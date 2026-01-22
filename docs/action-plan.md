# Plano de Ação - Desenvolvimento Backend AXIS

## Visão Geral
Desenvolvimento de um backend completo em TypeORM + Fastify que forneça APIs para o frontend AXIS (Gestão de KPIs), incluindo gestão de usuários, setores, KPIs, entradas de dados e planos de ação.

---

## Etapa 1: Setup e Configuração Inicial

### 1.1 - Configurar Banco de Dados e Migrações
- **Objetivo**: Estabelecer conexão e estrutura de dados robusta
- **Tarefas**:
  - [ ] Configurar DataSource do TypeORM com SQLite
  - [ ] Criar migrations para versionamento do banco
  - [ ] Implementar seed script com dados iniciais (setores, KPIs, usuários)
  - [ ] Testar conexão e logging

**Tempo estimado**: 2-3 horas

---

## Etapa 2: Desenvolvimento de Entidades (Models)

### 2.1 - Criar Entidades Base
- **Objetivo**: Definir estrutura de dados do banco
- **Tarefas**:
  - [ ] Entidade `User` (melhorar: adicionar role, sectorId, avatar)
  - [ ] Entidade `Sector` (id, name)
  - [ ] Entidade `KPI` (id, name, unit, format, sectorId FK)
  - [ ] Entidade `KpiEntry` (dados mensais/semanais: target, realized, gap, gapPercentage)
  - [ ] Entidade `ActionPlan` (5W2H: what, why, where, who, when, how, howMuch, status)
  - [ ] Entidade `RootCause` (causas do 5 Por Quês - relacionada a KpiEntry)

**Relacionamentos**:
- Sector 1→N KPI
- Sector 1→N User (líder)
- KPI 1→N KpiEntry
- KpiEntry 1→1 ActionPlan
- KpiEntry 1→N RootCause

**Tempo estimado**: 3-4 horas

---

## Etapa 3: Implementação de Repositórios e Serviços

### 3.1 - Criar Repositórios
- **Objetivo**: Encapsular lógica de acesso aos dados
- **Tarefas**:
  - [ ] Repository para User
  - [ ] Repository para Sector
  - [ ] Repository para KPI
  - [ ] Repository para KpiEntry
  - [ ] Repository para ActionPlan
  - [ ] Repository para RootCause

### 3.2 - Criar Serviços de Negócio
- **Objetivo**: Implementar lógica de negócio
- **Tarefas**:
  - [ ] Service para gestão de Setores (CRUD)
  - [ ] Service para gestão de KPIs (CRUD por setor)
  - [ ] Service para gestão de Usuários (CRUD, vincular a setores)
  - [ ] Service para gestão de KpiEntry (CRUD, cálculos de gap/gapPercentage)
  - [ ] Service para gestão de ActionPlans (CRUD, mudança de status)
  - [ ] Service para cálculos de Dashboard (health index, trends, financial bridge, aging)

**Tempo estimado**: 4-5 horas

---

## Etapa 4: Rotas de Autenticação e Usuários

### 4.1 - Endpoints de Usuários
- **Objetivo**: Gerenciar usuários da plataforma
- **Endpoints**:
  - [ ] `GET /api/users` - Listar todos os usuários
  - [ ] `GET /api/users/:id` - Obter detalhes de um usuário
  - [ ] `POST /api/users` - Criar novo usuário
  - [ ] `PUT /api/users/:id` - Atualizar usuário
  - [ ] `DELETE /api/users/:id` - Deletar usuário
  - [ ] `POST /api/users/:id/link-sector` - Vincular líder a um setor

### 4.2 - Autenticação Básica (Simples)
- **Objetivo**: Implementar autenticação simples para MVP
- **Tarefas**:
  - [ ] `POST /api/auth/login` - Login com email/senha simples ou Google
  - [ ] `GET /api/auth/me` - Obter usuário autenticado
  - [ ] `POST /api/auth/logout` - Logout
  - Obs: Usar JWT ou sessions (decidir abordagem)

**Tempo estimado**: 2-3 horas

---

## Etapa 5: Rotas de Estrutura (Setores e KPIs)

### 5.1 - Endpoints de Setores
- **Objetivo**: Gerenciar setores e sua estrutura
- **Endpoints**:
  - [ ] `GET /api/sectors` - Listar todos os setores
  - [ ] `GET /api/sectors/:id` - Obter detalhes de um setor com seus KPIs
  - [ ] `POST /api/sectors` - Criar novo setor
  - [ ] `PUT /api/sectors/:id` - Atualizar setor
  - [ ] `DELETE /api/sectors/:id` - Deletar setor (cascade KPIs)

### 5.2 - Endpoints de KPIs
- **Objetivo**: Gerenciar KPIs dentro de setores
- **Endpoints**:
  - [ ] `GET /api/sectors/:sectorId/kpis` - Listar KPIs de um setor
  - [ ] `GET /api/kpis/:id` - Obter detalhes de um KPI
  - [ ] `POST /api/sectors/:sectorId/kpis` - Criar novo KPI
  - [ ] `PUT /api/kpis/:id` - Atualizar KPI
  - [ ] `DELETE /api/kpis/:id` - Deletar KPI

**Tempo estimado**: 3-4 horas

---

## Etapa 6: Rotas de Dados de KPI (KpiEntry)

### 6.1 - Endpoints de Entradas de KPI
- **Objetivo**: Gerenciar dados mensais/semanais de KPIs
- **Endpoints**:
  - [ ] `GET /api/entries` - Listar todas as entradas (com filtros: sectorId, month, week)
  - [ ] `GET /api/entries/:id` - Obter detalhes de uma entrada
  - [ ] `POST /api/entries` - Criar nova entrada
  - [ ] `PUT /api/entries/:id` - Atualizar entrada (target, realized, causes)
  - [ ] `DELETE /api/entries/:id` - Deletar entrada
  - [ ] `GET /api/sectors/:sectorId/entries` - Listar entradas de um setor
  - [ ] `GET /api/sectors/:sectorId/entries?month=...&week=...` - Filtros avançados

### 6.2 - Validações e Cálculos
- **Objetivo**: Garantir integridade dos dados
- **Tarefas**:
  - [ ] Validar valores numéricos (target, realized)
  - [ ] Calcular automaticamente `gap = realized - target`
  - [ ] Calcular automaticamente `gapPercentage = (realized / target) * 100`
  - [ ] Validar que KPI existe antes de criar entry
  - [ ] Validar que setor existe antes de criar entry

**Tempo estimado**: 3-4 horas

---

## Etapa 7: Rotas de Planos de Ação (5W2H)

### 7.1 - Endpoints de Planos de Ação
- **Objetivo**: Gerenciar planos de ação e status
- **Endpoints**:
  - [ ] `GET /api/action-plans` - Listar todos os planos (com filtros: status, sectorId, month)
  - [ ] `GET /api/action-plans/:id` - Obter detalhes de um plano
  - [ ] `POST /api/entries/:entryId/action-plans` - Criar plano de ação para uma entry
  - [ ] `PUT /api/action-plans/:id` - Atualizar plano de ação
  - [ ] `PATCH /api/action-plans/:id/status` - Mudar status (a_fazer → fazendo → feito / stand_by)
  - [ ] `DELETE /api/action-plans/:id` - Deletar plano de ação

### 7.2 - Endpoints de Causas Raiz (5 Porquês)
- **Objetivo**: Gerenciar causas associadas a entries
- **Endpoints**:
  - [ ] `GET /api/entries/:entryId/causes` - Listar causas de uma entry
  - [ ] `POST /api/entries/:entryId/causes` - Adicionar causa
  - [ ] `PUT /api/causes/:id` - Atualizar causa
  - [ ] `DELETE /api/causes/:id` - Deletar causa

**Tempo estimado**: 3-4 horas

---

## Etapa 8: Rotas de Dashboard e Relatórios

### 8.1 - Endpoints de Analytics
- **Objetivo**: Fornecer dados agregados para o Dashboard
- **Endpoints**:
  - [ ] `GET /api/dashboard/health-index?month=...&week=...` - KPI Health Index
    - Retorna: onTrack, warning, critical
  - [ ] `GET /api/dashboard/trend-analysis?months=3` - Análise de tendência
    - Retorna: dados históricos por mês
  - [ ] `GET /api/dashboard/financial-bridge?month=...&week=...` - Ponte Financeira
    - Retorna: target vs realized por setor
  - [ ] `GET /api/dashboard/plan-stats?month=...` - Estatísticas de Planos
    - Retorna: total, a_fazer, fazendo, feito, stand_by
  - [ ] `GET /api/dashboard/aging-plans?month=...` - Envelhecimento de Planos
    - Retorna: planos por faixa de dias aberto
  - [ ] `GET /api/dashboard/root-cause-cloud?month=...` - Nuvem de Causas Raiz
    - Retorna: causas agrupadas com frequência

**Tempo estimado**: 4-5 horas

---

## Etapa 9: Middleware e Tratamento de Erros

### 9.1 - Middleware
- **Objetivo**: Implementar camada de cross-cutting
- **Tarefas**:
  - [ ] Middleware de autenticação (verificar JWT/session)
  - [ ] Middleware de logging (request/response)
  - [ ] Middleware de CORS (permitir frontend)
  - [ ] Middleware de validação global
  - [ ] Middleware de rate limiting (opcional)

### 9.2 - Tratamento de Erros
- **Objetivo**: Respostas de erro consistentes
- **Tarefas**:
  - [ ] Criar classe customizada de erro HTTP
  - [ ] Implementar error handler global
  - [ ] Documentar códigos de erro
  - [ ] Retornar mensagens de erro claras

**Tempo estimado**: 2-3 horas

---

## Etapa 10: Validação e DTOs

### 10.1 - Data Transfer Objects (DTOs)
- **Objetivo**: Validar e transformar dados de entrada
- **Tarefas**:
  - [ ] DTO para criar/atualizar User
  - [ ] DTO para criar/atualizar Sector
  - [ ] DTO para criar/atualizar KPI
  - [ ] DTO para criar/atualizar KpiEntry
  - [ ] DTO para criar/atualizar ActionPlan
  - [ ] Usar class-validator para validação automática

### 10.2 - Response DTOs
- **Objetivo**: Padronizar respostas
- **Tarefas**:
  - [ ] Criar estrutura padrão de resposta (data, status, message)
  - [ ] Implementar pagination (limit, offset, total)
  - [ ] Documentar formato de response para cada endpoint

**Tempo estimado**: 2-3 horas

---

## Etapa 11: Testes Unitários e de Integração

### 11.1 - Setup de Testes
- **Objetivo**: Garantir qualidade do código
- **Tarefas**:
  - [ ] Configurar Jest/Vitest
  - [ ] Configurar banco de testes (SQLite em memória)
  - [ ] Implementar test factory/fixtures

### 11.2 - Testes Unitários
- **Objetivo**: Testar lógica de negócio isolada
- **Tarefas**:
  - [ ] Testes dos Services (cálculos, validações)
  - [ ] Testes dos Repositories (CRUD básico)
  - [ ] Meta: 70%+ cobertura de código

### 11.3 - Testes de Integração
- **Objetivo**: Testar fluxos completos
- **Tarefas**:
  - [ ] Testes dos endpoints principais
  - [ ] Testes de validação e erro handling
  - [ ] Testes de relacionamentos entre entidades

**Tempo estimado**: 4-5 horas

---

## Etapa 12: Integração com Frontend

### 12.1 - Configuração CORS
- **Objetivo**: Permitir requisições do frontend
- **Tarefas**:
  - [ ] Configurar CORS para localhost:5173 (Vite dev)
  - [ ] Configurar CORS para produção (quando souber URL)

### 12.2 - Testes de Integração Frontend-Backend
- **Objetivo**: Validar fluxos completo
- **Tarefas**:
  - [ ] Testar login no frontend
  - [ ] Testar criação de setor
  - [ ] Testar criação de KPI
  - [ ] Testar entrada de dados
  - [ ] Testar criação de plano de ação
  - [ ] Testar visualização do Dashboard
  - [ ] Testar filtros e busca
  - [ ] Testar exportação de dados (CSV)

### 12.3 - Ajustes Conforme Descobertas
- **Objetivo**: Refinar baseado em feedback
- **Tarefas**:
  - [ ] Corrigir incompatibilidades encontradas
  - [ ] Ajustar formatos de resposta se necessário
  - [ ] Melhorar performance conforme observado
  - [ ] Adicionar endpoints faltantes

**Tempo estimado**: 3-5 horas

---

## Etapa 13: Documentação e Deploy

### 13.1 - Documentação
- **Objetivo**: Facilitar manutenção e onboarding
- **Tarefas**:
  - [ ] Documentar API (Swagger/OpenAPI)
  - [ ] Criar README.md do backend com instruções de setup
  - [ ] Documentar variáveis de ambiente necessárias
  - [ ] Documentar fluxos de autenticação

### 13.2 - Deploy e Produção
- **Objetivo**: Preparar para produção
- **Tarefas**:
  - [ ] Configurar variáveis de ambiente (.env.example)
  - [ ] Configurar banco de dados de produção
  - [ ] Testar em ambiente semelhante a produção
  - [ ] Preparar script de deploy (ou Docker)
  - [ ] Validar performance (load testing se necessário)

**Tempo estimado**: 2-3 horas

---

## Timeline Resumida

| Etapa | Descrição | Duração | Acumulado |
|-------|-----------|---------|-----------|
| 1 | Setup Inicial | 2-3h | 2-3h |
| 2 | Entidades | 3-4h | 5-7h |
| 3 | Repositórios e Serviços | 4-5h | 9-12h |
| 4 | Autenticação e Usuários | 2-3h | 11-15h |
| 5 | Setores e KPIs | 3-4h | 14-19h |
| 6 | KpiEntry | 3-4h | 17-23h |
| 7 | Action Plans | 3-4h | 20-27h |
| 8 | Dashboard | 4-5h | 24-32h |
| 9 | Middleware e Erros | 2-3h | 26-35h |
| 10 | DTOs e Validação | 2-3h | 28-38h |
| 11 | Testes | 4-5h | 32-43h |
| 12 | Integração Frontend | 3-5h | 35-48h |
| 13 | Documentação e Deploy | 2-3h | 37-51h |

**Total estimado**: 37-51 horas (1-2 semanas de trabalho)

---

## Prioridades Recomendadas

### MVP (Semana 1)
1. ✅ Etapas 1-7 (Setup até Action Plans)
2. ✅ Integração básica com Frontend
3. ✅ Testes de smoke test

### Fase 2 (Semana 2)
1. ✅ Etapas 8-10 (Dashboard, Middleware, DTOs)
2. ✅ Testes completos
3. ✅ Documentação e deploy

---

## Checklist de Verificação Final

- [ ] Todos os endpoints implementados
- [ ] Todas as entidades com relacionamentos corretos
- [ ] Validação de dados consistente
- [ ] Testes passando (mínimo 70% cobertura)
- [ ] Frontend consegue fazer login
- [ ] Frontend consegue criar setor
- [ ] Frontend consegue criar KPI
- [ ] Frontend consegue salvar dados de KPI
- [ ] Frontend consegue visualizar Dashboard com dados
- [ ] Frontend consegue criar e editar planos de ação
- [ ] Filtros funcionam corretamente
- [ ] Exportação de dados funciona
- [ ] CORS configurado corretamente
- [ ] Documentação Swagger pronta
- [ ] Variáveis de ambiente documentadas

---

## Notas Importantes

1. **Autenticação**: Começar com algo simples (sem banco de senhas real) para MVP
2. **Banco de Dados**: SQLite funciona para MVP, migrar para PostgreSQL em produção
3. **Frontend**: Atualmente usa mock data em `dataService.ts` - precisará ser substituído por chamadas HTTP
4. **Seed Data**: Preparar script para popular dados iniciais (setores, KPIs, usuários demo)
5. **Performance**: Considerar indexes no banco de dados para queries frequentes (mês, setor)
