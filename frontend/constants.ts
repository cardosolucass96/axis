import { Sector, KpiEntry } from './types';

export const SECTORS: Sector[] = [
  {
    id: 'comercial_allef',
    name: 'Comercial - Squad Allef',
    kpis: [
      { id: 'mrr_vendido', name: 'MRR Vendido', unit: 'currency', format: 'R$ ' },
      { id: 'valor_vendas_recebido', name: 'Valor de Vendas Recebido', unit: 'currency', format: 'R$ ' },
      { id: 'reunioes_agendadas', name: 'Reuniões Agendadas', unit: 'number', format: '' },
      { id: 'reunioes_realizadas', name: 'Reuniões Realizadas', unit: 'number', format: '' },
    ]
  },
  {
    id: 'comercial_lais',
    name: 'Comercial - Squad Lais',
    kpis: [
      { id: 'mrr_vendido', name: 'MRR Vendido', unit: 'currency', format: 'R$ ' },
      { id: 'reunioes_agendadas', name: 'Reuniões Agendadas', unit: 'number', format: '' },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    kpis: [
      { id: 'num_leads', name: 'Número de Leads', unit: 'number', format: '' },
      { id: 'num_mql', name: 'Número de MQL', unit: 'number', format: '' },
      { id: 'valor_recebido_ss', name: 'Valor Recebido (S. Selling)', unit: 'currency', format: 'R$ ' },
      { id: 'reunioes_agendadas_ss', name: 'Nº Reuniões Agendadas (S. Selling)', unit: 'number', format: '' },
      { id: 'reunioes_realizadas_ss', name: 'Nº Reuniões Realizadas (S. Selling)', unit: 'number', format: '' },
    ]
  },
  {
    id: 'cs',
    name: 'CS (Customer Success)',
    kpis: [
      { id: 'revenue_churn', name: '% de Revenue Churn', unit: 'percent', format: '%' },
    ]
  }
];

// Seed some initial data for visualization
export const INITIAL_ENTRIES: KpiEntry[] = [
  {
    id: '1',
    sectorId: 'comercial_allef',
    kpiId: 'mrr_vendido',
    month: 'Setembro',
    week: 'Mês Geral',
    target: 171004.83,
    realized: 72708.66,
    gap: -98296.17,
    gapPercentage: 42.52,
    causes: [
      "Falta de aderência ao processo de prospecção",
      "Existência de no-shows elevados",
      "Agendamentos para datas distantes",
      "Roteiro de qualificação pouco eficiente",
      "Inconsistência no follow anti-no-show"
    ],
    actionPlan: {
      what: "Revisar roteiro e treinar equipe",
      why: "Aumentar taxa de comparecimento",
      where: "Time comercial",
      who: "Sena",
      when: "Imediato",
      how: "Role plays e simulações",
      howMuch: "R$ 0,00"
    },
    actionPlanStatus: 'fazendo',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    sectorId: 'comercial_allef',
    kpiId: 'mrr_vendido',
    month: 'Outubro',
    week: 'Semana 1',
    target: 30536.58,
    realized: 15000.00,
    gap: -15536.58,
    gapPercentage: 49.1,
    actionPlanStatus: 'a_fazer',
    lastUpdated: new Date().toISOString()
  },
   {
    id: '3',
    sectorId: 'marketing',
    kpiId: 'num_leads',
    month: 'Setembro',
    week: 'Mês Geral',
    target: 507,
    realized: 688,
    gap: 181,
    gapPercentage: 135.70,
    actionPlanStatus: 'feito',
    lastUpdated: new Date().toISOString()
  }
];