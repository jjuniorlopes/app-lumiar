# Lumiar Platform

> **Acessibilidade conectada para espaços culturais, serviços e experiências.**

Plataforma SaaS da Lumiar para gestão de acervos, audiodescrição, curadoria acessível e experiências digitais inclusivas.

[![Backend](https://img.shields.io/badge/backend-FastAPI-0b8f8f?style=flat-square)](apps/api)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-087ea4?style=flat-square)](apps/web)
[![Deploy](https://img.shields.io/badge/deploy-Render-46e3b7?style=flat-square)](render.yaml)

## Visão geral

O ecossistema Lumiar possui dois produtos:

| Produto | Para quem | Estado |
| --- | --- | --- |
| **Lumiar Cultural** | Museus e espaços culturais | Disponível |
| **Lumiar Guia** | Orientação acessível em espaços públicos | Em desenvolvimento |

O produto atual já oferece:

- Gestão multi-organização com isolamento por instituição
- Perfis de superadministrador, gestor, administrador, curador e membro
- Acervo, espaços, obras, imagens e documentos
- Audiodescrição assistida por IA
- Revisão de conteúdo eMAG 3.0
- QR Codes para obras e experiência pública mobile
- Página pública acessível no navegador do celular, sem exigir instalação do app, com controles de audiodescrição, leitura de outros QR Codes e conversa por voz/texto com a Lumi
- Dashboard, auditoria e controle de equipe
- Página comercial estática em `/`
- Páginas comerciais individuais em `/cultural` e `/guia`
- Checkout hospedado pelo Stripe
- Barra global de acessibilidade

## Stack

| Camada | Tecnologia |
| --- | --- |
| API | FastAPI, Python 3.12, SQLAlchemy |
| Web | React 18, TypeScript, Vite, Lucide |
| Mobile | Flutter, Dart |
| Banco | PostgreSQL 16 |
| Cache | Redis 7 |
| Infraestrutura | Docker Compose, Nginx, GitHub Actions |
| Pagamentos | Stripe Checkout e Billing Portal |

## Estrutura

```text
apps/
├── api/              # API FastAPI, autenticação, acervo e billing
│   ├── app/
│   └── requirements.txt
├── mobile/           # Aplicativo Flutter
└── web/              # Landing, páginas comerciais e painel React
    ├── public/
    └── src/
assets/               # Materiais de marca e assets de origem
docs/                 # Documentação de produto, desenvolvimento e deploy
infra/                # Nginx e PostgreSQL
docker-compose.yml
render.yaml           # Blueprint de deploy no Render
```

## Executar localmente

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20+
- Python 3.12+
- Flutter SDK, caso trabalhe no app mobile

### Com Docker

```bash
cp .env.example .env
docker compose up --build
```

Serviços locais:

| Serviço | URL |
| --- | --- |
| Landing e painel | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

Para habilitar o chat da assistente Lumi, configure a chave de um provedor no `.env` do backend: `GROQ_API_KEY`, `OPENAI_API_KEY` ou `GOOGLE_API_KEY`. Defina `AI_PROVIDER=groq`, `openai` ou `google`; com `AI_PROVIDER=auto` (padrão), a API usa a primeira chave disponível na ordem Groq, OpenAI e Google. Modelos: `GROQ_AI_MODEL` (padrão `llama-3.3-70b-versatile`), `OPENAI_AI_MODEL` (padrão `gpt-4o-mini`) e `AI_MODEL` (Gemini, padrão `gemini-2.5-flash`). O tempo limite (`AI_TIMEOUT_SECONDS`) e o limite de saída do chat (`AI_CHAT_MAX_OUTPUT_TOKENS`) também podem ser definidos no `.env`. A geração de audiodescrições a partir de imagens continua usando Gemini e requer `GOOGLE_API_KEY`. Mantenha as chaves apenas no ambiente do backend; nunca as inclua no app mobile, no frontend ou no Git. Após alterar o `.env`, reinicie a API (`docker compose up -d --force-recreate api`).

As imagens da página inicial podem ser gerenciadas pelo administrador do sistema no menu **Imagens da Página Inicial**. Há áreas para a imagem principal, Lumiar Cultural e Lumiar Guia. Cada envio exige texto alternativo e aceita JPEG, PNG ou WebP de até 8 MB; os arquivos ficam no armazenamento configurado para a API. Enquanto não houver imagens próprias, o site exibe ilustrações conceituais locais (não geradas por IA).

### Sem Docker

```bash
# Terminal 1: API
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2: Web
cd apps/web
npm ci
npm run dev

# Terminal 3: Redis, caso necessário
redis-server
```

## Rotas comerciais

| Rota | Conteúdo |
| --- | --- |
| `/` | Página principal da Lumiar |
| `/cultural` | Página comercial do Lumiar Cultural |
| `/guia` | Página comercial do Lumiar Guia |

As páginas comerciais são renderizadas pelo build estático do Vite. Elas não dependem da API para abrir; login, dados e checkout são carregados somente quando necessários.

## Perfis de acesso

| Perfil | Escopo | Permissões principais |
| --- | --- | --- |
| `superadmin` | Global | Gerencia organizações, usuários e configurações de toda a plataforma |
| `owner` | Uma organização | Administra a organização, acervo, espaços, equipe e auditoria |
| `admin` | Uma organização | Administra acervo, espaços e usuários da organização |
| `curator` | Uma organização | Cria, edita e revisa conteúdo cultural |
| `member` | Uma organização | Consulta e apoia as operações permitidas pela equipe |

Organizações criam seus próprios usuários `admin`, `curator` e `member`. O perfil `superadmin` é reservado à operação global e não pode ser criado por uma organização.

## Stripe

O checkout usa Stripe hospedado. Dados de cartão não passam pela API Lumiar.

Configure no `.env` local ou nas variáveis do provedor:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=brl
STRIPE_SUCCESS_URL=http://localhost:5173/?checkout=success
STRIPE_CANCEL_URL=http://localhost:5173/?checkout=cancelled
```

Endpoints de billing:

```text
GET  /api/v1/billing/plans
POST /api/v1/billing/checkout
POST /api/v1/billing/portal
POST /api/v1/billing/webhook
```

Para desenvolvimento com Stripe CLI:

```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
```

Use `sk_test_...` durante testes e substitua por chaves de produção somente no ambiente publicado.

## Deploy no Render

O arquivo [render.yaml](render.yaml) cria dois serviços:

1. **`lumiar-web`**: Static Site gratuito, servido pela CDN.
2. **`lumiar-api`**: Web Service para autenticação, dados e pagamentos.

### Passos

1. Faça push do projeto para um repositório no GitHub.
2. No Render, escolha **New → Blueprint**.
3. Conecte o repositório e confirme o `render.yaml`.
4. No `lumiar-web`, configure:

   ```env
   VITE_API_URL=https://lumiar-api.onrender.com
   ```

5. No `lumiar-api`, configure:

   ```env
   DATABASE_URL=postgresql://...
   SECRET_KEY=uma-chave-forte-com-no-minimo-32-caracteres
   CORS_ORIGINS=https://lumiar-web.onrender.com
   PUBLIC_URL=https://lumiar-api.onrender.com
   MOBILE_APP_URL=https://lumiar-web.onrender.com/visit
   ```

6. Adicione as variáveis Stripe no serviço da API.

O `render.yaml` usa `generateValue: true` para criar automaticamente a `SECRET_KEY` em uma nova implantação. Se o serviço já foi criado antes dessa configuração, abra **Environment** no serviço `lumiar-api`, adicione `SECRET_KEY` com uma string aleatória de pelo menos 32 caracteres e faça um novo deploy.

O plano gratuito do Render não oferece PostgreSQL persistente. Para teste, use Neon ou Supabase e configure a `DATABASE_URL` fornecida por eles.

### Build do aplicativo mobile

O aplicativo visitante não recebe as variáveis do Render automaticamente. Gere o APK informando a URL pública da API:

```bash
cd apps/mobile
flutter pub get
flutter build apk --release --dart-define=API_BASE_URL=https://lumiar-api.onrender.com/api/v1
```

Para testar em um dispositivo conectado:

```bash
flutter run --dart-define=API_BASE_URL=https://lumiar-api.onrender.com/api/v1
```

No Render, `MOBILE_APP_URL` deve apontar para a URL pública do web app. Essa variável é usada para criar os QR Codes; depois de alterá-la, faça um novo deploy da API e gere novos QR Codes.

### Armazenamento de imagens no Render

As imagens de obras não devem ficar somente no disco efêmero do serviço. Configure um **Persistent Disk** no serviço `lumiar-api`, montado em `/var/data`, antes de usar uploads em produção. O Blueprint já define `STORAGE_PATH=/var/data/uploads`; sem esse disco, um restart ou novo deploy remove os arquivos, embora os registros no banco permaneçam.

## Testes e validação

```bash
# API
cd apps/api
pytest --cov=app

# Build web
cd apps/web
npm ci
npm run build
```

Health check:

```bash
curl http://localhost:8000/health
```

### Reset inicial do banco

Para iniciar uma base limpa, o script `apps/api/reset_production_data.py` remove organizações e todos os dados associados, preservando usuários com perfil `superadmin`. Execute-o somente após confirmar que a `DATABASE_URL` aponta para o banco correto:

```bash
cd apps/api
python reset_production_data.py
```

O script exige a confirmação literal `RESETAR DADOS ORGANIZACIONAIS` e não deve ser executado sem backup.

## Segurança

- Nunca versione `.env`, tokens ou chaves Stripe.
- Troque `SECRET_KEY` antes do deploy.
- Use HTTPS em produção.
- Restrinja `CORS_ORIGINS` ao domínio real do frontend.
- Configure o webhook Stripe com assinatura `STRIPE_WEBHOOK_SECRET`.
- O plano gratuito é adequado para demonstração, não para produção crítica.

## Documentação

- [Visão do produto](docs/PRODUCT_VISION.md)
- [Desenvolvimento](docs/DEVELOPMENT.md)
- [Deploy](docs/DEPLOYMENT.md)
- [Guia mobile](docs/MOBILE_GUIDE.md)
- [Roadmap](docs/ROADMAP.md)

## Roadmap

- [x] SaaS core e autenticação
- [x] Gestão de organizações e equipes
- [x] Lumiar Cultural
- [x] Página comercial e checkout Stripe
- [ ] Lumiar Guia
- [ ] Billing completo e faturas
- [ ] Observabilidade e métricas
- [ ] Aplicativo mobile em produção

## Suporte

- E-mail: admin@lumiar.dev
- API local: http://localhost:8000/docs

---

**Lumiar — Acessibilidade Conectada.**
