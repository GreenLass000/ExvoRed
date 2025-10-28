import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ColumnDef } from '../components/DataTable';
import { usePageConfig } from './usePageConfig';

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

  // Page config management
  resetPageConfig: () => void;
  hasStoredConfig: boolean;
}

export function useExcelMode<T extends Record<string, any>>(
  initialColumns: ColumnDef<T>[],
  data: T[],
  idField: keyof T = 'id' as keyof T,
  pageId?: string
): [ExcelModeState<T>, ExcelModeActions<T>] {

  // Page config persistence
  const pageConfig = pageId ? usePageConfig(pageId) : null;
  const configLoadedRef = useRef(false);

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

  // Load saved config or use defaults
  const loadInitialState = useCallback(() => {
    if (!pageConfig) {
      return {
        columns: initializeColumns(),
        sortColumn: null,
        sortDirection: null,
        filters: []
      };
    }

    const savedConfig = pageConfig.loadConfig();
    if (savedConfig) {
      // Merge saved config with current column definitions to handle schema changes
      const currentKeys = initialColumns.map(col => String(col.key));
      const savedColumns = savedConfig.columns.filter(col => currentKeys.includes(col.key));

      // Add any new columns that weren't in the saved config
      const savedKeys = savedColumns.map(col => col.key);
      const newColumns = initialColumns
        .filter(col => !savedKeys.includes(String(col.key)))
        .map((col, index) => ({
          key: String(col.key),
          visible: true,
          width: col.width || 150,
          order: savedColumns.length + index,
          sortDirection: null,
          locked: col.key === 'actions' || col.locked || false
        }));

      return {
        columns: [...savedColumns, ...newColumns],
        sortColumn: savedConfig.sortColumn,
        sortDirection: savedConfig.sortDirection,
        filters: savedConfig.filters
      };
    }

    return {
      columns: initializeColumns(),
      sortColumn: null,
      sortDirection: null,
      filters: []
    };
  }, [pageConfig, initializeColumns, initialColumns]);

  // State
  const initialState = loadInitialState();
  const [columns, setColumns] = useState<ExcelColumnSettings[]>(initialState.columns);
  const [sortColumn, setSortColumn] = useState<string | null>(initialState.sortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(initialState.sortDirection);
  const [filters, setFilters] = useState<ExcelFilter[]>(initialState.filters);
  const [cellCustomizations, setCellCustomizations] = useState<ExcelCellCustomization[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isExcelModeEnabled, setIsExcelModeEnabled] = useState(true);
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [expandedCell, setExpandedCell] = useState<{ content: string; rowIndex: number; columnKey: string } | null>(null);

  // Track if config has been loaded to avoid saving on initial render
  useEffect(() => {
    configLoadedRef.current = true;
  }, []);

  // Auto-save config when relevant state changes
  useEffect(() => {
    if (!pageConfig || !configLoadedRef.current) return;

    pageConfig.saveConfig({
      columns,
      filters,
      sortColumn,
      sortDirection
    });
  }, [columns, filters, sortColumn, sortDirection, pageConfig]);

  // Memoized calculations
  const visibleColumns = useMemo(() => {
    return columns
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [columns]);

  // Default sort (alphabetical) on first suitable text-like column
  useEffect(() => {
    if (!sortColumn && !sortDirection && Array.isArray(initialColumns) && initialColumns.length > 0) {
      const preferred = initialColumns.find(c => c && c.key !== 'actions' && c.type !== 'number' && c.type !== 'date');
      const fallback = initialColumns.find(c => c && c.key !== 'actions');
      if (!preferred && !fallback) return;
      const defaultKey = String((preferred || fallback)!.key);
      setSortColumn(defaultKey);
      setSortDirection('asc');
      setColumns(prev => (Array.isArray(prev) ? prev : []).map(col => ({
        ...col,
        sortDirection: col.key === defaultKey ? 'asc' : null
      })));
    }
  }, [initialColumns, sortColumn, sortDirection]);

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

    // Helpers for sorting by display text when available
    const normalizeText = (text: string): string =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const extractTextFromReactNode = (node: any): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (node == null) return '';
      // React element basic extraction
      const maybeChildren = (node && node.props && node.props.children) ?? null;
      if (typeof maybeChildren === 'string') return maybeChildren;
      if (typeof maybeChildren === 'number') return String(maybeChildren);
      return String(node);
    };

    const colDef = initialColumns.find(col => String(col.key) === sortColumn);

    const getComparable = (item: T) => {
      // Prefer display value when a renderer is provided (e.g., foreign keys)
      if (colDef && typeof colDef.getDisplayValue === 'function') {
        try {
          const display = colDef.getDisplayValue(item);
          return normalizeText(extractTextFromReactNode(display));
        } catch {
          // fallback to raw value
        }
      }
      const raw = item[sortColumn as keyof T] as unknown as any;
      if (raw == null) return null;
      return raw;
    };

    return [...filteredData].sort((a, b) => {
      const aComp = getComparable(a);
      const bComp = getComparable(b);

      if (aComp == null && bComp == null) return 0;
      if (aComp == null) return 1;
      if (bComp == null) return -1;

      let result = 0;

      if (typeof aComp === 'string' || typeof bComp === 'string') {
        result = String(aComp).localeCompare(String(bComp), undefined, { sensitivity: 'base' });
      } else if (typeof aComp === 'number' && typeof bComp === 'number') {
        result = aComp - bComp;
      } else if (aComp instanceof Date && bComp instanceof Date) {
        result = aComp.getTime() - bComp.getTime();
      } else {
        result = String(aComp).localeCompare(String(bComp));
      }

      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredData, sortColumn, sortDirection, initialColumns]);

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
      const defaultColumns = initializeColumns();
      setColumns(defaultColumns);
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
    }, []),

    // Page config management
    resetPageConfig: useCallback(() => {
      if (pageConfig) {
        pageConfig.clearConfig();
      }
      const defaultColumns = initializeColumns();
      setColumns(defaultColumns);
      setSortColumn(null);
      setSortDirection(null);
      setFilters([]);
    }, [pageConfig, initializeColumns]),

    hasStoredConfig: pageConfig?.hasStoredConfig() ?? false
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
