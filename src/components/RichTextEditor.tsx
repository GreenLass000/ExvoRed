import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import * as api from '../services/api';
import type { SearchResult } from '../services/api';

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

const LINK_TABLE_LABELS: Record<string, string> = {
  exvoto: 'Exvotos',
  sem: 'SEMs',
  catalog: 'Catálogos',
  divinity: 'Divinidades',
  character: 'Personajes',
  miracle: 'Milagros',
};

const LINK_ROUTES: Record<string, (id: number) => string> = {
  exvoto: (id) => `/exvoto/${id}`,
  sem: (id) => `/sem/${id}`,
  catalog: (id) => `/catalog/${id}`,
  divinity: (id) => `/divinity/${id}`,
  character: () => '/characters',
  miracle: () => '/miracles',
};

const normalizeLinkHref = (rawHref: string): string | null => {
  const href = rawHref.trim();
  if (!href || /^javascript:|^data:/i.test(href)) return null;
  if (href.startsWith('/') || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return null;
  return `https://${href}`;
};

interface LinkDialogProps {
  isOpen: boolean;
  linkText: string;
  linkHref: string;
  errorMessage: string;
  onLinkTextChange: (value: string) => void;
  onLinkHrefChange: (value: string) => void;
  onSelectResult: (result: SearchResult) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const LinkDialog: React.FC<LinkDialogProps> = ({
  isOpen,
  linkText,
  linkHref,
  errorMessage,
  onLinkTextChange,
  onLinkHrefChange,
  onSelectResult,
  onClose,
  onSubmit,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResults([]);
    setIsSearching(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await api.globalSearch(query);
        if (active) setResults(found);
      } catch (error) {
        console.error('Error buscando destino del enlace:', error);
        if (active) setResults([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="link-dialog-title" className="text-base font-semibold text-slate-800">Insertar hipervínculo</h3>
            <p className="mt-0.5 text-xs text-slate-500">Busca un registro o indica una ruta manual.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block text-sm font-medium text-slate-700">
            Texto del enlace
            <input
              ref={inputRef}
              value={linkText}
              onChange={(event) => onLinkTextChange(event.target.value)}
              placeholder="Ej.: Exvoto de 1874"
              className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Ruta o URL
            <input
              value={linkHref}
              onChange={(event) => onLinkHrefChange(event.target.value)}
              placeholder="/exvoto/42 o https://ejemplo.org"
              className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            {errorMessage && <p className="mt-1.5 text-xs text-red-600">{errorMessage}</p>}
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="link-record-search">Buscar un registro</label>
            <div className="relative mt-1.5">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
              <input
                id="link-record-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Exvoto, SEM, catálogo, divinidad…"
                className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-8 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {isSearching && <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
            </div>

            {results.length > 0 && (
              <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-slate-200">
                {results.map((result, index) => (
                  <button
                    key={`${result.table}-${result.id}-${index}`}
                    type="button"
                    onClick={() => onSelectResult(result)}
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-blue-50"
                  >
                    <span className="block text-sm font-medium text-slate-800">{result.displayText}</span>
                    <span className="block text-xs text-slate-500">{LINK_TABLE_LABELS[result.table] ?? result.table} · {result.matchedColumn || `#${result.id}`}</span>
                  </button>
                ))}
              </div>
            )}
            {query.trim().length >= 2 && !isSearching && results.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">No se han encontrado registros.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-200">Cancelar</button>
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Insertar enlace</button>
        </div>
      </form>
    </div>
  );
};

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
  const lastEmittedValueRef = useRef<string | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkHref, setLinkHref] = useState('');
  const [linkError, setLinkError] = useState('');

  // Sincroniza únicamente cambios externos. Reemplazar innerHTML mientras se escribe
  // destruye la selección y mueve el cursor.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || (value === lastEmittedValueRef.current && editor.innerHTML === value)) return;

    if (document.activeElement === editor) return;

    if (editor.innerHTML !== value) editor.innerHTML = value || '';
    lastEmittedValueRef.current = value;
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      const nextValue = editorRef.current.innerHTML;
      lastEmittedValueRef.current = nextValue;
      onChange(nextValue);
    }
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || !selectionRef.current) return;

    editor.focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const openLinkDialog = () => {
    saveSelection();
    setLinkText(selectionRef.current?.toString() || '');
    setLinkHref('');
    setLinkError('');
    setIsLinkDialogOpen(true);
  };

  const closeLinkDialog = () => {
    setIsLinkDialogOpen(false);
    setLinkError('');
    setTimeout(restoreSelection, 0);
  };

  const selectLinkDestination = (result: SearchResult) => {
    const route = LINK_ROUTES[result.table]?.(result.id);
    if (!route) return;
    setLinkText(result.displayText);
    setLinkHref(route);
    setLinkError('');
  };

  const insertLink = () => {
    const href = normalizeLinkHref(linkHref);
    const text = linkText.trim();
    const editor = editorRef.current;
    if (!href || !text || !editor) {
      setLinkError('Indica un texto y una ruta o URL válida.');
      return;
    }

    restoreSelection();
    const selection = window.getSelection();
    let range: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      const candidate = selection.getRangeAt(0);
      if (editor.contains(candidate.commonAncestorContainer)) range = candidate;
    }
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    link.style.color = '#2563eb';
    link.style.textDecoration = 'underline';
    if (!href.startsWith('/') && !href.startsWith('#')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    range.deleteContents();
    range.insertNode(link);
    range.setStartAfter(link);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    selectionRef.current = range.cloneRange();
    handleInput();
    setIsLinkDialogOpen(false);
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
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    restoreSelection();

    // Un carácter no puede ser a la vez subíndice y superíndice.
    // Desactivamos el formato opuesto antes de aplicar el solicitado.
    if (command === 'subscript' && document.queryCommandState('superscript')) {
      document.execCommand('superscript', false);
    }
    if (command === 'superscript' && document.queryCommandState('subscript')) {
      document.execCommand('subscript', false);
    }

    document.execCommand(command, false, value);
    saveSelection();
    handleInput();
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
      onMouseDown={(e) => {
        // El mousedown ocurre antes del click: impedir que el botón robe el foco
        // conserva la selección de texto sobre la que se aplica el formato.
        e.preventDefault();
      }}
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

        <ToolbarButton onClick={openLinkDialog} title="Insertar hipervínculo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
            <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" />
          </svg>
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
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onSelect={saveSelection}
        onClick={(event) => {
          const link = (event.target as HTMLElement).closest('a');
          if (link && !event.ctrlKey && !event.metaKey) event.preventDefault();
        }}
        onFocus={() => {
          saveSelection();
          setIsFocused(true);
        }}
        onBlur={() => {
          saveSelection();
          setIsFocused(false);
        }}
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

      <LinkDialog
        isOpen={isLinkDialogOpen}
        linkText={linkText}
        linkHref={linkHref}
        errorMessage={linkError}
        onLinkTextChange={setLinkText}
        onLinkHrefChange={(href) => {
          setLinkHref(href);
          setLinkError('');
        }}
        onSelectResult={selectLinkDestination}
        onClose={closeLinkDialog}
        onSubmit={insertLink}
      />

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
