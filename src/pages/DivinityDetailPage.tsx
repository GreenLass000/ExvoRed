import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Divinity, Sem } from '../types';
import * as api from '../services/api';
import RichTextEditor from '../components/RichTextEditor';

const DivinityDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [divinity, setDivinity] = useState<Divinity | null>(null);
    const [allSems, setAllSems] = useState<Sem[]>([]);
    const [linkedSems, setLinkedSems] = useState<Sem[]>([]);
    const [selectedSemId, setSelectedSemId] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Divinity | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchDivinity = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const divinityId = parseInt(id);
                const [foundDivinity, semsData, divinitySems] = await Promise.all([
                    api.getDivinityById(divinityId),
                    api.getAllSems(),
                    api.getDivinitySemsByDivinityId(divinityId),
                ]);
                setDivinity(foundDivinity);
                setAllSems(semsData);
                const linkedIds = new Set(divinitySems.map(ds => ds.sem_id));
                setLinkedSems(semsData.filter(s => linkedIds.has(s.id)));
            } catch (error) {
                console.error('Error fetching divinity:', error);
                setDivinity(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDivinity();
    }, [id]);

    const handleStartEdit = useCallback(() => {
        if (divinity) {
            setEditData({ ...divinity });
            setIsEditing(true);
        }
    }, [divinity]);

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleSave = async () => {
        if (!divinity || !editData) return;
        setSaving(true);
        try {
            const updated = await api.updateDivinity(divinity.id, editData);
            setDivinity(updated);
            setIsEditing(false);
            setEditData(null);
        } catch (err) {
            console.error('Error guardando divinidad:', err);
            alert('No se pudo guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const setField = (key: keyof Divinity, value: string | null) => {
        setEditData(prev => prev ? { ...prev, [key]: value } : prev);
    };

    const handleLinkSem = async () => {
        if (!divinity || !selectedSemId) return;
        try {
            await api.createDivinitySem(divinity.id, Number(selectedSemId));
            const sem = allSems.find(s => s.id === Number(selectedSemId));
            if (sem) setLinkedSems(prev => [...prev, sem]);
            setSelectedSemId('');
        } catch (err) {
            console.error('Error vinculando SEM:', err);
            alert('No se pudo vincular el SEM');
        }
    };

    const handleUnlinkSem = async (semId: number) => {
        if (!divinity) return;
        try {
            await api.deleteDivinitySem(divinity.id, semId);
            setLinkedSems(prev => prev.filter(s => s.id !== semId));
        } catch (err) {
            console.error('Error desvinculando SEM:', err);
            alert('No se pudo desvincular el SEM');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const result = ev.target?.result as string;
            setField('representation_image', result);
        };
        reader.readAsDataURL(file);
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

    if (loading) return <div className="text-center p-8">Cargando detalles de la divinidad...</div>;

    if (!divinity) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">Divinidad no encontrada</h2>
                <button onClick={() => navigate('/divinities')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Volver a Divinidades
                </button>
            </div>
        );
    }

    const renderField = (label: string, key: keyof Divinity, value: string | number | null | undefined) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {isEditing && editData ? (
                <input
                    type="text"
                    value={(editData[key] as string | null) ?? ''}
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

    const renderTextArea = (label: string, key: keyof Divinity, value: string | null | undefined) => (
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

    const data = isEditing && editData ? editData : divinity;
    const availableSems = allSems.filter(s => !linkedSems.some(l => l.id === s.id));
    const imageToShow = isEditing && editData ? editData.representation_image : divinity.representation_image;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-700">Detalles de la Divinidad</h1>
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
                            <button onClick={() => navigate('/divinities')} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">← Volver a Divinidades</button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
                {/* Datos básicos */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{data.name || '—'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {renderField('ID', 'id', divinity.id)}
                        {renderField('Última modificación', 'updated_at', divinity.updated_at)}
                        {renderField('Nombre', 'name', data.name)}
                    </div>
                    <div className="space-y-6">
                        {renderTextArea('Atributos / Especialidad', 'attributes', data.attributes)}
                        {renderTextArea('Historia', 'history', data.history)}
                        {renderTextArea('Representación', 'representation', data.representation)}
                        {renderTextArea('Comentarios', 'comments', data.comments)}
                    </div>
                </div>

                {/* Imagen de representación */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Imagen de Representación</label>
                    {imageToShow ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex gap-3 items-start">
                            <img
                                src={imageToShow}
                                alt={`Representación de ${data.name}`}
                                className="max-h-64 w-auto rounded-md object-contain"
                            />
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (imageToShow) {
                                            const a = document.createElement('a');
                                            a.href = imageToShow;
                                            a.download = `divinity_${divinity.id}.jpg`;
                                            a.click();
                                        }
                                    }}
                                    className="px-3 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300"
                                >Descargar</button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setField('representation_image', null)}
                                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >Quitar imagen</button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-400">Sin imagen</div>
                    )}
                    {isEditing && (
                        <div className="mt-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="text-sm text-slate-600"
                            />
                        </div>
                    )}
                </div>

                {/* SEMs donde se da culto */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">SEMs donde se da culto</h3>
                    {linkedSems.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Sin SEMs vinculados.</p>
                    ) : (
                        <ul className="flex flex-wrap gap-2 mb-4">
                            {linkedSems.map(sem => (
                                <li key={sem.id} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-sm text-blue-800">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/sem/${sem.id}`)}
                                        className="hover:underline"
                                    >{sem.name || `SEM #${sem.id}`}</button>
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

export default DivinityDetailPage;
