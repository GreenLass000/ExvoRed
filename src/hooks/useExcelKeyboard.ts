import { useEffect, useCallback, useRef } from 'react';
import { ExcelModeState, ExcelModeActions } from './useExcelMode';

interface ExcelKeyboardOptions {
  enabled: boolean;
  // New bindings per spec
  onEditCell?: (rowIndex: number, columnKey: string) => void; // 'e'
  onOpenDetails?: (rowIndex: number, columnKey: string) => void; // 'i'
  onEditRecord?: (rowIndex: number) => void; // 'E' - only in details
  onNavigateSem?: () => void; // 's'
  onNavigateCatalog?: () => void; // 'c'
  onNavigateExvotos?: () => void; // 'v'
  blockNavigation?: boolean; // block s/c/v in new data and details
  inDetailsTab?: boolean; // allow E and p only when true
  // Back-compat
  onEdit?: (rowIndex: number, columnKey: string) => void;
  onView?: (rowIndex: number, columnKey: string) => void;
  onInspect?: (rowIndex: number, columnKey: string) => void;
  onPrint?: () => void;
  onExport?: () => void;
  onSelectAll?: () => void;
  onCopy?: (content: string) => void;
}

export function useExcelKeyboard<T extends Record<string, any>>(
  state: ExcelModeState<T>,
  actions: ExcelModeActions<T>,
  options: ExcelKeyboardOptions
) {
  const keysPressed = useRef(new Set<string>());
  const lastKeyTime = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!options.enabled || !state.isExcelModeEnabled) return;

    const currentTime = Date.now();
    const isRepeating = currentTime - lastKeyTime.current < 50; // Throttle rapid key repeats
    lastKeyTime.current = currentTime;

    keysPressed.current.add(e.key.toLowerCase());
    
    const isCtrl = e.ctrlKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    // Prevent default for Excel-specific shortcuts
    const shouldPreventDefault = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Enter', 'Home', 'End', 'PageUp', 'PageDown'
    ].includes(e.key) || (isCtrl && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase()));

    if (shouldPreventDefault && !isRepeating) {
      e.preventDefault();
    }

    // Handle keyboard shortcuts
    switch (e.key) {
      case 'ArrowUp':
        if (!isRepeating) {
          actions.navigateCell('up');
        }
        break;

      case 'ArrowDown':
        if (!isRepeating) {
          actions.navigateCell('down');
        }
        break;

      case 'ArrowLeft':
        if (!isRepeating) {
          if (isCtrl) {
            // Ctrl+Left: Go to first column
            if (state.visibleColumns.length > 0) {
              const firstColumn = state.visibleColumns[0];
              actions.selectCell(state.selectedCell?.rowIndex || 0, firstColumn.key);
            }
          } else {
            actions.navigateCell('left');
          }
        }
        break;

      case 'ArrowRight':
        if (!isRepeating) {
          if (isCtrl) {
            // Ctrl+Right: Go to last column
            if (state.visibleColumns.length > 0) {
              const lastColumn = state.visibleColumns[state.visibleColumns.length - 1];
              actions.selectCell(state.selectedCell?.rowIndex || 0, lastColumn.key);
            }
          } else {
            actions.navigateCell('right');
          }
        }
        break;

      case 'Tab':
        if (!isRepeating) {
          if (isShift) {
            actions.navigateCell('left');
          } else {
            actions.navigateCell('right');
          }
        }
        break;

      case 'Enter':
        if (!isRepeating) {
          if (state.selectedCell) {
            const rowData = state.filteredData[state.selectedCell.rowIndex];
            if (rowData) {
              const cellContent = String(rowData[state.selectedCell.columnKey] || '');
              if (cellContent.length > 50 || cellContent.includes('\n')) {
                // Open cell modal for long content
                actions.expandCell(
                  cellContent,
                  state.selectedCell.rowIndex,
                  state.selectedCell.columnKey
                );
              }
            }
          }
          
          if (isShift) {
            actions.navigateCell('up');
          } else {
            actions.navigateCell('down');
          }
        }
        break;

      case 'Home':
        if (!isRepeating) {
          if (isCtrl) {
            // Ctrl+Home: Go to first cell
            if (state.visibleColumns.length > 0 && state.filteredData.length > 0) {
              actions.selectCell(0, state.visibleColumns[0].key);
            }
          } else {
            // Home: Go to first column of current row
            if (state.visibleColumns.length > 0) {
              actions.selectCell(state.selectedCell?.rowIndex || 0, state.visibleColumns[0].key);
            }
          }
        }
        break;

      case 'End':
        if (!isRepeating) {
          if (isCtrl) {
            // Ctrl+End: Go to last cell
            if (state.visibleColumns.length > 0 && state.filteredData.length > 0) {
              const lastColumn = state.visibleColumns[state.visibleColumns.length - 1];
              actions.selectCell(state.filteredData.length - 1, lastColumn.key);
            }
          } else {
            // End: Go to last column of current row
            if (state.visibleColumns.length > 0) {
              const lastColumn = state.visibleColumns[state.visibleColumns.length - 1];
              actions.selectCell(state.selectedCell?.rowIndex || 0, lastColumn.key);
            }
          }
        }
        break;

      case 'PageUp':
        if (!isRepeating) {
          const pageSize = 10; // Number of rows per page
          const currentRow = state.selectedCell?.rowIndex || 0;
          const newRow = Math.max(0, currentRow - pageSize);
          actions.selectCell(newRow, state.selectedCell?.columnKey || state.visibleColumns[0]?.key);
        }
        break;

      case 'PageDown':
        if (!isRepeating) {
          const pageSize = 10;
          const currentRow = state.selectedCell?.rowIndex || 0;
          const newRow = Math.min(state.filteredData.length - 1, currentRow + pageSize);
          actions.selectCell(newRow, state.selectedCell?.columnKey || state.visibleColumns[0]?.key);
        }
        break;

      case 'Escape':
        if (!isRepeating) {
          if (state.showCellModal) {
            actions.closeCellModal();
          } else if (state.showColumnPanel) {
            actions.toggleColumnPanel();
          } else {
            actions.clearSelection();
          }
        }
        break;

      case 'e':
        if (!isRepeating && state.selectedCell && !isCtrl) {
          // Edit current cell (expand/edit modal)
          if (options.onEditCell) {
            options.onEditCell(state.selectedCell.rowIndex, state.selectedCell.columnKey);
          } else {
            options.onEdit?.(state.selectedCell.rowIndex, state.selectedCell.columnKey);
          }
        }
        break;

      // 'd' deprecated in new spec
      // case 'd':
      //   if (!isRepeating && state.selectedCell && !isCtrl) {
      //     options.onView?.(state.selectedCell.rowIndex, state.selectedCell.columnKey);
      //   }
      //   break;

      case 'E':
        if (!isRepeating && state.selectedCell && !isCtrl) {
          if (options.inDetailsTab) {
            options.onEditRecord?.(state.selectedCell.rowIndex);
          }
        }
        break;

      case 'i':
        if (!isRepeating && state.selectedCell && !isCtrl) {
          if (options.onOpenDetails) {
            options.onOpenDetails(state.selectedCell.rowIndex, state.selectedCell.columnKey);
          } else {
            options.onInspect?.(state.selectedCell.rowIndex, state.selectedCell.columnKey);
          }
        }
        break;

      case 'p':
        if (!isRepeating && !isCtrl) {
          if (options.inDetailsTab) {
            options.onPrint?.();
          }
        }
        break;

      case ' ':
        if (isCtrl && !isRepeating) {
          // Ctrl+Space: Select entire column
          if (state.selectedCell) {
            // Implementation depends on your needs
          }
        } else if (isShift && !isRepeating) {
          // Shift+Space: Select entire row
          if (state.selectedCell) {
            const rowData = state.filteredData[state.selectedCell.rowIndex];
            if (rowData) {
              // Toggle row selection
              const rowId = rowData.id || state.selectedCell.rowIndex;
              actions.toggleRowSelection(rowId);
            }
          }
        }
        break;

      case 's':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          options.onNavigateSem?.();
        }
        break;
      case 'c':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          options.onNavigateCatalog?.();
        }
        break;
      case 'v':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          options.onNavigateExvotos?.();
        }
        break;

      default:
        // Handle Ctrl+key combinations
        if (isCtrl && !isRepeating) {
          switch (e.key.toLowerCase()) {
            case 'a':
              // Select all
              options.onSelectAll?.();
              break;

            case 'c':
              // Copy
              if (state.selectedCell) {
                const rowData = state.filteredData[state.selectedCell.rowIndex];
                if (rowData) {
                  const content = String(rowData[state.selectedCell.columnKey] || '');
                  options.onCopy?.(content);
                }
              }
              break;

            case 'p':
              // Print
              options.onPrint?.();
              break;

            case 's':
              // Save/Export
              options.onExport?.();
              break;

            case 'f':
              // Find/Filter - toggle column panel
              actions.toggleColumnPanel();
              break;

            case 'z':
              // Undo
              if (isShift) {
                // Ctrl+Shift+Z: Redo
                // Implementation depends on your undo/redo system
              } else {
                // Ctrl+Z: Undo
                // Implementation depends on your undo/redo system
              }
              break;

            case 'r':
              // Reset columns
              actions.resetColumns();
              break;
          }
        }
        break;
    }
  }, [
    options.enabled,
    state.isExcelModeEnabled,
    state.selectedCell,
    state.visibleColumns,
    state.filteredData,
    state.showCellModal,
    state.showColumnPanel,
    actions,
    options
  ]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
  }, []);

  // Auto-scroll to selected cell
  const scrollToSelectedCell = useCallback(() => {
    if (!state.selectedCell || !state.isExcelModeEnabled) return;

    // Find the cell element and scroll it into view
    const cellSelector = `[data-cell="${state.selectedCell.rowIndex}-${state.selectedCell.columnKey}"]`;
    const cellElement = document.querySelector(cellSelector);
    
    if (cellElement) {
      cellElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [state.selectedCell, state.isExcelModeEnabled]);

  // Effect to scroll to selected cell when it changes
  useEffect(() => {
    const timeoutId = setTimeout(scrollToSelectedCell, 100);
    return () => clearTimeout(timeoutId);
  }, [scrollToSelectedCell]);

  // Add/remove event listeners
  useEffect(() => {
    if (options.enabled && state.isExcelModeEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        keysPressed.current.clear();
      };
    }
  }, [options.enabled, state.isExcelModeEnabled, handleKeyDown, handleKeyUp]);

  return {
    keysPressed: keysPressed.current,
    scrollToSelectedCell
  };
}
