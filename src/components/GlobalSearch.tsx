import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import type { SearchResult } from '../services/api';

const TABLE_LABELS: Record<string, string> = {
    exvoto: 'Exvotos',
    sem: 'SEMs',
    catalog: 'Catálogos',
    divinity: 'Divinidades',
    character: 'Personajes',
    miracle: 'Milagros',
};

const TABLE_ROUTES: Record<string, (id: number) => string> = {
    exvoto: (id) => `/exvoto/${id}`,
    sem: (id) => `/sem/${id}`,
    catalog: (id) => `/catalog/${id}`,
    divinity: (id) => `/divinity/${id}`,
    character: (id) => `/characters`,
    miracle: (id) => `/miracles`,
};

const GlobalSearch: React.FC = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        setLoading(true);
        try {
            const data = await api.globalSearch(q);
            setResults(data);
            setIsOpen(true);
        } catch (err) {
            console.error('Search error:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, search]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelect = (result: SearchResult) => {
        const route = TABLE_ROUTES[result.table]?.(result.id);
        if (route) navigate(route);
        setQuery('');
        setIsOpen(false);
    };

    // Group results by table
    const grouped = results.reduce((acc, r) => {
        if (!acc[r.table]) acc[r.table] = [];
        acc[r.table].push(r);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div ref={containerRef} className="relative w-full max-w-sm">
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    placeholder="Buscar en todo…"
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white placeholder-slate-400"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                    {Object.entries(grouped).map(([table, items]) => (
                        <div key={table}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 sticky top-0">
                                {TABLE_LABELS[table] || table} ({items.length})
                            </div>
                            {items.map((result, idx) => (
                                <button
                                    key={`${table}-${result.id}-${idx}`}
                                    type="button"
                                    onClick={() => handleSelect(result)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <div className="text-sm text-slate-800 font-medium truncate">{result.displayText}</div>
                                    {result.matchedColumn && (
                                        <div className="text-xs text-slate-400 truncate">
                                            {result.matchedColumn}: <span className="text-slate-600">{result.matchedValue}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-slate-200 z-50 px-4 py-3 text-sm text-slate-400">
                    Sin resultados para "{query}"
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
