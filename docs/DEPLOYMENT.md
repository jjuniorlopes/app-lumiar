# 🚀 Guia de Deploy em Produção

## Checklist Pré-Deploy

- [ ] Testar localmente (`docker compose up`)
- [ ] Rodar testes backend (`pytest --cov`)
- [ ] Rodar testes frontend (`npm test`)
- [ ] Verificar variáveis de ambiente
- [ ] Validar segurança (SECRET_KEY, certificados)
- [ ] Backup do banco de dados
- [ ] Plano de rollback

## 📋 Preparação do Servidor

### Requisitos

- Ubuntu 22.04 LTS (ou equivalente)
- 4GB RAM mínimo
- 20GB storage
- Docker & Docker Compose
- Domain name + SSL certificate

### Instalação

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Criar diretórios
sudo mkdir -p /app/lumiar-platform-v2
cd /app/lumiar-platform-v2
```

## 🔐 Configuração de Segurança

### 1. Gerar SECRET_KEY

```bash
# Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# Bash
openssl rand -base64 32
```

### 2. Certificado SSL

**Option A: Let's Encrypt (Gratuito)**
```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx -y

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

**Option B: Self-signed (desenvolvimento)**
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

### 3. Arquivo .env.prod

```bash
# Copiar e editar
cp .env.example .env.prod

# Valores CRÍTICOS para produção
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=seu-secret-gerado-acima
POSTGRES_PASSWORD=senha-aleatoria-forte
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
PUBLIC_URL=https://seu-dominio.com
```

## 🐳 Deploy com Docker Compose

### 1. Docker Compose Produção

Criar `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: lumiar_postgres_prod
    restart: always
    environment:
      POSTGRES_DB: lumiar
      POSTGRES_USER: lumiar
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lumiar"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: lumiar_redis_prod
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/seu-usuario/lumiar-platform/api:main
    container_name: lumiar_api_prod
    restart: always
    env_file: .env.prod
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: ghcr.io/seu-usuario/lumiar-platform/web:main
    container_name: lumiar_web_prod
    restart: always
    environment:
      VITE_API_URL: "https://seu-dominio.com/api"

  nginx:
    image: nginx:alpine
    container_name: lumiar_nginx_prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/nginx/ssl:/etc/nginx/ssl:ro
      - ./uploads:/app/uploads:ro
    depends_on:
      - api
      - web

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 2. Nginx com SSL

Editar `infra/nginx/nginx.conf`:

```nginx
upstream api {
    server api:8000;
}

upstream web {
    server web:5173;
}

server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    client_max_body_size 100M;
    
    # API
    location /api/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
```

### 3. Deploy

```bash
# Copiar arquivo
scp docker-compose.prod.yml user@server:/app/lumiar-platform-v2/

# Conectar e deploiar
ssh user@server
cd /app/lumiar-platform-v2

# Copiar .env.prod (não commitar no git!)
scp .env.prod user@server:/app/lumiar-platform-v2/

# Iniciar serviços
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose logs -f api

# Verificar health
curl https://seu-dominio.com/health
```

## 📊 Monitoramento em Produção

### Logs

```bash
# Ver logs da API
docker logs lumiar_api_prod -f

# Ver logs com filtro
docker logs lumiar_api_prod | grep "ERROR"

# Exportar logs
docker logs lumiar_api_prod > logs.txt
```

### Backup Automático

```bash
# Criar script backup.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec lumiar_postgres_prod pg_dump -U lumiar lumiar > "backup_$TIMESTAMP.sql"
tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP.sql" uploads/
aws s3 cp "backup_$TIMESTAMP.tar.gz" s3://seu-bucket/backups/
rm "backup_$TIMESTAMP.sql" "backup_$TIMESTAMP.tar.gz"

# Agendar com cron (2am todos os dias)
0 2 * * * /app/lumiar-platform-v2/backup.sh
```

### Monitoramento com Prometheus + Grafana

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'
```

## 🔄 Rollback

```bash
# Listar images
docker images

# Reverter para versão anterior
docker compose -f docker-compose.prod.yml pull :previous-tag
docker compose -f docker-compose.prod.yml up -d

# Restaurar banco de dados
docker exec lumiar_postgres_prod psql -U lumiar < backup_20240101_020000.sql
```

## 📈 Scaling

### Aumentar Workers API

No docker-compose.prod.yml:
```yaml
environment:
  - GUNICORN_CMD_ARGS=--workers 8 --worker-class uvicorn.workers.UvicornWorker
```

### Load Balancing

```nginx
upstream api {
    server api1:8000;
    server api2:8000;
    server api3:8000;
}
```

## ✅ Checklist Pós-Deploy

- [ ] API respondendo em `/health`
- [ ] Frontend carregando corretamente
- [ ] Login/Register funcionando
- [ ] Testes de smoke (básicos)
- [ ] Verificar SSL certificate
- [ ] Testar com celular (mobile)
- [ ] Monitorar logs por erros
- [ ] Informar time sobre go-live
- [ ] Plano de suporte 24h

## 🆘 Troubleshooting

### API não inicia
```bash
docker logs lumiar_api_prod
# Verificar SECRET_KEY, DATABASE_URL
```

### Banco de dados não conecta
```bash
docker exec lumiar_postgres_prod pg_isready
# Verificar POSTGRES_PASSWORD
```

### SSL certificate error
```bash
# Validar certificado
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout
```

---

**Pronto para produção?** Contate o time de DevOps!
