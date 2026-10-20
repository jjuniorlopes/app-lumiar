# 👨‍💻 Guia de Desenvolvimento

## Setup Inicial

### Backend

```bash
# Criar ambiente virtual
cd apps/api
python -m venv venv

# Ativar
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows PowerShell

# Instalar dependências
pip install -r requirements.txt

# Rodar migrações (automático com SQLAlchemy)
# (Nada a fazer - tables criadas no startup)

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Acessar docs
# http://localhost:8000/docs
```

### Frontend

```bash
cd apps/web

# Instalar dependências
npm install

# Rodar dev server
npm run dev

# Acessar
# http://localhost:5173
```

### Redis (se não usar Docker)

```bash
# Windows (WSL2)
sudo apt install redis-server
redis-server

# macOS
brew install redis
redis-server

# Linux
sudo apt install redis-server
redis-server
```

## Arquitetura

### Backend (FastAPI)

```
app/
├── main.py              # Entry point + middlewares
├── config.py            # Configurações
├── database.py          # Session SQLAlchemy
├── models.py            # ORM models (SQLAlchemy)
├── security.py          # JWT + autenticação
├── middleware.py        # Logging + rate limiting
└── routers/
    ├── auth.py          # Login/Register/Refresh
    ├── core.py          # Endpoints administrativos
    ├── cultural.py      # Gestão de itens culturais
    └── public.py        # Rotas públicas
```

**Padrão de rota:**
```python
@router.post('/endpoint', tags=['Category'])
def my_endpoint(param: MySchema, user: User = Depends(current_user), db: Session = Depends(get_db)):
    # Implementação
    return {...}
```

### Frontend (React + Vite)

```
src/
├── main.tsx             # Entry point
├── hooks/
│   └── useAuth.ts       # Auth context + hooks
├── components/          # Componentes reutilizáveis
├── pages/               # Páginas
├── lib/                 # Utilitários
└── styles/
    └── global.css       # Estilos globais
```

**Usando autenticação:**
```tsx
import { useAuthContext } from './hooks/useAuth';

function Component() {
  const { user, token, logout } = useAuthContext();
  
  // Usar token em requisições
  fetch('/api/endpoint', {
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

## Best Practices

### Backend

✅ **DO:**
- [ ] Validar entrada com Pydantic
- [ ] Usar `Depends()` para injeção
- [ ] Logar ações importantes
- [ ] Tratar exceções propriamente
- [ ] Documentar rotas com docstrings
- [ ] Usar enums para status
- [ ] Database transactions
- [ ] Rate limiting

❌ **DON'T:**
- [ ] Query N+1 (usar `.options(joinedload())`)
- [ ] Expor detalhes de erro
- [ ] Hardcode valores
- [ ] Bloquear operações long-running
- [ ] Sem validação de permissões

### Frontend

✅ **DO:**
- [ ] Componentes pequenos e reutilizáveis
- [ ] Type-safe com TypeScript
- [ ] Usar hooks para lógica
- [ ] Tratamento de erro
- [ ] Loading states
- [ ] Validação de form
- [ ] Responsivo mobile-first
- [ ] Sem console.log() em produção

❌ **DON'T:**
- [ ] State management inline
- [ ] API calls direto em componentes
- [ ] Props drilling profundo
- [ ] Sem error boundaries
- [ ] Magic numbers/strings

## Workflow Git

### Branches

```bash
# Feature
git checkout -b feature/nova-funcionalidade

# Bugfix
git checkout -b bugfix/problema-critico

# Hotfix (produção)
git checkout -b hotfix/erro-urgente
```

### Commits

```bash
# Formato convencional
git commit -m "feat: adicionar autenticação com refresh token"
git commit -m "fix: resolver erro de rate limiting"
git commit -m "docs: atualizar README"
git commit -m "test: adicionar testes de autenticação"
```

### Pull Request

1. Criar feature branch
2. Fazer commits
3. Abrir PR (descrição clara)
4. Code review
5. Merge para develop
6. Merge develop → main (release)

## Testes

### Backend

```bash
# Instalar
pip install pytest pytest-cov

# Rodar tudo
pytest

# Com coverage
pytest --cov=app --cov-report=html

# Teste específico
pytest tests/test_auth.py::test_login
```

**Estrutura:**
```python
def test_login_success():
    # Arrange
    user = create_test_user(email="test@example.com")
    
    # Act
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    
    # Assert
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### Frontend

```bash
# Instalar
npm install --save-dev vitest @testing-library/react

# Rodar
npm run test

# Watch mode
npm run test:watch
```

## Debugging

### Backend

```python
# Breakpoint
import pdb; pdb.set_trace()

# Logging
import structlog
logger = structlog.get_logger()
logger.info("debug_message", variable=value)
```

### Frontend

```typescript
// Console
console.log("Debug:", value);

// Debugger
debugger;

// DevTools
F12 (ou Cmd+Option+I)
```

### Database

```bash
# Conectar ao PostgreSQL
psql -h localhost -U lumiar -d lumiar

# Ver tabelas
\dt

# Query
SELECT * FROM users;

# Ver estrutura
\d cultural_items
```

## Performance

### Backend

- Usar índices no banco
- Cache com Redis
- Query optimization (select_in_load, joinedload)
- Async I/O (para heavy ops)
- Profile com py-spy

### Frontend

- Code splitting
- Lazy loading de rotas
- Image optimization
- Minification (automático com Vite)
- Performance audit: Chrome DevTools

## Segurança

### Backend

```python
# Rate limiting
@limiter.limit("100/minute")
def my_endpoint():
    pass

# CORS (já configurado)
# Validação (Pydantic)
class LoginSchema(BaseModel):
    email: EmailStr  # Validado automaticamente
    password: str = Field(min_length=6)

# SQL Injection protection (SQLAlchemy ORM)
# Senhas hasheadas (bcrypt)
```

### Frontend

```typescript
// Não armazenar senhas
localStorage.removeItem('password');

// HTTPS only (automático)
// Headers de segurança (Nginx)
// XSS prevention (React automático)
```

## Variáveis de Ambiente

### Backend (.env)

```
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=sua-chave-dev
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000
```

## Recursos Úteis

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [React Docs](https://react.dev)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org)
- [Pydantic Validation](https://docs.pydantic.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Troubleshooting

### "Port already in use"
```bash
# Linux/Mac
lsof -i :8000
kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "Module not found"
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
npm cache clean --force
```

### "CORS error"
```
# Verificar CORS_ORIGINS em .env
# Adicionar seu domínio/IP
CORS_ORIGINS=http://localhost:5173,http://192.168.1.100:5173
```

---

**Pronto para codificar!** 🚀
