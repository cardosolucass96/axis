/**
 * Utilitário para formatação de datas
 */

/**
 * Formata data do formato ISO (YYYY-MM-DD) para DD/MM/AAAA
 * @param dateString Data no formato ISO (YYYY-MM-DD) ou Date
 * @returns Data formatada como DD/MM/AAAA ou string vazia se inválida
 */
export function formatDateToBR(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verifica se é uma data válida
    if (isNaN(date.getTime())) return dateString.toString();
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return dateString?.toString() || '';
  }
}

/**
 * Converte data do formato BR (DD/MM/AAAA) para ISO (YYYY-MM-DD)
 * @param brDate Data no formato DD/MM/AAAA
 * @returns Data no formato YYYY-MM-DD ou string vazia se inválida
 */
export function formatDateToISO(brDate: string | null | undefined): string {
  if (!brDate) return '';
  
  try {
    // Se já está no formato ISO, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(brDate)) {
      return brDate;
    }
    
    // Tenta converter de DD/MM/AAAA para YYYY-MM-DD
    const parts = brDate.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return brDate;
  } catch {
    return brDate?.toString() || '';
  }
}

/**
 * Formata data com hora (DD/MM/AAAA HH:mm)
 * @param dateString Data ISO string ou Date
 * @returns Data formatada com hora
 */
export function formatDateTimeToBR(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) return dateString.toString();
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString?.toString() || '';
  }
}

/**
 * Retorna data atual no formato DD/MM/AAAA
 */
export function getTodayBR(): string {
  return formatDateToBR(new Date());
}

/**
 * Retorna data atual no formato ISO (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
