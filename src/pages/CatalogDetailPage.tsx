import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Catalog, Sem, CatalogSem } from '../types';
import * as api from '../services/api';
import RichTextEditor from '../components/RichTextEditor';

const CatalogDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [allSems, setAllSems] = useState<Sem[]>([]);
    const [linkedSems, setLinkedSems] = useState<Sem[]>([]);
    const [selectedSemId, setSelectedSemId] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Catalog | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchCatalog = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const catalogId = parseInt(id);
                const [foundCatalog, semsData, catalogSems] = await Promise.all([
                    api.getCatalogById(catalogId),
                    api.getAllSems(),
                    api.getCatalogSemsByCatalogId(catalogId),
                ]);
                setCatalog(foundCatalog);
                setAllSems(semsData);
                const linkedIds = new Set(catalogSems.map((cs: CatalogSem) => cs.sem_id));
                setLinkedSems(semsData.filter(s => linkedIds.has(s.id)));
            } catch (error) {
                console.error('Error fetching catalog:', error);
                setCatalog(null);
            } finally {
                setLoading(false);
            }
        };
        fetchCatalog();
    }, [id]);

    const handleStartEdit = useCallback(() => {
        if (catalog) {
            setEditData({ ...catalog });
            setIsEditing(true);
        }
    }, [catalog]);

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleSave = async () => {
        if (!catalog || !editData) return;
        setSaving(true);
        try {
            const updated = await api.updateCatalog(catalog.id, editData);
            setCatalog(updated);
            setIsEditing(false);
            setEditData(null);
        } catch (err) {
            console.error('Error guardando catálogo:', err);
            alert('No se pudo guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const setField = (key: keyof Catalog, value: string | number | null) => {
        setEditData(prev => prev ? { ...prev, [key]: value } : prev);
    };

    const handleLinkSem = async () => {
        if (!catalog || !selectedSemId) return;
        try {
            await api.createCatalogSem(catalog.id, Number(selectedSemId));
            const sem = allSems.find(s => s.id === Number(selectedSemId));
            if (sem) setLinkedSems(prev => [...prev, sem]);
            setSelectedSemId('');
        } catch (err) {
            console.error('Error vinculando SEM:', err);
            alert('No se pudo vincular el SEM');
        }
    };

    const handleUnlinkSem = async (semId: number) => {
        if (!catalog) return;
        try {
            await api.deleteCatalogSem(catalog.id, semId);
            setLinkedSems(prev => prev.filter(s => s.id !== semId));
        } catch (err) {
            console.error('Error desvinculando SEM:', err);
            alert('No se pudo desvincular el SEM');
        }
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputField = target && (
                target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' || target.contentEditable === 'true' ||
                target.getAttribute('role') === 'textbox'
            );
            if (isInputField) return;
            if (e.shiftKey && e.key === 'E') { e.preventDefault(); handleStartEdit(); return; }
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            switch (e.key.toLowerCase()) {
                case 's': e.preventDefault(); navigate('/sems'); break;
                case 'c': e.preventDefault(); navigate('/catalog'); break;
                case 'v': e.preventDefault(); navigate('/exvotos'); break;
                case 'd': e.preventDefault(); navigate('/divinities'); break;
                case 'p': e.preventDefault(); navigate('/characters'); break;
                case 'm': e.preventDefault(); navigate('/miracles'); break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleStartEdit, navigate]);

    if (loading) return <div className="text-center p-8">Cargando detalles del catálogo...</div>;

    if (!catalog) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">Catálogo no encontrado</h2>
                <button onClick={() => navigate('/catalog')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Volver a Catálogos
                </button>
            </div>
        );
    }

    const renderField = (label: string, key: keyof Catalog, value: string | number | null | undefined) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {isEditing && editData ? (
                <input
                    type={key === 'publication_year' ? 'number' : 'text'}
                    value={(editData[key] as string | number | null) ?? ''}
                    onChange={e => setField(key, e.target.value || null)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
            ) : (
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                    {value !== null && value !== undefined && value !== '' ? value : '—'}
                </div>
            )}
        </div>
    );

    const renderTextArea = (label: string, key: keyof Catalog, value: string | null | undefined) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {isEditing && editData ? (
                <RichTextEditor
                    value={(editData[key] as string | null) ?? ''}
                    onChange={v => setField(key, v || null)}
                    rows={4}
                />
            ) : (
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md min-h-[100px]">
                    {value !== null && value !== undefined && value !== '' ? (
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
                    ) : '—'}
                </div>
            )}
        </div>
    );

    const data = isEditing && editData ? editData : catalog;
    const availableSems = allSems.filter(s => !linkedSems.some(l => l.id === s.id));

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-700">Detalles del Catálogo</h1>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button onClick={handleCancel} disabled={saving} className="px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50">
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleStartEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Editar</button>
                            <button onClick={() => navigate('/catalog')} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">← Volver a Catálogos</button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">{data.title || '—'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {renderField('ID', 'id', catalog.id)}
                        {renderField('Última modificación', 'updated_at', catalog.updated_at)}
                        {renderField('Título', 'title', data.title)}
                        {renderField('Referencia', 'reference', data.reference)}
                        {renderField('Autor', 'author', data.author)}
                        {renderField('Año de Publicación', 'publication_year', data.publication_year)}
                        {renderField('Ubicación del Catálogo', 'catalog_location', data.catalog_location)}
                        {renderField('Fecha del Exvoto Más Antiguo', 'oldest_exvoto_date', data.oldest_exvoto_date)}
                        {renderField('Fecha del Exvoto Más Reciente', 'newest_exvoto_date', data.newest_exvoto_date)}
                        {renderField('Lugares Relacionados', 'related_places', data.related_places)}
                    </div>
                    <div className="space-y-6">
                        {renderTextArea('Descripción', 'location', data.location)}
                        {renderTextArea('Info exvotos', 'other_exvotos', data.other_exvotos)}
                        {renderTextArea('Comentarios', 'comments', data.comments)}
                    </div>
                </div>

                {/* Sección SEMs relacionados */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">SEMs Relacionados</h3>
                    {linkedSems.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Sin SEMs vinculados.</p>
                    ) : (
                        <ul className="flex flex-wrap gap-2 mb-4">
                            {linkedSems.map(sem => (
                                <li key={sem.id} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm text-blue-800">
                                    <span>{sem.name || `SEM #${sem.id}`}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleUnlinkSem(sem.id)}
                                        className="ml-1 text-blue-400 hover:text-red-500 font-bold leading-none"
                                        title="Desvincular"
                                    >×</button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="flex gap-2 items-center">
                        <select
                            value={selectedSemId}
                            onChange={e => setSelectedSemId(e.target.value ? Number(e.target.value) : '')}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                            <option value="">-- Seleccionar SEM --</option>
                            {availableSems.map(s => (
                                <option key={s.id} value={s.id}>{s.name || `SEM #${s.id}`}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleLinkSem}
                            disabled={!selectedSemId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >Vincular</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatalogDetailPage;
