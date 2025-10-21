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
  onNavigateDivinities?: () => void; // 'd'
  onNavigateCharacters?: () => void; // 'p'
  onNavigateMiracles?: () => void; // 'm'
  blockNavigation?: boolean; // block s/c/v/d/p/m in new data and details
  inDetailsTab?: boolean; // allow E and p only when true
  // Back-compat
  onEdit?: (rowIndex: number, columnKey: string) => void;
  onView?: (rowIndex: number, columnKey: string) => void;
  onInspect?: (rowIndex: number, columnKey: string) => void;
  onPrint?: () => void;
  onExport?: () => void;
  onSelectAll?: () => void;
  onCopy?: (content: string) => void;
  // Foreign key navigation
  onNavigateToReference?: (referenceType: 'sem' | 'catalog', referenceId: number) => void;
  // Inline editing support
  onStartInlineEdit?: (rowIndex: number, columnKey: string) => void; // Enter - for inline editing
  // Copy/Paste cell values
  onCopyCellValue?: (rowIndex: number, columnKey: string, value: any) => void; // Ctrl+C
  onPasteCellValue?: (rowIndex: number, columnKey: string) => Promise<void>; // Ctrl+V
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

    // Don't handle keyboard shortcuts if user is typing in an input field
    const target = e.target as HTMLElement;
    const isInputField = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.contentEditable === 'true' ||
      target.getAttribute('role') === 'textbox'
    );
    
    // Permitimos Ctrl+A y Shift+Espacio incluso si hay foco en input, siempre que haya una celda seleccionada
    if (isInputField) {
      const allowSpecial = (isCtrl && e.key.toLowerCase() === 'a') || (isShift && e.key === ' ');
      if (!(allowSpecial && state.selectedCell)) return;
    }

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
    ].includes(e.key) || (isCtrl && ['a', 'c', 'v', 'x', 'z', 'y', 'f'].includes(e.key.toLowerCase()));

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
            // Always open cell modal for viewing content - no navigation
            const rowData = state.filteredData[state.selectedCell.rowIndex];
            if (rowData) {
              const cellContent = String(rowData[state.selectedCell.columnKey] || '');
              // Open cell modal for content viewing
              actions.expandCell(
                cellContent,
                state.selectedCell.rowIndex,
                state.selectedCell.columnKey
              );
            }
          }
          // No automatic navigation with Enter - user can use arrows
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
          // Don't handle escape if there are modals open - let them handle it
          const hasOpenModal = document.querySelector('.fixed.inset-0.z-50');
          if (!hasOpenModal) {
            if (state.showCellModal) {
              actions.closeCellModal();
            } else if (state.showColumnPanel) {
              actions.toggleColumnPanel();
            } else {
              actions.clearSelection();
            }
          }
        }
        break;

      case 'e':
        if (!isRepeating && state.selectedCell && !isCtrl) {
          // Prevent the typed 'e' from being inserted into the newly focused input
          e.preventDefault();
          e.stopPropagation();
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
          e.preventDefault();
          e.stopPropagation();
          if (options.inDetailsTab) {
            options.onEditRecord?.(state.selectedCell.rowIndex);
          }
        }
        break;

      case 'i':
        if (!isRepeating && state.selectedCell && !isCtrl) {
          // Prevent default so the typed 'i' doesn't leak into inputs
          e.preventDefault();
          e.stopPropagation();
          const rowData = state.filteredData[state.selectedCell.rowIndex];
          const columnKey = state.selectedCell.columnKey;
          
          if (rowData) {
            // Check if current cell contains a foreign key reference
            let referenceNavigated = false;
            
            // Handle SEM foreign key references
            if (columnKey.includes('sem_id') && options.onNavigateToReference) {
              const semId = rowData[columnKey];
              if (semId && typeof semId === 'number') {
                options.onNavigateToReference('sem', semId);
                referenceNavigated = true;
              }
            }
            
            // Handle Catalog foreign key references
            if (columnKey.includes('catalog_id') && options.onNavigateToReference) {
              const catalogId = rowData[columnKey];
              if (catalogId && typeof catalogId === 'number') {
                options.onNavigateToReference('catalog', catalogId);
                referenceNavigated = true;
              }
            }
            
            // If no foreign key reference was found, use default behavior
            if (!referenceNavigated) {
              if (options.onOpenDetails) {
                options.onOpenDetails(state.selectedCell.rowIndex, state.selectedCell.columnKey);
              } else {
                options.onInspect?.(state.selectedCell.rowIndex, state.selectedCell.columnKey);
              }
            }
          }
        }
        break;


      case ' ':
        if (isCtrl && !isRepeating) {
          // Ctrl+Space: Select entire column (no-op for ahora)
          if (state.selectedCell) {
            e.preventDefault();
            e.stopPropagation();
          }
        } else if (isShift && !isRepeating) {
          // Shift+Space: Select entire row
          if (state.selectedCell) {
            e.preventDefault();
            e.stopPropagation();
            const rowData = state.filteredData[state.selectedCell.rowIndex];
            if (rowData) {
              const rowId = rowData.id ?? state.selectedCell.rowIndex;
              actions.toggleRowSelection(rowId);
            }
          }
        }
        break;

      case 's':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          e.preventDefault();
          e.stopPropagation();
          options.onNavigateSem?.();
        }
        break;
      case 'c':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          e.preventDefault();
          e.stopPropagation();
          options.onNavigateCatalog?.();
        }
        break;
      case 'v':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          e.preventDefault();
          e.stopPropagation();
          options.onNavigateExvotos?.();
        }
        break;
      case 'd':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          e.preventDefault();
          e.stopPropagation();
          options.onNavigateDivinities?.();
        }
        break;
      case 'p':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          e.preventDefault();
          e.stopPropagation();
          options.onNavigateCharacters?.();
        }
        break;
      case 'm':
        if (!isRepeating && !isCtrl && !options.blockNavigation) {
          e.preventDefault();
          e.stopPropagation();
          options.onNavigateMiracles?.();
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
              // Copy cell value
              if (state.selectedCell) {
                const rowData = state.filteredData[state.selectedCell.rowIndex];
                if (rowData) {
                  const value = rowData[state.selectedCell.columnKey];
                  // Copy the actual value (ID for foreignKey, not the display text)
                  options.onCopyCellValue?.(state.selectedCell.rowIndex, state.selectedCell.columnKey, value);
                  // Legacy onCopy for backwards compatibility
                  const content = String(value || '');
                  options.onCopy?.(content);
                }
              }
              break;

            case 'v':
              // Paste cell value
              if (state.selectedCell && options.onPasteCellValue) {
                options.onPasteCellValue(state.selectedCell.rowIndex, state.selectedCell.columnKey);
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
