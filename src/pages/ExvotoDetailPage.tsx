
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Exvoto, Sem, ExvotoImage as ExvotoImageType, Miracle, Character, Divinity } from '../types';
import * as api from '../services/api';
import { getImageSrc } from '../utils/images';
import RichTextEditor from '../components/RichTextEditor';

// Abre una imagen (data URL o URL HTTP) en una nueva pestaña
function openImageInNewTab(src: string) {
    if (src.startsWith('data:')) {
        const parts = src.split(',');
        const mime = parts[0].match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
        const byteStr = atob(parts[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
        const blob = new Blob([arr], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
        window.open(src, '_blank');
    }
}

// Descarga una imagen dada una src y un nombre de archivo
function downloadImage(src: string, filename: string) {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    a.click();
}

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
    const [miracles, setMiracles] = useState<Miracle[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [divinities, setDivinities] = useState<Divinity[]>([]);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [extraImages, setExtraImages] = useState<ExvotoImageType[]>([]);
    type ActiveImage = { type: 'main'; src: string | null } | { type: 'extra'; id: number; src: string };
    const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Exvoto | null>(null);
    const [saving, setSaving] = useState(false);

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
                const [exvotoData, semsData, exvotoImages, miraclesData, charactersData, divinitiesData] = await Promise.all([
                    api.getExvotoById(exvotoId),
                    api.getAllSems(),
                    api.getExvotoImages(exvotoId),
                    api.getMiracles(),
                    api.getCharacters(),
                    api.getAllDivinities(),
                ]);

                if (exvotoData) {
                    setExvoto(exvotoData);
                    setSems(semsData);
                    setMiracles(miraclesData);
                    setCharacters(charactersData);
                    setDivinities(divinitiesData);
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

    const handleStartEdit = useCallback(() => {
        if (exvoto) {
            setEditData({ ...exvoto });
            setIsEditing(true);
        }
    }, [exvoto]);

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleSaveEdit = async () => {
        if (!exvoto || !editData) return;
        setSaving(true);
        try {
            const updated = await api.updateExvoto(exvoto.id, editData);
            setExvoto(updated);
            setIsEditing(false);
            setEditData(null);
        } catch (err) {
            console.error('Error guardando exvoto:', err);
            alert('No se pudo guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const setExvotoField = (key: keyof Exvoto, value: string | number | null) => {
        setEditData(prev => prev ? { ...prev, [key]: value } : prev);
    };

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
                handleStartEdit();
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
    }, [handleStartEdit, navigate]);

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
                    <div className="flex items-center gap-2 flex-wrap">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">
                                    {saving ? 'Guardando…' : 'Guardar'}
                                </button>
                                <button type="button" onClick={handleCancelEdit} disabled={saving} className="px-3 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 text-sm disabled:opacity-50">
                                    Cancelar
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={handleStartEdit} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                    Editar
                                </button>
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
                            </>
                        )}
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
                    {(() => {
                      const d = isEditing && editData ? editData : exvoto;

                      const EField = ({ label, fieldKey, type = 'text' }: { label: string; fieldKey: keyof Exvoto; type?: string }) => (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          {isEditing && editData ? (
                            <input
                              type={type}
                              value={(editData[fieldKey] as string | number | null) ?? ''}
                              onChange={e => setExvotoField(fieldKey, e.target.value || null)}
                              className="mt-1 w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                            />
                          ) : (
                            <dd className="mt-1 text-base text-slate-900">{(d[fieldKey] as string | null) || <span className="text-slate-400">—</span>}</dd>
                          )}
                        </div>
                      );

                      const ESelect = ({ label, fieldKey, options }: { label: string; fieldKey: keyof Exvoto; options: { value: string | number; label: string }[] }) => (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          {isEditing && editData ? (
                            <select
                              value={(editData[fieldKey] as string | number | null) ?? ''}
                              onChange={e => setExvotoField(fieldKey, e.target.value || null)}
                              className="mt-1 w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                            >
                              <option value="">—</option>
                              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : (
                            <dd className="mt-1 text-base text-slate-900">{(d[fieldKey] as string | null) || <span className="text-slate-400">—</span>}</dd>
                          )}
                        </div>
                      );

                      const ERich = ({ label, fieldKey }: { label: string; fieldKey: keyof Exvoto }) => (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          {isEditing && editData ? (
                            <RichTextEditor
                              value={(editData[fieldKey] as string | null) ?? ''}
                              onChange={v => setExvotoField(fieldKey, v || null)}
                              rows={3}
                            />
                          ) : (
                            <dd className="mt-1 text-base text-slate-900">
                              {(d[fieldKey] as string | null)
                                ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: d[fieldKey] as string }} />
                                : <span className="text-slate-400">—</span>}
                            </dd>
                          )}
                        </div>
                      );

                      return (
                        <>
                          {/* Sección principal */}
                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Detalles del Milagro</h2>
                            <dl className="space-y-4">
                              <EField label="Fecha" fieldKey="exvoto_date" />
                              <EField label="Época (25 años)" fieldKey="epoch" />
                              <ESelect label="Milagro" fieldKey="miracle" options={miracles.map(m => ({ value: m.name, label: m.name }))} />
                              <EField label="Lugar del Milagro" fieldKey="miracle_place" />
                              <EField label="Provincia" fieldKey="province" />
                            </dl>
                          </div>

                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Ubicación</h2>
                            <dl className="space-y-4">
                              {isEditing && editData ? (
                                <div>
                                  <dt className="text-sm font-medium text-slate-500">Lugar de Ofrenda (SEM)</dt>
                                  <select
                                    value={editData.offering_sem_id ?? ''}
                                    onChange={e => setExvotoField('offering_sem_id', e.target.value ? Number(e.target.value) : null)}
                                    className="mt-1 w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                  >
                                    <option value="">—</option>
                                    {sems.map(s => <option key={s.id} value={s.id}>{s.name || `SEM #${s.id}`}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <DetailField label="Lugar de Ofrenda (SEM)" value={d.offering_sem_id ? semNameMap[d.offering_sem_id] : null} />
                              )}
                              <EField label="Lugar Origen Devoto/a" fieldKey="lugar_origen" />
                              {isEditing && editData ? (
                                <div>
                                  <dt className="text-sm font-medium text-slate-500">Lugar de Conservación (SEM)</dt>
                                  <select
                                    value={editData.conservation_sem_id ?? ''}
                                    onChange={e => setExvotoField('conservation_sem_id', e.target.value ? Number(e.target.value) : null)}
                                    className="mt-1 w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                  >
                                    <option value="">—</option>
                                    {sems.map(s => <option key={s.id} value={s.id}>{s.name || `SEM #${s.id}`}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <DetailField label="Lugar de Conservación (SEM)" value={d.conservation_sem_id ? semNameMap[d.conservation_sem_id] : null} />
                              )}
                            </dl>
                          </div>

                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Personas Involucradas</h2>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              <EField label="Beneficiado" fieldKey="benefited_name" />
                              <EField label="Oferente" fieldKey="offerer_name" />
                              <ESelect label="Género del Oferente" fieldKey="offerer_gender" options={[
                                { value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' },
                                { value: 'Ambos', label: 'Ambos' }, { value: 'Desconocido', label: 'Desconocido' },
                              ]} />
                              <EField label="Relación Oferente-Beneficiado" fieldKey="offerer_relation" />
                              <EField label="Profesión" fieldKey="profession" />
                              <EField label="Subalternidad" fieldKey="social_status" />
                            </dl>
                          </div>

                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Descripción del Exvoto</h2>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              <ESelect label="Personajes representados" fieldKey="characters" options={characters.map(c => ({ value: c.name, label: c.name }))} />
                              <ESelect label="Divinidad" fieldKey="virgin_or_saint" options={divinities.map(dv => ({ value: dv.name, label: dv.name }))} />
                              <EField label="Soporte Material" fieldKey="material" />
                              <EField label="Dimensiones" fieldKey="dimensions" />
                              <EField label="Estado de Conservación" fieldKey="conservation_status" />
                              <EField label="ID Interno" fieldKey="internal_id" />
                            </dl>
                          </div>

                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Textos y Notas</h2>
                            <dl className="space-y-4">
                              <ERich label="Transcripción" fieldKey="transcription" />
                              <ERich label="Tipo de Escritura" fieldKey="writing_type" />
                              <ERich label="Competencia Lingüística" fieldKey="linguistic_competence" />
                              <ERich label="Referencias" fieldKey="references" />
                              <ERich label="Información Adicional" fieldKey="extra_info" />
                              <EField label="Uso Capitales" fieldKey="text_case" />
                              <ERich label="Competencia Gráfica (Forma de Texto)" fieldKey="text_form" />
                            </dl>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Zona imagen */}
                  <aside>
                    <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">Imagen</h2>
                    {(() => {
                      // Construir lista unificada de todas las imágenes
                      const allImgs: ActiveImage[] = [
                        ...(mainImage ? [{ type: 'main' as const, src: mainImage }] : []),
                        ...extraImages.map(img => ({ type: 'extra' as const, id: img.id, src: img.image })),
                      ];
                      const activeIdx = allImgs.findIndex(img =>
                        img.type === activeImage?.type &&
                        (img.type === 'main' || (img as any).id === (activeImage as any)?.id)
                      );
                      const activeSrc = activeImage?.type === 'main'
                        ? activeImage.src
                        : (activeImage as any)?.src ?? null;
                      const activeExtraImg = activeImage?.type === 'extra'
                        ? extraImages.find(i => i.id === (activeImage as any).id) ?? null
                        : null;

                      const goTo = (idx: number) => {
                        const img = allImgs[idx];
                        if (!img) return;
                        setActiveImage(img);
                        setZoomLevel(1);
                      };

                      return (
                        <>
                          <div className="border rounded-lg overflow-hidden bg-gray-50">
                            {/* Imagen principal con zoom por rueda */}
                            <div
                              className="overflow-hidden bg-white flex items-center justify-center"
                              style={{ height: '320px' }}
                              onWheel={e => {
                                e.preventDefault();
                                setZoomLevel(z => Math.min(4, Math.max(0.5, z + (e.deltaY < 0 ? 0.1 : -0.1))));
                              }}
                              onDoubleClick={() => setZoomLevel(1)}
                              title="Rueda para zoom · Doble click para restablecer"
                            >
                              <img
                                src={getImageSrc(activeSrc)}
                                alt={`Imagen del exvoto ${exvoto.internal_id || ''}`}
                                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.1s', transformOrigin: 'center', maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: zoomLevel !== 1 ? 'zoom-out' : 'zoom-in' }}
                              />
                            </div>

                            {/* Thumbnails + navegación */}
                            {allImgs.length > 1 && (
                              <div className="p-2 flex items-center gap-2 overflow-x-auto bg-gray-50 border-t">
                                <button type="button" onClick={() => goTo(Math.max(0, activeIdx - 1))} disabled={activeIdx <= 0} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600 text-lg flex-shrink-0">&#8249;</button>
                                <div className="flex gap-2 flex-1 overflow-x-auto">
                                  {allImgs.map((img, idx) => (
                                    <button
                                      key={img.type === 'main' ? 'main' : (img as any).id}
                                      type="button"
                                      onClick={() => goTo(idx)}
                                      className={`border-2 rounded flex-shrink-0 ${idx === activeIdx ? 'border-blue-500' : 'border-transparent'}`}
                                      title={img.type === 'main' ? 'Portada' : `Imagen ${idx + 1}`}
                                    >
                                      <img src={getImageSrc(img.type === 'main' ? img.src : (img as any).src)} alt="" className="h-14 w-14 object-cover rounded" />
                                    </button>
                                  ))}
                                </div>
                                <button type="button" onClick={() => goTo(Math.min(allImgs.length - 1, activeIdx + 1))} disabled={activeIdx >= allImgs.length - 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600 text-lg flex-shrink-0">&#8250;</button>
                                <span className="text-xs text-slate-400 flex-shrink-0">{activeIdx + 1} / {allImgs.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Caption de imagen extra */}
                          {activeExtraImg && (
                            <div className="mt-2">
                              <input
                                type="text"
                                defaultValue={activeExtraImg.caption ?? ''}
                                placeholder="Subtítulo / fuente…"
                                className="w-full text-sm border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                onBlur={async e => {
                                  const newCaption = e.target.value.trim() || null;
                                  if (newCaption === (activeExtraImg.caption ?? null)) return;
                                  try {
                                    const updated = await api.updateExvotoImage(exvoto.id, activeExtraImg.id, { caption: newCaption });
                                    setExtraImages(prev => prev.map(i => i.id === updated.id ? updated : i));
                                  } catch (err) {
                                    console.error('Error guardando caption:', err);
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => activeSrc && openImageInNewTab(getImageSrc(activeSrc))}
                              disabled={!activeSrc}
                              className="px-3 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 disabled:opacity-50 text-sm"
                            >Ampliar ↗</button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!activeSrc) return;
                                const ext = getImageSrc(activeSrc).startsWith('data:image/png') ? 'png' : 'jpg';
                                downloadImage(getImageSrc(activeSrc), `exvoto_${exvoto.id}_${activeIdx + 1}.${ext}`);
                              }}
                              disabled={!activeSrc}
                              className="px-3 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 disabled:opacity-50 text-sm"
                            >Descargar</button>
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
                                      setActiveImage({ type: 'extra', id: extraImages[0].id, src: extraImages[0].image });
                                    } else {
                                      setActiveImage(null);
                                    }
                                  } else {
                                    await api.deleteExvotoImage(exvoto.id, (activeImage as any).id);
                                    const remaining = extraImages.filter(i => i.id !== (activeImage as any).id);
                                    setExtraImages(remaining);
                                    if (remaining.length > 0) {
                                      setActiveImage({ type: 'extra', id: remaining[0].id, src: remaining[0].image });
                                    } else if (mainImage) {
                                      setActiveImage({ type: 'main', src: mainImage });
                                    } else {
                                      setActiveImage(null);
                                    }
                                  }
                                  setZoomLevel(1);
                                } catch (err) {
                                  console.error('Error eliminando imagen:', err);
                                  alert('No se pudo eliminar la imagen');
                                }
                              }}
                              disabled={!activeImage || (activeImage.type === 'main' && !activeImage.src)}
                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                            >Eliminar imagen</button>
                          </div>
                        </>
                      );
                    })()}
                  </aside>
                </div>
            </div>
        </div>
    );
};

export default ExvotoDetailPage;
