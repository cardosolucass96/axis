# Ajuste de Período - Semanas Dinâmicas

## Mudança Realizada

A partir de agora, as semanas são calculadas dinamicamente baseado no calendário do mês, ao invés de usar valores fixos.

### Novo Sistema de Semanas

**Regras:**
- **Semana 1**: dias 1-7 
- **Semana 2**: dias 8-14
- **Semana 3**: dias 15-21
- **Semana 4**: dias 22-28
- **Semana 5**: dias 29-31 (quando existir)
- **Mês Geral**: dados agregados do mês inteiro

### Formato

As semanas agora são exibidas como:
- `Semana 1 (1-7)`
- `Semana 2 (8-14)`
- `Semana 3 (15-21)`
- `Semana 4 (22-28)`
- `Semana 5 (29-31)` (se o mês tiver 29+ dias)
- `Mês Geral`

### Retrocompatibilidade

O sistema mantém retrocompatibilidade com dados antigos:
- Formatos antigos como `Semana 1`, `Semana 2`, etc. são automaticamente normalizados
- Filtros funcionam corretamente mesmo ao misturar dados antigos e novos
- Os dados existentes no banco de dados continuam funcionando

### Arquivos Modificados

**Frontend:**
- `frontend/utils/weekCalculator.ts` - Novo arquivo com funções utilitárias
- `frontend/types.ts` - WEEKS agora usa `getDefaultWeeks()`
- `frontend/pages/DataEntry.tsx` - Semanas dinâmicas baseadas no mês selecionado
- `frontend/pages/Dashboard.tsx` - Semanas dinâmicas com normalização
- `frontend/pages/ActionPlans.tsx` - Semanas dinâmicas com normalização

**Backend:**
- `backend/src/utils/weekCalculator.ts` - Novo arquivo com funções utilitárias

### Exemplo de Uso

```typescript
import { getWeeksForMonth, getWeekNumberFromDay, normalizeWeekName } from './utils/weekCalculator';

// Obter semanas disponíveis para um mês
const weeks = getWeeksForMonth('Outubro'); 
// Resultado: ['Semana 1 (1-7)', 'Semana 2 (8-14)', 'Semana 3 (15-21)', 'Semana 4 (22-28)', 'Semana 5 (29-31)', 'Mês Geral']

// Obter número da semana baseado no dia
const weekNum = getWeekNumberFromDay(15);
// Resultado: 3

// Normalizar nomes antigos para novos
const normalized = normalizeWeekName('Semana 1', 'Outubro');
// Resultado: 'Semana 1 (1-7)'
```

### Próximas Etapas (Opcional)

Se desejar, é possível:
1. Migrar dados existentes para o novo formato usando a função `normalizeWeekName()`
2. Adicionar testes para garantir compatibilidade
3. Atualizar a documentação da API
