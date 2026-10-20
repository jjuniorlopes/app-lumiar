import json
import logging
import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Organization, User, ProductSubscription, AuditLog, CulturalItem, CulturalSpace
from ..security import current_user, hash_password
from ..config import settings

router = APIRouter(tags=['Core SaaS & Organizações'])
logger = logging.getLogger(__name__)
SHOWCASE_IMAGE_KEYS = ('hero', 'cultural', 'guia')
SHOWCASE_IMAGE_MAX_BYTES = 8 * 1024 * 1024


def _showcase_metadata_path() -> str:
    return os.path.join(os.getcwd(), settings.storage_path, 'showcase-images.json')


def _read_showcase_images() -> dict:
    defaults = {key: {'url': '', 'alt': ''} for key in SHOWCASE_IMAGE_KEYS}
    try:
        with open(_showcase_metadata_path(), encoding='utf-8') as metadata_file:
            stored = json.load(metadata_file)
        if isinstance(stored, dict):
            for key in SHOWCASE_IMAGE_KEYS:
                image = stored.get(key)
                if isinstance(image, dict):
                    defaults[key] = {
                        'url': image.get('url') if isinstance(image.get('url'), str) else '',
                        'alt': image.get('alt') if isinstance(image.get('alt'), str) else '',
                    }
    except FileNotFoundError:
        pass
    except (OSError, json.JSONDecodeError):
        raise HTTPException(500, 'Não foi possível carregar as imagens de apresentação.')
    return defaults


def _image_file_extension(content_type: str, content: bytes) -> str | None:
    if content_type == 'image/jpeg' and content.startswith(b'\xff\xd8\xff'):
        return '.jpg'
    if content_type == 'image/png' and content.startswith(b'\x89PNG\r\n\x1a\n'):
        return '.png'
    if (
        content_type == 'image/webp'
        and content.startswith(b'RIFF')
        and content[8:12] == b'WEBP'
    ):
        return '.webp'
    return None

def is_system_admin_user(u: User) -> bool:
    return u.role in ('superadmin', 'system_admin')

def require_system_admin(u: User):
    if not is_system_admin_user(u):
        raise HTTPException(403, 'Acesso restrito aos administradores do sistema')

def require_admin(u: User):
    if not is_system_admin_user(u) and u.role not in ('owner', 'admin'):
        raise HTTPException(403, 'Permissão insuficiente para esta ação')


@router.get('/showcase-images')
def get_showcase_images():
    return _read_showcase_images()


@router.post('/showcase-images/{image_key}')
async def upload_showcase_image(
    image_key: str,
    file: UploadFile = File(...),
    alt_text: str = Form(..., min_length=5, max_length=300),
    u: User = Depends(current_user),
):
    require_system_admin(u)
    if image_key not in SHOWCASE_IMAGE_KEYS:
        raise HTTPException(404, 'Área de imagem não encontrada.')
    alt_text = alt_text.strip()
    if len(alt_text) < 5 or len(alt_text) > 300:
        raise HTTPException(422, 'O texto alternativo deve ter entre 5 e 300 caracteres.')

    content = await file.read(SHOWCASE_IMAGE_MAX_BYTES + 1)
    if len(content) > SHOWCASE_IMAGE_MAX_BYTES:
        raise HTTPException(413, 'A imagem deve ter no máximo 8 MB.')
    extension = _image_file_extension(file.content_type or '', content)
    if not extension:
        raise HTTPException(415, 'Use uma imagem JPEG, PNG ou WebP válida.')

    upload_dir = os.path.join(os.getcwd(), settings.storage_path)
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"showcase_{image_key}_{uuid.uuid4().hex}{extension}"
    image_path = os.path.join(upload_dir, filename)
    try:
        with open(image_path, 'wb') as image_file:
            image_file.write(content)

        images = _read_showcase_images()
        previous_url = images[image_key]['url']
        images[image_key] = {
            'url': f'/uploads/{filename}',
            'alt': alt_text,
        }
        metadata_path = _showcase_metadata_path()
        temporary_path = f'{metadata_path}.{uuid.uuid4().hex}.tmp'
        try:
            with open(temporary_path, 'w', encoding='utf-8') as metadata_file:
                json.dump(images, metadata_file, ensure_ascii=False)
            os.replace(temporary_path, metadata_path)
        finally:
            if os.path.exists(temporary_path):
                os.remove(temporary_path)
    except OSError as error:
        if os.path.exists(image_path):
            os.remove(image_path)
        raise HTTPException(500, 'Não foi possível salvar a imagem de apresentação.') from error

    if previous_url.startswith('/uploads/showcase_'):
        previous_path = os.path.join(upload_dir, os.path.basename(previous_url))
        if os.path.isfile(previous_path) and previous_path != image_path:
            try:
                os.remove(previous_path)
            except OSError as error:
                logger.warning('Could not remove previous showcase image (%s)', type(error).__name__)
    return images[image_key]


# --- Schemas ---
class OrganizationCreate(BaseModel):
    name: str
    plan: str = 'starter'
    description: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    active: Optional[bool] = None

class InviteUser(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=12)
    role: str = 'member'
    organization_id: Optional[int] = None

ORGANIZATION_USER_ROLES = ('admin', 'curator', 'member')

# --- Dashboard ---
@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db), u: User = Depends(current_user)):
    system_admin = is_system_admin_user(u)
    oid = u.organization_id
    scope = (lambda query: query) if system_admin else (lambda query: query.filter_by(organization_id=oid))
    total_items = scope(db.query(CulturalItem)).filter(CulturalItem.active.is_(True)).count()
    reviewed_items = scope(db.query(CulturalItem)).filter(CulturalItem.active.is_(True), CulturalItem.is_reviewed.is_(True)).count()
    total_spaces = scope(db.query(CulturalSpace)).filter(CulturalSpace.active.is_(True)).count()
    users_count = scope(db.query(User)).filter(User.active.is_(True)).count()
    scans = scope(db.query(CulturalItem)).filter(CulturalItem.active.is_(True)).with_entities(CulturalItem.scan_count).all()
    total_scans = sum(s[0] for s in scans) if scans else 0
    subs = scope(db.query(ProductSubscription)).all()

    return {
        'organization': u.organization.name if u.organization else 'Todas as organizações',
        'plan': u.organization.plan if u.organization else 'global',
        'users': users_count,
        'spaces': total_spaces,
        'total_items': total_items,
        'reviewed_items': reviewed_items,
        'total_scans': total_scans,
        'products': [{'key': s.product_key, 'status': s.status} for s in subs]
    }

# --- Organizações (CRUD Completo) ---
@router.get('/organizations')
def list_organizations(db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    require_system_admin(u)
    orgs = db.query(Organization).order_by(Organization.id.asc()).all()
    return [
        {
            'id': o.id,
            'name': o.name,
            'slug': o.slug,
            'plan': o.plan,
            'city': o.city,
            'state': o.state,
            'description': o.description,
            'contact_email': o.contact_email,
            'contact_phone': o.contact_phone,
            'active': o.active,
            'users_count': len(o.users),
            'spaces_count': len(o.spaces),
            'items_count': len(o.items),
            'is_current': o.id == u.organization_id,
            'created_at': o.created_at
        }
        for o in orgs
    ]

@router.get('/organization')
def get_current_org(u: User = Depends(current_user)):
    org = u.organization
    if not org:
        raise HTTPException(404, 'Nenhuma organização vinculada ao usuário')
    return {
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'plan': org.plan,
        'description': org.description,
        'city': org.city,
        'state': org.state,
        'contact_email': org.contact_email,
        'contact_phone': org.contact_phone,
        'active': org.active,
        'created_at': org.created_at
    }

@router.get('/organizations/{org_id}')
def get_organization_by_id(org_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    require_system_admin(u)
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(404, 'Organização não encontrada')
    return {
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'plan': org.plan,
        'description': org.description,
        'city': org.city,
        'state': org.state,
        'contact_email': org.contact_email,
        'contact_phone': org.contact_phone,
        'active': org.active,
        'users_count': len(org.users),
        'spaces_count': len(org.spaces),
        'items_count': len(org.items),
        'created_at': org.created_at
    }

@router.post('/organizations')
def create_organization(data: OrganizationCreate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    require_system_admin(u)
    if db.query(Organization).filter(Organization.name == data.name).first():
        raise HTTPException(400, 'Já existe uma organização com este nome')

    slug = ''.join(c.lower() if c.isalnum() else '-' for c in data.name).strip('-')[:110]
    base = slug or 'organizacao'
    slug = base
    i = 2
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base}-{i}"
        i += 1

    org = Organization(
        name=data.name,
        slug=slug,
        plan=data.plan,
        description=data.description,
        city=data.city,
        state=data.state,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        active=True
    )
    db.add(org)
    db.flush()

    # Habilita produto padrão (Lumiar Cultural)
    db.add(ProductSubscription(organization_id=org.id, product_key='cultural', status='active'))

    db.add(AuditLog(organization_id=u.organization_id, actor=u.email, action=f"Criou organização {org.name}"))
    db.commit()
    db.refresh(org)
    return {'ok': True, 'id': org.id, 'name': org.name, 'slug': org.slug}

@router.put('/organizations/{org_id}')
def update_organization(org_id: int, data: OrganizationUpdate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    require_system_admin(u)
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(404, 'Organização não encontrada')

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(org, field, val)

    db.add(AuditLog(organization_id=u.organization_id, actor=u.email, action=f"Atualizou organização {org.name}"))
    db.commit()
    return {'ok': True, 'id': org.id, 'name': org.name}

@router.delete('/organizations/{org_id}')
def delete_organization(org_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    require_system_admin(u)
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(404, 'Organização não encontrada')

    if org.id == u.organization_id:
        raise HTTPException(400, 'Não é permitido desativar a sua própria organização ativa')

    org.active = False
    db.add(AuditLog(organization_id=u.organization_id, actor=u.email, action=f"Desativou organização {org.name}"))
    db.commit()
    return {'ok': True, 'message': f"Organização {org.name} desativada com sucesso"}

@router.post('/organizations/{org_id}/switch')
def switch_active_organization(org_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    require_system_admin(u)
    org = db.query(Organization).filter_by(id=org_id, active=True).first()
    if not org:
        raise HTTPException(404, 'Organização não encontrada ou inativa')

    if not is_system_admin_user(u):
        u.organization_id = org.id
        db.commit()
    return {'ok': True, 'organization_id': org.id, 'organization_name': org.name}

# --- Usuários & Curadores ---
@router.get('/users')
def list_users(db: Session = Depends(get_db), u: User = Depends(current_user)):
    query = db.query(User).order_by(User.id.desc())
    if not is_system_admin_user(u):
        query = query.filter_by(organization_id=u.organization_id)
    return [
        {
            'id': x.id,
            'name': x.name,
            'email': x.email,
            'role': x.role,
            'organization': x.organization.name if x.organization else None,
            'active': x.active,
            'created_at': x.created_at
        }
        for x in query
    ]

@router.post('/users')
def add_user(data: InviteUser, db: Session = Depends(get_db), u: User = Depends(current_user)):
    require_admin(u)
    if db.query(User).filter_by(email=data.email).first():
        raise HTTPException(400, 'E-mail já cadastrado')

    organization_id = data.organization_id if is_system_admin_user(u) else u.organization_id
    if not organization_id or not db.query(Organization).filter_by(id=organization_id, active=True).first():
        raise HTTPException(400, 'Selecione uma organização ativa para o usuário')
    if data.role not in ORGANIZATION_USER_ROLES:
        raise HTTPException(400, 'Perfil de usuário inválido')
    
    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        organization_id=organization_id
    )
    db.add(new_user)
    db.commit()
    return {'ok': True, 'id': new_user.id}

@router.get('/subscriptions')
def subscriptions(db: Session = Depends(get_db), u: User = Depends(current_user)):
    query = db.query(ProductSubscription)
    if not is_system_admin_user(u):
        query = query.filter_by(organization_id=u.organization_id)
    return [
        {
            'id': x.id,
            'product_key': x.product_key,
            'status': x.status,
            'settings': x.settings
        }
        for x in query
    ]

@router.get('/audit')
def audit(db: Session = Depends(get_db), u: User = Depends(current_user)):
    query = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(50)
    if not is_system_admin_user(u):
        query = query.filter_by(organization_id=u.organization_id)
    return [
        {
            'id': x.id,
            'actor': x.actor,
            'action': x.action,
            'created_at': x.created_at
        }
        for x in query
    ]
