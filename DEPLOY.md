# Deploy AXIS no Docker Swarm com Portainer

## 📋 Pré-requisitos

- Docker Swarm ativo
- Portainer configurado
- Rede `CardosoNet` criada
- Traefik configurado como reverse proxy
- Certificado Let's Encrypt configurado

## � CI/CD com GitHub Actions

O repositório inclui um workflow que builda e publica as imagens automaticamente no **GitHub Container Registry (ghcr.io)**.

### Configuração do GitHub Actions

1. **Secrets necessários** (Settings → Secrets and variables → Actions):
   - `GEMINI_API_KEY`: Chave da API Gemini (opcional)

2. **Variables** (Settings → Secrets and variables → Actions → Variables):
   - `VITE_API_URL`: URL da API (padrão: `https://axis.cardosolucas.com/api`)
   - `PORTAINER_WEBHOOK_URL`: URL do webhook para deploy automático (opcional)

3. **Permissões do GITHUB_TOKEN**:
   - Vá em Settings → Actions → General
   - Em "Workflow permissions", selecione "Read and write permissions"

### Como funciona

- A cada push na branch `main` ou `master`, as imagens são buildadas e publicadas:
  - `ghcr.io/SEU_USUARIO/axis/axis-backend:latest`
  - `ghcr.io/SEU_USUARIO/axis/axis-frontend:latest`

### Imagens disponíveis

Após o primeiro build, as imagens ficam disponíveis em:
- `ghcr.io/cardosolucass96/axis/axis-backend:latest`
- `ghcr.io/cardosolucass96/axis/axis-frontend:latest`

---

## 🚀 Deploy via Portainer

### 1. Preparar as Imagens Docker (Manual - opcional)

Se preferir build manual em vez do GitHub Actions:

```bash
# Build da imagem do backend
cd /caminho/para/axis
docker build -t axis-backend:latest ./backend

# Build da imagem do frontend (com variáveis de build)
docker build -t axis-frontend:latest \
  --build-arg VITE_API_URL=https://axis.cardosolucas.com/api \
  --build-arg GEMINI_API_KEY=sua_chave_gemini \
  ./frontend
```

### 2. Configurar Registry no Portainer

Para usar imagens do GitHub Container Registry:

1. No Portainer, vá em **Registries** → **Add registry**
2. Selecione **Custom registry**
3. Configure:
   - Name: `GitHub Container Registry`
   - Registry URL: `ghcr.io`
   - Username: seu usuário GitHub
   - Password: Token de acesso pessoal (PAT) com permissão `read:packages`

### 3. Deploy via Portainer

#### Opção A: Stack via docker-compose.yml

1. Acesse o Portainer
2. Vá em **Stacks** → **Add Stack**
3. Nome: `axis`
4. Cole o conteúdo do `docker-compose.yml`
5. Configure as variáveis de ambiente:
   - `SESSION_SECRET`: Chave secreta para sessões (gere uma aleatória)
   - `GOOGLE_CLIENT_ID`: ID do cliente Google OAuth
   - `GOOGLE_CLIENT_SECRET`: Secret do cliente Google OAuth
   - `GEMINI_API_KEY`: Chave da API Gemini (opcional)
6. Clique em **Deploy the stack**

#### Opção B: Deploy via Git Repository

1. Faça push deste repositório para seu Git
2. No Portainer, vá em **Stacks** → **Add Stack**
3. Selecione **Repository**
4. Configure o repositório Git
5. Path: `docker-compose.yml`
6. Configure as variáveis de ambiente
7. Deploy

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `SESSION_SECRET` | Chave secreta para cookies de sessão | ✅ Sim |
| `GOOGLE_CLIENT_ID` | ID do cliente Google OAuth | ❌ Não |
| `GOOGLE_CLIENT_SECRET` | Secret do Google OAuth | ❌ Não |
| `GEMINI_API_KEY` | Chave da API Gemini | ❌ Não |

## 🌐 Rotas do Traefik

| Rota | Serviço | Descrição |
|------|---------|-----------|
| `https://axis.cardosolucas.com/*` | Frontend | Aplicação React |
| `https://axis.cardosolucas.com/api/*` | Backend | API Fastify |

O middleware `axis-strip-api` remove o prefixo `/api` antes de encaminhar ao backend.

## 📁 Volumes

| Volume | Descrição |
|--------|-----------|
| `axis-data` | Dados do SQLite (banco de dados) |

**⚠️ IMPORTANTE**: Faça backup regular do volume `axis-data` para não perder dados.

### Backup do volume:

```bash
# Backup
docker run --rm -v axis-data:/data -v $(pwd):/backup alpine tar czf /backup/axis-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore
docker run --rm -v axis-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/axis-backup-YYYYMMDD.tar.gz"
```

## 🔍 Health Checks

- **Backend**: `GET /health` → Retorna status do servidor e conexão com banco
- **Frontend**: `GET /health` → Retorna "OK" (nginx)

## 🐛 Troubleshooting

### Logs do Backend
```bash
docker service logs axis_axis-backend -f
```

### Logs do Frontend
```bash
docker service logs axis_axis-frontend -f
```

### Verificar status dos serviços
```bash
docker service ls | grep axis
```

### Reiniciar serviços
```bash
docker service update --force axis_axis-backend
docker service update --force axis_axis-frontend
```

## 🔄 Atualização

Para atualizar a aplicação:

1. Build das novas imagens
2. Push para registry (se aplicável)
3. No Portainer, vá na Stack e clique em **Update the stack**

Ou via CLI:

```bash
docker service update --image axis-backend:latest axis_axis-backend
docker service update --image axis-frontend:latest axis_axis-frontend
```
