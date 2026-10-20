from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets
from .config import settings
from .database import get_db
from .models import User, RefreshToken

pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')
bearer = HTTPBearer(auto_error=False)

# ========== PASSWORD HASHING ==========
def hash_password(v: str) -> str:
    return pwd.hash(v)

def verify_password(v: str, h: str) -> bool:
    return pwd.verify(v, h)

# ========== ACCESS TOKEN ==========
def create_access_token(user: User) -> str:
    """Cria um access token de curta duração (15 min por padrão)"""
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        'sub': str(user.id),
        'exp': exp,
        'type': 'access',
        'org_id': user.organization_id or 0
    }
    return jwt.encode(payload, settings.secret_key, algorithm='HS256')

# ========== REFRESH TOKEN ==========
def create_refresh_token(user_id: int, db: Session) -> str:
    """Cria um refresh token de longa duração (30 dias por padrão)"""
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    token_value = secrets.token_urlsafe(32)
    token_hash = pwd.hash(token_value)
    
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    
    return token_value

def verify_refresh_token(token: str, user_id: int, db: Session) -> bool:
    """Verifica se o refresh token é válido e não foi revogado"""
    # Encontrar o token no banco
    db_token = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.now(timezone.utc)
    ).order_by(RefreshToken.created_at.desc()).first()
    
    if not db_token:
        return False
    
    return pwd.verify(token, db_token.token_hash)

def revoke_refresh_tokens(user_id: int, db: Session):
    """Revoga todos os refresh tokens de um usuário"""
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update(
        {RefreshToken.revoked: True}
    )
    db.commit()

# ========== CURRENT USER ==========
def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> User:
    """Extrai e valida o usuário do access token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Não autenticado',
            headers={'WWW-Authenticate': 'Bearer'}
        )
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.secret_key,
            algorithms=['HS256']
        )
        
        if payload.get('type') != 'access':
            raise HTTPException(status_code=401, detail='Token inválido')
        
        user_id = int(payload['sub'])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail='Token expirado ou inválido')
    
    user = db.get(User, user_id)
    if not user or not user.active:
        raise HTTPException(status_code=401, detail='Usuário inválido ou inativo')
    
    return user

def current_admin(user: User = Depends(current_user)) -> User:
    """Valida que o usuário é admin ou owner"""
    if user.role not in ('admin', 'owner'):
        raise HTTPException(status_code=403, detail='Acesso negado: requer permissão de admin')
    return user

def current_owner(user: User = Depends(current_user)) -> User:
    """Valida que o usuário é owner"""
    if user.role != 'owner':
        raise HTTPException(status_code=403, detail='Acesso negado: requer permissão de owner')
    return user

