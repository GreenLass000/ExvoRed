
import React, { useState, useEffect, useCallback } from 'react';
import { DataTable, ColumnDef } from '../components/DataTable';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import { Catalog } from '../types';
import * as api from '../services/mockApi';

const getInitialCatalogData = (): Omit<Catalog, 'id'> => ({
    title: '',
    reference: '',
    author: '',
    publication_year: new Date().getFullYear(),
    publication_place: '',
    catalog_location: '',
    exvoto_count: 0,
    related_places: '',
    location_description: '',
    comments: ''
});

const columns: ColumnDef<Catalog>[] = [
    { key: 'title', header: 'Título' },
    { key: 'reference', header: 'Referencia' },
    { key: 'author', header: 'Autor' },
    { key: 'publication_year', header: 'Año Pub.', type: 'number' },
    { key: 'publication_place', header: 'Lugar Pub.' },
    { key: 'exvoto_count', header: 'Nº Exvotos', type: 'number' },
    { key: 'actions', header: 'Acciones' },
];

const CatalogPage: React.FC = () => {
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCatalogData, setNewCatalogData] = useState<Omit<Catalog, 'id'>>(getInitialCatalogData());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getCatalogs();
            setCatalogs(data);
        } catch (error) {
            console.error("Error fetching catalogs:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = () => {
        setNewCatalogData(getInitialCatalogData());
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let finalValue: string | number | null = value;
        
        if (type === 'number') {
            finalValue = value ? Number(value) : 0;
        }

        setNewCatalogData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.createCatalog(newCatalogData);
        handleModalClose();
        await fetchData();
    };

    const handleUpdate = async (id: number, data: Partial<Catalog>) => {
        const updatedCatalog = await api.updateCatalog(id, data);
        if (updatedCatalog) {
            setCatalogs(prev => prev.map(c => c.id === id ? { ...c, ...updatedCatalog } : c));
        }
    };
    
    const handleDelete = async (id: number) => {
        await api.deleteCatalog(id);
        setCatalogs(prev => prev.filter(c => c.id !== id));
    };

    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }

    const renderFormField = (label: string, name: keyof Omit<Catalog, 'id'>, type = 'text') => {
        const commonClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
        const value = newCatalogData[name] ?? '';

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
                ) : (
                    <input
                        type={type}
                        name={name}
                        id={name}
                        value={value as string | number}
                        onChange={handleFormChange}
                        className={commonClass}
                    />
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-700">Gestión de Catálogos</h1>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Añadir Catálogo
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Añadir Nuevo Catálogo">
                <form onSubmit={handleFormSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderFormField('Título', 'title')}
                        {renderFormField('Referencia', 'reference')}
                        {renderFormField('Autor', 'author')}
                        {renderFormField('Año de Publicación', 'publication_year', 'number')}
                        {renderFormField('Lugar de Publicación', 'publication_place')}
                        {renderFormField('Ubicación del Catálogo', 'catalog_location')}
                        {renderFormField('Número de Exvotos', 'exvoto_count', 'number')}
                        {renderFormField('Lugares Relacionados', 'related_places')}
                        <div className="md:col-span-2">
                            {renderFormField('Descripción de Ubicación', 'location_description', 'textarea')}
                        </div>
                        <div className="md:col-span-2">
                            {renderFormField('Comentarios', 'comments', 'textarea')}
                        </div>
                    </div>
                    <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
                        <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Guardar Catálogo</button>
                    </div>
                </form>
            </Modal>

            <DataTable<Catalog> 
                data={catalogs} 
                columns={columns}
                onRowUpdate={handleUpdate}
                onRowDelete={handleDelete}
            />
        </div>
    );
};

export default CatalogPage;
