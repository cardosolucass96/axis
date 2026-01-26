/**
 * Testes para a funcionalidade de Metas Dinâmicas
 * 
 * A funcionalidade recalcula as metas das semanas futuras baseado no desempenho
 * das semanas já concluídas (com realizado preenchido).
 * 
 * Regras:
 * - Quando uma semana tem realizado preenchido, a meta fica "congelada"
 * - O restante (meta_mensal - total_realizado) é redistribuído entre semanas pendentes
 * - Distribuição é proporcional aos dias de cada semana
 * 
 * Formato: "MÊS Sem1 (dia-dia)" ex: "OUT Sem1 (1-4)"
 */

import {
  getWeeksForMonth,
  getDaysInWeek,
  getTotalDaysInMonth,
  distributeMonthlyTarget,
  recalculateRemainingWeeklyTargets,
  WeeklyEntry,
  getWeekLabel,
  isSameWeek,
  getMonthAbbrev,
  extractWeekNumber,
  extractDayRange,
  getNextMonths,
} from '../utils/weekCalculator';

describe('Metas Dinâmicas - weekCalculator (Novo Formato)', () => {
  
  describe('getMonthAbbrev', () => {
    it('deve retornar abreviação correta do mês', () => {
      expect(getMonthAbbrev('Janeiro')).toBe('JAN');
      expect(getMonthAbbrev('Fevereiro')).toBe('FEV');
      expect(getMonthAbbrev('Outubro')).toBe('OUT');
      expect(getMonthAbbrev('Dezembro')).toBe('DEZ');
    });
  });

  describe('getNextMonths', () => {
    it('deve retornar os próximos N meses a partir de hoje', () => {
      const months = getNextMonths(6);
      
      expect(months).toHaveLength(6);
      expect(months[0]).toHaveProperty('month');
      expect(months[0]).toHaveProperty('year');
    });

    it('deve incluir o mês atual como primeiro', () => {
      const months = getNextMonths(3);
      const now = new Date();
      const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now);
      const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
      
      expect(months[0].month).toBe(capitalizedMonth);
      expect(months[0].year).toBe(now.getFullYear());
    });
  });

  describe('getWeeksForMonth', () => {
    it('deve retornar semanas no novo formato para Janeiro 2026', () => {
      const weeks = getWeeksForMonth('Janeiro', 2026);
      
      expect(weeks.length).toBeGreaterThan(0);
      // Janeiro 2026 começa em quinta-feira (1), então semana 1 vai de 1-2 (até sexta)
      expect(weeks[0]).toBe('JAN Sem1 (1-2)');
      expect(weeks[1]).toBe('JAN Sem2 (3-9)');
    });

    it('deve retornar semanas no novo formato para Outubro 2026', () => {
      const weeks = getWeeksForMonth('Outubro', 2026);
      
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks[0]).toMatch(/^OUT Sem1/);
    });

    it('deve retornar array vazio para mês inválido', () => {
      const weeks = getWeeksForMonth('MesInvalido', 2026);
      expect(weeks.length).toBe(0);
    });

    it('deve gerar semanas corretas para Fevereiro 2026', () => {
      const weeks = getWeeksForMonth('Fevereiro', 2026);
      
      // Fevereiro 2026 começa em domingo (0)
      // Sem1: 1-6 (dom a sex), Sem2: 7-13, etc.
      expect(weeks[0]).toBe('FEV Sem1 (1-6)');
      expect(weeks[weeks.length - 1]).toMatch(/28\)/); // Último dia de fevereiro
    });
  });

  describe('extractWeekNumber', () => {
    it('deve extrair número da semana corretamente', () => {
      expect(extractWeekNumber('JAN Sem1 (1-2)')).toBe(1);
      expect(extractWeekNumber('OUT Sem4 (17-23)')).toBe(4);
      expect(extractWeekNumber('DEZ Sem5 (28-31)')).toBe(5);
    });

    it('deve retornar null para formato inválido', () => {
      expect(extractWeekNumber('Semana Inválida')).toBeNull();
    });
  });

  describe('extractDayRange', () => {
    it('deve extrair intervalo de dias corretamente', () => {
      expect(extractDayRange('JAN Sem1 (1-2)')).toEqual({ start: 1, end: 2 });
      expect(extractDayRange('OUT Sem4 (17-23)')).toEqual({ start: 17, end: 23 });
    });

    it('deve retornar null para formato inválido', () => {
      expect(extractDayRange('Semana Inválida')).toBeNull();
    });
  });

  describe('getDaysInWeek', () => {
    it('deve calcular corretamente número de dias', () => {
      expect(getDaysInWeek('JAN Sem1 (1-2)')).toBe(2);
      expect(getDaysInWeek('FEV Sem2 (7-13)')).toBe(7);
      expect(getDaysInWeek('MAR Sem5 (28-31)')).toBe(4);
    });

    it('deve retornar 7 como padrão para formato inválido', () => {
      expect(getDaysInWeek('Semana 1')).toBe(7);
      expect(getDaysInWeek('Invalid')).toBe(7);
    });
  });

  describe('getTotalDaysInMonth', () => {
    it('deve retornar dias corretos para cada mês', () => {
      expect(getTotalDaysInMonth('Janeiro', 2026)).toBe(31);
      expect(getTotalDaysInMonth('Fevereiro', 2026)).toBe(28);
      expect(getTotalDaysInMonth('Fevereiro', 2024)).toBe(29); // Ano bissexto
      expect(getTotalDaysInMonth('Abril', 2026)).toBe(30);
    });

    it('deve retornar 31 como padrão para mês inválido', () => {
      expect(getTotalDaysInMonth('MesInvalido', 2026)).toBe(31);
    });
  });

  describe('isSameWeek', () => {
    it('deve identificar semanas iguais', () => {
      expect(isSameWeek('JAN Sem1 (1-2)', 'JAN Sem1 (1-2)')).toBe(true);
      expect(isSameWeek('OUT Sem3 (10-16)', 'OUT Sem3 (10-16)')).toBe(true);
    });

    it('deve identificar semanas diferentes', () => {
      expect(isSameWeek('JAN Sem1 (1-2)', 'JAN Sem2 (3-9)')).toBe(false);
      expect(isSameWeek('JAN Sem1 (1-2)', 'FEV Sem1 (1-6)')).toBe(false);
    });

    it('deve comparar por intervalo de dias', () => {
      // Mesmo intervalo, mesmo resultado
      expect(isSameWeek('JAN Sem1 (1-7)', 'OUT Sem1 (1-7)')).toBe(true);
    });
  });

  describe('distributeMonthlyTarget', () => {
    it('deve distribuir meta mensal proporcionalmente entre semanas', () => {
      const monthlyTarget = 31000;
      const month = 'Janeiro';
      const year = 2026;
      
      const distribution = distributeMonthlyTarget(monthlyTarget, month, year, 'currency');
      const weeks = getWeeksForMonth(month, year);
      
      // Verificar que todas as semanas têm meta
      weeks.forEach(week => {
        expect(distribution[week]).toBeDefined();
        expect(distribution[week]).toBeGreaterThan(0);
      });

      // Verificar que soma das metas = meta mensal
      const total = Object.values(distribution).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(monthlyTarget, 0);
    });

    it('deve manter meta igual para todas as semanas quando unit é percent', () => {
      const monthlyTarget = 95;
      const distribution = distributeMonthlyTarget(monthlyTarget, 'Janeiro', 2026, 'percent');
      const weeks = getWeeksForMonth('Janeiro', 2026);
      
      weeks.forEach(week => {
        expect(distribution[week]).toBe(95);
      });
    });

    it('deve distribuir proporcionalmente aos dias para currency', () => {
      const monthlyTarget = 31000;
      const month = 'Janeiro';
      const year = 2026;
      
      const distribution = distributeMonthlyTarget(monthlyTarget, month, year, 'currency');
      const weeks = getWeeksForMonth(month, year);
      
      // Semanas com mais dias devem ter metas maiores
      const week1Days = getDaysInWeek(weeks[0]);
      const week2Days = getDaysInWeek(weeks[1]);
      
      if (week2Days > week1Days) {
        expect(distribution[weeks[1]]).toBeGreaterThan(distribution[weeks[0]]);
      }
    });
  });

  describe('recalculateRemainingWeeklyTargets', () => {
    it('deve recalcular metas quando primeira semana está concluída', () => {
      const monthlyTarget = 100000;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      const entries: WeeklyEntry[] = [
        { week: weeks[0], realized: 15000, target: 10000, isCompleted: true },
      ];

      const newTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );

      // Meta restante: 100000 - 15000 = 85000 distribuída entre semanas restantes
      const remainingTotal = Object.entries(newTargets)
        .filter(([week]) => week !== weeks[0])
        .reduce((sum, [, target]) => sum + target, 0);

      expect(remainingTotal).toBeCloseTo(85000, 0);
    });

    it('deve manter meta original para semanas concluídas', () => {
      const monthlyTarget = 100000;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      const originalTargets = distributeMonthlyTarget(monthlyTarget, month, year, 'currency');
      
      const entries: WeeklyEntry[] = [
        { week: weeks[0], realized: 15000, target: originalTargets[weeks[0]], isCompleted: true },
      ];

      const newTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );

      // Meta da semana concluída deve ser mantida
      expect(newTargets[weeks[0]]).toBe(originalTargets[weeks[0]]);
    });

    it('deve redistribuir deficit entre semanas pendentes', () => {
      const monthlyTarget = 100000;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      const originalTargets = distributeMonthlyTarget(monthlyTarget, month, year, 'currency');
      
      // Realizado abaixo da meta
      const entries: WeeklyEntry[] = [
        { week: weeks[0], realized: 5000, target: originalTargets[weeks[0]], isCompleted: true },
      ];

      const newTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );

      // Meta restante: 100000 - 5000 = 95000
      const remainingTotal = Object.entries(newTargets)
        .filter(([week]) => week !== weeks[0])
        .reduce((sum, [, target]) => sum + target, 0);

      expect(remainingTotal).toBeCloseTo(95000, 0);
    });

    it('deve tratar percentuais mantendo meta fixa', () => {
      const monthlyTarget = 95;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      const entries: WeeklyEntry[] = [
        { week: weeks[0], realized: 90, target: 95, isCompleted: true },
      ];

      const newTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'percent'
      );

      // Para percentuais, todas as metas devem ser 95
      weeks.forEach(week => {
        expect(newTargets[week]).toBe(95);
      });
    });

    it('não deve permitir metas negativas', () => {
      const monthlyTarget = 100000;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      // Realizado muito acima da meta
      const entries: WeeklyEntry[] = [
        { week: weeks[0], realized: 150000, target: 10000, isCompleted: true },
      ];

      const newTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );

      // Metas das semanas pendentes devem ser 0 ou maiores
      Object.values(newTargets).forEach(target => {
        expect(target).toBeGreaterThanOrEqual(0);
      });
    });

    it('deve calcular corretamente com múltiplas semanas concluídas', () => {
      const monthlyTarget = 100000;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      const originalTargets = distributeMonthlyTarget(monthlyTarget, month, year, 'currency');
      
      const entries: WeeklyEntry[] = [
        { week: weeks[0], realized: 8000, target: originalTargets[weeks[0]], isCompleted: true },
        { week: weeks[1], realized: 22000, target: originalTargets[weeks[1]], isCompleted: true },
      ];

      const newTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );

      // Meta restante: 100000 - 8000 - 22000 = 70000
      const remainingTotal = Object.entries(newTargets)
        .filter(([week]) => !entries.some(e => e.week === week))
        .reduce((sum, [, target]) => sum + target, 0);

      expect(remainingTotal).toBeCloseTo(70000, 0);
    });
  });

  describe('getWeekLabel', () => {
    it('deve retornar label correto para número de semana', () => {
      const label = getWeekLabel('Janeiro', 1, 2026);
      expect(label).toBe('JAN Sem1 (1-2)');
    });

    it('deve retornar label genérico se semana não existe', () => {
      const label = getWeekLabel('Janeiro', 10, 2026);
      expect(label).toContain('JAN Sem10');
    });
  });

  describe('Cenários de Integração', () => {
    it('deve funcionar corretamente para um mês inteiro', () => {
      const monthlyTarget = 200000;
      const month = 'Janeiro';
      const year = 2026;
      const weeks = getWeeksForMonth(month, year);
      
      // Simular preenchimento progressivo
      let entries: WeeklyEntry[] = [];
      let currentTargets = distributeMonthlyTarget(monthlyTarget, month, year, 'currency');
      
      // Semana 1: realizado 80% da meta
      entries.push({
        week: weeks[0],
        realized: currentTargets[weeks[0]] * 0.8,
        target: currentTargets[weeks[0]],
        isCompleted: true
      });
      
      currentTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );
      
      // Semana 2: realizado 120% da meta recalculada
      entries.push({
        week: weeks[1],
        realized: currentTargets[weeks[1]] * 1.2,
        target: currentTargets[weeks[1]],
        isCompleted: true
      });
      
      currentTargets = recalculateRemainingWeeklyTargets(
        monthlyTarget, month, entries, year, 'currency'
      );
      
      // Verificar que todas as metas são válidas
      Object.values(currentTargets).forEach(target => {
        expect(target).toBeGreaterThanOrEqual(0);
        expect(typeof target).toBe('number');
        expect(isNaN(target)).toBe(false);
      });
    });

    it('deve tratar mês com 4 semanas corretamente', () => {
      const weeks = getWeeksForMonth('Fevereiro', 2026);
      
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks[0]).toMatch(/^FEV Sem1/);
      
      // Verificar que cobre todo o mês
      const lastWeek = weeks[weeks.length - 1];
      const range = extractDayRange(lastWeek);
      expect(range?.end).toBe(28); // Fevereiro 2026 tem 28 dias
    });

    it('deve tratar mês com 31 dias corretamente', () => {
      const weeks = getWeeksForMonth('Março', 2026);
      
      // Verificar que cobre todo o mês
      const lastWeek = weeks[weeks.length - 1];
      const range = extractDayRange(lastWeek);
      expect(range?.end).toBe(31);
    });
  });
});
