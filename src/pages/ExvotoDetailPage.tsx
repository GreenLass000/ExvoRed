
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Exvoto, Sem } from '../types';
import * as api from '../services/api';
import { getImageSrc } from '../utils/images';

const DetailField = ({ label, value }: { label: string, value: React.ReactNode }) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return (
        <div>
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-base text-slate-900">{value}</dd>
        </div>
    );
};

const ExvotoDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [exvoto, setExvoto] = useState<Exvoto | null>(null);
    const [sems, setSems] = useState<Sem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) {
                setError("No se ha proporcionado un ID de exvoto.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const exvotoId = parseInt(id, 10);
                const [exvotoData, semsData] = await Promise.all([
                    api.getExvotoById(exvotoId),
                    api.getSems()
                ]);

                if (exvotoData) {
                    setExvoto(exvotoData);
                    setSems(semsData);
                } else {
                    setError("No se encontró el exvoto.");
                }
            } catch (err) {
                setError("Error al cargar los detalles del exvoto.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const semNameMap = useMemo(() => {
        return sems.reduce((acc, sem) => {
            acc[sem.id] = sem.name || `SEM #${sem.id}`;
            return acc;
        }, {} as Record<number, string>);
    }, [sems]);

    const handleEditExvoto = useCallback(() => {
        if (exvoto) {
            // Navigate to the exvotos page with edit mode for this specific exvoto
            navigate(`/exvotos?edit=${exvoto.id}`);
        }
    }, [exvoto, navigate]);

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
            
            if (e.shiftKey && e.key === 'E') {
                e.preventDefault();
                handleEditExvoto();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleEditExvoto]);

    if (loading) {
        return <div className="text-center p-8">Cargando detalles del exvoto...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600">{error}</div>;
    }

    if (!exvoto) {
        return <div className="text-center p-8">No hay datos para mostrar.</div>;
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden max-w-6xl mx-auto">
            <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start">
                    <div>
<h1 className="text-3xl font-bold text-slate-800">{exvoto.internal_id || 'N/A'}</h1>
                        <p className="text-md text-slate-500 mt-1">Virgen/Santo: {exvoto.virgin_or_saint || 'N/A'}</p>
                    </div>
                     <Link to="/exvotos" className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium">
                        &larr; Volver a la lista
                    </Link>
                </div>
                
                {/* Contenido principal en dos zonas: detalles (2/3) e imagen (1/3) */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Zona detalles */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Sección principal */}
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Detalles del Milagro</h2>
                      <dl className="space-y-4">
<DetailField label="Fecha" value={formatDate(exvoto.exvoto_date)} />
                        <DetailField label="Época (25 años)" value={exvoto.epoch} />
                        <DetailField label="Milagro" value={exvoto.miracle} />
                        <DetailField label="Lugar del Milagro" value={exvoto.miracle_place} />
                        <DetailField label="Provincia" value={exvoto.province} />
                      </dl>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Ubicación</h2>
                      <dl className="space-y-4">
                        <DetailField label="Lugar de Ofrenda" value={semNameMap[exvoto.offering_sem_id!] || 'N/A'} />
                        <DetailField label="Lugar de Origen del Milagro" value={semNameMap[(exvoto as any).origin_sem_id!] || 'N/A'} />
                        <DetailField label="Lugar de Conservación" value={semNameMap[exvoto.conservation_sem_id!] || 'N/A'} />
                      </dl>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Personas Involucradas</h2>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailField label="Beneficiado" value={exvoto.benefited_name} />
                        <DetailField label="Oferente" value={exvoto.offerer_name} />
                        <DetailField label="Género del Oferente" value={exvoto.offerer_gender} />
                        <DetailField label="Relación Oferente-Beneficiado" value={exvoto.offerer_relation} />
                        <DetailField label="Profesión" value={exvoto.profession} />
                        <DetailField label="Estatus Social" value={exvoto.social_status} />
                      </dl>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Descripción del Exvoto</h2>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailField label="Personajes representados" value={exvoto.characters} />
                        <DetailField label="Material" value={exvoto.material} />
                        <DetailField label="Dimensiones" value={exvoto.dimensions} />
                        <DetailField label="Estado de Conservación" value={exvoto.conservation_status} />
                      </dl>
                    </div>
                    
                    {(exvoto.transcription || exvoto.extra_info) && (
                      <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Textos y Notas</h2>
                        <dl className="space-y-4">
                           <DetailField label="Transcripción" value={exvoto.transcription ? <p className="whitespace-pre-wrap font-serif italic">{exvoto.transcription}</p> : null} />
                           <DetailField label="Información Adicional" value={exvoto.extra_info} />
                           <DetailField label="Uso de Mayúsculas" value={exvoto.text_case} />
                           <DetailField label="Forma del Texto" value={exvoto.text_form} />
                        </dl>
                      </div>
                    )}
                  </div>

                  {/* Zona imagen */}
                  <aside>
                    <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Imagen</h2>
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={getImageSrc(exvoto.image)}
                        alt={`Imagen del exvoto ${exvoto.internal_id || ''}`}
                        className="w-full h-80 object-contain bg-white"
                      />
                    </div>
                  </aside>
                </div>
            </div>
        </div>
    );
};

export default ExvotoDetailPage;
