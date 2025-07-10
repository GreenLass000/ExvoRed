
import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../components/Modal';
import { PlusIcon } from '../components/icons';
import * as api from '../services/mockApi';

const MiraclesPage: React.FC = () => {
    const [miracles, setMiracles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMiracle, setNewMiracle] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getUniqueMiracles();
            setMiracles(data);
        } catch (error) {
            console.error("Error fetching miracles:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = () => {
        setNewMiracle('');
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setNewMiracle('');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMiracle.trim()) {
            try {
                await api.createMiracle(newMiracle.trim());
                handleModalClose();
                await fetchData();
            } catch (error) {
                console.error('Error creating miracle:', error);
            }
        }
    };

    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-700">Tipos de Milagros (Únicos)</h1>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Añadir Milagro
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Añadir Nuevo Milagro">
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label htmlFor="miracle" className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Milagro
                        </label>
                        <input
                            type="text"
                            id="miracle"
                            value={newMiracle}
                            onChange={(e) => setNewMiracle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Curación de enfermedad, Protección, etc."
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={handleModalClose}
                            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white rounded-lg shadow p-6">
                {miracles.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                        {miracles.map((miracle, index) => (
                            <li key={index} className="text-slate-800">{miracle}</li>
                        ))}
                    </ul>
                ) : (
                    <p>No se encontraron datos de milagros.</p>
                )}
            </div>
        </div>
    );
};

export default MiraclesPage;
