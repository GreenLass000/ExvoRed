
import React, { useState, useEffect, useRef } from 'react';
import { TrashIcon, EyeIcon, EditIcon } from './icons';
import type { Sem } from '../types';

export type ColumnDef<T> = {
    key: keyof T | 'actions';
    header: string;
    type?: 'text' | 'date' | 'number' | 'foreignKey' | 'clickable';
    foreignKeyData?: Sem[];
    getDisplayValue?: (row: T) => React.ReactNode;
    onCellClick?: (row: T) => void;
};

interface DataTableProps<T extends { id: number }> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowUpdate: (id: number, data: Partial<T>) => Promise<any>;
    onRowDelete: (id: number) => Promise<any>;
    onRowView?: (id: number) => void;
    onRowEdit?: (id: number) => void;
}

export function DataTable<T extends { id: number }>({ data, columns, onRowUpdate, onRowDelete, onRowView, onRowEdit }: DataTableProps<T>) {
    const [editingCell, setEditingCell] = useState<{ rowId: number; columnKey: string } | null>(null);
    const [editValue, setEditValue] = useState<any>('');
    const [status, setStatus] = useState<{ rowId: number, message: string, type: 'info' | 'error' } | null>(null);
    const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    const handleCellDoubleClick = (row: T, columnKey: string) => {
        setEditingCell({ rowId: row.id, columnKey });
        setEditValue(row[columnKey as keyof T] ?? '');
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditValue(e.target.value);
    };

    const saveChanges = async () => {
        if (!editingCell) return;
        
        const { rowId, columnKey } = editingCell;
        const originalRow = data.find(d => d.id === rowId);
        if (!originalRow) return;

        const originalValue = originalRow[columnKey as keyof T];
        let finalValue: any = editValue;
        
        const columnDef = columns.find(c => c.key === columnKey);
        if(columnDef?.type === 'number' || columnDef?.type === 'foreignKey') {
            finalValue = editValue === '' || editValue === null ? null : Number(editValue);
        }

        if (finalValue !== originalValue) {
            setStatus({ rowId, message: 'Saving...', type: 'info' });
            try {
                await onRowUpdate(rowId, { [columnKey]: finalValue } as Partial<T>);
                setStatus({ rowId, message: 'Saved!', type: 'info' });
            } catch (error) {
                setStatus({ rowId, message: 'Error saving', type: 'error' });
                console.error("Failed to update row:", error);
            }
        }
        
        setEditingCell(null);
        setTimeout(() => setStatus(null), 2000);
    };
    
    const handleInputBlur = () => {
        saveChanges();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveChanges();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const renderCell = (row: T, column: ColumnDef<T>) => {
        const columnKey = column.key as string;
        const isEditing = editingCell?.rowId === row.id && editingCell?.columnKey === columnKey;
        
        if (isEditing) {
            if (column.type === 'foreignKey' && column.foreignKeyData) {
                return (
                    <select
                        ref={inputRef as React.Ref<HTMLSelectElement>}
                        value={editValue ?? ''}
                        onChange={handleEditChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className="w-full h-full p-2 bg-white border-2 border-blue-500 rounded-md focus:outline-none"
                    >
                        <option value="">-- Sin asignar --</option>
                        {column.foreignKeyData.map(fk => (
                             <option key={fk.id} value={fk.id}>{fk.name}</option>
                        ))}
                    </select>
                );
            }

            return (
                <input
                    ref={inputRef as React.Ref<HTMLInputElement>}
                    type={column.type === 'date' ? 'date' : 'text'}
                    value={column.type === 'date' && editValue ? (editValue as string).split('T')[0] : editValue ?? ''}
                    onChange={handleEditChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-full p-2 bg-white border-2 border-blue-500 rounded-md focus:outline-none"
                />
            );
        }

        if (column.getDisplayValue) {
            const displayValue = column.getDisplayValue(row);
            
            if (displayValue === null || displayValue === undefined) {
                return <span className="text-slate-400">N/A</span>;
            }
            
            // Si es un elemento React, lo renderizamos directamente
            if (React.isValidElement(displayValue)) {
                return displayValue;
            }
            
            // Si es clickable, lo envolvemos en un botón
            if (column.type === 'clickable' && column.onCellClick) {
                const isInvalid = displayValue && typeof displayValue === 'string' && displayValue.includes('ID inválido');
                
                if (isInvalid) {
                    return <span className="text-red-500 text-xs">{displayValue}</span>;
                }
                
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            column.onCellClick!(row);
                        }}
                        className="text-slate-900 hover:text-blue-600 hover:bg-blue-50 cursor-pointer px-2 py-1 rounded transition-colors"
                    >
                        {displayValue}
                    </button>
                );
            }
            
            return displayValue;
        }

        const cellValue = row[columnKey as keyof T];

        if (cellValue === null || cellValue === undefined) {
            return <span className="text-slate-400">N/A</span>;
        }

        if (cellValue instanceof Date) {
            return cellValue.toLocaleDateString();
        }

        const displayValue = cellValue.toString();
        
        if (column.type === 'clickable' && column.onCellClick) {
            const isInvalid = displayValue && typeof displayValue === 'string' && displayValue.includes('ID inválido');
            
            if (isInvalid) {
                return <span className="text-red-500 text-xs">{displayValue}</span>;
            }
            
            return (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        column.onCellClick!(row);
                    }}
                    className="text-slate-900 hover:text-blue-600 hover:bg-blue-50 cursor-pointer px-2 py-1 rounded transition-colors"
                >
                    {displayValue}
                </button>
            );
        }

        return displayValue;
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-sm divide-y divide-slate-200">
                <thead className="bg-slate-100">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key as string} className="px-4 py-3 font-semibold text-left text-slate-600 sticky top-0 bg-slate-100 z-10">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {data.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50">
                            {columns.map(col => (
                                <td 
                                    key={`${row.id}-${col.key as string}`}
                                    className="px-4 py-1 h-12 whitespace-nowrap relative"
                                    onDoubleClick={() => col.key !== 'actions' && col.type !== 'clickable' && handleCellDoubleClick(row, col.key as string)}
                                >
                                    {col.key === 'actions' ? (
                                        <div className="flex items-center space-x-2">
                                            {onRowView && (
                                                 <button 
                                                    onClick={() => onRowView(row.id)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Ver detalles"
                                                >
                                                    <EyeIcon />
                                                </button>
                                            )}
                                            {onRowEdit && (
                                                 <button 
                                                    onClick={() => onRowEdit(row.id)}
                                                    className="p-1 text-slate-400 hover:text-green-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Editar"
                                                >
                                                    <EditIcon />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    if (confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
                                                        onRowDelete(row.id);
                                                    }
                                                }}
                                                className="p-1 text-slate-400 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete row"
                                            >
                                                <TrashIcon />
                                            </button>
                                            {status && status.rowId === row.id && (
                                                 <span className={`text-xs ${status.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>{status.message}</span>
                                            )}
                                        </div>
                                    ) : (
                                        renderCell(row, col)
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}