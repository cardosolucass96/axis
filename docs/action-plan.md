# Plano de Ação - Desenvolvimento Backend AXIS

## Visão Geral
Desenvolvimento de um backend completo em TypeORM + Fastify que forneça APIs para o frontend AXIS (Gestão de KPIs), incluindo gestão de usuários, setores, KPIs, entradas de dados e planos de ação.

---

## Etapa 1: Setup e Configuração Inicial ✅ COMPLETA

### 1.1 - Configurar Banco de Dados e Migrações
- **Objetivo**: Estabelecer conexão e estrutura de dados robusta
- **Tarefas**:
  - [x] Configurar DataSource do TypeORM com SQLite
  - [x] Criar migrations para versionamento do banco
  - [x] Implementar seed script com dados iniciais (setores, KPIs, usuários)
  - [x] Testar conexão e logging

**Tempo estimado**: 2-3 horas
**Status**: ✅ CONCLUÍDO - Servidor rodando em http://localhost:3000

---

## Etapa 2: Desenvolvimento de Entidades (Models) ✅ COMPLETA

### 2.1 - Criar Entidades Base
- **Objetivo**: Definir estrutura de dados do banco
- **Tarefas**:
  - [x] Entidade `User` (melhorar: adicionar role, sectorId, avatar)
  - [x] Entidade `Sector` (id, name)
  - [x] Entidade `KPI` (id, name, unit, format, sectorId FK)
  - [x] Entidade `KpiEntry` (dados mensais/semanais: target, realized, gap, gapPercentage)
  - [x] Entidade `ActionPlan` (5W2H: what, why, where, who, when, how, howMuch, status)
  - [x] Entidade `RootCause` (causas do 5 Por Quês - relacionada a KpiEntry)

**Relacionamentos**:
- Sector 1→N KPI
- Sector 1→N User (líder)
- KPI 1→N KpiEntry
- KpiEntry 1→1 ActionPlan
- KpiEntry 1→N RootCause

**Tempo estimado**: 3-4 horas
**Status**: ✅ CONCLUÍDO - Todas as entidades criadas com relacionamentos e seed executado com sucesso

---

## Etapa 3: Implementação de Repositórios e Serviços ✅ COMPLETA

### 3.1 - Criar Repositórios
- **Objetivo**: Encapsular lógica de acesso aos dados
- **Tarefas**:
  - [x] Repository para User
  - [x] Repository para Sector
  - [x] Repository para KPI
  - [x] Repository para KpiEntry
  - [x] Repository para ActionPlan
  - [x] Repository para RootCause

### 3.2 - Criar Serviços de Negócio
- **Objetivo**: Implementar lógica de negócio
- **Tarefas**:
  - [x] Service para gestão de Setores (CRUD)
  - [x] Service para gestão de KPIs (CRUD por setor)
  - [x] Service para gestão de Usuários (CRUD, vincular a setores)
  - [x] Service para gestão de KpiEntry (CRUD, cálculos de gap/gapPercentage)
  - [x] Service para gestão de ActionPlans (CRUD, mudança de status)
  - [ ] Service para cálculos de Dashboard (health index, trends, financial bridge, aging)

**Tempo estimado**: 4-5 horas
**Status**: ✅ CONCLUÍDO - Todos os repositórios e serviços criados

---

## Etapa 3.5: Integração Frontend-Backend (Refatoração Incremental)

**Objetivo**: Refatorar o frontend para consumir APIs reais do backend de forma incremental, em paralelo com o desenvolvimento

### 3.5.1 - Configuração do Cliente HTTP ✅ COMPLETA
- **Objetivo**: Criar cliente HTTP para comunicação com backend
- **Tarefas**:
  - [x] Criar arquivo `src/services/api.ts` com configuração do fetch/axios
  - [x] Configurar base URL (http://localhost:3000/api)
  - [x] Implementar interceptadores para tratamento de erros

### 3.5.2 - Refatorar DataService para Chamar Backend ✅ COMPLETA
- **Objetivo**: Substituir dados mockados por chamadas HTTP
- **Tarefas**:
  - [x] Criar métodos que chamam `GET /api/users`
  - [x] Criar métodos que chamam `GET /api/sectors`
  - [x] Implementar cache local para reduzir requests (opcional)
  - [x] Adicionar loading states durante requisições
  - [x] Implementar tratamento de erros com feedback ao usuário

### 3.5.3 - Atualizar Estrutura do Frontend ✅ COMPLETA
- **Objetivo**: Preparar o frontend para dados dinâmicos
- **Tarefas**:
  - [x] Remover INITIAL_ENTRIES do constants.ts (usar apenas dados do backend)
  - [x] Remover SECTORS do constants.ts (usar dados do backend)
  - [x] Adicionar contexto para loading states em `ThemeContext` ou criar `LoadingContext`
  - [x] Adicionar tratamento de erro genérico
  - [x] Adicionar função de retry para requisições falhadas

### 3.5.4 - Testar Integração por Página
- **Objetivo**: Validar funcionamento de cada página com dados reais
- **Tarefas após cada etapa de backend**:
  - [ ] Etapa 4 (Usuários): Testar UserManagementPage + Dashboard
  - [ ] Etapa 5 (Setores/KPIs): Testar StructureManagementPage + DataEntry
  - [ ] Etapa 6 (KpiEntry): Testar DataEntry com salva dados reais
  - [ ] Etapa 7 (ActionPlan): Testar ActionPlansPage com dados reais
  - [ ] Etapa 8 (Dashboard): Testar Dashboard com dados agregados

**Tempo estimado**: 2 horas iniciais + 1 hora por teste incremental
**Status**: ⏳ PRÓXIMA ETAPA

## Etapa 4: Rotas de Autenticação e Usuários ✅ COMPLETA (Parte 4.1)

### 4.1 - Endpoints de Usuários ✅ COMPLETA
- **Objetivo**: Gerenciar usuários da plataforma
- **Endpoints**:
  - [x] `GET /api/users` - Listar todos os usuários
  - [x] `GET /api/users/:id` - Obter detalhes de um usuário
  - [x] `POST /api/users` - Criar novo usuário
  - [x] `PUT /api/users/:id` - Atualizar usuário
  - [x] `DELETE /api/users/:id` - Deletar usuário
  - [x] `POST /api/users/:userId/link-sector` - Vincular líder a um setor

### 4.2 - Autenticação Básica (Simples)
- **Objetivo**: Implementar autenticação simples para MVP
- **Tarefas**:
  - [ ] `POST /api/auth/login` - Login com email/senha simples ou Google
  - [ ] `GET /api/auth/me` - Obter usuário autenticado
  - [ ] `POST /api/auth/logout` - Logout
  - Obs: Usar JWT ou sessions (decidir abordagem)

**Tempo estimado**: 2-3 horas

---

## Etapa 5: Rotas de Estrutura (Setores e KPIs) ✅ COMPLETA

### 5.1 - Endpoints de Setores ✅ COMPLETA
- **Objetivo**: Gerenciar setores e sua estrutura
- **Endpoints**:
  - [x] `GET /api/sectors` - Listar todos os setores
  - [x] `GET /api/sectors/:id` - Obter detalhes de um setor com seus KPIs
  - [x] `POST /api/sectors` - Criar novo setor
  - [x] `PUT /api/sectors/:id` - Atualizar setor
  - [x] `DELETE /api/sectors/:id` - Deletar setor (cascade KPIs)

### 5.2 - Endpoints de KPIs ✅ COMPLETA
- **Objetivo**: Gerenciar KPIs dentro de setores
- **Endpoints**:
  - [x] `GET /api/sectors/:sectorId/kpis` - Listar KPIs de um setor
  - [x] `GET /api/kpis/:id` - Obter detalhes de um KPI
  - [x] `POST /api/sectors/:sectorId/kpis` - Criar novo KPI
  - [x] `PUT /api/kpis/:id` - Atualizar KPI
  - [x] `DELETE /api/kpis/:id` - Deletar KPI

**Tempo estimado**: 3-4 horas
**Status**: ✅ CONCLUÍDO

---

## Etapa 6: Rotas de Dados de KPI (KpiEntry) ✅ COMPLETA

### 6.1 - Endpoints de Entradas de KPI ✅ COMPLETA
- **Objetivo**: Gerenciar dados mensais/semanais de KPIs
- **Endpoints**:
  - [x] `GET /api/entries` - Listar todas as entradas (com filtros: sectorId, month, week)
  - [x] `GET /api/entries/:id` - Obter detalhes de uma entrada
  - [x] `POST /api/entries` - Criar nova entrada
  - [x] `PUT /api/entries/:id` - Atualizar entrada (target, realized, causes)
  - [x] `DELETE /api/entries/:id` - Deletar entrada
  - [x] `GET /api/sectors/:sectorId/entries` - Listar entradas de um setor
  - [x] `GET /api/sectors/:sectorId/entries?month=...&week=...` - Filtros avançados

### 6.2 - Validações e Cálculos ✅ COMPLETA
- **Objetivo**: Garantir integridade dos dados
- **Tarefas**:
  - [x] Validar valores numéricos (target, realized)
  - [x] Calcular automaticamente `gap = realized - target`
  - [x] Calcular automaticamente `gapPercentage = (realized / target) * 100`
  - [x] Validar que KPI existe antes de criar entry
  - [x] Validar que setor existe antes de criar entry

**Tempo estimado**: 3-4 horas
**Status**: ✅ CONCLUÍDO

---

## Etapa 7: Rotas de Planos de Ação (5W2H) ✅ COMPLETA

### 7.1 - Endpoints de Planos de Ação ✅ COMPLETA
- **Objetivo**: Gerenciar planos de ação e status
- **Endpoints**:
  - [x] `GET /api/action-plans` - Listar todos os planos (com filtros: status, sectorId, month)
  - [x] `GET /api/action-plans/:id` - Obter detalhes de um plano
  - [x] `POST /api/entries/:entryId/action-plans` - Criar plano de ação para uma entry
  - [x] `PUT /api/action-plans/:id` - Atualizar plano de ação
  - [x] `PATCH /api/action-plans/:id/status` - Mudar status (a_fazer → fazendo → feito / stand_by)
  - [x] `DELETE /api/action-plans/:id` - Deletar plano de ação

### 7.2 - Endpoints de Causas Raiz (5 Porquês) ✅ COMPLETA
- **Objetivo**: Gerenciar causas associadas a entries
- **Endpoints**:
  - [x] `GET /api/entries/:entryId/causes` - Listar causas de uma entry
  - [x] `POST /api/entries/:entryId/causes` - Adicionar causa
  - [x] `PUT /api/causes/:id` - Atualizar causa
  - [x] `DELETE /api/causes/:id` - Deletar causa

**Tempo estimado**: 3-4 horas
**Status**: ✅ CONCLUÍDO

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

## Etapa 12: DTOs e Validação

### 12.1 - Data Transfer Objects (DTOs)
- **Objetivo**: Validar e transformar dados de entrada
- **Tarefas**:
  - [ ] DTO para criar/atualizar User
  - [ ] DTO para criar/atualizar Sector
  - [ ] DTO para criar/atualizar KPI
  - [ ] DTO para criar/atualizar KpiEntry
  - [ ] DTO para criar/atualizar ActionPlan
  - [ ] Usar class-validator para validação automática

### 12.2 - Response DTOs
- **Objetivo**: Padronizar respostas
- **Tarefas**:
  - [ ] Criar estrutura padrão de resposta (data, status, message)
  - [ ] Implementar pagination (limit, offset, total)
  - [ ] Documentar formato de response para cada endpoint

**Tempo estimado**: 2-3 horas

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
| 3.5 | Integração Frontend | 2h + tests | 11-14h |
| 4 | Autenticação e Usuários | 2-3h | 13-17h |
| 5 | Setores e KPIs | 3-4h | 16-21h |
| 6 | KpiEntry | 3-4h | 19-25h |
| 7 | Action Plans | 3-4h | 22-29h |
| 8 | Dashboard | 4-5h | 26-34h |
| 9 | Middleware e Erros | 2-3h | 28-37h |
| 10 | DTOs e Validação | 2-3h | 30-40h |
| 11 | Testes | 4-5h | 34-45h |
| 12 | Documentação e Deploy | 2-3h | 36-48h |

**Total estimado**: 36-48 horas (1-2 semanas de trabalho)

---

## Prioridades Recomendadas

### MVP - Integração Básica (Semana 1)
1. ✅ Etapas 1-3 (Setup, Entidades, Repositórios/Serviços)
2. ✅ Etapa 3.5 (Refatoração do Frontend - Parte 1)
3. ✅ Etapas 4-6 (Autenticação, Estrutura, Dados)
4. ✅ Testes incrementais do frontend após cada etapa
5. ✅ Validação de fluxos básicos

### Fase 2 - Funcionalidades Avançadas (Semana 2)
1. ✅ Etapas 7-8 (Action Plans, Dashboard)
2. ✅ Etapas 9-10 (Middleware, DTOs, Validação)
3. ✅ Etapa 3.5 (Refatoração do Frontend - Parte 2)
4. ✅ Testes completos
5. ✅ Documentação e preparação para deploy

---

## Estratégia de Integração Frontend-Backend

A integração será feita de forma **incremental e paralela**:

1. **Após Etapa 4** (Usuários):
   - Frontend chama `GET /api/users`
   - Testa login com usuários reais
   - Valida `UserManagementPage`

2. **Após Etapa 5** (Setores/KPIs):
   - Frontend chama `GET /api/sectors` (com KPIs)
   - Testa criação de setor/KPI
   - Valida `StructureManagementPage`

3. **Após Etapa 6** (KpiEntry):
   - Frontend chama `POST/PUT /api/entries`
   - Testa salva dados reais
   - Valida `DataEntryPage`

4. **Após Etapa 7** (ActionPlans):
   - Frontend chama endpoints de planos
   - Testa criação e mudança de status
   - Valida `ActionPlansPage`

5. **Após Etapa 8** (Dashboard):
   - Frontend chama endpoints agregados
   - Testa visualização com dados reais
   - Valida `Dashboard`

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
