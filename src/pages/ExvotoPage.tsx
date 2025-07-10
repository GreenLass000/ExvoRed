// Mejoras aplicadas:
// - Tipos ajustados para coincidir con el archivo types.ts
// - Evita perder el foco en inputs

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ColumnDef } from '../components/DataTable';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import TagSelect from '../components/TagSelect';
import { Exvoto, Sem, Character, Miracle } from '../types';
import * as api from '../services/api';

const getInitialExvotoData = (): Omit<Exvoto, 'id'> => ({
  internal_id: '',
  offering_sem_id: null,
  origin_sem_id: null,
  conservation_sem_id: null,
  province: '',
  virgin_or_saint: '',
  exvoto_date: new Date().toISOString().split('T')[0],
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
  const [sems, setSems] = useState<Sem[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [miracles, setMiracles] = useState<Miracle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExvoto, setEditingExvoto] = useState<Exvoto | null>(null);
  const [newExvotoData, setNewExvotoData] = useState<Omit<Exvoto, 'id'>>(getInitialExvotoData());
  const navigate = useNavigate();

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
      key: 'offering_sem_id',
      header: 'SEM Ofrenda',
      type: 'clickable',
      getDisplayValue: row => getSemDisplayValue(row.offering_sem_id),
      onCellClick: row => row.offering_sem_id && navigate(`/sem/${row.offering_sem_id}`)
    },
    {
      key: 'conservation_sem_id',
      header: 'SEM Conservación',
      type: 'clickable',
      getDisplayValue: row => getSemDisplayValue(row.conservation_sem_id),
      onCellClick: row => row.conservation_sem_id && navigate(`/sem/${row.conservation_sem_id}`)
    },
    { key: 'virgin_or_saint', header: 'Virgen/Santo' },
    { key: 'exvoto_date', header: 'Fecha Exvoto', type: 'date' },
    { key: 'offerer_gender', header: 'Género Oferente' },
    { key: 'offerer_relation', header: 'Relación Oferente' },
    { key: 'miracle', header: 'Milagro' },
    { key: 'text_form', header: 'Forma del Texto' },
    { key: 'actions', header: 'Acciones' }
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
    setNewExvotoData(prev => ({ ...prev, [name]: value === '' ? null : value }));
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-700">Gestión de Exvotos</h1>
        <button onClick={handleOpenModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <PlusIcon className="w-5 h-5 mr-2" /> Añadir Exvoto
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingExvoto ? 'Editar Exvoto' : 'Añadir Nuevo Exvoto'}>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderFormField('ID Interno', 'internal_id')}
            {renderFormField('SEM Ofrenda', 'offering_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('SEM Origen', 'origin_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('SEM Conservación', 'conservation_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || `SEM #${s.id}` })))}
            {renderFormField('Provincia', 'province')}
            {renderFormField('Virgen o Santo', 'virgin_or_saint')}
            {renderFormField('Fecha Exvoto', 'exvoto_date', 'date')}
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

      <DataTable<Exvoto>
        data={exvotos}
        columns={columns}
        onRowUpdate={handleUpdate}
        onRowDelete={handleDelete}
        onRowView={handleView}
        onRowEdit={handleEditExvoto}
      />
    </div>
  );
};

export default ExvotoPage;
