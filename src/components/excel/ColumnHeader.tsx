import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { ExcelFilter } from '../../hooks/useExcelMode';

interface ColumnHeaderProps {
  title: string;
  columnKey: string;
  sortDirection: 'asc' | 'desc' | null;
  hasFilter: boolean;
  onSort: (direction?: 'asc' | 'desc') => void;
  onSortByColumn: (columnKey: string, direction: 'asc' | 'desc') => void;
  onAddFilter: (filter: ExcelFilter) => void;
  onRemoveFilter: () => void;
  className?: string;
  locked?: boolean;
  columnType?: 'text' | 'number' | 'date' | 'select';
  selectOptions?: string[];
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  title,
  columnKey,
  sortDirection,
  hasFilter,
  onSort,
  onSortByColumn,
  onAddFilter,
  onRemoveFilter,
  className = '',
  locked = false,
  columnType = 'text',
  selectOptions = []
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filterOperator, setFilterOperator] = useState<'equals' | 'contains' | 'starts_with' | 'gt' | 'lt'>('contains');
  const [selectedSort, setSelectedSort] = useState<'asc' | 'desc' | ''>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync selectedSort with incoming sortDirection
  useEffect(() => {
    setSelectedSort(sortDirection ?? '');
  }, [sortDirection]);

  const handleSort = useCallback(() => {
    if (locked) return;
    onSort();
  }, [locked, onSort]);

  const handleApplyFilter = useCallback(() => {
    if (!filterValue.trim()) {
      onRemoveFilter();
    } else {
      const filter: ExcelFilter = {
        columnKey,
        type: columnType,
        value: columnType === 'number' ? Number(filterValue) : filterValue,
        operator: filterOperator
      };
      onAddFilter(filter);
    }
    setShowFilterMenu(false);
  }, [filterValue, filterOperator, columnKey, columnType, onAddFilter, onRemoveFilter]);

  const handleClearFilter = useCallback(() => {
    setFilterValue('');
    onRemoveFilter();
    setShowFilterMenu(false);
  }, [onRemoveFilter]);

  const getOperatorOptions = () => {
    switch (columnType) {
      case 'number':
        return [
          { value: 'equals', label: 'Igual a' },
          { value: 'gt', label: 'Mayor que' },
          { value: 'lt', label: 'Menor que' }
        ];
      case 'date':
        return [
          { value: 'equals', label: 'Igual a' },
          { value: 'gt', label: 'Después de' },
          { value: 'lt', label: 'Antes de' }
        ];
      case 'select':
        return [
          { value: 'equals', label: 'Igual a' }
        ];
      default:
        return [
          { value: 'contains', label: 'Contiene' },
          { value: 'equals', label: 'Igual a' },
          { value: 'starts_with', label: 'Comienza con' }
        ];
    }
  };

  const getSortLabels = () => {
    if (columnType === 'number') {
      return { asc: 'Menor a mayor', desc: 'Mayor a menor' } as const;
    }
    if (columnType === 'date') {
      return { asc: 'Más antiguo', desc: 'Más reciente' } as const;
    }
    return { asc: 'A-Z', desc: 'Z-A' } as const;
  };

  const renderFilterInput = () => {
    switch (columnType) {
      case 'number':
        return (
          <input
            type="number"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Valor numérico..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-900"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-900"
          />
        );
      
      case 'select':
        return (
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-900"
          >
            <option value="">Seleccionar...</option>
            {selectOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Buscar texto..."
            className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-900"
          />
        );
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "flex items-center justify-between px-3 py-2",
        "border-b border-gray-200",
        "bg-gray-100",
        !locked && "hover:bg-gray-200 cursor-pointer",
        locked && "opacity-60"
      )}>
        {/* Title and sort */}
        <div 
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={handleSort}
        >
          <span className={cn(
            "font-medium text-gray-800 truncate",
            "text-sm"
          )}>
            {title}
          </span>
          
          {/* Sort indicator */}
          {sortDirection && !locked && (
            <div className="flex items-center text-blue-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                {sortDirection === 'asc' ? (
                  <path d="M7 14l5-5 5 5H7z" fill="currentColor"/>
                ) : (
                  <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
                )}
              </svg>
            </div>
          )}
        </div>

        {/* Filter button */}
        {!locked && (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowFilterMenu(!showFilterMenu);
            }}
            className={cn(
              "p-1 rounded hover:bg-gray-200 transition-colors",
              hasFilter && "text-blue-600 bg-blue-50",
              showFilterMenu && "bg-gray-200"
            )}
            title="Filtrar columna"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path 
                d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filter menu */}
      {showFilterMenu && !locked && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 z-50 w-72 bg-white border border-gray-200 rounded-md shadow-lg"
        >
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Filtrar: {title}
              </h4>
              {hasFilter && (
                <button
                  onClick={handleClearFilter}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Sort selection */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Orden
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['asc','desc'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSort(dir);
                      onSort(dir);
                    }}
                    className={cn(
                      "px-2 py-1 text-xs rounded border",
                      selectedSort === dir ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {getSortLabels()[dir]}
                  </button>
                ))}
              </div>
            </div>

            {/* Last modified sort */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Modificación
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSortByColumn('updated_at', 'desc'); }}
                  className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Último modificado
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSortByColumn('updated_at', 'asc'); }}
                  className="px-2 py-1 text-xs rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Más antiguo (modif.)
                </button>
              </div>
            </div>

            {/* Operator selection */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Condición
              </label>
              <select
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value as any)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900"
              >
                {getOperatorOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value input */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Valor
              </label>
              {renderFilterInput()}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilter}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
              >
                Aplicar
              </button>
              <button
                onClick={() => setShowFilterMenu(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnHeader;
