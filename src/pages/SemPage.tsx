// Página SEM corregida: evita uso incorrecto de hooks y estabiliza renderizado

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable, ExcelTableRef } from '../components/excel';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import RichTextEditor from '../components/RichTextEditor';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 100;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSem, setEditingSem] = useState<Sem | null>(null);
  const [newSemData, setNewSemData] = useState<Omit<Sem, 'id'>>(getInitialSemData());
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Refs y estado para integración SearchBar-ExcelTable
  const excelTableRef = useRef<ExcelTableRef>(null);
  const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);

  // Función helper para mostrar mensajes toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Atajo 'n' para crear nuevo SEM
  useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await api.getSems(page, itemsPerPage);

      setSems(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error("Error fetching sems:", error);
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
    try {
      if (editingSem) {
        await api.updateSem(editingSem.id, newSemData);
        showToast('SEM actualizado correctamente', 'success');
      } else {
        await api.createSem(newSemData);
        showToast('SEM creado correctamente', 'success');
      }
      handleModalClose();
      await fetchData();
    } catch (error) {
      console.error('Error al guardar SEM:', error);
      showToast(editingSem ? 'Error al actualizar el SEM' : 'Error al crear el SEM', 'error');
    }
  };

  const handleUpdate = async (id: number, data: Partial<Sem>) => {
    try {
      const updatedSem = await api.updateSem(id, data);
      if (updatedSem) {
        setSems(prev => prev.map(s => s.id === id ? { ...s, ...updatedSem } : s));
        showToast('SEM actualizado correctamente', 'success');
      }
    } catch (error) {
      console.error("Error updating sem:", error);
      showToast('Error al actualizar el SEM', 'error');
    }
  };

  const handleCreateEmpty = async () => {
    try {
      const emptySem = getInitialSemData();
      const created = await api.createSem(emptySem);
      setSems(prev => [...prev, created]);
      await fetchData();
      showToast('Fila vacía creada correctamente', 'success');
    } catch (error) {
      console.error("Error creating empty sem:", error);
      showToast('Error al crear fila vacía', 'error');
    }
  };

  const handleDuplicate = async (sem: Sem) => {
    try {
      const { id, ...semData } = sem;
      const duplicated = await api.createSem(semData);

      // Actualizar estado local sin recargar, manteniendo el orden por updated_at
      setSems(prev => {
        const newList = [...prev, duplicated];
        return newList.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      });

      showToast('SEM duplicado correctamente', 'success');
    } catch (error) {
      console.error("Error duplicating sem:", error);
      showToast('Error al duplicar SEM', 'error');
    }
  };

  // Campos para la búsqueda
  const searchFields: (keyof Sem)[] = [
    'name', 'region', 'province', 'town', 'associated_divinity', 
    'festivity', 'other_exvotos', 'comments', 'references', 'contact'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Sem[], _matchingIndexes: number[], query: string) => {
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
          excelTableRef={excelTableRef as React.RefObject<{ selectCell: (rowIndex: number, columnKey: string) => void }>}
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
        pageId="sems"
        onEdit={(_rowIndex, _columnKey, data) => {
          handleEditSem(data.id);
        }}
        onView={(_rowIndex, _columnKey, data) => {
          navigate(`/sem/${data.id}`);
        }}
        onViewNewTab={(_rowIndex, _columnKey, data) => {
          window.open(`/sem/${data.id}`, '_blank');
        }}
        onInspect={(_rowIndex, _columnKey, data) => {
          // Navegar a detalle en vez de hacer console.log
          navigate(`/sem/${data.id}`);
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
        blockNavigation={isModalOpen}
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
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} SEMs
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

export default SemPage;
