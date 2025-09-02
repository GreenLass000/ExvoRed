import React, { useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { cn } from '../../lib/utils';
import { ColumnDef } from '../DataTable';
import { useExcelMode } from '../../hooks/useExcelMode';
import { useExcelKeyboard } from '../../hooks/useExcelKeyboard';
import ResizableColumn from './ResizableColumn';
import ColumnVisibilityPanel from './ColumnVisibilityPanel';
import DraggableColumn from './DraggableColumn';
import ColumnHeader from './ColumnHeader';
import CellModal from './CellModal';
import EditCellModal from './EditCellModal';

interface ExcelTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  className?: string;
  onEdit?: (rowIndex: number, columnKey: string, data: T) => void;
  onView?: (rowIndex: number, columnKey: string, data: T) => void;
  onInspect?: (rowIndex: number, columnKey: string, data: T) => void;
  onPrint?: () => void;
  onExport?: () => void;
  idField?: keyof T;
  enableExcelMode?: boolean;
  enableKeyboardNavigation?: boolean;
  rowActions?: (item: T, index: number) => React.ReactNode;
  searchQuery?: string;
  onCellFound?: (rowIndex: number, columnKey: string) => void;
  fitToViewport?: boolean; // hace que el scroll vertical ocupe hasta el final de la página
  // Navegación global
  onNavigateSem?: () => void;
  onNavigateCatalog?: () => void;
  onNavigateExvotos?: () => void;
  onNavigateDivinities?: () => void;
  onNavigateCharacters?: () => void;
  onNavigateMiracles?: () => void;
  blockNavigation?: boolean;
  inDetailsTab?: boolean;
  // Navigation for foreign key references
  onNavigateToReference?: (referenceType: 'sem' | 'catalog', referenceId: number) => void;
  // Inline editing support
  onRowUpdate?: (id: any, data: Partial<T>) => Promise<any>;
  enableInlineEdit?: boolean;
}

export interface ExcelTableRef {
  selectCell: (rowIndex: number, columnKey: string) => void;
  getSearchResults: () => Array<{ rowIndex: number; columnKey: string; content: string }>;
}

const ExcelTableInner = <T extends Record<string, any>>({
  data,
  columns,
  className = '',
  onEdit,
  onView,
  onInspect,
  onPrint,
  onExport,
  idField = 'id' as keyof T,
  enableExcelMode = true,
  enableKeyboardNavigation = true,
  rowActions,
  searchQuery,
  onCellFound,
  fitToViewport = true,
  onNavigateSem,
  onNavigateCatalog,
  onNavigateExvotos,
  onNavigateDivinities,
  onNavigateCharacters,
  onNavigateMiracles,
  blockNavigation = false,
  inDetailsTab = false,
  onNavigateToReference,
  onRowUpdate,
  enableInlineEdit = false
}: ExcelTableProps<T>, ref: React.Ref<ExcelTableRef>) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Excel mode state and actions
  const [excelState, excelActions] = useExcelMode(columns, data, idField);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [status, setStatus] = useState<{ rowIndex: number, message: string, type: 'info' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  
  // Focus on editing input when entering edit mode
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);
  
  // Inline editing functions
  const handleCellDoubleClick = useCallback((rowIndex: number, columnKey: string) => {
    if (!enableInlineEdit || !onRowUpdate) return;
    
    const rowData = excelState.filteredData[rowIndex];
    if (!rowData) return;
    
    setEditingCell({ rowIndex, columnKey });
    setEditValue(rowData[columnKey] ?? '');
  }, [enableInlineEdit, onRowUpdate, excelState.filteredData]);
  
  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  }, []);
  
  const saveChanges = useCallback(async () => {
    if (!editingCell || !onRowUpdate) return;
    
    const { rowIndex, columnKey } = editingCell;
    const originalRow = excelState.filteredData[rowIndex];
    if (!originalRow) return;
    
    const originalValue = originalRow[columnKey];
    let finalValue: any = editValue;
    
    const columnDef = columns.find(c => String(c.key) === columnKey);
    if (columnDef?.type === 'number' || columnDef?.type === 'foreignKey') {
      finalValue = editValue === '' || editValue === null ? null : Number(editValue);
    }
    
    if (finalValue !== originalValue) {
      setStatus({ rowIndex, message: 'Guardando...', type: 'info' });
      try {
        const rowId = originalRow[idField];
        await onRowUpdate(rowId, { [columnKey]: finalValue } as Partial<T>);
        setStatus({ rowIndex, message: '¡Guardado!', type: 'info' });
      } catch (error) {
        setStatus({ rowIndex, message: 'Error al guardar', type: 'error' });
        console.error('Error al actualizar fila:', error);
      }
    }
    
    setEditingCell(null);
    setTimeout(() => setStatus(null), 2000);
  }, [editingCell, editValue, onRowUpdate, excelState.filteredData, columns, idField]);
  
  const handleInputBlur = useCallback(() => {
    saveChanges();
  }, [saveChanges]);
  
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveChanges();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  }, [saveChanges]);
  
  // Select default cell A1 on mount or when data/columns ready
  useEffect(() => {
    if (!excelState.selectedCell && excelState.visibleColumns.length > 0 && excelState.filteredData.length > 0) {
      excelActions.selectCell(0, excelState.visibleColumns[0].key);
    }
  }, [excelState.selectedCell, excelState.visibleColumns, excelState.filteredData, excelActions]);

  // Search results state (uses display values for referenced fields)
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const normalizeText = (text: string): string =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const extractTextFromReactNode = (node: React.ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (node == null) return '';
      if (React.isValidElement(node)) {
        if (typeof node.props?.children === 'string') return node.props.children;
        if (typeof node.props?.children === 'number') return String(node.props.children);
      }
      return String(node);
    };

    const normQuery = normalizeText(searchQuery);
    const results: Array<{ rowIndex: number; columnKey: string; content: string }> = [];

    excelState.filteredData.forEach((item, rowIndex) => {
      excelState.visibleColumns.forEach(visibleCol => {
        const colDef = columns.find(c => String(c.key) === visibleCol.key);
        let displayText = '';
        if (colDef?.getDisplayValue) {
          try {
            displayText = extractTextFromReactNode(colDef.getDisplayValue(item)) || '';
          } catch {
            displayText = '';
          }
        } else {
          displayText = String(item[visibleCol.key] ?? '');
        }

        if (normalizeText(displayText).includes(normQuery)) {
          results.push({
            rowIndex,
            columnKey: visibleCol.key,
            content: displayText
          });
        }
      });
    });

    return results;
  }, [searchQuery, excelState.filteredData, excelState.visibleColumns, columns]);
  
  // Function to select a cell programmatically
  const selectCellProgrammatically = useCallback((rowIndex: number, columnKey: string) => {
    excelActions.selectCell(rowIndex, columnKey);
    
    // Scroll to the cell if needed
    const cellElement = tableRef.current?.querySelector(`[data-cell="${rowIndex}-${columnKey}"]`);
    if (cellElement) {
      cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [excelActions]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    selectCell: selectCellProgrammatically,
    getSearchResults: () => searchResults
  }), [selectCellProgrammatically, searchResults]);
  
  // Expose selectCell method via onCellFound callback
  useEffect(() => {
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      onCellFound?.(firstResult.rowIndex, firstResult.columnKey);
    }
  }, [searchResults, onCellFound]);
  
  // Keyboard navigation
  useExcelKeyboard(excelState, excelActions, {
    enabled: enableKeyboardNavigation,
    // 'e' -> edit cell - open edit modal if onRowUpdate available, otherwise expand cell
    onEditCell: (rowIndex, columnKey) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData && onRowUpdate) {
        // Get the actual cell value
        const cellValue = rowData[columnKey];
        // Start edit mode for this cell with the current value
        setEditingCell({ rowIndex, columnKey });
        setEditValue(cellValue); // Use the actual value, not converted to string
      } else if (rowData) {
        // Fallback to readonly cell modal
        const content = String(rowData[columnKey] ?? '');
        excelActions.expandCell(content, rowIndex, columnKey);
      }
    },
    // 'i' -> open details
    onOpenDetails: (rowIndex, columnKey) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) onView?.(rowIndex, columnKey, rowData);
    },
    // 'E' -> edit full record (only in details tab)
    onEditRecord: (rowIndex) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) onEdit?.(rowIndex, excelState.selectedCell?.columnKey || '', rowData);
    },
    // Enter -> inline editing when available
    onStartInlineEdit: enableInlineEdit && onRowUpdate ? handleCellDoubleClick : undefined,
    inDetailsTab,
    // 'p' handled in keyboard (only in details)
    onPrint,
    onExport,
    // Navigation to sections
    onNavigateSem,
    onNavigateCatalog,
    onNavigateExvotos,
    onNavigateDivinities,
    onNavigateCharacters,
    onNavigateMiracles,
    blockNavigation,
    onSelectAll: () => {
      // Select all visible rows
      excelState.filteredData.forEach(item => {
        const id = item[idField];
        if (id) excelActions.toggleRowSelection(id);
      });
    },
    onCopy: async (content) => {
      try {
        await navigator.clipboard.writeText(content);
      } catch (err) {
        console.warn('Failed to copy to clipboard:', err);
      }
    },
    onNavigateToReference
  });

  // Ajustar altura del contenedor de scroll para que llegue al final de la página
  const updateScrollMaxHeight = useCallback(() => {
    if (!fitToViewport) return;
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 16; // px de margen inferior
    const available = window.innerHeight - rect.top - margin;
    if (available > 150) {
      el.style.maxHeight = `${available}px`;
    }
  }, [fitToViewport]);

  useEffect(() => {
    updateScrollMaxHeight();
    const handle = () => updateScrollMaxHeight();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [updateScrollMaxHeight]);

  // Recalcular cuando cambian columnas o datos
  useEffect(() => {
    updateScrollMaxHeight();
  }, [excelState.visibleColumns, excelState.filteredData.length, updateScrollMaxHeight]);

  // Calculate content dimensions for scrolling
  const contentWidth = useMemo(() => {
    return excelState.visibleColumns.reduce((sum, col) => sum + col.width, 0);
  }, [excelState.visibleColumns]);

  // Handle cell click
  const handleCellClick = useCallback((rowIndex: number, columnKey: string, event: React.MouseEvent) => {
    excelActions.selectCell(rowIndex, columnKey);
    
    // Double click opens cell modal for viewing
    if (event.detail === 2) {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) {
        const content = String(rowData[columnKey] || '');
        excelActions.expandCell(content, rowIndex, columnKey);
      }
    }
  }, [excelActions, excelState.filteredData]);

  // Get cell customization
  const getCellStyle = useCallback((rowId: string | number, columnKey: string) => {
    const customization = excelState.cellCustomizations.find(
      c => c.rowId === rowId && c.columnKey === columnKey
    );
    
    if (!customization) return {};
    
    return {
      backgroundColor: customization.backgroundColor,
      color: customization.textColor,
      fontWeight: customization.fontWeight
    };
  }, [excelState.cellCustomizations]);

  // Get column type for filters
  const getColumnType = useCallback((columnKey: string): 'text' | 'number' | 'date' | 'select' => {
    const column = columns.find(col => String(col.key) === columnKey);
    if (column?.type) return column.type;
    
    // Try to infer from data
    const sampleValue = data.find(item => item[columnKey] != null)?.[columnKey];
    if (typeof sampleValue === 'number') return 'number';
    if (sampleValue instanceof Date) return 'date';
    
    return 'text';
  }, [columns, data]);

  // Render cell content
  const renderCellContent = useCallback((item: T, columnKey: string, rowIndex: number) => {
    const column = columns.find(col => String(col.key) === columnKey);
    
    // Show status message if this row has one
    if (status?.rowIndex === rowIndex) {
      return (
        <span className={cn(
          "text-xs font-medium",
          status.type === 'error' ? 'text-red-600' : 'text-green-600'
        )}>
          {status.message}
        </span>
      );
    }
    
    // Normal cell content rendering
    const value = item[columnKey];
    
    // Use getDisplayValue first if available (for foreign key columns)
    if (column?.getDisplayValue) {
      return column.getDisplayValue(item) || '';
    }
    
    if (column?.render) {
      return column.render(value, item);
    }
    
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    
    return String(value);
  }, [columns, status]);


  return (
    <div className={cn("w-full", className)}>
      {/* Excel Controls - Integrado con el diseño de la página */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={excelActions.toggleColumnPanel}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z" fill="currentColor"/>
            </svg>
            Columnas
          </button>
          
          <button
            onClick={excelActions.resetColumns}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Resetear
          </button>
        </div>
        
        {/* Info */}
        <div className="text-sm text-gray-500">
          {excelState.filteredData.length} de {data.length} registros
          {excelState.filters.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {excelState.filters.length} filtros
            </span>
          )}
        </div>
      </div>

      {/* Excel Table - Fondo blanco integrado */}
      <div className="relative bg-white rounded-lg shadow-sm border border-gray-200" ref={tableRef}>
        {/* Contenedor principal con scroll */}
        <div 
          ref={scrollRef}
          className="overflow-auto"
        >
          {/* Header sticky que se mueve con el scroll */}
          <div className="sticky top-0 z-10 bg-white">
            <div 
              className="flex bg-gray-100 border-b border-gray-200"
              style={{ minWidth: `${contentWidth}px` }}
            >
              {excelState.visibleColumns.map((column, index) => (
                <DraggableColumn
                  key={column.key}
                  index={index}
                  columnKey={column.key}
                  onDragEnd={excelActions.reorderColumns}
                  locked={column.locked}
                  className="group"
                >
                  <ResizableColumn
                    width={column.width}
                    onResize={(width) => excelActions.resizeColumn(column.key, width)}
                    locked={column.locked}
                  >
                    <div className="bg-gray-100">
                      <ColumnHeader
                        title={columns.find(col => String(col.key) === column.key)?.header || column.key}
                        columnKey={column.key}
                        sortDirection={column.sortDirection}
                        hasFilter={excelState.filters.some(f => f.columnKey === column.key)}
                        onSort={(direction) => excelActions.sortByColumn(column.key, direction)}
                        onSortByColumn={(key, direction) => excelActions.sortByColumn(key, direction)}
                        onAddFilter={(filter) => excelActions.addFilter(filter)}
                        onRemoveFilter={() => excelActions.removeFilter(column.key)}
                        locked={column.locked}
                        columnType={getColumnType(column.key)}
                      />
                    </div>
                  </ResizableColumn>
                </DraggableColumn>
              ))}
            </div>
          </div>

          {/* Contenido de filas */}
          <div style={{ minWidth: `${contentWidth}px` }}>
            {excelState.filteredData.map((item, rowIndex) => (
              <div
                key={item[idField] || rowIndex}
                className={cn(
                  "flex border-b border-gray-200 hover:bg-gray-50 transition-colors",
                  excelState.selectedRows.has(item[idField] || rowIndex) && "bg-blue-50"
                )}
              >
                {excelState.visibleColumns.map((column) => (
                  <div
                    key={column.key}
                    data-cell={`${rowIndex}-${column.key}`}
                    className={cn(
                      "px-3 py-2 text-sm text-gray-900 cursor-cell bg-white",
                      "overflow-hidden text-ellipsis whitespace-nowrap h-10 flex items-center flex-shrink-0",
                      "border-r border-gray-200 last:border-r-0",
                      // Special styling for foreign key cells
                      (column.key.includes('sem_id') || column.key.includes('catalog_id')) &&
                      item[column.key] &&
                      "hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer",
                      excelState.selectedCell?.rowIndex === rowIndex && 
                      excelState.selectedCell?.columnKey === column.key &&
                      "ring-2 ring-blue-500 bg-blue-50 ring-inset"
                    )}
                    style={{
                      width: `${column.width}px`,
                      minWidth: `${column.width}px`,
                      maxWidth: `${column.width}px`,
                      ...getCellStyle(item[idField] || rowIndex, column.key)
                    }}
                    onClick={(e) => handleCellClick(rowIndex, column.key, e)}
                    title={String(item[column.key] || '')}
                  >
                    {renderCellContent(item, column.key, rowIndex)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column Visibility Panel */}
      <ColumnVisibilityPanel
        columns={excelState.columns}
        onToggleColumn={excelActions.toggleColumnVisibility}
        onClose={excelActions.toggleColumnPanel}
        isOpen={excelState.showColumnPanel}
      />

      {/* Cell Modal */}
      {excelState.expandedCell && (
        <CellModal
          isOpen={excelState.showCellModal}
          content={excelState.expandedCell.content}
          title={columns.find(col => String(col.key) === excelState.expandedCell?.columnKey)?.header || excelState.expandedCell?.columnKey || ''}
          rowIndex={excelState.expandedCell.rowIndex}
          columnKey={excelState.expandedCell.columnKey}
          onClose={excelActions.closeCellModal}
        />
      )}
      
      {/* Edit Cell Modal */}
      {editingCell && onRowUpdate && (
        <EditCellModal
          isOpen={!!editingCell}
          title={columns.find(col => String(col.key) === editingCell.columnKey)?.header || editingCell.columnKey}
          rowIndex={editingCell.rowIndex}
          columnKey={editingCell.columnKey}
          initialValue={editValue}
          column={columns.find(col => String(col.key) === editingCell.columnKey)}
          onClose={() => {
            setEditingCell(null);
            setEditValue(''); // Clear edit value when closing
          }}
          onSave={async (newValue) => {
            const originalRow = excelState.filteredData[editingCell.rowIndex];
            if (originalRow && onRowUpdate) {
              const rowId = originalRow[idField];
              await onRowUpdate(rowId, { [editingCell.columnKey]: newValue } as Partial<T>);
            }
            setEditingCell(null);
            setEditValue(''); // Clear edit value after saving
          }}
        />
      )}
    </div>
  );
};

// Create the forwardRef component
export const ExcelTable = forwardRef(ExcelTableInner) as <T extends Record<string, any>>(
  props: ExcelTableProps<T> & { ref?: React.Ref<ExcelTableRef> }
) => React.ReactElement;

// Export the ref type
export type { ExcelTableRef };

export default ExcelTable;
