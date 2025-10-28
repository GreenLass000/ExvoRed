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
  { key: 'attributes', header: 'Atributos/Especialidad', type: 'truncated' },
  { key: 'history', header: 'Historia', type: 'truncated' },
  { key: 'representation', header: 'Representación', type: 'truncated' },
  { key: 'comments', header: 'Comentarios', type: 'truncated' }
];

const DivinitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [divinities, setDivinities] = useState<Divinity[]>([]);
  const [filteredDivinities, setFilteredDivinities] = useState<Divinity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivinity, setEditingDivinity] = useState<Divinity | null>(null);
  const [newDivinityData, setNewDivinityData] = useState<Omit<Divinity, 'id'>>(getInitialDivinityData());
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [duplicateToast, setDuplicateToast] = useState<string | null>(null);

  // Refs y estado para integración SearchBar-ExcelTable
  const excelTableRef = useRef<ExcelTableRef>(null);
  const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);

  // Atajo 'n' para crear nueva divinidad
  useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDivinities();

      // Ordenar por updated_at descendente (últimos modificados primero)
      const sortedDivinities = [...data].sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      });

      setDivinities(sortedDivinities);
    } catch (error) {
      console.error('Error fetching divinities:', error);
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
    if (editingDivinity) {
      await api.updateDivinity(editingDivinity.id, newDivinityData);
    } else {
      await api.createDivinity(newDivinityData);
    }
    handleModalClose();
    await fetchData();
  };

  const handleUpdate = async (id: number, data: Partial<Divinity>) => {
    const updatedDivinity = await api.updateDivinity(id, data);
    if (updatedDivinity) {
      setDivinities(prev => prev.map(d => d.id === id ? { ...d, ...updatedDivinity } : d));
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteDivinity(id);
    setDivinities(prev => prev.filter(d => d.id !== id));
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
    } catch (error) {
      console.error("Error creating empty divinity:", error);
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

      // Mostrar feedback
      setDuplicateToast('Divinidad duplicada correctamente');
      setTimeout(() => setDuplicateToast(null), 3000);
    } catch (error) {
      console.error("Error duplicating divinity:", error);
      setDuplicateToast('Error al duplicar divinidad');
      setTimeout(() => setDuplicateToast(null), 3000);
    }
  };

  // Campos para la búsqueda
  const searchFields: (keyof Divinity)[] = [
    'name', 'attributes', 'history', 'representation', 'comments'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Divinity[], matchingIndexes: number[], query: string) => {
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
          excelTableRef={excelTableRef}
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
        onEdit={(rowIndex, columnKey, data) => {
          handleEditDivinity(data.id);
        }}
        onView={(rowIndex, columnKey, data) => {
          // Navegar a la página de detalles
          navigate(`/divinity/${data.id}`);
        }}
        onViewNewTab={(rowIndex, columnKey, data) => {
          // Abrir detalles en nueva pestaña
          window.open(`/divinity/${data.id}`, '_blank');
        }}
        onInspect={(rowIndex, columnKey, data) => {
          // Inspeccionar abre la página de detalles
          navigate(`/divinity/${data.id}`);
        }}
        onPrint={() => {
          window.print();
        }}
        onExport={() => {
          console.log('Exportar Divinidades');
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

      {/* Toast de feedback para duplicación */}
      {duplicateToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {duplicateToast}
        </div>
      )}
    </div>
  );
};

export default DivinitiesPage;
