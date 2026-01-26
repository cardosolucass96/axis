# 🧪 Guia de Testes - Períodos Dinâmicos

## Como Testar a Implementação

### 1. **Testar DataEntry (Entrada de Dados)**

#### Teste 1: Semanas aparecem dinamicamente
```
1. Abrir página "Data Entry"
2. Selecionar mês "Outubro" (31 dias)
3. Verificar dropdown "Período (Semana)" exibe:
   ✓ Semana 1 (1-7)
   ✓ Semana 2 (8-14)
   ✓ Semana 3 (15-21)
   ✓ Semana 4 (22-28)
   ✓ Semana 5 (29-31) ← Deve existir
   ✓ Mês Geral

4. Mudar para "Fevereiro" (28 dias)
5. Verificar dropdown agora exibe:
   ✓ Semana 1 (1-7)
   ✓ Semana 2 (8-14)
   ✓ Semana 3 (15-21)
   ✓ Semana 4 (22-28)
   ✗ Semana 5 (29-31) ← Não deve existir
   ✓ Mês Geral
```

#### Teste 2: Primeira semana sempre começa no dia 1
```
1. Verificar que todas as semanas têm formato:
   Semana N (dias iniciais-dias finais)
   
2. Confirmar:
   ✓ Semana 1 SEMPRE começa em (1-...)
   ✓ Nunca há semana começando em 0
   ✓ Sequência é: 1-7, 8-14, 15-21, 22-28, 29-31
```

#### Teste 3: Dados salvam corretamente
```
1. Selecionar Outubro + Semana 3 (15-21)
2. Preencher dados para uma KPI
3. Salvar
4. Verificar se salvou com semana "Semana 3 (15-21)" ou normalizado
5. Mudar de semana e voltar → dados devem estar lá
```

---

### 2. **Testar Dashboard (Visão de Dados)**

#### Teste 1: Filtros dinâmicos de semanas
```
1. Abrir Dashboard
2. Clicar em filtro "Período (Semana)"
3. Verificar que começa com "Todas as Semanas"
4. Clicar em filtro "Mês"
5. Selecionar "Outubro"
6. Voltar ao filtro "Semana" → deve exibir semanas dinâmicas
```

#### Teste 2: Filtragem funciona corretamente
```
1. Filtrar por mês "Outubro" e semana "Semana 2 (8-14)"
2. Verificar que dados exibidos correspondem a essa semana
3. Mudar para "Semana 3 (15-21)" → dados devem atualizar
4. Selecionar "Todas as Semanas" → volta a exibir todas
```

#### Teste 3: Retrocompatibilidade com dados antigos
```
Se houver dados antigos com formato "Semana 1" (sem datas):
1. Filtrar por "Semana 1 (1-7)"
2. Sistema deve exibir TAMBÉM dados com "Semana 1" antigo
3. Verificar que não há duplicatas
```

---

### 3. **Testar Action Plans (Planos de Ação)**

#### Teste 1: Filtros de semanas aparecem corretamente
```
1. Abrir "Planos de Ação"
2. Clicar em filtro "Semana"
3. Verificar opções dinâmicas baseadas no mês
4. Mudar mês → opciones de semana devem atualizar
```

#### Teste 2: Filtragem por semana funciona
```
1. Selecionar mês "Outubro" e semana "Semana 1 (1-7)"
2. Verificar que apenas planos da semana 1 aparecem
3. Mudar para "Semana 4 (22-28)" → dados devem filtrar
4. Selecionar "Todas as Semanas" → volta a exibir todos
```

#### Teste 3: Exportação CSV inclui semanas corretas
```
1. Aplicar filtros de semana
2. Clicar em "Exportar CSV"
3. Abrir arquivo e verificar coluna "Semana"
4. Confirmar que semanas estão no formato novo (1-7, 8-14, etc.)
```

---

### 4. **Testes de Compatibilidade (Backend)**

#### Teste 1: API aceita ambos formatos
```bash
# Teste com novo formato
curl http://localhost:3000/api/sectors/:sectorId/entries \
  -G -d "month=Outubro&week=Semana 1 (1-7)"

# Teste com formato antigo
curl http://localhost:3000/api/sectors/:sectorId/entries \
  -G -d "month=Outubro&week=Semana 1"

# Ambos devem retornar dados (se houver)
```

#### Teste 2: Salvar com novo formato
```
1. Entrada de dados salva com "Semana 2 (8-14)"
2. GET /api/sectors/:id/entries retorna com novo formato
3. Verificar que busca posterior funciona normalmente
```

---

### 5. **Teste Visual/UX**

#### Checklist de UI
- [ ] Dropdown de semanas não fica vazio quando seleciona mês
- [ ] Semanas aparecem com melhor contexto (dias especificados)
- [ ] Sem opções duplicadas
- [ ] Filtros em Dashboard atualizam quando mês muda
- [ ] Filtros em ActionPlans atualizam quando mês muda
- [ ] Comportamento é consistente em Desktop/Mobile

---

### 6. **Casos Extremos**

#### Teste 1: Meses diferentes
```
Testar cada mês:
- Janeiro (31): deve ter 5 semanas
- Fevereiro normal (28): deve ter 4 semanas  
- Fevereiro bissexto (29): deve ter 5 semanas
- Abril (30): deve ter 5 semanas
- Dezembro (31): deve ter 5 semanas
```

#### Teste 2: Navegação entre meses
```
1. DataEntry: Outubro → Novembro → Dezembro → Outubro
2. Verificar que semanas mudam corretamente
3. Sem erros no console
4. Estado fica consistente
```

---

## 🐛 Se Encontrar Bugs

### Bug: Semanas não atualizam ao mudar mês
**Solução:** Verificar se `useMemo` tem `selectedMonth`/`filterMonth` como dependência

### Bug: Dados desaparecem ao filtrar
**Solução:** Usar `normalizeWeekName()` na comparação de semanas

### Bug: "Semana 5" não aparece em alguns meses
**Solução:** Verificar se a função calcula corretamente o último dia do mês

### Bug: Retrocompatibilidade quebrada
**Solução:** Garantir que `normalizeWeekName()` é chamada em todos os filtros

---

## ✅ Checklist de Validação

- [ ] DataEntry exibe semanas dinâmicas
- [ ] Dashboard filtra por semanas dinâmicas
- [ ] ActionPlans filtra por semanas dinâmicas
- [ ] Dados antigos ainda funcionam
- [ ] Não há erros no console
- [ ] Salvar e carregar dados funciona
- [ ] Exportação CSV inclui novo formato
- [ ] Responsive design mantido
- [ ] Performance não foi impactada
- [ ] Documentação atualizada

---

**Documento de Teste:** SEMANAS_DINAMICAS
**Data:** 2026-01-23
**Status:** Pronto para testar ✅
