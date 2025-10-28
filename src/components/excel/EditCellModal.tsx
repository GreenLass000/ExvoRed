import React, { useEffect, useCallback, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ColumnDef } from '../DataTable';
import RichTextEditor from '../RichTextEditor';

interface EditCellModalProps {
  isOpen: boolean;
  title: string;
  rowIndex: number;
  columnKey: string;
  initialValue: any;
  column?: ColumnDef<any>;
  onClose: () => void;
  onSave: (newValue: any) => Promise<void>;
  className?: string;
}

export const EditCellModal: React.FC<EditCellModalProps> = ({
  isOpen,
  title,
  rowIndex,
  columnKey,
  initialValue,
  column,
  onClose,
  onSave,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  
  // State for editing
  const [editValue, setEditValue] = useState<any>(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update edit value when initial value changes
  useEffect(() => {
    setEditValue(initialValue ?? '');
  }, [initialValue]);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !saving) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [onClose, saving]);

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, [isOpen]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  // Removed: No longer closing on backdrop click

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    setErrorMessage(''); // Clear error on new input
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    
    setSaving(true);
    setErrorMessage('');
    
    try {
      let finalValue: any = editValue;
      
      // Type conversion
      if (column?.type === 'number' || column?.type === 'foreignKey') {
        finalValue = editValue === '' || editValue === null ? null : Number(editValue);
      }
      
      await onSave(finalValue);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      setErrorMessage('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  }, [editValue, column, onSave, onClose, saving]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave, saving]);

  if (!isOpen) return null;

  // Usar RichTextEditor para campos de tipo 'truncated' (transcripciones, comentarios largos, etc.) o textos largos
  const shouldUseRichTextEditor =
    column?.type === 'truncated' ||
    (typeof editValue === 'string' && (editValue.length > 100 || editValue.includes('\n')));

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-xl",
        "w-[90vw] h-[90vh] flex flex-col",
        "border border-gray-200 dark:border-gray-700",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-green-600 dark:text-green-400"
              >
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Editar {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fila {rowIndex + 1} • Columna {columnKey}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className={cn(
              "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700",
              "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
              "transition-colors disabled:opacity-50"
            )}
            title="Cerrar (ESC)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex flex-col gap-4">
            {/* Field type indicator */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                {column?.type === 'foreignKey' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                    Selección
                  </span>
                )}
                {column?.type === 'date' && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium">
                    Fecha
                  </span>
                )}
                {(column?.type === 'text' || !column?.type) && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-medium">
                    Texto
                  </span>
                )}
                {column?.type === 'number' && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs font-medium">
                    Número
                  </span>
                )}
              </div>

              <div className="text-xs">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  Enter
                </kbd>
                <span className="ml-1">para guardar</span>
              </div>
            </div>

            {/* Input field */}
            <div className="flex-1">
              {column?.type === 'foreignKey' && column.foreignKeyData ? (
                <select
                  ref={inputRef as React.Ref<HTMLSelectElement>}
                  value={editValue ?? ''}
                  onChange={handleEditChange}
                  onKeyDown={handleInputKeyDown}
                  disabled={saving}
                  className={cn(
                    "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md",
                    "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                    "text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <option value="">-- Sin asignar --</option>
                  {column.foreignKeyData.map(fk => (
                    <option key={fk.id} value={fk.id}>{fk.name || `SEM #${fk.id}`}</option>
                  ))}
                </select>
              ) : shouldUseRichTextEditor ? (
                <RichTextEditor
                  value={String(editValue ?? '')}
                  onChange={(newValue) => setEditValue(newValue)}
                  disabled={saving}
                  rows={8}
                  placeholder="Escribe aquí..."
                />
              ) : (
                <input
                  ref={inputRef as React.Ref<HTMLInputElement>}
                  type={column?.type === 'date' ? 'date' : column?.type === 'number' ? 'number' : 'text'}
                  value={column?.type === 'date' && editValue ? (editValue as string).split('T')[0] : editValue ?? ''}
                  onChange={handleEditChange}
                  onKeyDown={handleInputKeyDown}
                  disabled={saving}
                  className={cn(
                    "w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md",
                    "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                    "text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                />
              )}
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="text-sm font-medium">{errorMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>Modo edición</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className={cn(
                  "px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
                  "text-gray-800 dark:text-gray-200 font-medium rounded-md",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "px-4 py-2 bg-green-600 hover:bg-green-700",
                  "text-white font-medium rounded-md",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-green-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {saving && (
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCellModal;
