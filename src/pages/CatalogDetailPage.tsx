import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Catalog } from '../types';
import * as api from '../services/api';

const CatalogDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCatalog = async () => {
            if (!id) return;

            setLoading(true);
            try {
                // Obtener el catálogo directamente por ID
                const foundCatalog = await api.getCatalogById(parseInt(id));
                setCatalog(foundCatalog);
            } catch (error) {
                console.error('Error fetching catalog:', error);
                setCatalog(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCatalog();
    }, [id]);

    const handleEditCatalog = useCallback(() => {
        if (catalog) {
            // Navigate to the catalog page with edit mode for this specific catalog
            navigate(`/catalog?edit=${catalog.id}`);
        }
    }, [catalog, navigate]);

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
                handleEditCatalog();
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
    }, [handleEditCatalog, navigate]);

    if (loading) {
        return <div className="text-center p-8">Cargando detalles del catálogo...</div>;
    }

    if (!catalog) {
        return (
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-red-600">Catálogo no encontrado</h2>
                <button
                    onClick={() => navigate('/catalog')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Volver a Catálogos
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
                <h1 className="text-3xl font-bold text-slate-700">Detalles del Catálogo</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleEditCatalog}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => navigate('/catalog')}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                    >
                        ← Volver a Catálogos
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{catalog.title || '—'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {renderField('ID', catalog.id)}
                    {renderField('Última modificación', catalog.updated_at)}
                    {renderField('Título', catalog.title)}
                    {renderField('Referencia', catalog.reference)}
                    {renderField('Autor', catalog.author)}
                    {renderField('Año de Publicación', catalog.publication_year)}
                    {renderField('Lugar de Publicación', catalog.publication_place)}
                    {renderField('Ubicación del Catálogo', catalog.catalog_location)}
                    {renderField('Número de Exvotos', catalog.exvoto_count)}
                    {renderField('Número Total de Exvotos', catalog.numero_exvotos)}
                    {renderField('Fecha del Exvoto Más Antiguo', catalog.oldest_exvoto_date)}
                    {renderField('Fecha del Exvoto Más Reciente', catalog.newest_exvoto_date)}
                    {renderField('Lugares Relacionados', catalog.related_places)}
                </div>

                <div className="space-y-6">
                    {renderTextArea('Descripción de Ubicación', catalog.location_description)}
                    {renderTextArea('Otros Exvotos', catalog.other_exvotos)}
                    {renderTextArea('Comentarios', catalog.comments)}
                </div>

                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Información del Catálogo</h3>
                    <p className="text-xs text-green-700">
                        Este catálogo contiene información sobre {catalog.exvoto_count || 0} exvotos y está relacionado
                        con los siguientes lugares: {catalog.related_places || '—'}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CatalogDetailPage;
