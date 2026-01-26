/**
 * AXIS UI Components
 * Componentes de UI padronizados seguindo o Design System
 */

import React from 'react';
import { ds, cn } from '../../styles/design-tokens';
import { X, ChevronDown } from 'lucide-react';

// =============================================================================
// CARD
// =============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover }) => (
  <div className={cn(hover ? ds.card.hover : ds.card.base, className)}>
    {children}
  </div>
);

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn(ds.card.header, className)}>
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={cn(ds.card.body, className)}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn(ds.card.footer, className)}>
    {children}
  </div>
);

// =============================================================================
// INPUT
// =============================================================================

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  inputSize?: 'sm' | 'md';
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  hint, 
  error, 
  icon,
  inputSize = 'md',
  className, 
  ...props 
}) => (
  <div className="space-y-1">
    {label && <label className={ds.input.label}>{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          inputSize === 'sm' ? ds.input.sm : ds.input.base,
          icon && 'pl-10',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    </div>
    {hint && !error && <p className={ds.input.hint}>{hint}</p>}
    {error && <p className={ds.input.error}>{error}</p>}
  </div>
);

// =============================================================================
// SELECT
// =============================================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  hint, 
  error, 
  options,
  placeholder,
  className, 
  ...props 
}) => (
  <div className="space-y-1">
    {label && <label className={ds.input.label}>{label}</label>}
    <div className="relative">
      <select
        className={cn(
          ds.select.base,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
    </div>
    {hint && !error && <p className={ds.input.hint}>{hint}</p>}
    {error && <p className={ds.input.error}>{error}</p>}
  </div>
);

// =============================================================================
// BADGE
// =============================================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'secondary', 
  icon,
  className 
}) => (
  <span className={cn(ds.badge.base, ds.badge[variant], className)}>
    {icon}
    {children}
  </span>
);

// =============================================================================
// MODAL
// =============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  footer,
  size = 'md',
  className
}) => {
  if (!isOpen) return null;

  return (
    <div className={ds.modal.overlay} onClick={onClose}>
      <div 
        className={cn(ds.modal.content, modalSizes[size], className)}
        onClick={e => e.stopPropagation()}
      >
        <div className={cn(ds.modal.header, 'flex justify-between items-start')}>
          <div>
            <h2 className={ds.modal.title}>{title}</h2>
            {subtitle && <p className={ds.modal.subtitle}>{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={ds.modal.body}>
          {children}
        </div>
        {footer && (
          <div className={ds.modal.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PAGE HEADER
// =============================================================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  actions,
  className 
}) => (
  <div className={cn(ds.pageHeader.container, className)}>
    <div>
      <h1 className={ds.pageHeader.title}>{title}</h1>
      {subtitle && <p className={ds.pageHeader.subtitle}>{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);

// =============================================================================
// LOADING SPINNER
// =============================================================================

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Carregando...', 
  className 
}) => (
  <div className={cn(ds.loading.container, className)}>
    <div className="text-center">
      <div className={cn(ds.loading.spinner, 'mx-auto mb-4')} />
      <p className={ds.loading.text}>{message}</p>
    </div>
  </div>
);

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action,
  className 
}) => (
  <div className={cn(ds.empty.container, className)}>
    <div className={ds.empty.icon}>
      {icon}
    </div>
    <h3 className={ds.empty.title}>{title}</h3>
    {description && <p className={ds.empty.description}>{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// =============================================================================
// ICON BUTTON
// =============================================================================

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  children: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  variant = 'default', 
  className,
  children, 
  ...props 
}) => (
  <button 
    className={cn(ds.iconButton.base, ds.iconButton[variant], className)}
    {...props}
  >
    {children}
  </button>
);

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor?: 'amber' | 'emerald' | 'red' | 'zinc';
  className?: string;
}

const accentColors = {
  amber: 'border-b-amber-500',
  emerald: 'border-b-emerald-500',
  red: 'border-b-red-500',
  zinc: 'border-b-zinc-500',
};

const accentTextColors = {
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
  red: 'text-red-600',
  zinc: 'text-zinc-600',
};

const accentBgColors = {
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
  zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
};

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon,
  accentColor = 'amber',
  className 
}) => (
  <div className={cn(
    ds.card.base,
    'p-6 flex items-center justify-between border-b-4',
    accentColors[accentColor],
    className
  )}>
    <div>
      <p className={cn('text-sm font-medium', accentTextColors[accentColor])}>{title}</p>
      <p className={cn('text-3xl font-bold mt-1', 
        accentColor === 'zinc' ? 'text-zinc-900 dark:text-white' : 
        accentColor === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' :
        accentColor === 'red' ? 'text-red-700 dark:text-red-400' :
        'text-amber-700 dark:text-amber-400'
      )}>{value}</p>
    </div>
    {icon && (
      <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', accentBgColors[accentColor])}>
        {icon}
      </div>
    )}
  </div>
);

// =============================================================================
// FILTER BAR
// =============================================================================

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: {
    id: string;
    label?: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onClear?: () => void;
  hasActiveFilters?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onClear,
  hasActiveFilters,
  icon,
  className
}) => (
  <div className={cn(ds.filterBar.container, className)}>
    {icon && (
      <div className={ds.filterBar.label}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Filtros</span>
      </div>
    )}
    
    {filters.map((filter, index) => (
      <React.Fragment key={filter.id}>
        {index > 0 && <div className={ds.filterBar.divider} />}
        <select
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className={ds.filterBar.select}
        >
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </React.Fragment>
    ))}
    
    {hasActiveFilters && onClear && (
      <button onClick={onClear} className={ds.filterBar.clearButton} title="Limpar filtros">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

// =============================================================================
// VIEW SWITCHER
// =============================================================================

interface ViewSwitcherProps<T extends string> {
  views: { id: T; label: string; icon: React.ReactNode }[];
  activeView: T;
  onChange: (view: T) => void;
  className?: string;
}

export function ViewSwitcher<T extends string>({ 
  views, 
  activeView, 
  onChange,
  className 
}: ViewSwitcherProps<T>) {
  return (
    <div className={cn(ds.viewSwitcher.container, className)}>
      {views.map(view => (
        <button
          key={view.id}
          onClick={() => onChange(view.id)}
          className={cn(
            ds.viewSwitcher.button,
            activeView === view.id ? ds.viewSwitcher.active : ds.viewSwitcher.inactive
          )}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
}
