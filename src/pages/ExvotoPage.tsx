// Mejoras aplicadas:
// - Tipos ajustados para coincidir con el archivo types.ts
// - Evita perder el foco en inputs

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable, ExcelTableRef } from '../components/excel';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import TagSelect from '../components/TagSelect';
import SearchBar from '../components/SearchBar';
import EpochSelector from '../components/EpochSelector';
import RichTextEditor from '../components/RichTextEditor';
import { Exvoto, Sem, Character, Miracle } from '../types';
import { calculateEpochFromDate } from '../utils/epochUtils';
import * as api from '../services/api';
import { useNewShortcut } from '../hooks/useGlobalShortcut';
import { getImageSrc } from '../utils/images';

const getInitialExvotoData = (): Omit<Exvoto, 'id'> => ({
  internal_id: '',
  offering_sem_id: null,
  lugar_origen: '',
  conservation_sem_id: null,
  province: '',
  virgin_or_saint: '',
  exvoto_date: new Date().toISOString().split('T')[0],
  epoch: '',
  benefited_name: '',
  offerer_name: '',
  offerer_gender: '',
  offerer_relation: '',
  characters: '',
  profession: '',
  social_status: '',
  miracle: '',
  miracle_place: '',
  material: '',
  dimensions: '',
  text_case: '',
  text_form: '',
  writing_type: '',
  linguistic_competence: '',
  references: '',
  extra_info: '',
  transcription: '',
  conservation_status: '',
  image: null
});

const ExvotoPage: React.FC = () => {
  const [exvotos, setExvotos] = useState<Exvoto[]>([]);
  const [filteredExvotos, setFilteredExvotos] = useState<Exvoto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sems, setSems] = useState<Sem[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [miracles, setMiracles] = useState<Miracle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 100;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExvoto, setEditingExvoto] = useState<Exvoto | null>(null);
  const [newExvotoData, setNewExvotoData] = useState<Omit<Exvoto, 'id'>>(getInitialExvotoData());
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Modal rápido para crear SEM desde el formulario de Exvoto
  const [isSemModalOpen, setIsSemModalOpen] = useState(false);
  const [semFieldTarget, setSemFieldTarget] = useState<'offering_sem_id' | 'conservation_sem_id' | null>(null);
  const getInitialQuickSem = (): Omit<Sem, 'id'> => ({
    name: '',
    region: '',
    province: '',
    town: '',
    associated_divinity: '',
    festivity: '',
    pictorial_exvoto_count: null,
    oldest_exvoto_date: null,
    newest_exvoto_date: null,
    other_exvotos: '',
    numero_exvotos: null,
    comments: '',
    references: '',
    contact: ''
  });
  const [newSemQuick, setNewSemQuick] = useState<Omit<Sem, 'id'>>(getInitialQuickSem());

  // Función helper para mostrar mensajes toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Atajo 'n' para crear nuevo exvoto
  useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });
  
  // Refs y estado para integración SearchBar-ExcelTable
  const excelTableRef = useRef<ExcelTableRef>(null);
  const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const [exvotoResponse, semData, characterData, miracleData] = await Promise.all([
        api.getExvotos(page, itemsPerPage),
        api.getAllSems(),
        api.getCharacters(),
        api.getMiracles()
      ]);

      setExvotos(exvotoResponse.data);
      setTotalPages(exvotoResponse.pagination.totalPages);
      setTotalRecords(exvotoResponse.pagination.total);
      setCurrentPage(exvotoResponse.pagination.page);
      setSems(semData);
      setCharacters(characterData);
      setMiracles(miracleData);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast('Error al cargar los datos. Por favor, recarga la página.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle URL parameters for edit mode
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && exvotos.length > 0) {
      const exvotoId = parseInt(editId, 10);
      const exvoto = exvotos.find(e => e.id === exvotoId);
      if (exvoto) {
        // Open edit modal
        const { id: _, ...rest } = exvoto;
        setEditingExvoto(exvoto);
        setNewExvotoData({ ...rest });
        setIsModalOpen(true);
        
        // Clean URL parameter
        setSearchParams({});
      }
    }
  }, [searchParams, exvotos, setSearchParams]);

  const semNameMap = useMemo(() => {
    return sems.reduce((acc, sem) => {
      acc[sem.id] = sem.name || `SEM #${sem.id}`;
      return acc;
    }, {} as Record<number, string>);
  }, [sems]);

  const getSemDisplayValue = useCallback((semId: number | null) => {
    if (semId === null) return null;
    return semNameMap[semId] || `ID inválido: ${semId}`;
  }, [semNameMap]);

const columns: ColumnDef<Exvoto>[] = useMemo(() => [
    {
      key: 'image',
      header: 'Imagen',
      render: (value) => {
        // miniatura
        const src = getImageSrc(value as string | null);
        return (
          <div className="flex items-center justify-center w-full">
            <img src={src} alt="Miniatura" className="h-12 w-12 object-cover rounded border border-gray-200 bg-gray-100" />
          </div>
        );
      }
    },
    { key: 'internal_id', header: 'ID Interno' },
    {
      key: 'offering_sem_id',
      header: 'SEM Ofrenda',
      type: 'foreignKey',
      foreignKeyData: sems,
      getDisplayValue: row => getSemDisplayValue(row.offering_sem_id),
      onCellClick: row => row.offering_sem_id && navigate(`/sem/${row.offering_sem_id}`)
    },
    { key: 'lugar_origen', header: 'Lugar Origen Devoto/a' },
    {
      key: 'conservation_sem_id',
      header: 'SEM Conservación',
      type: 'foreignKey',
      foreignKeyData: sems,
      getDisplayValue: row => getSemDisplayValue(row.conservation_sem_id),
      onCellClick: row => row.conservation_sem_id && navigate(`/sem/${row.conservation_sem_id}`)
    },
    { key: 'province', header: 'Provincia' },
    { key: 'virgin_or_saint', header: 'Divinidad' },
    { key: 'exvoto_date', header: 'Fecha Exvoto', type: 'date' },
    { key: 'epoch', header: 'Época (25 años)' },
    { key: 'benefited_name', header: 'Beneficiado' },
    { key: 'offerer_name', header: 'Oferente' },
    { key: 'offerer_gender', header: 'Género Oferente' },
    { key: 'offerer_relation', header: 'Relación Oferente' },
    { key: 'characters', header: 'Personajes' },
    { key: 'profession', header: 'Profesión' },
    { key: 'social_status', header: 'Subalternidad' },
    { key: 'miracle', header: 'Milagro' },
    { key: 'miracle_place', header: 'Lugar Milagro' },
    { key: 'material', header: 'Soporte Material' },
    { key: 'dimensions', header: 'Dimensiones' },
    { key: 'text_case', header: 'Uso Capitales' },
    { key: 'text_form', header: 'Competencia Gráfica', type: 'richtext' },
    { key: 'writing_type', header: 'Tipo de Escritura', type: 'richtext' },
    { key: 'linguistic_competence', header: 'Competencia Lingüística', type: 'richtext' },
    { key: 'references', header: 'Referencias', type: 'richtext' },
    { key: 'conservation_status', header: 'Estado Conservación' },
    { key: 'extra_info', header: 'Info Extra', type: 'richtext' },
    { key: 'transcription', header: 'Transcripción', type: 'richtext' }
  ], [getSemDisplayValue, navigate, sems]);

  const handleUpdate = async (id: number, data: Partial<Exvoto>) => {
    try {
      const updatedExvoto = await api.updateExvoto(id, data);
      if (updatedExvoto) {
        setExvotos(prev => prev.map(e => e.id === id ? { ...e, ...updatedExvoto } : e));
        showToast('Exvoto actualizado correctamente', 'success');
      }
    } catch (error) {
      console.error("Error updating exvoto:", error);
      showToast('Error al actualizar el exvoto', 'error');
    }
  };

  const handleCreateEmpty = async () => {
    try {
      const emptyExvoto = getInitialExvotoData();
      const created = await api.createExvoto(emptyExvoto);
      setExvotos(prev => [...prev, created]);
      // Refrescar datos para asegurar consistencia
      await fetchData();
      showToast('Fila vacía creada correctamente', 'success');
    } catch (error) {
      console.error("Error creating empty exvoto:", error);
      showToast('Error al crear fila vacía', 'error');
    }
  };

  const handleDuplicate = async (exvoto: Exvoto) => {
    try {
      // Crear una copia sin el ID, preservando el updated_at del original
      const { id, ...exvotoData } = exvoto;
      const duplicated = await api.createExvoto(exvotoData);

      // Actualizar estado local sin recargar, manteniendo el orden por updated_at
      setExvotos(prev => {
        const newList = [...prev, duplicated];
        return newList.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      });

      showToast('Exvoto duplicado correctamente', 'success');
    } catch (error) {
      console.error("Error duplicating exvoto:", error);
      showToast('Error al duplicar exvoto', 'error');
    }
  };

  const handleOpenModal = () => {
    setEditingExvoto(null);
    setNewExvotoData(getInitialExvotoData());
    setIsModalOpen(true);
    setHasUnsaved(false);
  };

  const handleEditExvoto = (id: number) => {
    const exvoto = exvotos.find(e => e.id === id);
    if (exvoto) {
      const { id: _, ...rest } = exvoto;
      setEditingExvoto(exvoto);
      setNewExvotoData({ ...rest });
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingExvoto(null);
    setHasUnsaved(false);
  };

  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    const updatedData = { ...newExvotoData, [name]: value === '' ? null : value };
    
    // Auto-calcular época cuando cambia la fecha
    if (name === 'exvoto_date' && value) {
      const calculatedEpoch = calculateEpochFromDate(value);
      if (calculatedEpoch) {
        updatedData.epoch = calculatedEpoch;
      }
    }
    
    setNewExvotoData(updatedData);
    setHasUnsaved(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExvoto) {
        const updated = await api.updateExvoto(editingExvoto.id, newExvotoData);
        // Subir imágenes adicionales seleccionadas (si hay más de una)
        const extra = selectedImages.slice(1);
        if (extra.length > 0) {
          try {
            await api.addExvotoImages(updated.id, extra);
          } catch (err) {
            console.error('Error subiendo imágenes extra:', err);
            showToast('Exvoto actualizado, pero algunas imágenes no se pudieron subir', 'warning');
          }
        } else {
          showToast('Exvoto actualizado correctamente', 'success');
        }
      } else {
        const created = await api.createExvoto(newExvotoData);
        const extra = selectedImages.slice(1);
        if (extra.length > 0) {
          try {
            await api.addExvotoImages(created.id, extra);
          } catch (err) {
            console.error('Error subiendo imágenes extra:', err);
            showToast('Exvoto creado, pero algunas imágenes no se pudieron subir', 'warning');
          }
        } else {
          showToast('Exvoto creado correctamente', 'success');
        }
      }
      handleModalClose();
      setSelectedImages([]);
      await fetchData();
    } catch (error) {
      console.error('Error al guardar exvoto:', error);
      showToast(editingExvoto ? 'Error al actualizar el exvoto' : 'Error al crear el exvoto', 'error');
    }
  };

  // Campos para la búsqueda
  const searchFields: (keyof Exvoto)[] = [
    'internal_id', 'lugar_origen', 'province', 'virgin_or_saint', 'epoch',
    'benefited_name', 'offerer_name', 'offerer_gender',
    'offerer_relation', 'characters', 'profession',
    'social_status', 'miracle', 'miracle_place',
    'material', 'dimensions', 'text_case', 'text_form',
    'writing_type', 'linguistic_competence', 'references',
    'conservation_status', 'extra_info', 'transcription'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Exvoto[], _matchingIndexes: number[], query: string) => {
    setFilteredExvotos(filtered);
    setSearchQuery(query);
  }, []);
  
  // Manejar consulta de búsqueda para ExcelTable
  const handleSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    // Obtener resultados del ExcelTable si está disponible
    if (excelTableRef.current) {
      const results = excelTableRef.current.getSearchResults();
      setSearchResults(results);
    }
  }, []);
  
  // Manejar navegación a resultado
  const handleNavigateToResult = useCallback((index: number) => {
    if (searchResults[index] && excelTableRef.current) {
      const result = searchResults[index];
      excelTableRef.current.selectCell(result.rowIndex, result.columnKey);
    }
  }, [searchResults]);

  const renderFormField = useCallback((label: string, name: keyof typeof newExvotoData, type = 'text', options: { value: any, label: string }[] = []) => {
    const value = newExvotoData[name] ?? '';
    const commonClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (type === 'textarea') {
      return (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
          <RichTextEditor
            id={name}
            name={name}
            value={String(value ?? '')}
            onChange={(newValue) => {
              const event = { target: { name, value: newValue } } as React.ChangeEvent<any>;
              handleFormChange(event);
            }}
            rows={3}
          />
        </div>
      );
    }
    if (type === 'select') {
      const isSemField = name === 'offering_sem_id' || name === 'conservation_sem_id';
      return (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
          <div className="flex items-center gap-2">
            <select id={name} name={name} value={value ?? ''} onChange={handleFormChange} className={commonClass}>
              <option value="">-- Seleccionar --</option>
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {isSemField && (
              <button
                type="button"
                onClick={() => {
                  setSemFieldTarget(name as 'offering_sem_id' | 'conservation_sem_id');
                  setNewSemQuick(getInitialQuickSem());
                  setIsSemModalOpen(true);
                }}
                className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Añadir SEM"
                aria-label="Añadir SEM"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      );
    }
    if (type === 'tagselect') {
      return (
        <TagSelect
          key={name}
          name={name}
          value={String(value ?? '')}
          onChange={handleFormChange}
          options={characters}
          placeholder="Seleccionar personajes..."
          className="mt-1"
        />
      );
    }
    if (type === 'epoch') {
      return (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
          <EpochSelector
            value={String(value ?? '')}
            onChange={(epochValue) => {
              const event = { target: { name, value: epochValue } } as React.ChangeEvent<any>;
              handleFormChange(event);
            }}
            placeholder="Seleccionar época..."
            className="mt-1"
          />
        </div>
      );
    }
    return (
      <div key={name}>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        <input type={type} id={name} name={name} value={value ?? ''} onChange={handleFormChange} className={commonClass} />
      </div>
    );
  }, [newExvotoData, characters]);

  if (loading) return <div className="text-center p-8">Cargando datos...</div>;

return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-700">Gestión de Exvotos</h1>
          <button onClick={handleOpenModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-start md:self-center">
            <PlusIcon className="w-5 h-5 mr-2" /> Añadir Exvoto
          </button>
        </div>
        
        <SearchBar
          data={exvotos}
          searchFields={searchFields}
          columns={columns}
          onFilteredDataChange={handleFilteredDataChange}
          onSearchQuery={handleSearchQuery}
          onNavigateToResult={handleNavigateToResult}
          excelTableRef={excelTableRef as React.RefObject<{ selectCell: (rowIndex: number, columnKey: string) => void }>}
          searchResults={searchResults}
          placeholder="Buscar en exvotos (ID, provincia, beneficiado, oferente, milagro, etc.)..."
          className="w-full"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingExvoto ? 'Editar Exvoto' : 'Añadir Nuevo Exvoto'}
        shouldConfirmOnClose
        hasUnsavedChanges={hasUnsaved}
        confirmMessage="Tienes cambios sin guardar. ¿Descartarlos?"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderFormField('ID Interno', 'internal_id')}
            {renderFormField('SEM Ofrenda', 'offering_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('Lugar Origen Devoto/a', 'lugar_origen')}
            {renderFormField('SEM Conservación', 'conservation_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('Provincia', 'province')}
            {renderFormField('Divinidad', 'virgin_or_saint')}
            {renderFormField('Fecha Exvoto', 'exvoto_date', 'text')}
            {renderFormField('Época (25 años)', 'epoch', 'epoch')}
            {renderFormField('Nombre Beneficiado', 'benefited_name')}
            {renderFormField('Nombre Oferente', 'offerer_name')}
            {renderFormField('Género Oferente', 'offerer_gender', 'select', [
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Femenino', label: 'Femenino' },
              { value: 'Ambos', label: 'Ambos' },
              { value: 'Desconocido', label: 'Desconocido' }
            ])}
            {renderFormField('Relación Oferente', 'offerer_relation')}
            {renderFormField('Personajes', 'characters', 'tagselect')}
            {renderFormField('Profesión', 'profession')}
            {renderFormField('Subalternidad', 'social_status')}
            {renderFormField('Milagro', 'miracle', 'select', miracles.map(m => ({ value: m.name, label: m.name })))}
            {renderFormField('Lugar del Milagro', 'miracle_place')}
            {renderFormField('Soporte Material', 'material')}
            {renderFormField('Dimensiones', 'dimensions')}
            {renderFormField('Uso Capitales', 'text_case')}
            <div className="md:col-span-2 lg:col-span-3">{renderFormField('Competencia Gráfica (Forma de Texto)', 'text_form', 'textarea')}</div>
            {renderFormField('Estado de Conservación', 'conservation_status')}
            <div className="md:col-span-2 lg:col-span-3">{renderFormField('Tipo de Escritura', 'writing_type', 'textarea')}</div>
            <div className="md:col-span-2 lg:col-span-3">{renderFormField('Competencia Lingüística', 'linguistic_competence', 'textarea')}</div>
            <div className="md:col-span-2 lg:col-span-3">{renderFormField('Referencias', 'references', 'textarea')}</div>
            {renderFormField('Información Extra', 'extra_info', 'textarea')}
            {renderFormField('Transcripción', 'transcription', 'textarea')}
            {/* Campo de imagen */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700">Imagen</label>
              <div className="mt-2 flex items-center gap-4 flex-wrap">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    // Validar tipos permitidos
                    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
                    const invalid = files.filter(f => !allowed.includes((f as any).type?.toLowerCase?.() || ''));
                    if (invalid.length > 0) {
                      alert('Solo se permiten imágenes JPG, JPEG o PNG.');
                      return;
                    }
                    Promise.all(
                      files.map(
                        (file) =>
                          new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          })
                      )
                    )
                      .then((urls) => {
                        setSelectedImages(urls);
                        setNewExvotoData((prev) => ({ ...prev, image: urls[0] || null })); // primera como portada
                        setHasUnsaved(true);
                      })
                      .catch((err) => {
                        console.error('Error leyendo imágenes:', err);
                        showToast('Error al leer las imágenes seleccionadas', 'error');
                      });
                  }}
                  className="block text-sm text-slate-700"
                />
                {selectedImages.length > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedImages.map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={getImageSrc(imgSrc)}
                        alt={`Vista previa ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded border border-gray-200 bg-white"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImages([]);
                        setNewExvotoData((prev) => ({ ...prev, image: null }));
                      }}
                      className="px-3 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
                    >Quitar imágenes</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
            <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              {editingExvoto ? "Actualizar Exvoto" : "Guardar Exvoto"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal rápido para crear SEM */}
      <Modal isOpen={isSemModalOpen} onClose={() => setIsSemModalOpen(false)} title="Añadir SEM">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (!newSemQuick.name || newSemQuick.name.trim() === '') {
                showToast('El nombre del SEM es obligatorio', 'warning');
                return;
              }
              const created = await api.createSem(newSemQuick);
              setSems(prev => [...prev, created]);
              if (semFieldTarget) {
                setNewExvotoData(prev => ({ ...prev, [semFieldTarget]: created.id }));
              }
              setIsSemModalOpen(false);
              showToast('SEM creado correctamente', 'success');
            } catch (err) {
              console.error('Error al crear SEM rápido:', err);
              showToast('Error al crear el SEM', 'error');
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="quick_sem_name">Nombre</label>
              <input
                id="quick_sem_name"
                name="name"
                value={newSemQuick.name ?? ''}
                onChange={(e) => setNewSemQuick(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nombre del SEM"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="quick_sem_region">Región</label>
              <input
                id="quick_sem_region"
                name="region"
                value={newSemQuick.region ?? ''}
                onChange={(e) => setNewSemQuick(prev => ({ ...prev, region: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Región"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="quick_sem_province">Provincia</label>
              <input
                id="quick_sem_province"
                name="province"
                value={newSemQuick.province ?? ''}
                onChange={(e) => setNewSemQuick(prev => ({ ...prev, province: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Provincia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="quick_sem_town">Población</label>
              <input
                id="quick_sem_town"
                name="town"
                value={newSemQuick.town ?? ''}
                onChange={(e) => setNewSemQuick(prev => ({ ...prev, town: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Población"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="quick_sem_divinity">Divinidad asociada</label>
              <input
                id="quick_sem_divinity"
                name="associated_divinity"
                value={newSemQuick.associated_divinity ?? ''}
                onChange={(e) => setNewSemQuick(prev => ({ ...prev, associated_divinity: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Divinidad asociada (opcional)"
              />
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <button type="button" onClick={() => setIsSemModalOpen(false)} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Guardar SEM</button>
          </div>
        </form>
      </Modal>

      <ExcelTable<Exvoto>
        ref={excelTableRef}
        data={filteredExvotos.length > 0 || searchQuery ? filteredExvotos : exvotos}
        columns={columns}
        searchQuery={searchQuery}
        pageId="exvotos"
        onEdit={(_rowIndex, _columnKey, data) => {
          handleEditExvoto(data.id);
        }}
        onView={(_rowIndex, _columnKey, data) => {
          navigate(`/exvoto/${data.id}`);
        }}
        onViewNewTab={(_rowIndex, _columnKey, data) => {
          window.open(`/exvoto/${data.id}`, '_blank');
        }}
        onInspect={(_rowIndex, _columnKey, data) => {
          // Navegar a detalle en vez de hacer console.log
          navigate(`/exvoto/${data.id}`);
        }}
        onPrint={() => {
          window.print();
        }}
        onExport={() => {
          showToast('Exportación no implementada aún', 'warning');
        }}
        onNavigateSem={() => navigate('/sems')}
        onNavigateCatalog={() => navigate('/catalog')}
        onNavigateExvotos={() => navigate('/exvotos')}
        onNavigateDivinities={() => navigate('/divinities')}
        onNavigateCharacters={() => navigate('/characters')}
        onNavigateMiracles={() => navigate('/miracles')}
        onNavigateToReference={(type, id) => {
          if (type === 'sem') {
            navigate(`/sem/${id}`);
          } else if (type === 'catalog') {
            navigate(`/catalog/${id}`);
          }
        }}
        onNavigateToReferenceNewTab={(type, id) => {
          if (type === 'sem') {
            window.open(`/sem/${id}`, '_blank');
          } else if (type === 'catalog') {
            window.open(`/catalog/${id}`, '_blank');
          }
        }}
        blockNavigation={isModalOpen || isSemModalOpen}
        idField="id"
        enableKeyboardNavigation={true}
        onRowUpdate={handleUpdate}
        onCreateEmpty={handleCreateEmpty}
        onDuplicateRow={handleDuplicate}
        className="mt-4"
      />

      {/* Controles de paginación */}
      {!searchQuery && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-sm text-slate-600">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} exvotos
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ««
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              « Anterior
            </button>
            <span className="px-4 py-2 text-sm text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente »
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Toast de feedback unificado */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          {toast.type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.type === 'warning' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ExvotoPage;
