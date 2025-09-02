
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import { PlusIcon, MagnifyingGlassIcon } from '../components/icons';
import * as api from '../services/api';
import { Character } from '../types';

const CharactersPage: React.FC = () => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCharacter, setNewCharacter] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getCharacters();
            setCharacters(data);
        } catch (error) {
            console.error("Error fetching characters:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = () => {
        setNewCharacter('');
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setNewCharacter('');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCharacter.trim()) {
            try {
                await api.createCharacter(newCharacter.trim());
                handleModalClose();
                await fetchData();
            } catch (error) {
                console.error('Error creating character:', error);
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

    // Filtrar personajes basado en la búsqueda
    const filteredCharacters = useMemo(() => {
        if (!searchQuery.trim()) {
            return characters;
        }

        const normalizedQuery = normalizeText(searchQuery);
        return characters.filter(character => 
            normalizeText(character.name).includes(normalizedQuery)
        );
    }, [characters, searchQuery]);

    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h1 className="text-2xl font-bold text-slate-700">Personajes Representados (Únicos)</h1>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start md:self-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Añadir Personaje
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
                        placeholder="Buscar personajes..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Añadir Nuevo Personaje">
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label htmlFor="character" className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre del Personaje
                        </label>
                        <input
                            type="text"
                            id="character"
                            value={newCharacter}
                            onChange={(e) => setNewCharacter(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Virgen María, San José, etc."
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
                            Mostrando {filteredCharacters.length} de {characters.length} personajes para "{searchQuery}"
                        </p>
                    </div>
                )}
                {filteredCharacters.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                        {filteredCharacters.map((character) => (
                            <li key={character.id} className="text-slate-800">{character.name}</li>
                        ))}
                    </ul>
                ) : (
                    <p>{searchQuery ? `No se encontraron personajes que coincidan con "${searchQuery}"` : 'No se encontraron datos de personajes.'}</p>
                )}
            </div>
        </div>
    );
};

export default CharactersPage;
