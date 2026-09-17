import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Exvoto, Sem } from '../types';
import * as api from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import { isEditableTarget } from '../utils/keyboard';

const SemDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isTemporaryRecord = searchParams.get('new') === '1';
    const returnTo = searchParams.get('returnTo') || '/sems';
    const [sem, setSem] = useState<Sem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Sem | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSem = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const foundSem = await api.getSemById(parseInt(id, 10));
                setSem(foundSem);
            } catch (error) {
                console.error('Error fetching SEM:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSem();
    }, [id]);

    const handleStartEdit = useCallback(() => {
        if (sem) {
            setEditData({ ...sem });
            setIsEditing(true);
        }
    }, [sem]);

    useEffect(() => {
        if ((!isTemporaryRecord && searchParams.get('edit') !== '1') || !sem || isEditing) return;
        setEditData({ ...sem });
        setIsEditing(true);
        if (!isTemporaryRecord) setSearchParams({}, { replace: true });
    }, [isEditing, isTemporaryRecord, searchParams, sem, setSearchParams]);

    const handleCreateExvoto = async () => {
        if (!sem) return;
        try {
            const created = await api.createExvoto({ conservation_sem_id: sem.id } as Omit<Exvoto, 'id'>);
            navigate(`/exvoto/${created.id}?new=1&returnTo=${encodeURIComponent(`/sem/${sem.id}`)}`);
        } catch (error) {
            console.error('Error creando exvoto desde el SEM:', error);
            alert('No se pudo crear el exvoto');
        }
    };

    const handleCancel = async () => {
        if (isTemporaryRecord && sem) {
            try {
                await api.deleteSem(sem.id);
                navigate(returnTo, { replace: true });
            } catch (err) {
                console.error('Error descartando SEM temporal:', err);
                alert('No se pudo descartar el SEM temporal');
            }
            return;
        }
        setIsEditing(false);
        setEditData(null);
    };

    const handleSave = async () => {
        if (!sem || !editData) return;
        setSaving(true);
        try {
            const updated = await api.updateSem(sem.id, editData);
            setSem(updated);
            setIsEditing(false);
            setEditData(null);
            if (isTemporaryRecord) setSearchParams({}, { replace: true });
        } catch (err) {
            console.error('Error guardando SEM:', err);
            alert('No se pudo guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!sem || !window.confirm('¿Eliminar este SEM? Esta acción no se puede deshacer.')) return;

        try {
            await api.deleteSem(sem.id);
            navigate('/sems');
        } catch (err) {
            console.error('Error eliminando SEM:', err);
            alert('No se pudo eliminar el SEM');
        }
    };

    const setField = (key: keyof Sem, value: string | number | null) => {
        setEditData(prev => prev ? { ...prev, [key]: value } : prev);
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditableTarget(e.target)) return;
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

    if (loading) return <div className="text-center p-8">Cargando detalles del SEM...</div>;

    if (!sem) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">SEM no encontrado</h2>
                <button onClick={() => navigate('/sems')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Volver a SEMs
                </button>
            </div>
        );
    }

    const renderField = (label: string, key: keyof Sem, value: string | number | null | undefined) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {isEditing && editData ? (
                <input
                    type={typeof value === 'number' ? 'number' : 'text'}
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

    const renderTextArea = (label: string, key: keyof Sem, value: string | null | undefined) => (
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

    const data = isEditing && editData ? editData : sem;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-700">Detalles del SEM</h1>
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
                            <button onClick={handleStartEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Editar
                            </button>
                            <button
                                onClick={handleCreateExvoto}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                + Nuevo Exvoto
                            </button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Eliminar
                            </button>
                            <button onClick={() => navigate('/sems')} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                                ← Volver a SEMs
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{data.name || '—'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {renderField('ID', 'id', sem.id)}
                    {renderField('Última modificación', 'updated_at', sem.updated_at)}
                    {renderField('Nombre', 'name', data.name)}
                    {renderField('Región', 'region', data.region)}
                    {renderField('Provincia', 'province', data.province)}
                    {renderField('Población', 'town', data.town)}
                    {renderField('Divinidad Asociada', 'associated_divinity', data.associated_divinity)}
                    {renderField('Festividad', 'festivity', data.festivity)}
                    {renderField('Contacto', 'contact', data.contact)}
                    {renderField('Número de Exvotos Pictóricos', 'pictorial_exvoto_count', data.pictorial_exvoto_count)}
                    {renderField('Número Total de Exvotos', 'numero_exvotos', data.numero_exvotos)}
                    {renderField('Fecha del Exvoto Más Antiguo', 'oldest_exvoto_date', data.oldest_exvoto_date)}
                    {renderField('Fecha del Exvoto Más Reciente', 'newest_exvoto_date', data.newest_exvoto_date)}
                </div>

                <div className="space-y-6">
                    {renderTextArea('Info exvotos', 'other_exvotos', data.other_exvotos)}
                    {renderTextArea('Comentarios', 'comments', data.comments)}
                    {renderTextArea('Referencias', 'references', data.references)}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Información Estadística</h3>
                    <p className="text-xs text-blue-700">
                        Los datos estadísticos (número de exvotos, fechas más antigua y reciente) se calculan automáticamente
                        a partir de todos los exvotos que tienen este SEM como lugar de ofrenda o de conservación.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SemDetailPage;
