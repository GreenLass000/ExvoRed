import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ColumnDef } from '../components/DataTable';

export interface ExcelColumnSettings {
  key: string;
  visible: boolean;
  width: number;
  order: number;
  sortDirection: 'asc' | 'desc' | null;
  color?: string;
  locked?: boolean;
}

export interface ExcelCellCustomization {
  rowId: string | number;
  columnKey: string;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
}

export interface ExcelFilter {
  columnKey: string;
  type: 'text' | 'date' | 'number' | 'select';
  value: any;
  operator: 'equals' | 'contains' | 'starts_with' | 'gt' | 'lt' | 'between';
}

export interface ExcelModeState<T> {
  // Column management
  columns: ExcelColumnSettings[];
  visibleColumns: ExcelColumnSettings[];
  
  // Sorting and filtering
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  filters: ExcelFilter[];
  filteredData: T[];
  
  // Cell customization
  cellCustomizations: ExcelCellCustomization[];
  
  // Navigation and selection
  selectedCell: { rowIndex: number; columnKey: string } | null;
  selectedRows: Set<string | number>;
  
  // Layout
  scrollPosition: { x: number; y: number };
  containerWidth: number;
  
  // UI State
  isExcelModeEnabled: boolean;
  showColumnPanel: boolean;
  showCellModal: boolean;
  expandedCell: { content: string; rowIndex: number; columnKey: string } | null;
}

export interface ExcelModeActions<T> {
  // Mode toggle
  toggleExcelMode: () => void;
  
  // Column management
  toggleColumnVisibility: (columnKey: string) => void;
  resizeColumn: (columnKey: string, width: number) => void;
  reorderColumns: (oldIndex: number, newIndex: number) => void;
  resetColumns: () => void;
  
  // Sorting and filtering
  sortByColumn: (columnKey: string, direction?: 'asc' | 'desc') => void;
  addFilter: (filter: ExcelFilter) => void;
  removeFilter: (columnKey: string) => void;
  clearAllFilters: () => void;
  
  // Cell customization
  setCellColor: (rowId: string | number, columnKey: string, backgroundColor: string) => void;
  removeCellColor: (rowId: string | number, columnKey: string) => void;
  clearAllCellColors: () => void;
  
  // Navigation
  selectCell: (rowIndex: number, columnKey: string) => void;
  navigateCell: (direction: 'up' | 'down' | 'left' | 'right') => void;
  toggleRowSelection: (rowId: string | number) => void;
  clearSelection: () => void;
  
  // Modal and expanded views
  expandCell: (content: string, rowIndex: number, columnKey: string) => void;
  closeCellModal: () => void;
  
  // Layout
  setScrollPosition: (x: number, y: number) => void;
  setContainerWidth: (width: number) => void;
  
  // Panel management
  toggleColumnPanel: () => void;
}

export function useExcelMode<T extends Record<string, any>>(
  initialColumns: ColumnDef<T>[],
  data: T[],
  idField: keyof T = 'id' as keyof T
): [ExcelModeState<T>, ExcelModeActions<T>] {
  
  // Initialize column settings
  const initializeColumns = useCallback((): ExcelColumnSettings[] => {
    return initialColumns.map((col, index) => ({
      key: String(col.key),
      visible: true,
      width: col.width || 150,
      order: index,
      sortDirection: null,
      locked: col.key === 'actions' || col.locked || false
    }));
  }, [initialColumns]);

  // State
  const [columns, setColumns] = useState<ExcelColumnSettings[]>(initializeColumns);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFilters] = useState<ExcelFilter[]>([]);
  const [cellCustomizations, setCellCustomizations] = useState<ExcelCellCustomization[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isExcelModeEnabled, setIsExcelModeEnabled] = useState(true);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [expandedCell, setExpandedCell] = useState<{ content: string; rowIndex: number; columnKey: string } | null>(null);

  // Memoized calculations
  const visibleColumns = useMemo(() => {
    return columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [columns]);

  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;
    
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.columnKey as keyof T];
        const filterValue = filter.value;
        
        if (value == null || filterValue == null) return false;
        
        switch (filter.type) {
          case 'text':
            const textValue = String(value).toLowerCase();
            const textFilter = String(filterValue).toLowerCase();
            
            switch (filter.operator) {
              case 'equals': return textValue === textFilter;
              case 'contains': return textValue.includes(textFilter);
              case 'starts_with': return textValue.startsWith(textFilter);
              default: return false;
            }
            
          case 'number':
            const numValue = Number(value);
            const numFilter = Number(filterValue);
            
            switch (filter.operator) {
              case 'equals': return numValue === numFilter;
              case 'gt': return numValue > numFilter;
              case 'lt': return numValue < numFilter;
              default: return false;
            }
            
          case 'date':
            const dateValue = new Date(String(value));
            const dateFilter = new Date(String(filterValue));
            
            switch (filter.operator) {
              case 'equals': return dateValue.getTime() === dateFilter.getTime();
              case 'gt': return dateValue > dateFilter;
              case 'lt': return dateValue < dateFilter;
              default: return false;
            }
            
          default:
            return true;
        }
      });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      let result = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        result = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        result = aValue.getTime() - bValue.getTime();
      } else {
        result = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Actions
  const actions: ExcelModeActions<T> = {
    // Mode toggle
    toggleExcelMode: useCallback(() => {
      setIsExcelModeEnabled(prev => !prev);
    }, []),
    
    // Column management
    toggleColumnVisibility: useCallback((columnKey: string) => {
      setColumns(prev => prev.map(col => 
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      ));
    }, []),
    
    resizeColumn: useCallback((columnKey: string, width: number) => {
      setColumns(prev => prev.map(col => 
        col.key === columnKey ? { ...col, width: Math.max(50, width) } : col
      ));
    }, []),
    
    reorderColumns: useCallback((oldIndex: number, newIndex: number) => {
      setColumns(prev => {
        const newColumns = [...prev];
        const [movedColumn] = newColumns.splice(oldIndex, 1);
        newColumns.splice(newIndex, 0, movedColumn);
        
        // Update order values
        return newColumns.map((col, index) => ({ ...col, order: index }));
      });
    }, []),
    
    resetColumns: useCallback(() => {
      setColumns(initializeColumns());
      setSortColumn(null);
      setSortDirection(null);
      setFilters([]);
    }, [initializeColumns]),
    
    // Sorting and filtering
    sortByColumn: useCallback((columnKey: string, direction?: 'asc' | 'desc') => {
      if (sortColumn === columnKey && !direction) {
        // Toggle through: asc -> desc -> none
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else if (sortDirection === 'desc') {
          setSortColumn(null);
          setSortDirection(null);
        } else {
          setSortDirection('asc');
        }
      } else {
        setSortColumn(columnKey);
        setSortDirection(direction || 'asc');
      }
      
      // Update column settings
      setColumns(prev => prev.map(col => ({
        ...col,
        sortDirection: col.key === columnKey ? (direction || 'asc') : null
      })));
    }, [sortColumn, sortDirection]),
    
    addFilter: useCallback((filter: ExcelFilter) => {
      setFilters(prev => {
        const filtered = prev.filter(f => f.columnKey !== filter.columnKey);
        return [...filtered, filter];
      });
    }, []),
    
    removeFilter: useCallback((columnKey: string) => {
      setFilters(prev => prev.filter(f => f.columnKey !== columnKey));
    }, []),
    
    clearAllFilters: useCallback(() => {
      setFilters([]);
    }, []),
    
    // Cell customization
    setCellColor: useCallback((rowId: string | number, columnKey: string, backgroundColor: string) => {
      setCellCustomizations(prev => {
        const filtered = prev.filter(c => !(c.rowId === rowId && c.columnKey === columnKey));
        return [...filtered, { rowId, columnKey, backgroundColor }];
      });
    }, []),
    
    removeCellColor: useCallback((rowId: string | number, columnKey: string) => {
      setCellCustomizations(prev => prev.filter(c => !(c.rowId === rowId && c.columnKey === columnKey)));
    }, []),
    
    clearAllCellColors: useCallback(() => {
      setCellCustomizations([]);
    }, []),
    
    // Navigation
    selectCell: useCallback((rowIndex: number, columnKey: string) => {
      setSelectedCell({ rowIndex, columnKey });
    }, []),
    
    navigateCell: useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
      if (!selectedCell || !isExcelModeEnabled) return;
      
      const visibleColumnKeys = visibleColumns.map(col => col.key);
      const currentColumnIndex = visibleColumnKeys.indexOf(selectedCell.columnKey);
      
      let newRowIndex = selectedCell.rowIndex;
      let newColumnIndex = currentColumnIndex;
      
      switch (direction) {
        case 'up':
          newRowIndex = Math.max(0, selectedCell.rowIndex - 1);
          break;
        case 'down':
          newRowIndex = Math.min(sortedData.length - 1, selectedCell.rowIndex + 1);
          break;
        case 'left':
          newColumnIndex = Math.max(0, currentColumnIndex - 1);
          break;
        case 'right':
          newColumnIndex = Math.min(visibleColumnKeys.length - 1, currentColumnIndex + 1);
          break;
      }
      
      setSelectedCell({
        rowIndex: newRowIndex,
        columnKey: visibleColumnKeys[newColumnIndex]
      });
    }, [selectedCell, isExcelModeEnabled, visibleColumns, sortedData.length]),
    
    toggleRowSelection: useCallback((rowId: string | number) => {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(rowId)) {
          newSet.delete(rowId);
        } else {
          newSet.add(rowId);
        }
        return newSet;
      });
    }, []),
    
    clearSelection: useCallback(() => {
      setSelectedCell(null);
      setSelectedRows(new Set());
    }, []),
    
    // Modal and expanded views
    expandCell: useCallback((content: string, rowIndex: number, columnKey: string) => {
      setExpandedCell({ content, rowIndex, columnKey });
    }, []),
    
    closeCellModal: useCallback(() => {
      setExpandedCell(null);
    }, []),
    
    // Layout
    setScrollPosition: useCallback((x: number, y: number) => {
      setScrollPosition({ x, y });
    }, []),
    
    setContainerWidth: useCallback((width: number) => {
      setContainerWidth(width);
    }, []),
    
    // Panel management
    toggleColumnPanel: useCallback(() => {
      setShowColumnPanel(prev => !prev);
    }, [])
  };

  const state: ExcelModeState<T> = {
    columns,
    visibleColumns,
    sortColumn,
    sortDirection,
    filters,
    filteredData: sortedData,
    cellCustomizations,
    selectedCell,
    selectedRows,
    scrollPosition,
    containerWidth,
    isExcelModeEnabled,
    showColumnPanel,
    showCellModal: expandedCell !== null,
    expandedCell
  };

  return [state, actions];
}
