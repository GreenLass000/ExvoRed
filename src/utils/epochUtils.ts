/**
 * Utilidades para trabajar con épocas de 25 años
 */

/**
 * Calcula el intervalo de época de 25 años para una fecha dada
 * @param dateString - Fecha en formato YYYY-MM-DD o cualquier formato válido de Date
 * @returns Cadena con el formato "YYYY-YYYY" o null si la fecha no es válida
 */
export const calculateEpochFromDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  const year = date.getFullYear();
  return calculateEpochFromYear(year);
};

/**
 * Calcula el intervalo de época de 25 años para un año específico
 * @param year - Año como número
 * @returns Cadena con el formato "YYYY-YYYY"
 */
export const calculateEpochFromYear = (year: number): string => {
  // Encontrar el inicio del intervalo de 25 años
  // Los intervalos comienzan en años que terminan en 01, 26, 51, 76
  const remainder = (year - 1) % 25;
  const epochStart = year - remainder;
  const epochEnd = epochStart + 24;
  
  return `${epochStart}-${epochEnd}`;
};

/**
 * Genera todas las épocas posibles desde el siglo XIII hasta el actual
 * @returns Array de objetos con época y siglo
 */
export const generateAllEpochs = (): Array<{ epoch: string; century: number; yearStart: number; yearEnd: number }> => {
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.ceil(currentYear / 100);
  const minCentury = 13; // Siglo XIII (1201-1300)
  
  const epochs: Array<{ epoch: string; century: number; yearStart: number; yearEnd: number }> = [];
  
  for (let century = minCentury; century <= currentCentury; century++) {
    const centuryStart = (century - 1) * 100 + 1;
    
    for (let i = 0; i < 4; i++) {
      const epochStart = centuryStart + (i * 25);
      const epochEnd = epochStart + 24;
      
      // No incluir épocas futuras
      if (epochStart > currentYear) break;
      
      epochs.push({
        epoch: `${epochStart}-${epochEnd}`,
        century,
        yearStart: epochStart,
        yearEnd: epochEnd
      });
    }
  }
  
  return epochs;
};

/**
 * Obtiene todas las épocas de un siglo específico
 * @param century - Número del siglo (13, 14, 15, etc.)
 * @returns Array de épocas para ese siglo
 */
export const getEpochsByCentury = (century: number): string[] => {
  const currentYear = new Date().getFullYear();
  const centuryStart = (century - 1) * 100 + 1;
  const epochs: string[] = [];
  
  for (let i = 0; i < 4; i++) {
    const epochStart = centuryStart + (i * 25);
    const epochEnd = epochStart + 24;
    
    // No incluir épocas futuras
    if (epochStart > currentYear) break;
    
    epochs.push(`${epochStart}-${epochEnd}`);
  }
  
  return epochs;
};

/**
 * Obtiene el siglo de una época
 * @param epoch - Época en formato "YYYY-YYYY"
 * @returns Número del siglo o null si no es válida
 */
export const getCenturyFromEpoch = (epoch: string): number | null => {
  const match = epoch.match(/^(\d{4})-\d{4}$/);
  if (!match) return null;
  
  const startYear = parseInt(match[1]);
  return Math.ceil(startYear / 100);
};

/**
 * Valida si una época está en el formato correcto
 * @param epoch - Cadena de época a validar
 * @returns true si es válida, false en caso contrario
 */
export const isValidEpoch = (epoch: string): boolean => {
  const match = epoch.match(/^(\d{4})-(\d{4})$/);
  if (!match) return false;
  
  const startYear = parseInt(match[1]);
  const endYear = parseInt(match[2]);
  
  // Verificar que la diferencia sea exactamente 24 años
  if (endYear - startYear !== 24) return false;
  
  // Verificar que el año de inicio sea válido para intervalos de 25 años
  const remainder = (startYear - 1) % 25;
  return remainder === 0;
};

/**
 * Nombres de los siglos en números romanos
 */
export const getCenturyName = (century: number): string => {
  const romanNumerals: Record<number, string> = {
    13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI', 17: 'XVII', 
    18: 'XVIII', 19: 'XIX', 20: 'XX', 21: 'XXI', 22: 'XXII'
  };
  return `Siglo ${romanNumerals[century] || century}`;
};
