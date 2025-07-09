import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Catalog } from '../types';
import * as api from '../services/mockApi';

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
                const catalogs = await api.getCatalogs();
                const foundCatalog = catalogs.find(c => c.id === parseInt(id));
                setCatalog(foundCatalog || null);
            } catch (error) {
                console.error('Error fetching catalog:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCatalog();
    }, [id]);

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

    const renderField = (label: string, value: string | number | null) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                {value || <span className="text-slate-400">No disponible</span>}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-700">Detalles del Catálogo</h1>
                <button
                    onClick={() => navigate('/catalog')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                    ← Volver a Catálogos
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderField('ID', catalog.id)}
                    {renderField('Título', catalog.title)}
                    {renderField('Referencia', catalog.reference)}
                    {renderField('Autor', catalog.author)}
                    {renderField('Año de Publicación', catalog.publication_year)}
                    {renderField('Lugar de Publicación', catalog.publication_place)}
                    {renderField('Ubicación del Catálogo', catalog.catalog_location)}
                    {renderField('Número de Exvotos', catalog.exvoto_count)}
                    {renderField('Lugares Relacionados', catalog.related_places)}
                </div>

                <div className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de Ubicación</label>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md min-h-[80px]">
                            {catalog.location_description || <span className="text-slate-400">No disponible</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Comentarios</label>
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md min-h-[80px]">
                            {catalog.comments || <span className="text-slate-400">No disponible</span>}
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Información del Catálogo</h3>
                    <p className="text-xs text-green-700">
                        Este catálogo contiene información sobre {catalog.exvoto_count || 0} exvotos y está relacionado 
                        con los siguientes lugares: {catalog.related_places || 'No especificado'}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CatalogDetailPage;
