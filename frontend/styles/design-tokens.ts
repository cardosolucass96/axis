/**
 * AXIS Design System Tokens
 * Centralização de todas as constantes visuais do sistema
 */

// =============================================================================
// TRANSIÇÕES GLOBAIS
// =============================================================================

export const transition = {
  // Transição padrão para mudança de tema (usar em containers principais)
  theme: 'transition-colors duration-150',
  // Transição para elementos interativos (hover, focus)
  interactive: 'transition-colors duration-150',
  // Transição para animações de transform (sidebar, modais)
  transform: 'transition-transform duration-200 ease-out',
  // Sem transição (para elementos que não devem animar)
  none: '',
} as const;

// =============================================================================
// CORES
// =============================================================================

export const colors = {
  // Primary - Amber (Accent Color)
  primary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main accent
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral - Zinc (Base Colors)
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  
  // Semantic Colors
  success: {
    light: '#10b981', // emerald-500
    dark: '#34d399',  // emerald-400
    bg: '#ecfdf5',    // emerald-50
    bgDark: 'rgba(16, 185, 129, 0.1)',
  },
  
  warning: {
    light: '#f59e0b', // amber-500
    dark: '#fbbf24',  // amber-400
    bg: '#fffbeb',    // amber-50
    bgDark: 'rgba(245, 158, 11, 0.1)',
  },
  
  error: {
    light: '#ef4444', // red-500
    dark: '#f87171',  // red-400
    bg: '#fef2f2',    // red-50
    bgDark: 'rgba(239, 68, 68, 0.1)',
  },
} as const;

// =============================================================================
// CLASSES TAILWIND - Design System
// =============================================================================

export const ds = {
  // -------------------------------------------------------------------------
  // BACKGROUNDS
  // -------------------------------------------------------------------------
  bg: {
    // Page backgrounds
    page: 'bg-zinc-50 dark:bg-black',
    pageAlt: 'bg-zinc-100 dark:bg-zinc-950',
    
    // Card backgrounds
    card: 'bg-white dark:bg-zinc-900',
    cardElevated: 'bg-white dark:bg-zinc-900 shadow-lg',
    cardSubtle: 'bg-zinc-50 dark:bg-zinc-950',
    
    // Interactive backgrounds
    hover: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
    active: 'bg-zinc-100 dark:bg-zinc-800',
    
    // Sidebar (always dark)
    sidebar: 'bg-zinc-900 dark:bg-black',
    sidebarHover: 'hover:bg-zinc-800 dark:hover:bg-zinc-900',
    
    // Input backgrounds
    input: 'bg-white dark:bg-zinc-900',
    inputDisabled: 'bg-zinc-100 dark:bg-zinc-800',
  },
  
  // -------------------------------------------------------------------------
  // TEXT COLORS
  // -------------------------------------------------------------------------
  text: {
    // Primary text
    primary: 'text-zinc-900 dark:text-white',
    secondary: 'text-zinc-600 dark:text-zinc-400', // Bom contraste em ambos os modos
    muted: 'text-zinc-500 dark:text-zinc-500', // Neutro em ambos
    placeholder: 'text-zinc-400 dark:text-zinc-600', // Placeholder sutil
    
    // Accent text
    accent: 'text-amber-500',
    accentHover: 'hover:text-amber-500',
    
    // Semantic text
    success: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    error: 'text-red-700 dark:text-red-400',
    
    // Inverted (for dark backgrounds)
    inverted: 'text-white',
    invertedMuted: 'text-zinc-200 dark:text-zinc-300', // Adaptado para temas
  },
  
  // -------------------------------------------------------------------------
  // BORDERS
  // -------------------------------------------------------------------------
  border: {
    default: 'border-zinc-200 dark:border-zinc-800',
    subtle: 'border-zinc-100 dark:border-zinc-900',
    strong: 'border-zinc-300 dark:border-zinc-700',
    input: 'border-zinc-300 dark:border-zinc-700',
    focus: 'focus:border-amber-500 focus:ring-amber-500',
    accent: 'border-amber-500',
    error: 'border-red-500',
  },
  
  // -------------------------------------------------------------------------
  // SHADOWS
  // -------------------------------------------------------------------------
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    glowStrong: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
    amber: 'shadow-lg shadow-amber-500/20',
  },
  
  // -------------------------------------------------------------------------
  // BORDER RADIUS
  // -------------------------------------------------------------------------
  rounded: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
  
  // -------------------------------------------------------------------------
  // COMPONENTES COMPOSTOS
  // -------------------------------------------------------------------------
  
  // Cards
  card: {
    base: 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors duration-150',
    hover: 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-colors duration-150',
    header: 'bg-zinc-50 dark:bg-zinc-950 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 transition-colors duration-150',
    body: 'p-6',
    footer: 'px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-150',
  },
  
  // Inputs
  input: {
    base: 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-zinc-500 dark:placeholder-zinc-500 font-medium transition-colors duration-150 px-4 py-2.5',
    sm: 'w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-zinc-500 dark:placeholder-zinc-500 text-sm px-3 py-2 transition-colors duration-150',
    label: 'block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 transition-colors duration-150',
    hint: 'text-xs text-zinc-600 dark:text-zinc-400 mt-1',
    error: 'text-xs text-red-500 mt-1',
  },
  
  // Select
  select: {
    base: 'w-full appearance-none rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium transition-colors duration-150 px-4 py-2.5 pr-10',
  },
  
  // Buttons
  button: {
    base: 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed',
    primary: 'bg-amber-500 text-black hover:bg-amber-400 focus:ring-amber-500 shadow-lg shadow-amber-500/20 active:scale-[0.98]',
    secondary: 'bg-zinc-800 dark:bg-zinc-900 text-white hover:bg-zinc-700 dark:hover:bg-zinc-800 focus:ring-zinc-500 border border-zinc-700 dark:border-zinc-800 active:scale-[0.98]',
    outline: 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-white focus:ring-amber-500 bg-white dark:bg-transparent active:scale-[0.98]',
    ghost: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white focus:ring-amber-500 active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:scale-[0.98]',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    },
  },
  
  // Badges
  badge: {
    base: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors duration-150',
    primary: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  },
  
  // Modal
  modal: {
    overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4',
    content: 'bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-700 animate-fade-in transition-colors duration-150',
    header: 'p-6 border-b border-zinc-200 dark:border-zinc-700 transition-colors duration-150',
    body: 'p-6 bg-white dark:bg-zinc-900 transition-colors duration-150',
    footer: 'p-6 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-b-2xl flex justify-end gap-3 transition-colors duration-150',
    title: 'text-xl font-bold text-zinc-900 dark:text-white transition-colors duration-150',
    subtitle: 'text-sm text-zinc-500 dark:text-zinc-400 mt-1',
  },
  
  // Tables
  table: {
    container: 'bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden transition-colors duration-150',
    header: 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-700 transition-colors duration-150',
    headerCell: 'px-6 py-4 text-xs uppercase tracking-wider',
    body: 'divide-y divide-zinc-200 dark:divide-zinc-800',
    row: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150',
    cell: 'px-6 py-4 transition-colors duration-150',
  },
  
  // Empty States
  empty: {
    container: 'bg-white dark:bg-zinc-900 p-12 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center shadow-sm transition-colors duration-150',
    icon: 'mx-auto w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 transition-colors duration-150',
    title: 'text-lg font-medium text-zinc-800 dark:text-white transition-colors duration-150',
    description: 'text-zinc-500 dark:text-zinc-400 mt-2 transition-colors duration-150',
  },
  
  // Loading States
  loading: {
    spinner: 'animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500',
    text: 'text-zinc-500 dark:text-zinc-400 transition-colors duration-150',
    container: 'flex items-center justify-center h-96',
  },
  
  // Icon Buttons
  iconButton: {
    base: 'p-2 rounded-lg transition-colors duration-150',
    default: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    primary: 'text-zinc-500 dark:text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30',
    danger: 'text-zinc-500 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30',
  },
  
  // Page Headers
  pageHeader: {
    container: 'flex flex-col md:flex-row justify-between items-start md:items-center gap-4',
    title: 'text-2xl font-bold text-zinc-800 dark:text-white transition-colors duration-150',
    subtitle: 'text-zinc-600 dark:text-zinc-400 transition-colors duration-150',
  },
  
  // Filter Bar
  filterBar: {
    container: 'flex bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-1.5 gap-1.5 items-center overflow-x-auto transition-colors duration-150',
    label: 'px-3 py-2 text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-700 flex items-center gap-2 transition-colors duration-150',
    select: 'bg-transparent border-none text-sm font-bold text-zinc-700 dark:text-zinc-300 focus:ring-0 cursor-pointer py-2 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150',
    divider: 'w-px h-5 bg-zinc-200 dark:bg-zinc-700 transition-colors duration-150',
    clearButton: 'p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 rounded-lg transition-colors duration-150',
  },
  
  // View Switcher
  viewSwitcher: {
    container: 'flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl transition-colors duration-150',
    button: 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
    active: 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm',
    inactive: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200',
  },
} as const;

// =============================================================================
// ANIMAÇÕES
// =============================================================================

export const animations = {
  fadeIn: 'animate-fade-in',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
} as const;

// =============================================================================
// BREAKPOINTS (para referência)
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Combina classes do design system com classes customizadas
 */
export const merge = (base: string, custom?: string) => {
  return custom ? `${base} ${custom}` : base;
};
