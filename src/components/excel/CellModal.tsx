import React, { useEffect, useCallback, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { ColumnDef } from '../DataTable';

interface CellModalProps {
  isOpen: boolean;
  content: string;
  title: string;
  rowIndex: number;
  columnKey: string;
  onClose: () => void;
  className?: string;
  // New props for editing
  editMode?: boolean;
  column?: ColumnDef<any>;
  onSave?: (newValue: any) => Promise<void>;
  initialValue?: any;
}

export const CellModal: React.FC<CellModalProps> = ({
  isOpen,
  content,
  title,
  rowIndex,
  columnKey,
  onClose,
  className = '',
  editMode = false,
  column,
  onSave,
  initialValue
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Auto-focus but don't select content when modal opens (readonly modal)
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Don't select text in readonly modal - just focus
    }
  }, [isOpen]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  // Handle click outside to close
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && e.target === modalRef.current) {
      onClose();
    }
  }, [onClose]);

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      // Fallback for older browsers
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand('copy');
      }
    }
  }, [content]);

  if (!isOpen) return null;

  const isLongContent = content.length > 100;
  const hasLineBreaks = content.includes('\n');
  const estimatedLines = Math.max(3, Math.min(15, content.split('\n').length));

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-xl",
        "w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col",
        "border border-gray-200 dark:border-gray-700",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-blue-600 dark:text-blue-400"
              >
                <path 
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <polyline 
                  points="14,2 14,8 20,8" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <line 
                  x1="16" 
                  y1="13" 
                  x2="8" 
                  y2="13" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <line 
                  x1="16" 
                  y1="17" 
                  x2="8" 
                  y2="17" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fila {rowIndex + 1} • Columna {columnKey}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
                "transition-colors"
              )}
              title="Copiar contenido (Ctrl+C)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect 
                  x="9" 
                  y="9" 
                  width="13" 
                  height="13" 
                  rx="2" 
                  ry="2" 
                  stroke="currentColor" 
                  strokeWidth="2"
                />
                <path 
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" 
                  stroke="currentColor" 
                  strokeWidth="2"
                />
              </svg>
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
                "transition-colors"
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
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Content info */}
            <div className="flex items-center justify-between mb-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>{content.length} caracteres</span>
                {hasLineBreaks && (
                  <span>{content.split('\n').length} líneas</span>
                )}
                {isLongContent && (
                  <span className="text-amber-600 dark:text-amber-400">
                    Contenido largo
                  </span>
                )}
              </div>
              
              <div className="text-xs">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  ESC
                </kbd>
                <span className="ml-1">para cerrar</span>
              </div>
            </div>
            
            {/* Text area */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                readOnly
                className={cn(
                  "w-full h-full p-3 border border-gray-300 dark:border-gray-600 rounded-md",
                  "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100",
                  "font-mono text-sm leading-relaxed resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                )}
                style={{
                  minHeight: `${estimatedLines * 1.5}rem`
                }}
                spellCheck={false}
              />
              
              {/* Character limit indicator */}
              {content.length > 1000 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded">
                  Texto extenso
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Contenido de solo lectura</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  Ctrl+C
                </kbd>
                Copiar
              </span>
              
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 bg-blue-600 hover:bg-blue-700",
                  "text-white font-medium rounded-md",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CellModal;
