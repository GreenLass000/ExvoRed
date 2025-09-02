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
import { Exvoto, Sem, Character, Miracle } from '../types';
import { calculateEpochFromDate } from '../utils/epochUtils';
import * as api from '../services/api';
import { useNewShortcut } from '../hooks/useGlobalShortcut';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExvoto, setEditingExvoto] = useState<Exvoto | null>(null);
  const [newExvotoData, setNewExvotoData] = useState<Omit<Exvoto, 'id'>>(getInitialExvotoData());

  // Atajo 'n' para crear nuevo exvoto
  useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });
  
  // Refs y estado para integración SearchBar-ExcelTable
  const excelTableRef = useRef<ExcelTableRef>(null);
  const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [exvotoData, semData, characterData, miracleData] = await Promise.all([
        api.getExvotos(),
        api.getSems(),
        api.getCharacters(),
        api.getMiracles()
      ]);
      setExvotos(exvotoData);
      setSems(semData);
      setCharacters(characterData);
      setMiracles(miracleData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    { key: 'internal_id', header: 'ID Interno' },
    {
      key: 'offering_sem_id',
      header: 'SEM Ofrenda',
      type: 'foreignKey',
      foreignKeyData: sems,
      getDisplayValue: row => getSemDisplayValue(row.offering_sem_id),
      onCellClick: row => row.offering_sem_id && navigate(`/sem/${row.offering_sem_id}`)
    },
    { key: 'lugar_origen', header: 'Lugar de Origen' },
    {
      key: 'conservation_sem_id',
      header: 'SEM Conservación',
      type: 'foreignKey',
      foreignKeyData: sems,
      getDisplayValue: row => getSemDisplayValue(row.conservation_sem_id),
      onCellClick: row => row.conservation_sem_id && navigate(`/sem/${row.conservation_sem_id}`)
    },
    { key: 'province', header: 'Provincia' },
    { key: 'virgin_or_saint', header: 'Virgen/Santo' },
    { key: 'exvoto_date', header: 'Fecha Exvoto', type: 'date' },
    { key: 'epoch', header: 'Época (25 años)' },
    { key: 'benefited_name', header: 'Beneficiado' },
    { key: 'offerer_name', header: 'Oferente' },
    { key: 'offerer_gender', header: 'Género Oferente' },
    { key: 'offerer_relation', header: 'Relación Oferente' },
    { key: 'characters', header: 'Personajes' },
    { key: 'profession', header: 'Profesión' },
    { key: 'social_status', header: 'Estatus Social' },
    { key: 'miracle', header: 'Milagro' },
    { key: 'miracle_place', header: 'Lugar Milagro' },
    { key: 'material', header: 'Material' },
    { key: 'dimensions', header: 'Dimensiones' },
    { key: 'text_case', header: 'Uso Mayúsculas' },
    { key: 'text_form', header: 'Forma del Texto' },
    { key: 'conservation_status', header: 'Estado Conservación' },
    { key: 'extra_info', header: 'Info Extra', type: 'truncated' },
    { key: 'transcription', header: 'Transcripción', type: 'truncated' }
  ], [getSemDisplayValue, navigate]);

  const handleUpdate = async (id: number, data: Partial<Exvoto>) => {
    const updatedExvoto = await api.updateExvoto(id, data);
    if (updatedExvoto) {
      setExvotos(prev => prev.map(e => e.id === id ? { ...e, ...updatedExvoto } : e));
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteExvoto(id);
    setExvotos(prev => prev.filter(e => e.id !== id));
  };

  const handleView = (id: number) => navigate(`/exvoto/${id}`);

  const handleOpenModal = () => {
    setEditingExvoto(null);
    setNewExvotoData(getInitialExvotoData());
    setIsModalOpen(true);
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
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExvoto) {
      await api.updateExvoto(editingExvoto.id, newExvotoData);
    } else {
      await api.createExvoto(newExvotoData);
    }
    handleModalClose();
    await fetchData();
  };

  // Campos para la búsqueda
  const searchFields: (keyof Exvoto)[] = [
    'internal_id', 'lugar_origen', 'province', 'virgin_or_saint', 'epoch', 
    'benefited_name', 'offerer_name', 'offerer_gender', 
    'offerer_relation', 'characters', 'profession', 
    'social_status', 'miracle', 'miracle_place', 
    'material', 'dimensions', 'text_case', 'text_form', 
    'conservation_status', 'extra_info', 'transcription'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Exvoto[], matchingIndexes: number[], query: string) => {
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
          <textarea id={name} name={name} value={value ?? ''} onChange={handleFormChange} className={commonClass} rows={3} />
        </div>
      );
    }
    if (type === 'select') {
      return (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
          <select id={name} name={name} value={value ?? ''} onChange={handleFormChange} className={commonClass}>
            <option value="">-- Seleccionar --</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
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
          excelTableRef={excelTableRef}
          searchResults={searchResults}
          placeholder="Buscar en exvotos (ID, provincia, beneficiado, oferente, milagro, etc.)..."
          className="w-full"
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingExvoto ? 'Editar Exvoto' : 'Añadir Nuevo Exvoto'}>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderFormField('ID Interno', 'internal_id')}
            {renderFormField('SEM Ofrenda', 'offering_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('Lugar de Origen', 'lugar_origen')}
            {renderFormField('SEM Conservación', 'conservation_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('Provincia', 'province')}
            {renderFormField('Virgen o Santo', 'virgin_or_saint')}
            {renderFormField('Fecha Exvoto', 'exvoto_date', 'date')}
            {renderFormField('Época (25 años)', 'epoch', 'epoch')}
            {renderFormField('Nombre Beneficiado', 'benefited_name')}
            {renderFormField('Nombre Oferente', 'offerer_name')}
            {renderFormField('Género Oferente', 'offerer_gender', 'select', [
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Femenino', label: 'Femenino' },
              { value: 'Otro', label: 'Otro' }
            ])}
            {renderFormField('Relación Oferente', 'offerer_relation')}
            {renderFormField('Personajes', 'characters', 'tagselect')}
            {renderFormField('Profesión', 'profession')}
            {renderFormField('Estatus Social', 'social_status')}
            {renderFormField('Milagro', 'miracle', 'select', miracles.map(m => ({ value: m.name, label: m.name })))}
            {renderFormField('Lugar del Milagro', 'miracle_place')}
            {renderFormField('Material', 'material')}
            {renderFormField('Dimensiones', 'dimensions')}
            {renderFormField('Uso de Mayúsculas', 'text_case')}
            {renderFormField('Forma del Texto', 'text_form')}
            {renderFormField('Estado de Conservación', 'conservation_status')}
            {renderFormField('Información Extra', 'extra_info', 'textarea')}
            {renderFormField('Transcripción', 'transcription', 'textarea')}
          </div>
          <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
            <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              {editingExvoto ? "Actualizar Exvoto" : "Guardar Exvoto"}
            </button>
          </div>
        </form>
      </Modal>

      <ExcelTable<Exvoto>
        ref={excelTableRef}
        data={filteredExvotos.length > 0 || searchQuery ? filteredExvotos : exvotos}
        columns={columns}
        searchQuery={searchQuery}
        onEdit={(rowIndex, columnKey, data) => {
          handleEditExvoto(data.id);
        }}
        onView={(rowIndex, columnKey, data) => {
          handleView(data.id);
        }}
        onInspect={(rowIndex, columnKey, data) => {
          console.log('Inspeccionar:', data);
        }}
        onPrint={() => {
          window.print();
        }}
        onExport={() => {
          console.log('Exportar datos');
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
        blockNavigation={isModalOpen}
        idField="id"
        enableKeyboardNavigation={true}
        onRowUpdate={handleUpdate}
        className="mt-4"
      />
    </div>
  );
};

export default ExvotoPage;
