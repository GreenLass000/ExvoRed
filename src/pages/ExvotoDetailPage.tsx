
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Exvoto, Sem, ExvotoImage as ExvotoImageType, Miracle, Character, Divinity } from '../types';
import * as api from '../services/api';
import { getImageSrc } from '../utils/images';
import { isEditableTarget } from '../utils/keyboard';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const isTemporaryRecord = searchParams.get('new') === '1';
    const returnTo = searchParams.get('returnTo') || '/exvotos';
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
    const imageViewportRef = useRef<HTMLDivElement>(null);
    const imageUploadInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Exvoto | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

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

    useEffect(() => {
        if ((!isTemporaryRecord && searchParams.get('edit') !== '1') || !exvoto || isEditing) return;
        setEditData({ ...exvoto });
        setIsEditing(true);
        if (!isTemporaryRecord) setSearchParams({}, { replace: true });
    }, [exvoto, isEditing, isTemporaryRecord, searchParams, setSearchParams]);

    const handleCancelEdit = async () => {
        if (isTemporaryRecord && exvoto) {
            try {
                await api.deleteExvoto(exvoto.id);
                navigate(returnTo, { replace: true });
            } catch (err) {
                console.error('Error descartando exvoto temporal:', err);
                alert('No se pudo descartar el exvoto temporal');
            }
            return;
        }
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
            if (isTemporaryRecord) setSearchParams({}, { replace: true });
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

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!exvoto) return;
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length === 0) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (files.some(file => !allowedTypes.includes(file.type.toLowerCase()))) {
            alert('Solo se permiten imágenes JPG, JPEG o PNG.');
            return;
        }

        setUploadingImages(true);
        try {
            const imageData = await Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            })));

            let remainingImages = imageData;
            if (!mainImage && imageData[0]) {
                const updated = await api.updateExvoto(exvoto.id, { image: imageData[0] });
                setExvoto(updated);
                setMainImage(imageData[0]);
                setActiveImage({ type: 'main', src: imageData[0] });
                remainingImages = imageData.slice(1);
            }

            if (remainingImages.length > 0) {
                const addedImages = await api.addExvotoImages(exvoto.id, remainingImages);
                setExtraImages(previous => [...previous, ...addedImages]);
                if (!mainImage && imageData.length === 0 && addedImages[0]) {
                    setActiveImage({ type: 'extra', id: addedImages[0].id, src: addedImages[0].image });
                }
            }
            setZoomLevel(1);
        } catch (err) {
            console.error('Error añadiendo imágenes:', err);
            alert('No se pudieron añadir las imágenes seleccionadas.');
        } finally {
            setUploadingImages(false);
        }
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle keyboard shortcuts if user is typing in an input field
            if (isEditableTarget(e.target)) return;

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

    // El listener nativo no pasivo permite cancelar el scroll de rueda/touchpad
    // cuando se usa ese gesto para ampliar o reducir la imagen.
    useEffect(() => {
        if (loading) return;
        const viewport = imageViewportRef.current;
        if (!viewport) return;

        const handleImageWheel = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setZoomLevel(current => Math.min(4, Math.max(0.5, current + (event.deltaY < 0 ? 0.1 : -0.1))));
        };

        viewport.addEventListener('wheel', handleImageWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', handleImageWheel);
    }, [loading]);

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

    const renderEditableTextField = (label: string, fieldKey: keyof Exvoto, type = 'text') => {
        if (isEditing && editData) {
            return (
                <div>
                    <dt className="text-sm font-medium text-slate-500">{label}</dt>
                    <input
                        type={type}
                        value={(editData[fieldKey] as string | number | null) ?? ''}
                        onChange={event => setExvotoField(fieldKey, event.target.value || null)}
                        className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                </div>
            );
        }
        return <DetailField label={label} value={exvoto[fieldKey] as string | number | null} />;
    };

    const renderEditableSelectField = (
        label: string,
        fieldKey: keyof Exvoto,
        options: Array<{ value: string | number; label: string }>,
    ) => {
        if (isEditing && editData) {
            return (
                <div>
                    <dt className="text-sm font-medium text-slate-500">{label}</dt>
                    <select
                        value={String(editData[fieldKey] ?? '')}
                        onChange={event => setExvotoField(fieldKey, event.target.value || null)}
                        className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                        <option value="">—</option>
                        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </div>
            );
        }
        return <DetailField label={label} value={exvoto[fieldKey] as string | number | null} />;
    };

    const renderEditableRichTextField = (label: string | null, fieldKey: keyof Exvoto, rows = 4) => {
        const value = exvoto[fieldKey] as string | null;
        if (isEditing && editData) {
            return (
                <div>
                    {label && <dt className="text-sm font-medium text-slate-500">{label}</dt>}
                    <div className={label ? 'mt-1' : 'mt-4'}>
                        <RichTextEditor
                            value={(editData[fieldKey] as string | null) ?? ''}
                            onChange={nextValue => setExvotoField(fieldKey, nextValue || null)}
                            rows={rows}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div>
                {label && <dt className="text-sm font-medium text-slate-500">{label}</dt>}
                <dd className={label ? 'mt-1 text-base text-slate-900' : 'mt-4 text-base text-slate-900'}>
                    {value
                        ? <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: value }} />
                        : <span className="text-slate-400">—</span>}
                </dd>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1680px] mx-auto grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,63fr)_minmax(0,37fr)] xl:gap-10">
            <section className="min-h-[calc(100vh-10rem)] bg-white shadow-xl rounded-lg" aria-label="Ficha del exvoto">
              <div className="p-6 sm:p-8">
                <div className="sticky top-16 z-20 -mx-6 -mt-6 mb-8 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-6 sm:-mx-8 sm:-mt-8 sm:px-8">
                    <div>
                        {isEditing && editData ? (
                          <input
                            type="text"
                            value={editData.internal_id ?? ''}
                            onChange={event => setExvotoField('internal_id', event.target.value || null)}
                            className="w-full rounded border border-blue-300 px-2 py-1 text-3xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            aria-label="ID interno"
                          />
                        ) : (
                          <h1 className="text-3xl font-bold text-slate-800">{exvoto.internal_id || '—'}</h1>
                        )}
                        <p className="mt-1 text-md text-slate-500">
                          {(isEditing && editData ? editData.virgin_or_saint : exvoto.virgin_or_saint) || '—'} — {(isEditing && editData ? editData.conservation_sem_id : exvoto.conservation_sem_id) ? semNameMap[(isEditing && editData ? editData.conservation_sem_id : exvoto.conservation_sem_id) as number] ?? '—' : '—'}
                        </p>
                        <p className="hidden">ID: {exvoto.id} | Última modificación: {exvoto.updated_at || '—'}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
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
                
                <div className="space-y-10">
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Ubicación</h2>
                    <dl className="mt-5 space-y-4">
                      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                        {isEditing && editData ? (
                          <div>
                            <dt className="text-sm font-medium text-slate-500">Lugar de ofrenda</dt>
                            <select
                              value={editData.offering_sem_id ?? ''}
                              onChange={event => setExvotoField('offering_sem_id', event.target.value ? Number(event.target.value) : null)}
                              className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              <option value="">—</option>
                              {sems.map(sem => <option key={sem.id} value={sem.id}>{sem.name || `SEM #${sem.id}`}</option>)}
                            </select>
                          </div>
                        ) : <DetailField label="Lugar de ofrenda" value={exvoto.offering_sem_id ? semNameMap[exvoto.offering_sem_id] : null} />}
                        {isEditing && editData ? (
                          <div>
                            <dt className="text-sm font-medium text-slate-500">Lugar de conservación</dt>
                            <select
                              value={editData.conservation_sem_id ?? ''}
                              onChange={event => setExvotoField('conservation_sem_id', event.target.value ? Number(event.target.value) : null)}
                              className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              <option value="">—</option>
                              {sems.map(sem => <option key={sem.id} value={sem.id}>{sem.name || `SEM #${sem.id}`}</option>)}
                            </select>
                          </div>
                        ) : <DetailField label="Lugar de conservación" value={exvoto.conservation_sem_id ? semNameMap[exvoto.conservation_sem_id] : null} />}
                      </div>
                      <DetailField
                        label="Provincia (del SEM)"
                        value={sems.find(sem => sem.id === (isEditing && editData ? editData.conservation_sem_id : exvoto.conservation_sem_id))?.province ?? null}
                      />
                      {isEditing && editData ? (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Divinidad</dt>
                          <select
                            value={editData.virgin_or_saint ?? ''}
                            onChange={event => setExvotoField('virgin_or_saint', event.target.value || null)}
                            className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="">—</option>
                            {divinities.map(divinity => <option key={divinity.id} value={divinity.name}>{divinity.name}</option>)}
                          </select>
                        </div>
                      ) : <DetailField label="Divinidad" value={exvoto.virgin_or_saint} />}
                    </dl>
                  </section>
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Detalles del Milagro</h2>
                    <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                      {isEditing && editData ? (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Fecha</dt>
                          <input
                            type="date"
                            value={editData.exvoto_date ?? ''}
                            onChange={event => setExvotoField('exvoto_date', event.target.value || null)}
                            className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      ) : <DetailField label="Fecha" value={exvoto.exvoto_date} />}
                      {isEditing && editData ? (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Época</dt>
                          <input
                            type="text"
                            value={editData.epoch ?? ''}
                            onChange={event => setExvotoField('epoch', event.target.value || null)}
                            className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      ) : <DetailField label="Época" value={exvoto.epoch} />}
                      {isEditing && editData ? (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Milagro</dt>
                          <select
                            value={editData.miracle ?? ''}
                            onChange={event => setExvotoField('miracle', event.target.value || null)}
                            className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="">—</option>
                            {miracles.map(miracle => <option key={miracle.id} value={miracle.name}>{miracle.name}</option>)}
                          </select>
                        </div>
                      ) : <DetailField label="Milagro" value={exvoto.miracle} />}
                      {isEditing && editData ? (
                        <div>
                          <dt className="text-sm font-medium text-slate-500">Lugar del Milagro</dt>
                          <input
                            type="text"
                            value={editData.miracle_place ?? ''}
                            onChange={event => setExvotoField('miracle_place', event.target.value || null)}
                            className="mt-1 w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      ) : <DetailField label="Lugar del Milagro" value={exvoto.miracle_place} />}
                    </dl>
                  </section>
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Personas Involucradas</h2>
                    <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                      {renderEditableTextField('Beneficiado/a', 'benefited_name')}
                      {renderEditableTextField('Oferente', 'offerer_name')}
                      {renderEditableSelectField('Género', 'offerer_gender', [
                        { value: 'Masculino', label: 'Masculino' },
                        { value: 'Femenino', label: 'Femenino' },
                        { value: 'Ambos', label: 'Ambos' },
                        { value: 'Desconocido', label: 'Desconocido' },
                      ])}
                      {renderEditableTextField('Lugar de Origen', 'lugar_origen')}
                      {renderEditableTextField('Subalternidad', 'social_status')}
                      {renderEditableTextField('Profesión', 'profession')}
                      {renderEditableTextField('Relación Oferente', 'offerer_relation')}
                      {renderEditableSelectField('Personajes representados', 'characters', characters.map(character => ({ value: character.name, label: character.name })))}
                    </dl>
                  </section>
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Descripción del Exvoto</h2>
                    <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                      {renderEditableTextField('Soporte Material', 'material')}
                      {renderEditableTextField('Dimensiones', 'dimensions')}
                      {renderEditableTextField('Estado de Conservación', 'conservation_status')}
                    </dl>
                  </section>
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Escritura</h2>
                    <dl className="mt-5 space-y-5">
                      {renderEditableTextField('Uso Capitales', 'text_case')}
                      {renderEditableRichTextField('Competencia Gráfica', 'text_form')}
                      {renderEditableRichTextField('Competencia Lingüística', 'linguistic_competence')}
                      {renderEditableRichTextField('Tipo de Escritura', 'writing_type')}
                    </dl>
                  </section>
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Información Adicional</h2>
                    <dl>
                      {renderEditableRichTextField(null, 'extra_info', 5)}
                    </dl>
                  </section>
                  <section>
                    <h2 className="border-b border-slate-300 pb-2 text-xl font-semibold text-slate-700">Referencias</h2>
                    <dl>
                      {renderEditableRichTextField(null, 'references', 5)}
                    </dl>
                  </section>
                </div>

                <div className="hidden mt-8">
                  {/* Zona detalles */}
                  <div className="space-y-8">
                    {(() => {
                      const d = isEditing && editData ? editData : exvoto;

                      const renderField = (label: string, fieldKey: keyof Exvoto, type = 'text') => (
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

                      const renderSelect = (label: string, fieldKey: keyof Exvoto, options: { value: string | number; label: string }[]) => (
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

                      const renderRichText = (label: string, fieldKey: keyof Exvoto) => (
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
                              {renderField('Fecha', 'exvoto_date')}
                              {renderField('Época (25 años)', 'epoch')}
                              {renderSelect('Milagro', 'miracle', miracles.map(m => ({ value: m.name, label: m.name })))}
                              {renderField('Lugar del Milagro', 'miracle_place')}
                              {renderField('Provincia', 'province')}
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
                              {renderField('Lugar Origen Devoto/a', 'lugar_origen')}
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
                              {renderField('Beneficiado', 'benefited_name')}
                              {renderField('Oferente', 'offerer_name')}
                              {renderSelect('Género del Oferente', 'offerer_gender', [
                                { value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' },
                                { value: 'Ambos', label: 'Ambos' }, { value: 'Desconocido', label: 'Desconocido' },
                              ])}
                              {renderField('Relación Oferente-Beneficiado', 'offerer_relation')}
                              {renderField('Profesión', 'profession')}
                              {renderField('Subalternidad', 'social_status')}
                            </dl>
                          </div>

                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Descripción del Exvoto</h2>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                              {renderSelect('Personajes representados', 'characters', characters.map(c => ({ value: c.name, label: c.name })))}
                              {renderSelect('Divinidad', 'virgin_or_saint', divinities.map(dv => ({ value: dv.name, label: dv.name })))}
                              {renderField('Soporte Material', 'material')}
                              {renderField('Dimensiones', 'dimensions')}
                              {renderField('Estado de Conservación', 'conservation_status')}
                              {renderField('ID Interno', 'internal_id')}
                            </dl>
                          </div>

                          <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-700 border-b pb-2">Textos y Notas</h2>
                            <dl className="space-y-4">
                              {renderRichText('Transcripción', 'transcription')}
                              {renderRichText('Tipo de Escritura', 'writing_type')}
                              {renderRichText('Competencia Lingüística', 'linguistic_competence')}
                              {renderRichText('Referencias', 'references')}
                              {renderRichText('Información Adicional', 'extra_info')}
                              {renderField('Uso Capitales', 'text_case')}
                              {renderRichText('Competencia Gráfica (Forma de Texto)', 'text_form')}
                            </dl>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  </div>
                </div>
            </section>

            {/* Panel de imagen independiente de la hoja de datos. */}
            <aside className="self-start overflow-x-hidden rounded-lg border border-slate-200 bg-white lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
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
                              ref={imageViewportRef}
                              className="overflow-hidden bg-white flex items-center justify-center"
                              style={{ height: 'min(62vh, 680px)', minHeight: '420px' }}
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
                          <input
                            ref={imageUploadInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <div className="mt-3 flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => imageUploadInputRef.current?.click()}
                              disabled={uploadingImages}
                              className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                            >{uploadingImages ? 'Añadiendo…' : 'Añadir imagen'}</button>
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
                            >Borrar imagen</button>
                          </div>
                        </>
                      );
                    })()}

                    <section className="mx-4 mb-5 mt-6 border-t border-slate-200 pt-5">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transcripción</h2>
                      {isEditing && editData ? (
                        <div className="mt-3">
                          <RichTextEditor
                            value={editData.transcription ?? ''}
                            onChange={value => setExvotoField('transcription', value || null)}
                            rows={8}
                          />
                        </div>
                      ) : exvoto.transcription ? (
                        <div
                          className="prose prose-sm mt-3 max-w-none break-words text-slate-800"
                          dangerouslySetInnerHTML={{ __html: exvoto.transcription }}
                        />
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">—</p>
                      )}
                    </section>
            </aside>
        </div>
    );
};

export default ExvotoDetailPage;
