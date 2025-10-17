
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { PlusIcon, MagnifyingGlassIcon } from '../components/icons';
import * as api from '../services/api';
import { Miracle } from '../types';
import { useNewShortcut } from '../hooks/useGlobalShortcut';

const MiraclesPage: React.FC = () => {
    const navigate = useNavigate();
    const [miracles, setMiracles] = useState<Miracle[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMiracle, setNewMiracle] = useState('');
    const [hasUnsaved, setHasUnsaved] = useState(false);

    // Atajo 'n' para crear nuevo milagro
    useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getMiracles();
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

    // Navegación rápida en esta página: s/c/v/d/p/m
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const target = e.target as HTMLElement | null;
            const isTyping = !!target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable ||
                target.getAttribute('role') === 'textbox'
            );
            if (isTyping) return;

            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    navigate('/sems');
                    break;
                case 'c':
                    e.preventDefault();
                    navigate('/catalog');
                    break;
                case 'v':
                    e.preventDefault();
                    navigate('/exvotos');
                    break;
                case 'd':
                    e.preventDefault();
                    navigate('/divinities');
                    break;
                case 'p':
                    e.preventDefault();
                    navigate('/characters');
                    break;
                case 'm':
                    e.preventDefault();
                    navigate('/miracles');
                    break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [navigate]);

    const handleOpenModal = () => {
        setNewMiracle('');
        setIsModalOpen(true);
        setHasUnsaved(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setNewMiracle('');
        setHasUnsaved(false);
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

    // Función para normalizar texto
    const normalizeText = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
    };

    // Filtrar milagros basado en la búsqueda
    const filteredMiracles = useMemo(() => {
        if (!searchQuery.trim()) {
            return miracles;
        }

        const normalizedQuery = normalizeText(searchQuery);
        return miracles.filter(miracle => 
            normalizeText(miracle.name).includes(normalizedQuery)
        );
    }, [miracles, searchQuery]);

    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h1 className="text-2xl font-bold text-slate-700">Tipos de Milagros (Únicos)</h1>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start md:self-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Añadir Milagro
                    </button>
                </div>
                
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar milagros..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Añadir Nuevo Milagro" shouldConfirmOnClose hasUnsavedChanges={hasUnsaved} confirmMessage="Tienes cambios sin guardar. ¿Descartarlos?">
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label htmlFor="miracle" className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Milagro
                        </label>
                        <input
                            type="text"
                            id="miracle"
                            value={newMiracle}
                            onChange={(e) => { setNewMiracle(e.target.value); setHasUnsaved(true); }}
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
                {searchQuery && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            Mostrando {filteredMiracles.length} de {miracles.length} milagros para "{searchQuery}"
                        </p>
                    </div>
                )}
                {filteredMiracles.length > 0 ? (
                    <ul className="space-y-2">
                        {filteredMiracles.map((miracle) => (
                            <li key={miracle.id} className="flex items-center justify-between text-slate-800 bg-white border rounded px-3 py-2">
                                <span>{miracle.name}</span>
                                <button
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  onClick={async () => {
                                    const ok = confirm('¿Eliminar este milagro?');
                                    if (!ok) return;
                                    try {
                                      await api.deleteMiracle(miracle.id);
                                      await fetchData();
                                    } catch (err) {
                                      console.error('Error deleting miracle:', err);
                                    }
                                  }}
                                >Eliminar</button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>{searchQuery ? `No se encontraron milagros que coincidan con "${searchQuery}"` : 'No se encontraron datos de milagros.'}</p>
                )}
            </div>
        </div>
    );
};

export default MiraclesPage;
