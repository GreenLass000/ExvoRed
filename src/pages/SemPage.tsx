// Página SEM corregida: evita uso incorrecto de hooks y estabiliza renderizado

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ColumnDef } from '../components/DataTable';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import { Sem } from '../types';
import * as api from '../services/api';

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
  comments: '',
  references: '',
  contact: ''
});

const columns: ColumnDef<Sem>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'province', header: 'Provincia' },
  { key: 'associated_divinity', header: 'Divinidad Asociada' },
  { key: 'pictorial_exvoto_count', header: 'Nº Exvotos', type: 'number' },
  { key: 'oldest_exvoto_date', header: 'Fecha más antigua', type: 'date' },
  { key: 'newest_exvoto_date', header: 'Fecha más reciente', type: 'date' },
  { key: 'actions', header: 'Acciones' }
];

const SemPage: React.FC = () => {
  const [sems, setSems] = useState<Sem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSem, setEditingSem] = useState<Sem | null>(null);
  const [newSemData, setNewSemData] = useState<Omit<Sem, 'id'>>(getInitialSemData());
  const navigate = useNavigate();

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

  const handleOpenModal = () => {
    setEditingSem(null);
    setNewSemData(getInitialSemData());
    setIsModalOpen(true);
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
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSemData(prev => ({ ...prev, [name]: value || null }));
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-700">Gestión de SEM (Santuarios, Ermitas, Museos)</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Añadir SEM
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingSem ? "Editar SEM" : "Añadir Nuevo SEM"}>
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

      <DataTable<Sem>
        data={sems}
        columns={columns}
        onRowUpdate={handleUpdate}
        onRowDelete={handleDelete}
        onRowView={handleViewDetail}
        onRowEdit={handleEditSem}
      />
    </div>
  );
};

export default SemPage;
