
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ColumnDef } from '../components/DataTable';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import { Exvoto, Sem } from '../types';
import * as api from '../services/mockApi';

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
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExvotoData, setNewExvotoData] = useState<Omit<Exvoto, 'id'>>(getInitialExvotoData());
    const navigate = useNavigate();


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [exvotoData, semData] = await Promise.all([api.getExvotos(), api.getSems()]);
            setExvotos(exvotoData);
            setSems(semData);
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
            if (sem.id) {
                acc[sem.id] = sem.name || `SEM #${sem.id}`;
            }
            return acc;
        }, {} as Record<number, string>);
    }, [sems]);

    const getSemDisplayValue = useCallback((semId: number | null | undefined) => {
        if (semId === null || semId === undefined) {
            return null;
        }
        return semNameMap[semId] || <span className="text-red-500 text-xs">ID inválido: {semId}</span>;
    }, [semNameMap]);

    const columns: ColumnDef<Exvoto>[] = useMemo(() => [
        { key: 'internal_id', header: 'ID Interno' },
        { 
            key: 'offering_sem_id', 
            header: 'SEM Ofrenda', 
            type: 'foreignKey',
            foreignKeyData: sems,
            getDisplayValue: (row: Exvoto) => getSemDisplayValue(row.offering_sem_id)
        },
        { 
            key: 'origin_sem_id', 
            header: 'SEM Origen', 
            type: 'foreignKey',
            foreignKeyData: sems,
            getDisplayValue: (row: Exvoto) => getSemDisplayValue(row.origin_sem_id)
        },
        { 
            key: 'conservation_sem_id', 
            header: 'SEM Conservación', 
            type: 'foreignKey',
            foreignKeyData: sems,
            getDisplayValue: (row: Exvoto) => getSemDisplayValue(row.conservation_sem_id)
        },
        { key: 'virgin_or_saint', header: 'Virgen/Santo' },
        { key: 'exvoto_date', header: 'Fecha', type: 'date' },
        { key: 'miracle', header: 'Milagro' },
        { key: 'actions', header: 'Acciones' },
    ], [sems, getSemDisplayValue]);
    
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
    
    const handleView = (id: number) => {
        navigate(`/exvoto/${id}`);
    };

    const handleOpenModal = () => {
        setNewExvotoData(getInitialExvotoData());
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let finalValue: string | number | null = value;

        if (type === 'select-one' && (name.includes('_sem_id'))) {
            finalValue = value ? Number(value) : null;
        } else if (value === '') {
            finalValue = null;
        }

        setNewExvotoData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.createExvoto(newExvotoData);
        handleModalClose();
        await fetchData();
    };


    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }
    
    const renderFormField = (label: string, name: keyof Omit<Exvoto, 'id' | 'image'>, type = 'text', options: {value: any, label: string}[] = []) => {
        const commonClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
        const value = newExvotoData[name] ?? '';

        return (
            <div>
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
                 ) : type === 'select' ? (
                     <select
                        name={name}
                        id={name}
                        value={value as string | number}
                        onChange={handleFormChange}
                        className={commonClass}
                     >
                        <option value="">-- Seleccionar --</option>
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                     </select>
                 ) : (
                     <input
                        type={type}
                        name={name}
                        id={name}
                        value={type === 'date' && value ? String(value).split('T')[0] : value as string | number}
                        onChange={handleFormChange}
                        className={commonClass}
                     />
                 )}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-700">Gestión de Exvotos</h1>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Añadir Exvoto
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Añadir Nuevo Exvoto">
                <form onSubmit={handleFormSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderFormField('ID Interno', 'internal_id')}
                        {renderFormField('SEM Ofrenda', 'offering_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || '' })))}
                        {renderFormField('SEM Origen', 'origin_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || '' })))}
                        {renderFormField('SEM Conservación', 'conservation_sem_id', 'select', sems.map(s => ({ value: s.id, label: s.name || '' })))}
                        {renderFormField('Provincia', 'province')}
                        {renderFormField('Virgen o Santo', 'virgin_or_saint')}
                        {renderFormField('Fecha Exvoto', 'exvoto_date', 'date')}
                        {renderFormField('Nombre Beneficiado', 'benefited_name')}
                        {renderFormField('Nombre Oferente', 'offerer_name')}
                        {renderFormField('Género Oferente', 'offerer_gender', 'select', [{value: 'Masculino', label: 'Masculino'}, {value: 'Femenino', label: 'Femenino'}, {value: 'Otro', label: 'Otro'}])}
                        {renderFormField('Relación Oferente', 'offerer_relation')}
                        {renderFormField('Personajes', 'characters')}
                        {renderFormField('Profesión', 'profession')}
                        {renderFormField('Estatus Social', 'social_status')}
                        {renderFormField('Milagro', 'miracle')}
                        {renderFormField('Lugar del Milagro', 'miracle_place')}
                        {renderFormField('Material', 'material')}
                        {renderFormField('Dimensiones', 'dimensions')}
                        {renderFormField('Uso de Mayúsculas', 'text_case')}
                        {renderFormField('Forma del Texto', 'text_form')}
                        {renderFormField('Estado de Conservación', 'conservation_status')}
                        <div className="md:col-span-2 lg:col-span-3">
                            {renderFormField('Información Extra', 'extra_info', 'textarea')}
                        </div>
                         <div className="md:col-span-2 lg:col-span-3">
                            {renderFormField('Transcripción', 'transcription', 'textarea')}
                        </div>
                    </div>
                    <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
                      <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Guardar Exvoto</button>
                    </div>
                </form>
            </Modal>

            <DataTable<Exvoto> 
                data={exvotos} 
                columns={columns}
                onRowUpdate={handleUpdate}
                onRowDelete={handleDelete}
                onRowView={handleView}
            />
        </div>
    );
};

export default ExvotoPage;