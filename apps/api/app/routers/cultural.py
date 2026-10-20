import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CulturalSpace, CulturalItem, ItemDocument, User
from ..security import current_user
from ..config import settings
from ..services.ai_service import generate_audiodescription, generate_qr_code_png

router = APIRouter(prefix='/cultural', tags=['Lumiar Cultural'])

UPLOAD_DIR = os.path.join(os.getcwd(), settings.storage_path)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Schemas ---
class SpaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    floor_plan: Optional[str] = None

class SpaceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    floor_plan: Optional[str] = None
    items_count: int = 0
    created_at: datetime

class ItemCreate(BaseModel):
    space_id: Optional[int] = None
    code: str
    title: str
    author: Optional[str] = None
    year: Optional[str] = None
    category: Optional[str] = None
    short_description: Optional[str] = None
    audio_description: Optional[str] = None
    curator_notes: Optional[str] = None

class ItemUpdate(BaseModel):
    space_id: Optional[int] = None
    code: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    year: Optional[str] = None
    category: Optional[str] = None
    short_description: Optional[str] = None
    audio_description: Optional[str] = None
    curator_notes: Optional[str] = None
    active: Optional[bool] = None

class ReviewPayload(BaseModel):
    audio_description: str
    curator_notes: Optional[str] = None

def resolve_item_organization_id(space_id: Optional[int], user: User, db: Session) -> int:
    """Resolve a organização da obra para usuários comuns e superadmins."""
    if user.organization_id:
        if space_id:
            space = db.query(CulturalSpace).filter_by(
                id=space_id,
                organization_id=user.organization_id,
                active=True
            ).first()
            if not space:
                raise HTTPException(400, 'Espaço inválido para a organização atual')
        return user.organization_id

    if space_id:
        space = db.query(CulturalSpace).filter_by(id=space_id, active=True).first()
        if space:
            return space.organization_id

    raise HTTPException(400, 'Selecione um espaço ou galeria antes de cadastrar a obra')

# --- Espaços ---
@router.get('/spaces')
def list_spaces(db: Session = Depends(get_db), u: User = Depends(current_user)):
    spaces_query = db.query(CulturalSpace).filter_by(active=True)
    if u.role not in ('superadmin', 'system_admin'):
        spaces_query = spaces_query.filter_by(organization_id=u.organization_id)
    spaces = spaces_query.all()
    return [
        {
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'floor_plan': s.floor_plan,
            'items_count': len(s.items),
            'created_at': s.created_at
        }
        for s in spaces
    ]

@router.post('/spaces')
def create_space(data: SpaceCreate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    space = CulturalSpace(
        organization_id=u.organization_id,
        name=data.name,
        description=data.description,
        floor_plan=data.floor_plan
    )
    db.add(space)
    db.commit()
    db.refresh(space)
    return {'ok': True, 'id': space.id, 'name': space.name}

@router.delete('/spaces/{space_id}')
def delete_space(space_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    space = db.query(CulturalSpace).filter_by(id=space_id, organization_id=u.organization_id).first()
    if not space:
        raise HTTPException(404, 'Espaço não encontrado')
    space.active = False
    db.commit()
    return {'ok': True}

# --- Itens do Acervo ---
@router.get('/items')
def list_items(
    space_id: Optional[int] = None,
    is_reviewed: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    u: User = Depends(current_user)
):
    q = db.query(CulturalItem).filter_by(active=True)
    if u.role not in ('superadmin', 'system_admin'):
        q = q.filter_by(organization_id=u.organization_id)
    if space_id is not None:
        q = q.filter_by(space_id=space_id)
    if is_reviewed is not None:
        q = q.filter_by(is_reviewed=is_reviewed)
    if search:
        term = f"%{search}%"
        q = q.filter((CulturalItem.title.ilike(term)) | (CulturalItem.code.ilike(term)))
    
    items = q.order_by(CulturalItem.id.desc()).all()
    return [
        {
            'id': x.id,
            'code': x.code,
            'title': x.title,
            'author': x.author,
            'year': x.year,
            'category': x.category,
            'image_url': x.image_url,
            'short_description': x.short_description,
            'audio_description': x.audio_description,
            'is_reviewed': x.is_reviewed,
            'reviewed_by': x.reviewed_by,
            'reviewed_at': x.reviewed_at,
            'space_id': x.space_id,
            'space_name': x.space.name if x.space else None,
            'qr_token': x.qr_token,
            'scan_count': x.scan_count,
            'created_at': x.created_at
        }
        for x in items
    ]

@router.post('/items/with-image')
async def create_item_with_image(
    code: str = Form(...),
    title: str = Form(...),
    author: Optional[str] = Form(None),
    year: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    space_id: Optional[int] = Form(None),
    short_description: Optional[str] = Form(None),
    curator_notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    auto_describe: bool = Form(True),
    db: Session = Depends(get_db),
    u: User = Depends(current_user)
):
    organization_id = resolve_item_organization_id(space_id, u, db)
    existing = db.query(CulturalItem).filter_by(organization_id=organization_id, code=code, active=True).first()
    if existing:
        raise HTTPException(400, f"Já existe um item com o código '{code}' nesta organização")

    token = uuid.uuid4().hex[:16]
    image_url = None
    desc = None

    image_bytes = None
    mime_type = "image/jpeg"

    if file:
        image_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"
        ext = os.path.splitext(file.filename or 'image.jpg')[1].lower()
        filename = f"item_{organization_id}_{token[:8]}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        image_url = f"/uploads/{filename}"

    if auto_describe:
        desc = await generate_audiodescription(
            image_bytes=image_bytes,
            mime_type=mime_type,
            title=title,
            category=category or "",
            notes=curator_notes or short_description or ""
        )

    item = CulturalItem(
        organization_id=organization_id,
        space_id=space_id,
        code=code,
        title=title,
        author=author,
        year=year,
        category=category,
        image_url=image_url,
        short_description=short_description,
        audio_description=desc,
        curator_notes=curator_notes,
        is_reviewed=False,
        qr_token=token
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        'ok': True,
        'id': item.id,
        'code': item.code,
        'title': item.title,
        'image_url': item.image_url,
        'audio_description': item.audio_description,
        'qr_token': item.qr_token
    }

@router.post('/items')
async def create_item(data: ItemCreate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    organization_id = resolve_item_organization_id(data.space_id, u, db)
    existing = db.query(CulturalItem).filter_by(organization_id=organization_id, code=data.code, active=True).first()
    if existing:
        raise HTTPException(400, f"Já existe um item com o código '{data.code}' nesta organização")
    
    token = uuid.uuid4().hex[:16]
    
    # Se não foi fornecida descrição de áudio, gera descrição provisória
    desc = data.audio_description
    if not desc:
        desc = await generate_audiodescription(
            title=data.title,
            category=data.category or "",
            notes=data.curator_notes or data.short_description or ""
        )

    item = CulturalItem(
        organization_id=organization_id,
        space_id=data.space_id,
        code=data.code,
        title=data.title,
        author=data.author,
        year=data.year,
        category=data.category,
        short_description=data.short_description,
        audio_description=desc,
        curator_notes=data.curator_notes,
        is_reviewed=False,
        qr_token=token
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {'ok': True, 'id': item.id, 'code': item.code, 'qr_token': item.qr_token}

@router.get('/items/{item_id}')
def get_item(item_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')
    return {
        'id': item.id,
        'code': item.code,
        'title': item.title,
        'author': item.author,
        'year': item.year,
        'category': item.category,
        'image_url': item.image_url,
        'short_description': item.short_description,
        'audio_description': item.audio_description,
        'curator_notes': item.curator_notes,
        'is_reviewed': item.is_reviewed,
        'reviewed_by': item.reviewed_by,
        'reviewed_at': item.reviewed_at,
        'space_id': item.space_id,
        'space_name': item.space.name if item.space else None,
        'qr_token': item.qr_token,
        'scan_count': item.scan_count,
        'documents': [{'id': d.id, 'title': d.title, 'file_url': d.file_url} for d in item.documents]
    }

@router.put('/items/{item_id}')
def update_item(item_id: int, data: ItemUpdate, db: Session = Depends(get_db), u: User = Depends(current_user)):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')
    
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(item, field, val)
        
    db.commit()
    return {'ok': True, 'id': item.id}

@router.delete('/items/{item_id}')
def delete_item(item_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')
    item.active = False
    db.commit()
    return {'ok': True, 'id': item.id}

@router.post('/items/{item_id}/upload-image')
async def upload_item_image(
    item_id: int,
    file: UploadFile = File(...),
    auto_describe: bool = Form(True),
    db: Session = Depends(get_db),
    u: User = Depends(current_user)
):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')

    content = await file.read()
    ext = os.path.splitext(file.filename or 'image.jpg')[1].lower()
    filename = f"item_{item.organization_id}_{item.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    # URL pública do arquivo servido pela API
    item.image_url = f"/uploads/{filename}"

    if auto_describe:
        desc = await generate_audiodescription(
            image_bytes=content,
            mime_type=file.content_type or "image/jpeg",
            title=item.title,
            category=item.category or "",
            notes=item.curator_notes or item.short_description or ""
        )
        item.audio_description = desc
        item.is_reviewed = False

    db.commit()
    return {'ok': True, 'image_url': item.image_url, 'audio_description': item.audio_description}

@router.post('/items/{item_id}/generate-description')
async def regenerate_description(item_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')

    img_bytes = None
    mime = "image/jpeg"
    if item.image_url and item.image_url.startswith('/uploads/'):
        local_f = os.path.join(UPLOAD_DIR, os.path.basename(item.image_url))
        if os.path.exists(local_f):
            with open(local_f, "rb") as f:
                img_bytes = f.read()

    desc = await generate_audiodescription(
        image_bytes=img_bytes,
        mime_type=mime,
        title=item.title,
        category=item.category or "",
        notes=item.curator_notes or item.short_description or ""
    )
    item.audio_description = desc
    item.is_reviewed = False
    db.commit()
    return {'ok': True, 'audio_description': item.audio_description}

@router.post('/items/{item_id}/review')
def review_item_description(item_id: int, payload: ReviewPayload, db: Session = Depends(get_db), u: User = Depends(current_user)):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')

    item.audio_description = payload.audio_description
    if payload.curator_notes is not None:
        item.curator_notes = payload.curator_notes
    item.is_reviewed = True
    item.reviewed_by = u.name
    item.reviewed_at = datetime.utcnow()
    db.commit()
    return {'ok': True, 'is_reviewed': True, 'reviewed_at': item.reviewed_at}

@router.get('/items/{item_id}/qr')
def get_item_qr_code(item_id: int, db: Session = Depends(get_db), u: User = Depends(current_user)):
    item_query = db.query(CulturalItem).filter_by(id=item_id)
    if u.role not in ('superadmin', 'system_admin'):
        item_query = item_query.filter_by(organization_id=u.organization_id)
    item = item_query.first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')

    # O app mobile extrai o token deste endpoint público.
    visit_url = f"{settings.mobile_app_url.rstrip('/')}/{item.qr_token}"
    png_bytes = generate_qr_code_png(visit_url)
    return Response(content=png_bytes, media_type="image/png")

@router.post('/items/{item_id}/documents')
async def upload_item_document(
    item_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    u: User = Depends(current_user)
):
    item = db.query(CulturalItem).filter_by(id=item_id, organization_id=u.organization_id).first()
    if not item:
        raise HTTPException(404, 'Item não encontrado')

    content = await file.read()
    ext = os.path.splitext(file.filename or 'doc.txt')[1].lower()
    filename = f"doc_{item.organization_id}_{item.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    extracted_text = ""
    if ext in ['.txt', '.md']:
        extracted_text = content.decode('utf-8', errors='ignore')

    doc = ItemDocument(
        organization_id=u.organization_id,
        item_id=item.id,
        title=title or file.filename or "Documento",
        file_url=f"/uploads/{filename}",
        extracted_text=extracted_text
    )
    db.add(doc)
    db.commit()
    return {'ok': True, 'id': doc.id, 'title': doc.title, 'file_url': doc.file_url}

@router.get('/stats')
def cultural_stats(db: Session = Depends(get_db), u: User = Depends(current_user)):
    items_query = db.query(CulturalItem).filter_by(active=True)
    spaces_query = db.query(CulturalSpace).filter_by(active=True)
    if u.role not in ('superadmin', 'system_admin'):
        items_query = items_query.filter_by(organization_id=u.organization_id)
        spaces_query = spaces_query.filter_by(organization_id=u.organization_id)
    total_items = items_query.count()
    reviewed_items = items_query.filter_by(is_reviewed=True).count()
    pending_items = total_items - reviewed_items
    total_spaces = spaces_query.count()
    total_scans = items_query.with_entities(CulturalItem.scan_count).all()
    scans_sum = sum(x[0] for x in total_scans) if total_scans else 0

    return {
        'total_items': total_items,
        'reviewed_items': reviewed_items,
        'pending_review': pending_items,
        'total_spaces': total_spaces,
        'total_scans': scans_sum
    }
