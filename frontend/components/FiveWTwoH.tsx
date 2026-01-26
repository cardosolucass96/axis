import React from 'react';
import { FiveWTwoH as FiveWTwoHType, User } from '../types';
import { ds } from '../styles/design-tokens';

interface FiveWTwoHProps {
  data?: FiveWTwoHType;
  onChange: (field: keyof FiveWTwoHType, value: string) => void;
  availableUsers: User[];
}

export const FiveWTwoHInput: React.FC<FiveWTwoHProps> = ({ data, onChange, availableUsers }) => {
  const emptyData: FiveWTwoHType = {
    what: '', why: '', where: '', who: '', when: '', how: '', howMuch: ''
  };

  const values = data || emptyData;

  const fields: { key: keyof FiveWTwoHType; label: string; placeholder: string; fullWidth?: boolean; type?: 'text' | 'select' | 'date' }[] = [
    { key: 'what', label: 'What (O que será feito?)', placeholder: 'Ex: Revisar roteiro de vendas', fullWidth: true },
    { key: 'why', label: 'Why (Por que será feito?)', placeholder: 'Ex: Para reduzir taxa de no-show' },
    { key: 'who', label: 'Who (Responsável)', placeholder: 'Selecione...', type: 'select' },
    { key: 'where', label: 'Where (Onde?)', placeholder: 'Ex: CRM / Reunião semanal' },
    { key: 'when', label: 'When (Quando?)', placeholder: '', type: 'date' },
    { key: 'how', label: 'How (Como será feito?)', placeholder: 'Ex: Criando checklist de confirmação', fullWidth: true },
    { key: 'howMuch', label: 'How Much (Quanto custa?)', placeholder: 'Ex: R$ 0,00 ou 2 horas de trabalho' },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700 pb-2">Plano de Ação (5W2H)</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className={`${field.fullWidth ? 'md:col-span-2' : ''}`}>
            <label className={ds.input.label}>{field.label}</label>
            
            {field.type === 'select' ? (
              <select
                value={values[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={ds.select.base}
              >
                <option value="">Selecione um responsável...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role === 'admin' ? 'Admin' : 'Líder'})</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={values[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={ds.input.base}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};