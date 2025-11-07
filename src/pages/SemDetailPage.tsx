import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sem } from '../types';
import * as api from '../services/api';

const SemDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sem, setSem] = useState<Sem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSem = async () => {
            if (!id) return;
            
            setLoading(true);
            try {
                const sems = await api.getSems();
                const foundSem = sems.find(s => s.id === parseInt(id));
                setSem(foundSem || null);
            } catch (error) {
                console.error('Error fetching SEM:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSem();
    }, [id]);

    const handleEditSem = useCallback(() => {
        if (sem) {
            // Navigate to the SEMs page with edit mode for this specific SEM
            navigate(`/sems?edit=${sem.id}`);
        }
    }, [sem, navigate]);

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
                handleEditSem();
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
    }, [handleEditSem, navigate]);

    if (loading) {
        return <div className="text-center p-8">Cargando detalles del SEM...</div>;
    }

    if (!sem) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">SEM no encontrado</h2>
                <button
                    onClick={() => navigate('/sems')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Volver a SEMs
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
                <h1 className="text-3xl font-bold text-slate-700">Detalles del SEM</h1>
                <button
                    onClick={() => navigate('/sems')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                    ← Volver a SEMs
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{sem.name || '—'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {renderField('ID', sem.id)}
                    {renderField('Última modificación', sem.updated_at)}
                    {renderField('Nombre', sem.name)}
                    {renderField('Región', sem.region)}
                    {renderField('Provincia', sem.province)}
                    {renderField('Población', sem.town)}
                    {renderField('Divinidad Asociada', sem.associated_divinity)}
                    {renderField('Festividad', sem.festivity)}
                    {renderField('Contacto', sem.contact)}
                    {renderField('Número de Exvotos Pictóricos', sem.pictorial_exvoto_count)}
                    {renderField('Número Total de Exvotos', sem.numero_exvotos)}
                    {renderField('Fecha del Exvoto Más Antiguo', sem.oldest_exvoto_date)}
                    {renderField('Fecha del Exvoto Más Reciente', sem.newest_exvoto_date)}
                </div>

                <div className="space-y-6">
                    {renderTextArea('Info exvotos', sem.other_exvotos)}
                    {renderTextArea('Comentarios', sem.comments)}
                    {renderTextArea('Referencias', sem.references)}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Información Estadística</h3>
                    <p className="text-xs text-blue-700">
                        Los datos estadísticos (número de exvotos, fechas más antigua y reciente) se calculan automáticamente
                        basándose únicamente en los exvotos que están <strong>conservados</strong> en este SEM.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SemDetailPage;
