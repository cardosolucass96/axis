# API Endpoints - AXIS Backend

Base URL: `http://localhost:3000`

## Health Check
- `GET /health` - Verifica status do servidor e banco de dados

## Usuários
- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Obter detalhes de um usuário
- `POST /api/users` - Criar novo usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário
- `POST /api/users/:userId/link-sector` - Vincular líder a um setor

## Setores
- `GET /api/sectors` - Listar todos os setores
- `GET /api/sectors/:id` - Obter detalhes de um setor
- `POST /api/sectors` - Criar novo setor
- `PUT /api/sectors/:id` - Atualizar setor
- `DELETE /api/sectors/:id` - Deletar setor

## KPIs
- `GET /api/kpis` - Listar todos os KPIs
- `GET /api/kpis/:id` - Obter detalhes de um KPI
- `GET /api/sectors/:sectorId/kpis` - Listar KPIs de um setor
- `POST /api/sectors/:sectorId/kpis` - Criar novo KPI
- `PUT /api/kpis/:id` - Atualizar KPI
- `DELETE /api/kpis/:id` - Deletar KPI

## Entradas de KPI
- `GET /api/entries` - Listar todas as entradas (filtros: sectorId, month, week, kpiId)
- `GET /api/entries/:id` - Obter detalhes de uma entrada
- `POST /api/entries` - Criar nova entrada
- `PUT /api/entries/:id` - Atualizar entrada
- `DELETE /api/entries/:id` - Deletar entrada
- `GET /api/sectors/:sectorId/entries` - Listar entradas de um setor

## Planos de Ação
- `GET /api/action-plans` - Listar todos os planos (filtros: status, sectorId, month)
- `GET /api/action-plans/:id` - Obter detalhes de um plano
- `POST /api/entries/:entryId/action-plans` - Criar plano de ação
- `PUT /api/action-plans/:id` - Atualizar plano de ação
- `PATCH /api/action-plans/:id/status` - Mudar status do plano
- `DELETE /api/action-plans/:id` - Deletar plano de ação

## Causas Raiz (5 Porquês)
- `GET /api/entries/:entryId/causes` - Listar causas de uma entry
- `POST /api/entries/:entryId/causes` - Adicionar causa
- `PUT /api/causes/:id` - Atualizar causa
- `DELETE /api/causes/:id` - Deletar causa

## Formato de Resposta

### Sucesso
```json
{
  "status": "success",
  "data": { ... }
}
```

### Erro
```json
{
  "status": "error",
  "message": "Descrição do erro"
}
```

## CORS
O servidor aceita requisições de:
- http://localhost:5173 (Vite default)
- http://localhost:3001 (Vite alternative)
- http://localhost:3000 (Backend)
- http://127.0.0.1:5173
- http://127.0.0.1:3001

## Como Iniciar

```bash
# Instalar dependências
npm install

# Criar banco de dados e popular
npm run db:seed

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`
