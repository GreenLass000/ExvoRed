import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Divinity } from '../types';
import * as api from '../services/api';

const DivinityDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [divinity, setDivinity] = useState<Divinity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDivinity = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const divinities = await api.getDivinities();
                const foundDivinity = divinities.find(d => d.id === parseInt(id));
                setDivinity(foundDivinity || null);
            } catch (error) {
                console.error('Error fetching divinity:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDivinity();
    }, [id]);

    const handleEditDivinity = useCallback(() => {
        if (divinity) {
            // Navigate to the divinities page with edit mode for this specific divinity
            navigate(`/divinities?edit=${divinity.id}`);
        }
    }, [divinity, navigate]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle keyboard shortcuts if user is typing in an input field
            const target = e.target as HTMLElement;
            const isInputField = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.contentEditable === 'true' ||
                target.getAttribute('role') === 'textbox'
            );

            if (isInputField) return;

            // Edit with Shift+E
            if (e.shiftKey && e.key === 'E') {
                e.preventDefault();
                handleEditDivinity();
                return;
            }

            // Navigation shortcuts (only when not using Ctrl/Alt/Meta)
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    navigate('/sems');
                    break;
                case 'c':
                    e.preventDefault();
                    navigate('/catalog');
                    break;
                case 'v':
                    e.preventDefault();
                    navigate('/exvotos');
                    break;
                case 'd':
                    e.preventDefault();
                    navigate('/divinities');
                    break;
                case 'p':
                    e.preventDefault();
                    navigate('/characters');
                    break;
                case 'm':
                    e.preventDefault();
                    navigate('/miracles');
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleEditDivinity, navigate]);

    if (loading) {
        return <div className="text-center p-8">Cargando detalles de la divinidad...</div>;
    }

    if (!divinity) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">Divinidad no encontrada</h2>
                <button
                    onClick={() => navigate('/divinities')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Volver a Divinidades
                </button>
            </div>
        );
    }

    const renderField = (label: string, value: string | number | null | undefined) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                {value !== null && value !== undefined && value !== '' ? value : '—'}
            </div>
        </div>
    );

    const renderTextArea = (label: string, value: string | null | undefined) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md min-h-[100px] whitespace-pre-wrap">
                {value !== null && value !== undefined && value !== '' ? value : '—'}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-700">Detalles de la Divinidad</h1>
                <button
                    onClick={() => navigate('/divinities')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                    ← Volver a Divinidades
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{divinity.name || '—'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderField('ID', divinity.id)}
                        {renderField('Última modificación', divinity.updated_at)}
                    </div>
                </div>

                <div className="space-y-6">
                    {renderTextArea('Atributos / Especialidad', divinity.attributes)}
                    {renderTextArea('Historia', divinity.history)}
                    {renderTextArea('Representación', divinity.representation)}
                    {renderTextArea('Comentarios', divinity.comments)}
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Imagen de Representación</label>
                    {divinity.representation_image ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                            <img
                                src={divinity.representation_image}
                                alt={`Representación de ${divinity.name}`}
                                className="max-w-full h-auto rounded-md"
                            />
                        </div>
                    ) : (
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">—</div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleEditDivinity}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Editar Divinidad (Shift+E)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DivinityDetailPage;
