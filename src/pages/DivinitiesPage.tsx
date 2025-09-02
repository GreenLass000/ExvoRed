import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable } from '../components/excel';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import { PlusIcon } from '../components/icons';
import * as api from '../services/api';
import { Divinity } from '../types';

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
  const [divinities, setDivinities] = useState<Divinity[]>([]);
  const [filteredDivinities, setFilteredDivinities] = useState<Divinity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivinity, setEditingDivinity] = useState<Divinity | null>(null);
  const [newDivinityData, setNewDivinityData] = useState<Omit<Divinity, 'id'>>(getInitialDivinityData());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDivinities();
      setDivinities(data);
    } catch (error) {
      console.error('Error fetching divinities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => {
    setEditingDivinity(null);
    setNewDivinityData(getInitialDivinityData());
    setIsModalOpen(true);
  };

  const handleEditDivinity = (id: number) => {
    const divinity = divinities.find(d => d.id === id);
    if (divinity) {
      const { id: _, ...rest } = divinity;
      setEditingDivinity(divinity);
      setNewDivinityData({ ...rest });
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDivinity(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDivinityData(prev => ({ ...prev, [name]: value === '' ? null : value }));
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

  // Campos para la búsqueda
  const searchFields: (keyof Divinity)[] = [
    'name', 'attributes', 'history', 'representation', 'comments'
  ];

  // Handle de filtrado desde SearchBar
  const handleFilteredDataChange = useCallback((filtered: Divinity[], matchingIndexes: number[], query: string) => {
    setFilteredDivinities(filtered);
    setSearchQuery(query);
  }, []);

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
          placeholder="Buscar en divinidades (nombre, atributos, historia, representación, etc.)..."
          className="w-full"
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingDivinity ? 'Editar Divinidad' : 'Añadir Nueva Divinidad'}>
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
              <textarea
                name="attributes"
                value={newDivinityData.attributes || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Historia</label>
              <textarea
                name="history"
                value={newDivinityData.history || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Representación</label>
              <textarea
                name="representation"
                value={newDivinityData.representation || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Comentarios</label>
              <textarea
                name="comments"
                value={newDivinityData.comments || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
        data={filteredDivinities.length > 0 || searchQuery ? filteredDivinities : divinities}
        columns={columns}
        onEdit={(rowIndex, columnKey, data) => {
          handleEditDivinity(data.id);
        }}
        onView={(rowIndex, columnKey, data) => {
          console.log('Ver Divinidad:', data);
        }}
        onInspect={(rowIndex, columnKey, data) => {
          console.log('Inspeccionar Divinidad:', data);
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
        blockNavigation={isModalOpen}
        idField="id"
        enableKeyboardNavigation={true}
        className="mt-4"
      />
    </div>
  );
};

export default DivinitiesPage;
