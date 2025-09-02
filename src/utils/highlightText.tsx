import React from 'react';

/**
 * Normaliza texto removiendo acentos y convirtiendo a minúsculas
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Resalta texto buscado con fondo amarillo
 * @param text - Texto original
 * @param searchQuery - Término de búsqueda
 * @param className - Clase CSS adicional para el contenedor
 * @returns JSX con texto resaltado
 */
export const highlightText = (
  text: string | null | undefined, 
  searchQuery: string,
  className?: string
): React.ReactNode => {
  // Si no hay texto o búsqueda, devolver el texto original
  if (!text || !searchQuery?.trim()) {
    return <span className={className}>{text || ''}</span>;
  }

  const normalizedQuery = normalizeText(searchQuery.trim());
  const normalizedText = normalizeText(text);

  // Si no encuentra coincidencias, devolver texto original
  if (!normalizedText.includes(normalizedQuery)) {
    return <span className={className}>{text}</span>;
  }

  // Encontrar todas las coincidencias (case-insensitive, sin acentos)
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let searchIndex = 0;

  while (searchIndex !== -1) {
    searchIndex = normalizedText.indexOf(normalizedQuery, lastIndex);
    
    if (searchIndex !== -1) {
      // Añadir texto antes de la coincidencia
      if (searchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, searchIndex));
      }
      
      // Añadir texto resaltado
      const matchedText = text.slice(searchIndex, searchIndex + normalizedQuery.length);
      parts.push(
        <mark 
          key={`highlight-${searchIndex}`} 
          className="bg-yellow-200 text-yellow-900 font-medium rounded px-0.5"
        >
          {matchedText}
        </mark>
      );
      
      lastIndex = searchIndex + normalizedQuery.length;
    }
  }

  // Añadir texto restante después de la última coincidencia
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};

/**
 * Verifica si un texto contiene el término de búsqueda
 * @param text - Texto a verificar
 * @param searchQuery - Término de búsqueda
 * @returns true si el texto contiene el término
 */
export const textContainsSearch = (
  text: string | null | undefined, 
  searchQuery: string
): boolean => {
  if (!text || !searchQuery?.trim()) return false;
  
  const normalizedQuery = normalizeText(searchQuery.trim());
  const normalizedText = normalizeText(text);
  
  return normalizedText.includes(normalizedQuery);
};

/**
 * Trunca texto largo y añade puntos suspensivos
 * @param text - Texto original
 * @param maxLength - Longitud máxima
 * @returns Texto truncado
 */
export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
