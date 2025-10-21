// Página SEM corregida: evita uso incorrecto de hooks y estabiliza renderizado

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable, ExcelTableRef } from '../components/excel';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import { Sem } from '../types';
import * as api from '../services/api';
import { useNewShortcut } from '../hooks/useGlobalShortcut';

const getInitialSemData = (): Omit<Sem, 'id'> => ({
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

const columns: ColumnDef<Sem>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'region', header: 'Región' },
  { key: 'province', header: 'Provincia' },
  { key: 'town', header: 'Población' },
  { key: 'associated_divinity', header: 'Divinidad Asociada' },
  { key: 'festivity', header: 'Festividad' },
  { key: 'pictorial_exvoto_count', header: 'Nº Exvotos Pictóricos', type: 'number' },
  { key: 'oldest_exvoto_date', header: 'Fecha más antigua', type: 'date' },
  { key: 'newest_exvoto_date', header: 'Fecha más reciente', type: 'date' },
  { key: 'other_exvotos', header: 'Otros Exvotos', type: 'truncated' },
  { key: 'numero_exvotos', header: 'Nº Total Exvotos', type: 'number' },
  { key: 'contact', header: 'Contacto' },
  { key: 'comments', header: 'Comentarios', type: 'truncated' },
  { key: 'references', header: 'Referencias', type: 'truncated' }
];

const SemPage: React.FC = () => {
  const [sems, setSems] = useState<Sem[]>([]);
  const [filteredSems, setFilteredSems] = useState<Sem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSem, setEditingSem] = useState<Sem | null>(null);
  const [newSemData, setNewSemData] = useState<Omit<Sem, 'id'>>(getInitialSemData());
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // Refs y estado para integración SearchBar-ExcelTable
  const excelTableRef = useRef<ExcelTableRef>(null);
  const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);

  // Atajo 'n' para crear nuevo SEM
  useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSems();
      setSems(data);
    } catch (error) {
      console.error("Error fetching sems:", error);
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
    if (editId && sems.length > 0) {
      const semId = parseInt(editId, 10);
      const sem = sems.find(s => s.id === semId);
      if (sem) {
        // Open edit modal
        const { id: _, ...rest } = sem;
        setEditingSem(sem);
        setNewSemData({ ...rest });
        setIsModalOpen(true);
        
        // Clean URL parameter
        setSearchParams({});
      }
    }
  }, [searchParams, sems, setSearchParams]);

  const handleOpenModal = () => {
    setEditingSem(null);
    setNewSemData(getInitialSemData());
    setIsModalOpen(true);
    setHasUnsaved(false);
  };

  const handleEditSem = (id: number) => {
    const sem = sems.find(s => s.id === id);
    if (sem) {
      const { id: _, ...rest } = sem;
      setEditingSem(sem);
      setNewSemData({ ...rest });
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSem(null);
    setHasUnsaved(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSemData(prev => ({ ...prev, [name]: value || null }));
    setHasUnsaved(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSem) {
      await api.updateSem(editingSem.id, newSemData);
    } else {
      await api.createSem(newSemData);
    }
    handleModalClose();
    await fetchData();
  };

  const handleUpdate = async (id: number, data: Partial<Sem>) => {
    const updatedSem = await api.updateSem(id, data);
    if (updatedSem) {
      setSems(prev => prev.map(s => s.id === id ? { ...s, ...updatedSem } : s));
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteSem(id);
    setSems(prev => prev.filter(s => s.id !== id));
  };

  const handleViewDetail = (id: number) => {
    navigate(`/sem/${id}`);
  };

  // Campos para la búsqueda
  const searchFields: (keyof Sem)[] = [
    'name', 'region', 'province', 'town', 'associated_divinity', 
    'festivity', 'other_exvotos', 'comments', 'references', 'contact'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Sem[], matchingIndexes: number[], query: string) => {
    setFilteredSems(filtered);
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

  const renderFormField = (
    label: string,
    name: keyof Omit<Sem, 'id'>,
    type: 'text' | 'textarea' = 'text'
  ) => {
    const commonClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const value = newSemData[name] ?? '';

    return (
      <div key={name}>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
        {type === 'textarea' ? (
          <textarea
            name={name}
            id={name}
            value={value as string}
            onChange={handleFormChange}
            className={commonClass}
            rows={3}
          />
        ) : (
          <input
            type={type}
            name={name}
            id={name}
            value={value as string}
            onChange={handleFormChange}
            className={commonClass}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center p-8">Cargando datos...</div>;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-700">Gestión de SEM (Santuarios, Ermitas, Museos)</h1>
          <button
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start md:self-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Añadir SEM
          </button>
        </div>
        
        <SearchBar
          data={sems}
          searchFields={searchFields}
          columns={columns}
          onFilteredDataChange={handleFilteredDataChange}
          onSearchQuery={handleSearchQuery}
          onNavigateToResult={handleNavigateToResult}
          excelTableRef={excelTableRef}
          searchResults={searchResults}
          placeholder="Buscar en SEMs (nombre, región, provincia, población, etc.)..."
          className="w-full"
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingSem ? "Editar SEM" : "Añadir Nuevo SEM"} shouldConfirmOnClose hasUnsavedChanges={hasUnsaved} confirmMessage="Tienes cambios sin guardar. ¿Descartarlos?">
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFormField('Nombre', 'name')}
            {renderFormField('Región', 'region')}
            {renderFormField('Provincia', 'province')}
            {renderFormField('Población', 'town')}
            {renderFormField('Divinidad Asociada', 'associated_divinity')}
            {renderFormField('Festividad', 'festivity')}
            {renderFormField('Contacto', 'contact')}
            <div className="md:col-span-2">{renderFormField('Otros Exvotos', 'other_exvotos', 'textarea')}</div>
            <div className="md:col-span-2">{renderFormField('Comentarios', 'comments', 'textarea')}</div>
            <div className="md:col-span-2">{renderFormField('Referencias', 'references', 'textarea')}</div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Información Autocalculada</h4>
            <p className="text-xs text-blue-700">
              El número de exvotos y las fechas más antigua y reciente se calculan automáticamente 
              basándose únicamente en los exvotos que están <strong>conservados</strong> en este SEM.
            </p>
          </div>
          <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
            <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              {editingSem ? "Actualizar SEM" : "Guardar SEM"}
            </button>
          </div>
        </form>
      </Modal>

      <ExcelTable<Sem>
        ref={excelTableRef}
        data={filteredSems.length > 0 || searchQuery ? filteredSems : sems}
        columns={columns}
        searchQuery={searchQuery}
        onEdit={(rowIndex, columnKey, data) => {
          handleEditSem(data.id);
        }}
        onView={(rowIndex, columnKey, data) => {
          window.open(`/sem/${data.id}`, '_blank');
        }}
        onInspect={(rowIndex, columnKey, data) => {
          console.log('Inspeccionar SEM:', data);
        }}
        onPrint={() => {
          window.print();
        }}
        onExport={() => {
          console.log('Exportar SEMs');
        }}
        onNavigateSem={() => navigate('/sems')}
        onNavigateCatalog={() => navigate('/catalog')}
        onNavigateExvotos={() => navigate('/exvotos')}
        onNavigateDivinities={() => navigate('/divinities')}
        onNavigateCharacters={() => navigate('/characters')}
        onNavigateMiracles={() => navigate('/miracles')}
        blockNavigation={isModalOpen}
        idField="id"
        enableKeyboardNavigation={true}
        onRowUpdate={handleUpdate}
        className="mt-4"
      />
    </div>
  );
};

export default SemPage;
