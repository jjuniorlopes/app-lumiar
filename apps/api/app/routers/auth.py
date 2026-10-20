from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User, Organization, ProductSubscription, AuditLog
from ..security import (
    verify_password, hash_password, create_access_token, 
    create_refresh_token, verify_refresh_token, current_user, revoke_refresh_tokens
)

router = APIRouter(prefix='/auth', tags=['Autenticação'])

# ========== SCHEMAS ==========
class Login(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class Register(BaseModel):
    name: str = Field(..., min_length=3, max_length=160)
    email: EmailStr
    password: str = Field(..., min_length=8)
    organization_name: str = Field(..., min_length=3, max_length=180)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ChangePassword(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=12)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    organization_id: int | None
    organization: str | None
    email_verified: bool
    is_system_admin: bool

# ========== HELPERS ==========
def serialize_user(u: User) -> dict:
    """Serializa um usuário para resposta"""
    return {
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'role': u.role,
        'organization_id': u.organization_id,
        'organization': u.organization.name if u.organization else None,
        'email_verified': u.email_verified,
        'is_system_admin': u.role in ('superadmin', 'system_admin'),
    }

# ========== ENDPOINTS ==========
@router.post('/register', response_model=TokenResponse)
def register(data: Register, db: Session = Depends(get_db)):
    """Registra um novo usuário e organização"""
    
    # Validar email único
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='E-mail já cadastrado'
        )
    
    # Criar slug único para organização
    slug = ''.join(c.lower() if c.isalnum() else '-' for c in data.organization_name).strip('-')[:110]
    base = slug or 'organizacao'
    slug = base
    i = 2
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f'{base}-{i}'
        i += 1
    
    # Criar organização
    org = Organization(
        name=data.organization_name,
        slug=slug,
        plan='starter'
    )
    db.add(org)
    db.flush()
    
    # Criar usuário
    user = User(
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role='owner',
        organization_id=org.id
    )
    db.add(user)
    db.flush()
    
    # Ativar produto Cultural
    db.add(ProductSubscription(
        organization_id=org.id,
        product_key='cultural',
        status='active'
    ))
    
    # Log de auditoria
    db.add(AuditLog(
        organization_id=org.id,
        actor=user.email,
        action=f'Registro: {user.name}'
    ))
    
    db.commit()
    db.refresh(user)
    
    # Criar tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user.id, db)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': serialize_user(user)
    }

@router.post('/login', response_model=TokenResponse)
def login(data: Login, db: Session = Depends(get_db)):
    """Faz login e retorna access e refresh tokens"""
    
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='E-mail ou senha inválidos'
        )
    
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Usuário inativo'
        )
    
    # Atualizar último login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Log de auditoria
    db.add(AuditLog(
        organization_id=user.organization_id,
        actor=user.email,
        action='Login'
    ))
    db.commit()
    
    # Criar tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user.id, db)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': serialize_user(user)
    }

@router.post('/refresh', response_model=TokenResponse)
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Usa refresh token para obter novo access token"""
    
    # Decodificar o refresh token para obter o user_id
    # Na prática, armazenaremos o refresh token no banco e verificaremos lá
    try:
        # Por enquanto, fazemos uma abordagem simples
        # Em produção, você armazenaria o refresh_token_id no token JWT
        raise HTTPException(status_code=401, detail='Refresh token inválido')
    except:
        raise HTTPException(status_code=401, detail='Refresh token expirado')

@router.post('/logout')
def logout(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Faz logout revogando todos os refresh tokens"""
    revoke_refresh_tokens(user.id, db)
    
    db.add(AuditLog(
        organization_id=user.organization_id,
        actor=user.email,
        action='Logout'
    ))
    db.commit()
    
    return {'message': 'Logout realizado com sucesso'}

@router.post('/change-password')
def change_password(data: ChangePassword, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Altera a senha do usuário autenticado e revoga suas sessões persistentes."""
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Senha atual inválida'
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='A nova senha deve ser diferente da senha atual'
        )

    user.password_hash = hash_password(data.new_password)
    db.add(AuditLog(
        organization_id=user.organization_id,
        actor=user.email,
        action='Senha alterada'
    ))
    db.commit()
    revoke_refresh_tokens(user.id, db)

    return {'message': 'Senha alterada com sucesso'}

@router.get('/me', response_model=UserResponse)
def get_me(user: User = Depends(current_user)):
    """Retorna dados do usuário atual"""
    return serialize_user(user)

