import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable, ExcelTableRef } from '../components/excel';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import RichTextEditor from '../components/RichTextEditor';
import { PlusIcon } from '../components/icons';
import * as api from '../services/api';
import { Divinity } from '../types';
import { useNewShortcut } from '../hooks/useGlobalShortcut';

const getInitialDivinityData = (): Omit<Divinity, 'id'> => ({
  name: '',
  attributes: null,
  history: null,
  representation: null,
  representation_image: null,
  comments: null
});

const columns: ColumnDef<Divinity>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'attributes', header: 'Atributos/Especialidad', type: 'richtext' },
  { key: 'history', header: 'Historia', type: 'richtext' },
  { key: 'representation', header: 'Representación', type: 'richtext' },
  { key: 'comments', header: 'Comentarios', type: 'richtext' }
];

const DivinitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [divinities, setDivinities] = useState<Divinity[]>([]);
  const [filteredDivinities, setFilteredDivinities] = useState<Divinity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 50;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivinity, setEditingDivinity] = useState<Divinity | null>(null);
  const [newDivinityData, setNewDivinityData] = useState<Omit<Divinity, 'id'>>(getInitialDivinityData());
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Refs y estado para integración SearchBar-ExcelTable
  const excelTableRef = useRef<ExcelTableRef>(null);
  const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);

  // Atajo 'n' para crear nueva divinidad
  useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await api.getDivinities(page, itemsPerPage);

      setDivinities(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      console.error('Error fetching divinities:', error);
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
    if (editId && divinities.length > 0) {
      const divinityId = parseInt(editId, 10);
      const divinity = divinities.find(d => d.id === divinityId);
      if (divinity) {
        // Open edit modal
        handleEditDivinity(divinityId);

        // Clean URL parameter
        setSearchParams({});
      }
    }
  }, [searchParams, divinities, setSearchParams]);

  const handleOpenModal = () => {
    setEditingDivinity(null);
    setNewDivinityData(getInitialDivinityData());
    setIsModalOpen(true);
    setHasUnsaved(false);
  };

  const handleEditDivinity = (id: number) => {
    const divinity = divinities.find(d => d.id === id);
    if (divinity) {
      const { id: _, ...rest } = divinity;
      setEditingDivinity(divinity);
      setNewDivinityData({ ...rest });
      setIsModalOpen(true);
      setHasUnsaved(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDivinity(null);
    setHasUnsaved(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDivinityData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    setHasUnsaved(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDivinity) {
        await api.updateDivinity(editingDivinity.id, newDivinityData);
        showToast('Divinidad actualizada correctamente', 'success');
      } else {
        await api.createDivinity(newDivinityData);
        showToast('Divinidad creada correctamente', 'success');
      }
      handleModalClose();
      await fetchData();
    } catch (error) {
      console.error('Error saving divinity:', error);
      showToast('Error al guardar la divinidad', 'error');
    }
  };

  const handleUpdate = async (id: number, data: Partial<Divinity>) => {
    try {
      const updatedDivinity = await api.updateDivinity(id, data);
      if (updatedDivinity) {
        setDivinities(prev => prev.map(d => d.id === id ? { ...d, ...updatedDivinity } : d));
        showToast('Cambios guardados correctamente', 'success');
      }
    } catch (error) {
      console.error('Error updating divinity:', error);
      showToast('Error al actualizar la divinidad', 'error');
    }
  };

  const handleCreateEmpty = async () => {
    try {
      const emptyDivinity = {
        ...getInitialDivinityData(),
        name: '(Nueva Divinidad)' // Nombre por defecto requerido por la BD
      };
      const created = await api.createDivinity(emptyDivinity);

      // Actualizar estado local sin recargar, manteniendo el orden por updated_at
      setDivinities(prev => {
        const newList = [...prev, created];
        return newList.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      });
      showToast('Nueva fila vacía creada', 'success');
    } catch (error) {
      console.error("Error creating empty divinity:", error);
      showToast('Error al crear fila vacía', 'error');
    }
  };

  const handleDuplicate = async (divinity: Divinity) => {
    try {
      const { id, ...divinityData } = divinity;
      const duplicated = await api.createDivinity(divinityData);

      // Actualizar estado local sin recargar, manteniendo el orden por updated_at
      setDivinities(prev => {
        const newList = [...prev, duplicated];
        return newList.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      });

      showToast('Divinidad duplicada correctamente', 'success');
    } catch (error) {
      console.error("Error duplicating divinity:", error);
      showToast('Error al duplicar divinidad', 'error');
    }
  };

  // Campos para la búsqueda
  const searchFields: (keyof Divinity)[] = [
    'name', 'attributes', 'history', 'representation', 'comments'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Divinity[], _matchingIndexes: number[], query: string) => {
    setFilteredDivinities(filtered);
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

  if (loading) {
    return <div className="text-center p-8">Cargando datos...</div>;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-700">Divinidades</h1>
          <button
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start md:self-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Añadir Divinidad
          </button>
        </div>
        
        <SearchBar
          data={divinities}
          searchFields={searchFields}
          columns={columns}
          onFilteredDataChange={handleFilteredDataChange}
          onSearchQuery={handleSearchQuery}
          onNavigateToResult={handleNavigateToResult}
          excelTableRef={excelTableRef as React.RefObject<{ selectCell: (rowIndex: number, columnKey: string) => void }>}
          searchResults={searchResults}
          placeholder="Buscar en divinidades (nombre, atributos, historia, representación, etc.)..."
          className="w-full"
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingDivinity ? 'Editar Divinidad' : 'Añadir Nueva Divinidad'} shouldConfirmOnClose hasUnsavedChanges={hasUnsaved} confirmMessage="Tienes cambios sin guardar. ¿Descartarlos?">
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nombre</label>
              <input
                type="text"
                name="name"
                value={newDivinityData.name || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Atributos / Especialidad</label>
              <RichTextEditor
                name="attributes"
                value={newDivinityData.attributes || ''}
                onChange={(newValue) => {
                  const event = { target: { name: 'attributes', value: newValue } } as React.ChangeEvent<any>;
                  handleFormChange(event);
                }}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Historia</label>
              <RichTextEditor
                name="history"
                value={newDivinityData.history || ''}
                onChange={(newValue) => {
                  const event = { target: { name: 'history', value: newValue } } as React.ChangeEvent<any>;
                  handleFormChange(event);
                }}
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Representación</label>
              <RichTextEditor
                name="representation"
                value={newDivinityData.representation || ''}
                onChange={(newValue) => {
                  const event = { target: { name: 'representation', value: newValue } } as React.ChangeEvent<any>;
                  handleFormChange(event);
                }}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Comentarios</label>
              <RichTextEditor
                name="comments"
                value={newDivinityData.comments || ''}
                onChange={(newValue) => {
                  const event = { target: { name: 'comments', value: newValue } } as React.ChangeEvent<any>;
                  handleFormChange(event);
                }}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              {editingDivinity ? 'Actualizar Divinidad' : 'Guardar Divinidad'}
            </button>
          </div>
        </form>
      </Modal>

      <ExcelTable<Divinity>
        ref={excelTableRef}
        data={filteredDivinities.length > 0 || searchQuery ? filteredDivinities : divinities}
        columns={columns}
        searchQuery={searchQuery}
        pageId="divinities"
        onEdit={(_rowIndex, _columnKey, data) => {
          handleEditDivinity(data.id);
        }}
        onView={(_rowIndex, _columnKey, data) => {
          // Navegar a la página de detalles
          navigate(`/divinity/${data.id}`);
        }}
        onViewNewTab={(_rowIndex, _columnKey, data) => {
          // Abrir detalles en nueva pestaña
          window.open(`/divinity/${data.id}`, '_blank');
        }}
        onInspect={(_rowIndex, _columnKey, data) => {
          navigate(`/divinity/${data.id}`);
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
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} divinidades
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

export default DivinitiesPage;
