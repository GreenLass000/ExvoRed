
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Exvoto, Sem, ExvotoImage as ExvotoImageType } from '../types';
import * as api from '../services/api';
import { getImageSrc } from '../utils/images';
import Modal from '../components/Modal';

const DetailField = ({ label, value }: { label: string, value: React.ReactNode }) => {
    const isEmpty = value === null || value === undefined || value === '';
    return (
        <div>
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 text-base text-slate-900">{isEmpty ? <span className="text-slate-400">—</span> : value}</dd>
        </div>
    );
};

const ExvotoDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [exvoto, setExvoto] = useState<Exvoto | null>(null);
    const [sems, setSems] = useState<Sem[]>([]);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [extraImages, setExtraImages] = useState<ExvotoImageType[]>([]);
    type ActiveImage = { type: 'main'; src: string | null } | { type: 'extra'; id: number; src: string };
    const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
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
                const [exvotoData, semsData, exvotoImages] = await Promise.all([
                    api.getExvotoById(exvotoId),
                    api.getSems(),
                    api.getExvotoImages(exvotoId)
                ]);

                if (exvotoData) {
                    setExvoto(exvotoData);
                    setSems(semsData);
                    setMainImage(exvotoData.image ?? null);
                    setExtraImages(exvotoImages);
                    const initialActive: ActiveImage | null = exvotoData.image
                        ? { type: 'main', src: exvotoData.image }
                        : (exvotoImages[0] ? { type: 'extra', id: exvotoImages[0].id, src: exvotoImages[0].image } : null);
                    setActiveImage(initialActive);
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

            // Edit with Shift+E
            if (e.shiftKey && e.key === 'E') {
                e.preventDefault();
                handleEditExvoto();
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
    }, [handleEditExvoto, navigate]);

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
        if (!dateString) return '—';
        return dateString; // Preserve exact string; avoid timezone shifts
    }

    return (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden max-w-6xl mx-auto">
            <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{exvoto.internal_id || '—'}</h1>
                        <p className="text-md text-slate-500 mt-1">Divinidad: {exvoto.virgin_or_saint || '—'}</p>
                        <p className="text-sm text-slate-400 mt-1">ID: {exvoto.id} | Última modificación: {exvoto.updated_at || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            onClick={async () => {
                                const ok = window.confirm('¿Eliminar este exvoto? Esta acción no se puede deshacer.');
                                if (!ok || !exvoto) return;
                                try {
                                    await api.deleteExvoto(exvoto.id);
                                    navigate('/exvotos');
                                } catch (err) {
                                    alert('No se pudo eliminar el exvoto');
                                }
                            }}
                        >Eliminar</button>
                        <button
                            type="button"
                            className="px-3 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 text-sm"
                            onClick={() => navigate('/exvotos')}
                        >
                            &larr; Volver a la lista
                        </button>
                    </div>
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
                        <DetailField label="Lugar de Ofrenda (SEM)" value={exvoto.offering_sem_id ? semNameMap[exvoto.offering_sem_id] : null} />
                        <DetailField label="Lugar Origen Devoto/a" value={exvoto.lugar_origen} />
                        <DetailField label="Lugar de Conservación (SEM)" value={exvoto.conservation_sem_id ? semNameMap[exvoto.conservation_sem_id] : null} />
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
                        <DetailField label="Subalternidad" value={exvoto.social_status} />
                      </dl>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Descripción del Exvoto</h2>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailField label="Personajes representados" value={exvoto.characters} />
                        <DetailField label="Soporte Material" value={exvoto.material} />
                        <DetailField label="Dimensiones" value={exvoto.dimensions} />
                        <DetailField label="Estado de Conservación" value={exvoto.conservation_status} />
                      </dl>
                    </div>
                    
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Textos y Notas</h2>
                      <dl className="space-y-4">
                         <DetailField label="Transcripción" value={exvoto.transcription ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exvoto.transcription }} /> : null} />
                         <DetailField label="Tipo de Escritura" value={exvoto.writing_type ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exvoto.writing_type }} /> : null} />
                         <DetailField label="Competencia Lingüística" value={exvoto.linguistic_competence ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exvoto.linguistic_competence }} /> : null} />
                         <DetailField label="Referencias" value={exvoto.references ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exvoto.references }} /> : null} />
                         <DetailField label="Información Adicional" value={exvoto.extra_info ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exvoto.extra_info }} /> : null} />
                         <DetailField label="Uso Capitales" value={exvoto.text_case} />
                         <DetailField label="Competencia Gráfica (Forma de Texto)" value={exvoto.text_form ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: exvoto.text_form }} /> : null} />
                      </dl>
                    </div>
                  </div>

                  {/* Zona imagen */}
                  <aside>
                    <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Imagen</h2>
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={getImageSrc(activeImage?.type === 'main' ? activeImage?.src : (activeImage as any)?.src)}
                        alt={`Imagen del exvoto ${exvoto.internal_id || ''}`}
                        className="w-full h-80 object-contain bg-white cursor-zoom-in"
                        onClick={() => setIsZoomOpen(true)}
                      />
                      {((mainImage ? 1 : 0) + extraImages.length) > 1 && (
                        <div className="p-2 flex gap-2 overflow-x-auto bg-gray-50 border-t">
                          {mainImage && (
                            <button
                              type="button"
                              onClick={() => setActiveImage({ type: 'main', src: mainImage })}
                              className={`border rounded ${activeImage?.type === 'main' ? 'ring-2 ring-blue-500' : ''}`}
                              title="Portada"
                            >
                              <img src={getImageSrc(mainImage)} alt="Portada" className="h-16 w-16 object-cover" />
                            </button>
                          )}
                          {extraImages.map((img, idx) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setActiveImage({ type: 'extra', id: img.id, src: img.image })}
                              className={`border rounded ${activeImage?.type === 'extra' && (activeImage as any).id === img.id ? 'ring-2 ring-blue-500' : ''}`}
                              title={`Imagen ${idx + 1}`}
                            >
                              <img src={getImageSrc(img.image)} alt={`Miniatura ${idx + 1}`} className="h-16 w-16 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="px-3 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
                      >Ampliar</button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!exvoto || !activeImage) return;
                          const confirmed = window.confirm('¿Seguro que quieres eliminar esta imagen?');
                          if (!confirmed) return;
                          try {
                            if (activeImage.type === 'main') {
                              const updated = await api.updateExvoto(exvoto.id, { image: null });
                              setExvoto(updated);
                              setMainImage(null);
                              if (extraImages.length > 0) {
                                const first = extraImages[0];
                                setActiveImage({ type: 'extra', id: first.id, src: first.image });
                              } else {
                                setActiveImage(null);
                              }
                            } else {
                              await api.deleteExvotoImage(exvoto.id, activeImage.id);
                              const remaining = extraImages.filter(i => i.id !== activeImage.id);
                              setExtraImages(remaining);
                              if (remaining.length > 0) {
                                setActiveImage({ type: 'extra', id: remaining[0].id, src: remaining[0].image });
                              } else if (mainImage) {
                                setActiveImage({ type: 'main', src: mainImage });
                              } else {
                                setActiveImage(null);
                              }
                            }
                          } catch (err) {
                            console.error('Error eliminando imagen:', err);
                            alert('No se pudo eliminar la imagen');
                          }
                        }}
                        disabled={!activeImage || (activeImage.type === 'main' && !activeImage.src)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >Eliminar imagen</button>
                    </div>

                    {/* Modal de zoom */}
                    <Modal isOpen={isZoomOpen} onClose={() => setIsZoomOpen(false)} title="Imagen ampliada">
                      <div className="flex items-center justify-center">
                        <img
                          src={getImageSrc(activeImage?.type === 'main' ? activeImage?.src : (activeImage as any)?.src)}
                          alt="Imagen ampliada"
                          className="max-h-[75vh] w-auto object-contain"
                        />
                      </div>
                    </Modal>
                  </aside>
                </div>
            </div>
        </div>
    );
};

export default ExvotoDetailPage;
