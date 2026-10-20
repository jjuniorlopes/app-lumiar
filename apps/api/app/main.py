import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from .config import settings
from .database import Base, engine, SessionLocal
from .models import Organization, User, ProductSubscription, CulturalSpace, CulturalItem
from .security import hash_password
from .middleware import LoggingMiddleware, RateLimitMiddleware, ErrorHandlingMiddleware
from .routers import auth, core, cultural, public, billing

# Criar tabelas
Base.metadata.create_all(bind=engine)

upload_dir = os.path.join(os.getcwd(), settings.storage_path)
os.makedirs(upload_dir, exist_ok=True)

# ========== INICIALIZAR FASTAPI ==========
app = FastAPI(
    title="Lumiar Platform API",
    description="API SaaS para Gestão de Espaços Culturais",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ========== MIDDLEWARES ==========
# Adicionar middlewares na ordem correta (de cima para baixo = execução de dentro para fora)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)

# CORS
origins = settings.cors_origins.split(',') if settings.cors_origins else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== HEALTH CHECK ==========


@app.get("/health", tags=["Health"])
def health_check():
    """Verificar saúde da API"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "2.0.0"
    }


# ========== ROUTERS ==========
app.include_router(auth.router)
app.include_router(core.router)
app.include_router(cultural.router)
app.include_router(public.router)

# ========== STARTUP EVENTS ==========


@app.on_event("startup")
def startup_event():
    """Executar seeds na inicialização"""
    seed()


def seed():
    """Criar dados iniciais sem substituir credenciais existentes."""
    if settings.is_production:
        return

    db = SessionLocal()
    try:
        org = db.query(Organization).filter_by(slug='museu-embasa').first()
        if not org:
            org = db.query(Organization).first()
        if not org:
            org = Organization(
                name='Museu do Saneamento - EMBASA',
                slug='museu-embasa',
                plan='professional',
                city='Salvador',
                state='BA',
                description='Espaço de preservação histórica do saneamento da Bahia.'
            )
            db.add(org)
            db.flush()

        admin_password = settings.admin_initial_password or "Lumiar@2026"
        for mail in ['admin@lumiar.dev', 'admin@lumiar.local']:
            u = db.query(User).filter_by(email=mail).first()
            if not u:
                db.add(User(
                    name='Administrador Lumiar',
                    email=mail,
                    password_hash=hash_password(admin_password),
                    role='owner',
                    organization_id=org.id
                ))
            elif u:
                u.active = True

        superadmin = db.query(User).filter_by(
            email='superadmin@lumiar.dev').first()
        if not superadmin:
            db.add(User(
                name='Super Administrador Lumiar',
                email='superadmin@lumiar.dev',
                password_hash=hash_password(admin_password),
                role='superadmin',
                organization_id=None,
                active=True
            ))
        else:
            if superadmin:
                superadmin.role = 'superadmin'
                superadmin.organization_id = None
                superadmin.active = True

        for k in ['cultural']:
            if not db.query(ProductSubscription).filter_by(organization_id=org.id, product_key=k).first():
                db.add(ProductSubscription(organization_id=org.id,
                       product_key=k, status='active'))

        # Espaço Cultural Demo
        space = db.query(CulturalSpace).filter_by(
            organization_id=org.id).first()
        if not space:
            space = CulturalSpace(
                organization_id=org.id,
                name='Pavilhão das Bombas a Vapor',
                description='Espaço histórico que abriga as primeiras bombas de captação e distribuição de água de Salvador (século XIX).'
            )
            db.add(space)
            db.flush()

        if not db.query(CulturalItem).filter_by(organization_id=org.id).first():
            item1 = CulturalItem(
                organization_id=org.id,
                space_id=space.id,
                code='MS-001',
                title='Válvula de Retenção Industrial em Ferro Fundido',
                author='Fundição Imperial da Bahia',
                year='1892',
                category='Maquinário Histórico',
                short_description='Válvula histórica utilizada no sistema de abastecimento de Salvador no final do século XIX.',
                audio_description=(
                    "Peça industrial em ferro fundido de grande porte, pesando cerca de cento e cinquenta quilos, "
                    "com acabamento em tonalidade cinza-grafite escuro com marcas pontuais de oxidação controlada. "
                    "Apresenta formato cilíndrico central com dois flanges circulares espessos nas extremidades, "
                    "cada um perfurado por oito orifícios para fixação por parafusos maciços. "
                    "No topo do corpo da válvula sobressai um volante circular de ferro trabalhado com quatro raios, "
                    "destinado ao acionamento manual do obturador interno. Na lateral do bojo encontra-se fundida "
                    "em alto-relevo a inscrição com o ano de fabricação de mil oitocentos e noventa e dois."
                ),
                curator_notes='Peça restaurada em 2024. Total conformidade eMAG 3.0.',
                is_reviewed=True,
                reviewed_by='Curadoria EMBASA',
                qr_token='embasa-valvula-001',
                scan_count=12
            )

            item2 = CulturalItem(
                organization_id=org.id,
                space_id=space.id,
                code='MS-002',
                title='Hidrômetro de Precisão em Bronze Polido',
                author='Siemens & Halske',
                year='1914',
                category='Instrumentos de Medição',
                short_description='Instrumento pioneiro de medição volumétrica de água com mostrador mecânico de ponteiros.',
                audio_description=(
                    "Instrumento de medição de médio porte confeccionado em liga de bronze e latão polido dourado. "
                    "O corpo arredondado possui duas conexões roscadas laterais para acoplamento na tubulação. "
                    "Na parte superior, protegida por uma tampa basculante de bronze articulada por dobradiça, "
                    "destaca-se o mostrador circular em esmalte branco protegido por vidro espesso. "
                    "O visor exibe cinco pequenos mostradores graduados com ponteiros pretos indicadores de litros e metros cúbicos, "
                    "ao lado do logotipo gravado do fabricante com caligrafia do início do século vinte."
                ),
                curator_notes='Exemplar raro em funcionamento demonstrativo.',
                is_reviewed=True,
                reviewed_by='Curadoria EMBASA',
                qr_token='embasa-hidrometro-002',
                scan_count=8
            )
            db.add_all([item1, item2])

        db.commit()
    finally:
        db.close()


def init_db_with_retry(max_retries=5, delay=2):
    for attempt in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            seed()
            return
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                raise


app = FastAPI(title='Lumiar Platform API', version='2.0.0')
cors_origins_list = [x.strip()
                     for x in settings.cors_origins.split(',') if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*']
)

# Servir uploads de mídia estáticos
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.on_event("startup")
def startup_event():
    try:
        init_db_with_retry()
    except Exception as e:
        print(f"Failed to initialize database: {e}")


for r in [auth.router, core.router, cultural.router, public.router, billing.router]:
    app.include_router(r, prefix='/api/v1')


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'lumiar-platform-api', 'version': '2.0.0'}


@app.get('/')
def api_root():
    return {
        'service': 'Lumiar Platform API',
        'status': 'online',
        'docs': '/docs',
        'health': '/health'
    }
