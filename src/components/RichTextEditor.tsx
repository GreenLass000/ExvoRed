import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  rows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  className = '',
  id,
  name,
  disabled = false,
  rows = 4
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Inicializar contenido
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      let handled = false;
      switch (key) {
        case 's':
          execCommand('strikeThrough');
          handled = true;
          break;
        case 'b':
          execCommand('bold');
          handled = true;
          break;
        case 'i':
          execCommand('italic');
          handled = true;
          break;
        case 'u':
          execCommand('underline');
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        handleInput();
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const ToolbarButton = ({
    onClick,
    title,
    children,
    active = false
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "p-2 rounded hover:bg-slate-200 transition-colors border border-transparent",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        active && "bg-slate-200 border-slate-400"
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("border border-slate-300 rounded-md bg-white", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 bg-slate-50">
        {/* Negrita */}
        <ToolbarButton onClick={() => execCommand('bold')} title="Negrita (Ctrl+B)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </ToolbarButton>

        {/* Cursiva */}
        <ToolbarButton onClick={() => execCommand('italic')} title="Cursiva (Ctrl+I)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </ToolbarButton>

        {/* Subrayado */}
        <ToolbarButton onClick={() => execCommand('underline')} title="Subrayado (Ctrl+U)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </ToolbarButton>

        {/* Tachado */}
        <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Tachado (Ctrl+S)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4H9a3 3 0 0 0-2.83 4" />
            <path d="M14 12a4 4 0 0 1 0 8H6" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Subíndice */}
        <ToolbarButton onClick={() => execCommand('subscript')} title="Subíndice">
          <span className="text-sm font-semibold">
            X<sub className="text-xs">2</sub>
          </span>
        </ToolbarButton>

        {/* Superíndice */}
        <ToolbarButton onClick={() => execCommand('superscript')} title="Superíndice">
          <span className="text-sm font-semibold">
            X<sup className="text-xs">2</sup>
          </span>
        </ToolbarButton>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Tamaño de fuente */}
        <select
          onChange={(e) => {
            execCommand('fontSize', e.target.value);
            e.target.value = '3'; // Reset to default
          }}
          className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Tamaño de texto"
          disabled={disabled}
          defaultValue="3"
        >
          <option value="3">Normal</option>
          <option value="1">Muy pequeño</option>
          <option value="2">Pequeño</option>
          <option value="4">Grande</option>
          <option value="5">Muy grande</option>
          <option value="6">Enorme</option>
        </select>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Limpiar formato */}
        <ToolbarButton
          onClick={() => execCommand('removeFormat')}
          title="Limpiar formato"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3" />
            <path d="M5 20h6" />
            <path d="M13 4L8 20" />
            <line x1="18" y1="18" x2="21" y2="21" />
            <line x1="21" y1="18" x2="18" y2="21" />
          </svg>
        </ToolbarButton>

        {/* Deshacer */}
        <ToolbarButton onClick={() => execCommand('undo')} title="Deshacer (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </ToolbarButton>

        {/* Rehacer */}
        <ToolbarButton onClick={() => execCommand('redo')} title="Rehacer (Ctrl+Y)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "p-3 min-h-[100px] outline-none overflow-y-auto",
          "prose prose-sm max-w-none",
          "focus:ring-2 focus:ring-blue-500 focus:ring-inset",
          disabled && "bg-slate-50 cursor-not-allowed text-slate-500"
        )}
        style={{
          minHeight: `${rows * 1.5}rem`,
          maxHeight: '400px'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Placeholder cuando está vacío */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
      `}</style>

      {/* Hidden input para formularios */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
      />
    </div>
  );
};

export default RichTextEditor;
