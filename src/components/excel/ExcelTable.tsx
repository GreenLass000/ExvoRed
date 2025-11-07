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
import { EditCellModal } from './EditCellModal';
import { highlightText } from '../../utils/highlightText';

interface ExcelTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  className?: string;
  onEdit?: (rowIndex: number, columnKey: string, data: T) => void;
  onView?: (rowIndex: number, columnKey: string, data: T) => void;
  onViewNewTab?: (rowIndex: number, columnKey: string, data: T) => void;
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
  onNavigateToReferenceNewTab?: (referenceType: 'sem' | 'catalog', referenceId: number) => void;
  // Inline editing support
  onRowUpdate?: (id: any, data: Partial<T>) => Promise<any>;
  enableInlineEdit?: boolean;
  // Create empty record
  onCreateEmpty?: () => Promise<void>;
  // Duplicate row
  onDuplicateRow?: (data: T) => Promise<void>;
  // Page config persistence
  pageId?: string;
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
  onViewNewTab,
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
  onNavigateToReferenceNewTab,
  onRowUpdate,
  enableInlineEdit = false,
  onCreateEmpty,
  onDuplicateRow,
  pageId
}: ExcelTableProps<T>, ref: React.Ref<ExcelTableRef>) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Excel mode state and actions
  const [excelState, excelActions] = useExcelMode(columns, data, idField, pageId);

  // Inline editing state
  const [editingInlineCell, setEditingInlineCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [status, setStatus] = useState<{ rowIndex: number, message: string, type: 'info' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Copy/Paste clipboard state
  const [copiedValue, setCopiedValue] = useState<{ value: any; columnKey: string; rowIndex: number } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [pasteStatus, setPasteStatus] = useState<{ rowIndex: number; columnKey: string } | null>(null);

  // Edit Modal state (for 'e' key)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState<{ rowIndex: number; columnKey: string; value: any } | null>(null);
  
  // Focus on editing input when entering edit mode
  useEffect(() => {
    if (editingInlineCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [editingInlineCell]);
  
  // Inline editing functions - removed handleCellDoubleClick, now handled in handleCellClick
  
  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  }, []);
  
  const saveChanges = useCallback(async () => {
    if (!editingInlineCell || !onRowUpdate) return;

    const { rowIndex, columnKey } = editingInlineCell;
    const originalRow = excelState.filteredData[rowIndex];
    if (!originalRow) return;

    const originalValue = originalRow[columnKey];
    let finalValue: any = editValue;

    const columnDef = columns.find(c => String(c.key) === columnKey);
    // Convert to number for number and foreignKey types
    if (columnDef?.type === 'number' || columnDef?.type === 'foreignKey') {
      finalValue = editValue === '' || editValue === null ? null : Number(editValue);
    }

    // Don't save if value hasn't changed
    if (finalValue === originalValue) {
      setEditingInlineCell(null);
      return;
    }

    setStatus({ rowIndex, message: 'Guardando...', type: 'info' });
    try {
      const rowId = originalRow[idField];
      await onRowUpdate(rowId, { [columnKey]: finalValue } as Partial<T>);
      setStatus({ rowIndex, message: '¡Guardado!', type: 'info' });
    } catch (error) {
      setStatus({ rowIndex, message: 'Error al guardar', type: 'error' });
      console.error('Error al actualizar fila:', error);
    }

    setEditingInlineCell(null);
    setTimeout(() => setStatus(null), 2000);
  }, [editingInlineCell, editValue, onRowUpdate, excelState.filteredData, columns, idField]);
  
  const handleInputBlur = useCallback(() => {
    saveChanges();
  }, [saveChanges]);
  
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChanges();
    } else if (e.key === 'Escape') {
      setEditingInlineCell(null);
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
  
  // Copy/Paste handlers
  const handleCopyCellValue = useCallback((rowIndex: number, columnKey: string, value: any) => {
    setCopiedValue({ value, columnKey, rowIndex });

    // Show feedback
    const displayValue = value !== null && value !== undefined ? String(value) : '(vacío)';
    const truncated = displayValue.length > 30 ? displayValue.substring(0, 30) + '...' : displayValue;
    setCopyFeedback(`Copiado: ${truncated}`);

    // Clear feedback after 2 seconds
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const handlePasteCellValue = useCallback(async (rowIndex: number, columnKey: string) => {
    if (!copiedValue || !onRowUpdate) {
      return;
    }

    const rowData = excelState.filteredData[rowIndex];
    if (!rowData) {
      return;
    }

    const columnDef = columns.find(col => String(col.key) === columnKey);

    // Don't allow pasting into id column or readOnly columns
    if (columnKey === 'id' || columnDef?.readOnly) {
      setStatus({ rowIndex, message: 'Columna de solo lectura', type: 'error' });
      setTimeout(() => setStatus(null), 2000);
      return;
    }

    const rowId = rowData[idField];

    // Show paste status immediately
    setPasteStatus({ rowIndex, columnKey });

    try {
      await onRowUpdate(rowId, { [columnKey]: copiedValue.value } as Partial<T>);

      // Keep paste status for a moment to show success
      setTimeout(() => setPasteStatus(null), 1000);
    } catch (error) {
      console.error('Error pasting value:', error);
      setPasteStatus(null);
      setStatus({ rowIndex, message: 'Error al pegar', type: 'error' });
      setTimeout(() => setStatus(null), 2000);
    }
  }, [copiedValue, onRowUpdate, excelState.filteredData, idField, columns]);

  // Keyboard navigation
  useExcelKeyboard(excelState, excelActions, {
    enabled: enableKeyboardNavigation,
    // 'e' -> edit cell - open modal for editing
    onEditCell: (rowIndex, columnKey) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData && onRowUpdate && columnKey !== 'id') {
        // Open modal for editing
        const cellValue = rowData[columnKey];
        setEditModalData({ rowIndex, columnKey, value: cellValue });
        setShowEditModal(true);
      } else if (rowData) {
        // Fallback to readonly cell modal
        const content = String(rowData[columnKey] ?? '');
        excelActions.expandCell(content, rowIndex, columnKey);
      }
    },
    // 'i' -> open details (same tab)
    onOpenDetails: (rowIndex, columnKey) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) onView?.(rowIndex, columnKey, rowData);
    },
    // 'I' -> open details in new tab
    onOpenDetailsNewTab: (rowIndex, columnKey) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) onViewNewTab?.(rowIndex, columnKey, rowData);
    },
    // 'E' -> edit full record (only in details tab)
    onEditRecord: (rowIndex) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) onEdit?.(rowIndex, excelState.selectedCell?.columnKey || '', rowData);
    },
    // Enter -> inline editing when available
    onStartInlineEdit: onRowUpdate ? (rowIndex, columnKey) => {
      const rowData = excelState.filteredData[rowIndex];
      const columnDef = columns.find(col => String(col.key) === columnKey);
      // Don't allow editing id column or readOnly columns
      if (rowData && columnKey !== 'id' && !columnDef?.readOnly) {
        setEditingInlineCell({ rowIndex, columnKey });
        setEditValue(rowData[columnKey] ?? '');
      }
    } : undefined,
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
    onCopyCellValue: handleCopyCellValue,
    onPasteCellValue: handlePasteCellValue,
    onNavigateToReference,
    onNavigateToReferenceNewTab,
    // Ctrl+D -> duplicate row
    onDuplicateRow: onDuplicateRow ? (rowIndex) => {
      const rowData = excelState.filteredData[rowIndex];
      if (rowData) {
        onDuplicateRow(rowData);
      }
    } : undefined
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

    // Double click behavior
    if (event.detail === 2) {
      const rowData = excelState.filteredData[rowIndex];
      if (!rowData) return;

      const columnDef = columns.find(col => String(col.key) === columnKey);

      // If onRowUpdate is available and not the id column or readOnly column, enable inline editing
      if (onRowUpdate && columnKey !== 'id' && !columnDef?.readOnly) {
        setEditingInlineCell({ rowIndex, columnKey });
        setEditValue(rowData[columnKey] ?? '');
      }
      // Otherwise, open view-only modal (old behavior)
      else {
        const content = String(rowData[columnKey] || '');
        excelActions.expandCell(content, rowIndex, columnKey);
      }
    }
  }, [excelActions, excelState.filteredData, onRowUpdate, columns]);

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
    let contentToRender: React.ReactNode = '';

    // Use getDisplayValue first if available (for foreign key columns)
    if (column?.getDisplayValue) {
      contentToRender = column.getDisplayValue(item) || '';
    } else if (column?.render) {
      contentToRender = column.render(value, item);
    } else if (value == null) {
      contentToRender = '';
    } else if (typeof value === 'boolean') {
      contentToRender = value ? 'Sí' : 'No';
    } else if (value instanceof Date) {
      contentToRender = value.toLocaleDateString();
    } else {
      contentToRender = String(value);
    }

    // Helper function to detect if content is HTML
    const isHTML = (str: string) => {
      return /<[^>]+>/.test(str);
    };

    // Helper function to strip HTML tags for plain text display
    const stripHTML = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    // Handle richtext type - always render HTML
    if (column?.type === 'richtext' && typeof contentToRender === 'string') {
      if (isHTML(contentToRender)) {
        return (
          <div
            className="prose prose-sm max-w-none [&>*]:my-0 [&>*]:leading-tight [&>p]:my-0"
            dangerouslySetInnerHTML={{ __html: contentToRender }}
          />
        );
      }
      // If richtext but no HTML, show as plain text
      return contentToRender;
    }

    // Handle truncated type - show plain text truncated
    if (column?.type === 'truncated' && typeof contentToRender === 'string') {
      const plainText = isHTML(contentToRender) ? stripHTML(contentToRender) : contentToRender;
      const truncatedText = plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
      return (
        <span title={plainText}>
          {searchQuery ? highlightText(truncatedText, searchQuery) : truncatedText}
        </span>
      );
    }

    // If content is a string and contains HTML (for non-specified type columns), render it as HTML
    if (typeof contentToRender === 'string' && isHTML(contentToRender)) {
      return (
        <div
          className="prose prose-sm max-w-none [&>*]:my-0 [&>*]:leading-tight"
          dangerouslySetInnerHTML={{ __html: contentToRender }}
        />
      );
    }

    // Apply highlighting if search query is active and content is a string
    if (searchQuery && typeof contentToRender === 'string') {
      return highlightText(contentToRender, searchQuery);
    }

    return contentToRender;
  }, [columns, status, searchQuery]);


  return (
    <div className={cn("w-full", className)}>
      {/* Copy feedback toast */}
      {copyFeedback && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {copyFeedback}
        </div>
      )}

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
              style={{ minWidth: `${contentWidth + 50}px` }}
            >
              {/* Columna de números de fila - Header */}
              <div
                className="flex items-center justify-center font-semibold text-xs text-gray-600 bg-gray-100 border-r border-gray-300 sticky left-0 z-20"
                style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
              >
                #
              </div>

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
          <div style={{ minWidth: `${contentWidth + 50}px` }}>
            {excelState.filteredData.map((item, rowIndex) => (
              <div
                key={item[idField] || rowIndex}
                className={cn(
                  "flex border-b border-gray-200 hover:bg-gray-50 transition-colors",
                  excelState.selectedRows.has(item[idField] || rowIndex) && "bg-blue-50"
                )}
              >
                {/* Columna de números de fila */}
                <div
                  className="flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-50 border-r border-gray-300 sticky left-0 z-10"
                  style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                >
                  {rowIndex + 1}
                </div>

                {excelState.visibleColumns.map((column) => {
                  const isEditingThisCell = editingInlineCell?.rowIndex === rowIndex && editingInlineCell?.columnKey === column.key;
                  const columnDef = columns.find(col => String(col.key) === column.key);
                  const isCopiedCell = copiedValue?.rowIndex === rowIndex && copiedValue?.columnKey === column.key;
                  const isPastedCell = pasteStatus?.rowIndex === rowIndex && pasteStatus?.columnKey === column.key;

                  return (
                    <div
                      key={column.key}
                      data-cell={`${rowIndex}-${column.key}`}
                      className={cn(
                        "px-3 py-2 text-sm text-gray-900 cursor-cell bg-white",
                        "border-r border-gray-200 last:border-r-0",
                        // Diferentes estilos si está editando o no
                        isEditingThisCell
                          ? "min-h-[80px] items-start overflow-visible whitespace-normal break-words"
                          : "overflow-hidden text-ellipsis whitespace-nowrap h-10 items-center",
                        "flex flex-shrink-0",
                        // Special styling for foreign key cells
                        (column.key.includes('sem_id') || column.key.includes('catalog_id')) &&
                        item[column.key] &&
                        "hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer",
                        excelState.selectedCell?.rowIndex === rowIndex &&
                        excelState.selectedCell?.columnKey === column.key &&
                        "ring-2 ring-blue-500 bg-blue-50 ring-inset",
                        // Highlight copied cell with dashed border
                        isCopiedCell && "ring-2 ring-dashed ring-green-400",
                        // Highlight pasted cell with success background
                        isPastedCell && "bg-green-100 ring-2 ring-green-500"
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
                      {isEditingThisCell ? (
                        columnDef?.type === 'foreignKey' && columnDef.foreignKeyData ? (
                          <select
                            ref={inputRef as React.Ref<HTMLSelectElement>}
                            value={editValue ?? ''}
                            onChange={handleEditChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            className="w-full h-full px-1 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm bg-white"
                          >
                            <option value="">-- Sin asignar --</option>
                            {columnDef.foreignKeyData.map(fk => (
                              <option key={fk.id} value={fk.id}>{fk.name || `#${fk.id}`}</option>
                            ))}
                          </select>
                        ) : columnDef?.type === 'truncated' || (String(editValue ?? '').length > 100) ? (
                          <textarea
                            ref={inputRef as React.Ref<HTMLTextAreaElement>}
                            value={editValue ?? ''}
                            onChange={handleEditChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            className="w-full min-h-[60px] px-2 py-1 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm resize-none"
                            rows={4}
                          />
                        ) : (
                          <input
                            ref={inputRef as React.Ref<HTMLInputElement>}
                            type={columnDef?.type === 'date' ? 'date' : columnDef?.type === 'number' ? 'number' : 'text'}
                            value={columnDef?.type === 'date' && editValue ? (editValue as string).split('T')[0] : editValue ?? ''}
                            onChange={handleEditChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            className="w-full h-full px-1 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-sm"
                          />
                        )
                      ) : (
                        renderCellContent(item, column.key, rowIndex)
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Fila adicional para crear nuevo registro vacío */}
            {onCreateEmpty && (
              <div className="flex border-b border-gray-200 hover:bg-blue-50 transition-colors">
                {/* Columna de números de fila */}
                <div
                  className="flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-50 border-r border-gray-300 sticky left-0 z-10"
                  style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}
                >
                  <button
                    onClick={onCreateEmpty}
                    className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors"
                    title="Añadir nuevo registro"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Celdas vacías para mantener el ancho */}
                {excelState.visibleColumns.map((column) => (
                  <div
                    key={column.key}
                    className="px-3 py-2 text-sm text-gray-400 cursor-pointer bg-white overflow-hidden text-ellipsis whitespace-nowrap h-10 flex items-center flex-shrink-0 border-r border-gray-200 last:border-r-0"
                    style={{
                      width: `${column.width}px`,
                      minWidth: `${column.width}px`,
                      maxWidth: `${column.width}px`
                    }}
                    onClick={onCreateEmpty}
                  >
                    Haz clic en + para añadir
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Visibility Panel */}
      <ColumnVisibilityPanel
        columns={excelState.columns}
        onToggleColumn={excelActions.toggleColumnVisibility}
        onClose={excelActions.toggleColumnPanel}
        isOpen={excelState.showColumnPanel}
        onResetConfig={excelActions.resetPageConfig}
        hasStoredConfig={excelActions.hasStoredConfig}
      />

      {/* Cell Modal (only for view mode - when no onRowUpdate or for 'id' column) */}
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

      {/* Edit Modal (for 'e' key - edit mode with rich text support) */}
      {editModalData && (
        <EditCellModal
          isOpen={showEditModal}
          title={columns.find(col => String(col.key) === editModalData.columnKey)?.header || editModalData.columnKey}
          rowIndex={editModalData.rowIndex}
          columnKey={editModalData.columnKey}
          initialValue={editModalData.value}
          column={columns.find(col => String(col.key) === editModalData.columnKey)}
          onClose={() => {
            setShowEditModal(false);
            setEditModalData(null);
          }}
          onSave={async (newValue) => {
            if (onRowUpdate && editModalData) {
              const rowData = excelState.filteredData[editModalData.rowIndex];
              if (rowData) {
                const rowId = rowData[idField];
                await onRowUpdate(rowId, { [editModalData.columnKey]: newValue } as Partial<T>);
              }
            }
            setShowEditModal(false);
            setEditModalData(null);
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

export default ExcelTable;
