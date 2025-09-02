import React, { useState, useEffect, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  onFilteredDataChange: (filteredData: T[], highlightedIndexes: number[], searchQuery: string) => void;
  placeholder?: string;
  className?: string;
  columns?: Array<{
    key: keyof T | 'actions';
    getDisplayValue?: (row: T) => React.ReactNode;
  }>;
  // New props for ExcelTable integration
  onSearchQuery?: (query: string) => void;
  onNavigateToResult?: (index: number) => void;
  excelTableRef?: React.RefObject<{ selectCell: (rowIndex: number, columnKey: string) => void }>;
  searchResults?: Array<{ rowIndex: number; columnKey: string; content: string }>;
}

function SearchBar<T extends Record<string, any>>({
  data,
  searchFields,
  onFilteredDataChange,
  placeholder = "Buscar...",
  className = "",
  columns = [],
  onSearchQuery,
  onNavigateToResult,
  excelTableRef,
  searchResults = []
}: SearchBarProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Función para normalizar texto (sin acentos, minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  };

  // Función para obtener texto de un valor React o string
  const extractTextFromReactNode = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (node == null) return '';
    if (React.isValidElement(node)) {
      // Intentar extraer texto de elementos React simples
      if (typeof node.props?.children === 'string') return node.props.children;
      if (typeof node.props?.children === 'number') return String(node.props.children);
    }
    return String(node);
  };

  // Función para verificar si un item contiene el texto buscado
  const itemContainsSearch = (item: T, query: string): boolean => {
    if (!query) return true;
    
    const normalizedQuery = normalizeText(query);
    
    // Buscar en campos directos
    const directFieldMatch = searchFields.some(field => {
      const value = item[field];
      if (value == null) return false;
      
      const normalizedValue = normalizeText(String(value));
      return normalizedValue.includes(normalizedQuery);
    });
    
    if (directFieldMatch) return true;
    
    // Buscar en columnas con getDisplayValue
    const relatedFieldMatch = columns.some(column => {
      if (!column.getDisplayValue || column.key === 'actions') return false;
      
      try {
        const displayValue = column.getDisplayValue(item);
        const displayText = extractTextFromReactNode(displayValue);
        
        if (displayText) {
          const normalizedDisplayValue = normalizeText(displayText);
          return normalizedDisplayValue.includes(normalizedQuery);
        }
      } catch (error) {
        // Ignorar errores en getDisplayValue
        return false;
      }
      
      return false;
    });
    
    return relatedFieldMatch;
  };

  // Contar todas las coincidencias individuales en todas las celdas
  const countAllMatches = React.useCallback((item: T, query: string): number => {
    if (!query) return 0;
    
    const normalizedQuery = normalizeText(query);
    const regex = new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let totalMatches = 0;
    
    // Contar coincidencias en campos directos
    searchFields.forEach(field => {
      const value = item[field];
      if (value != null) {
        const normalizedValue = normalizeText(String(value));
        const matches = normalizedValue.match(regex);
        totalMatches += matches ? matches.length : 0;
      }
    });
    
    // Contar coincidencias en columnas con getDisplayValue
    columns.forEach(column => {
      if (!column.getDisplayValue || column.key === 'actions') return;
      
      try {
        const displayValue = column.getDisplayValue(item);
        const displayText = extractTextFromReactNode(displayValue);
        
        if (displayText) {
          const normalizedDisplayValue = normalizeText(displayText);
          const matches = normalizedDisplayValue.match(regex);
          totalMatches += matches ? matches.length : 0;
        }
      } catch (error) {
        // Ignorar errores en getDisplayValue
      }
    });
    
    return totalMatches;
  }, [searchFields, columns]);

  // Filtrar datos basado en la búsqueda y contar coincidencias
  // Usar resultados de ExcelTable si están disponibles, sino usar lógica local
  const { filteredData, totalMatches } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { 
        filteredData: data, 
        totalMatches: 0
      };
    }

    // Filtrado local estable (evita bucles con ExcelTable)
    const filtered: T[] = [];
    let matches = 0;

    data.forEach((item) => {
      const itemMatches = countAllMatches(item, searchQuery);
      if (itemMatches > 0) {
        filtered.push(item);
        matches += itemMatches;
      }
    });

    return { 
      filteredData: filtered, 
      totalMatches: matches
    };
  }, [data, searchQuery, countAllMatches]);

  // Resetear índice cuando cambia la búsqueda
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Notificar cambios al componente padre (mantenemos compatibilidad con array vacío)
  useEffect(() => {
    onFilteredDataChange(filteredData, [], searchQuery);
    // También notificar al ExcelTable si está disponible
    onSearchQuery?.(searchQuery);
  }, [filteredData, searchQuery, onFilteredDataChange, onSearchQuery]);

  // Navegación entre resultados
  const goToNextMatch = () => {
    if (totalMatches > 0) {
      const newIndex = currentMatchIndex < totalMatches - 1 ? currentMatchIndex + 1 : 0;
      setCurrentMatchIndex(newIndex);
      
      // Si tenemos resultados de ExcelTable y una referencia, navegar a la celda
      if (searchResults.length > 0 && excelTableRef?.current) {
        const result = searchResults[newIndex];
        if (result) {
          excelTableRef.current.selectCell(result.rowIndex, result.columnKey);
        }
      }
      
      // Notificar la navegación
      onNavigateToResult?.(newIndex);
    }
  };

  const goToPreviousMatch = () => {
    if (totalMatches > 0) {
      const newIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : totalMatches - 1;
      setCurrentMatchIndex(newIndex);
      
      // Si tenemos resultados de ExcelTable y una referencia, navegar a la celda
      if (searchResults.length > 0 && excelTableRef?.current) {
        const result = searchResults[newIndex];
        if (result) {
          excelTableRef.current.selectCell(result.rowIndex, result.columnKey);
        }
      }
      
      // Notificar la navegación
      onNavigateToResult?.(newIndex);
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  };

  const effectiveTotalMatches = searchResults.length > 0 ? searchResults.length : totalMatches;
  const hasResults = effectiveTotalMatches > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        
        {hasQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Contador y navegación de resultados */}
      {hasQuery && (
        <div className="ml-3 flex items-center space-x-2 bg-gray-50 px-2 py-1 md:px-3 md:py-2 rounded-lg border flex-shrink-0 whitespace-nowrap overflow-hidden">
          <span className="text-sm font-medium text-gray-700">
            {hasResults 
              ? `${currentMatchIndex + 1} de ${effectiveTotalMatches}` 
              : 'Sin resultados'}
          </span>
          
          {hasResults && (
            <div className="flex space-x-1">
              <button
                onClick={goToPreviousMatch}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Resultado anterior"
              >
                <ChevronUpIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={goToNextMatch}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Siguiente resultado"
              >
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
export type { SearchBarProps };
