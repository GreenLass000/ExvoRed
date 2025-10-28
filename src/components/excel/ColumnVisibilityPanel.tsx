import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ExcelColumnSettings } from '../../hooks/useExcelMode';

interface ColumnVisibilityPanelProps {
  columns: ExcelColumnSettings[];
  onToggleColumn: (columnKey: string) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
  onResetConfig?: () => void;
  hasStoredConfig?: boolean;
}

export const ColumnVisibilityPanel: React.FC<ColumnVisibilityPanelProps> = ({
  columns,
  onToggleColumn,
  onClose,
  isOpen,
  className = '',
  onResetConfig,
  hasStoredConfig = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredColumns = columns.filter(col => 
    col.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  const handleSelectAll = useCallback(() => {
    const allVisible = columns.every(col => col.visible || col.locked);
    columns.forEach(col => {
      if (!col.locked && col.visible === allVisible) {
        onToggleColumn(col.key);
      }
    });
  }, [columns, onToggleColumn]);

  const handleToggleColumn = useCallback((columnKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleColumn(columnKey);
  }, [onToggleColumn]);

  // Cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-xl shadow-2xl",
        "w-full max-w-4xl max-h-[80vh] flex flex-col mx-4",
        "border border-gray-200 dark:border-gray-700",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-blue-600"
            >
              <path 
                d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" 
                fill="currentColor"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Gestión de Columnas
            </h3>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-500">
              <path 
                d="M18 6L6 18M6 6l12 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
          <span>{visibleCount} de {totalCount} columnas visibles</span>
          {hasStoredConfig && (
            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Configuración guardada
            </span>
          )}
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
            </svg>
            
            <input
              type="text"
              placeholder="Buscar columna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600",
                "rounded-lg bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-gray-100 text-base",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
            />
          </div>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="p-4">
            {/* Select All */}
            <button
              onClick={handleSelectAll}
              className={cn(
                "w-full flex items-center gap-2 p-3 text-left",
                "hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg",
                "text-sm font-semibold text-blue-700 dark:text-blue-300",
                "transition-colors"
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              {visibleCount === totalCount ? 'Ocultar todas' : 'Mostrar todas'}
            </button>

            {/* Column items */}
            {filteredColumns.map((column) => (
              <div
                key={column.key}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  column.locked && "opacity-60"
                )}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    disabled={column.locked}
                    onChange={(e) => handleToggleColumn(column.key, e as any)}
                    className={cn(
                      "rounded border-gray-300 dark:border-gray-600 h-5 w-5",
                      "text-blue-600 focus:ring-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-base text-gray-900 dark:text-gray-100 truncate",
                      !column.visible && "line-through opacity-60"
                    )}>
                      {column.key.charAt(0).toUpperCase() + column.key.slice(1)}
                    </span>
                    
                    {column.locked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400 flex-shrink-0">
                        <path 
                          d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" 
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Ancho: {column.width}px
                  </div>
                </div>

                {/* Sort indicator */}
                {column.sortDirection && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      {column.sortDirection === 'asc' ? (
                        <path d="M7 14l5-5 5 5H7z" fill="currentColor"/>
                      ) : (
                        <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
                      )}
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {filteredColumns.length === 0 && searchTerm && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>No se encontraron columnas</p>
                <p className="text-xs">con "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Las columnas bloqueadas no pueden ocultarse
            </div>

            {onResetConfig && hasStoredConfig && (
              <button
                onClick={() => {
                  if (confirm('¿Restablecer la configuración de esta página a los valores por defecto?')) {
                    onResetConfig();
                    onClose();
                  }
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium",
                  "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                  "hover:bg-orange-200 dark:hover:bg-orange-900/50",
                  "rounded-md transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-orange-500"
                )}
                title="Restablecer configuración a valores por defecto"
              >
                Restablecer configuración
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 bg-blue-600 hover:bg-blue-700",
              "text-white font-medium rounded-md",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnVisibilityPanel;
