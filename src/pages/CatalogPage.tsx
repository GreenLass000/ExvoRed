
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable, ExcelTableRef } from '../components/excel';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import { Catalog, Sem, CatalogSem } from '../types';
import * as api from '../services/api';
import { calculateCatalogStatistics } from '../utils';
import { useNewShortcut } from '../hooks/useGlobalShortcut';

const getInitialCatalogData = (): Omit<Catalog, 'id'> => ({
    title: '',
    reference: '',
    author: '',
    publication_year: new Date().getFullYear(),
    publication_place: '',
    catalog_location: '',
    exvoto_count: 0,
    location_description: '',
    oldest_exvoto_date: null,
    newest_exvoto_date: null,
    other_exvotos: '',
    numero_exvotos: null,
    comments: ''
});

const columns: ColumnDef<Catalog>[] = [
    { key: 'title', header: 'Título' },
    { key: 'reference', header: 'Referencia' },
    { key: 'author', header: 'Autor' },
    { key: 'publication_year', header: 'Año Publicación', type: 'number' },
    { key: 'publication_place', header: 'Lugar Publicación' },
    { key: 'catalog_location', header: 'Ubicación del Catálogo' },
    { key: 'exvoto_count', header: 'Nº Exvotos', type: 'number' },
    { key: 'location_description', header: 'Descripción Ubicación', type: 'truncated' },
    { key: 'oldest_exvoto_date', header: 'Fecha Más Antigua', type: 'date' },
    { key: 'newest_exvoto_date', header: 'Fecha Más Reciente', type: 'date' },
    { key: 'other_exvotos', header: 'Otros Exvotos', type: 'truncated' },
    { key: 'numero_exvotos', header: 'Nº Total Exvotos', type: 'number' },
    { key: 'comments', header: 'Comentarios', type: 'truncated' }
];

const CatalogPage: React.FC = () => {
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [filteredCatalogs, setFilteredCatalogs] = useState<Catalog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [catalogSems, setCatalogSems] = useState<CatalogSem[]>([]);
    const [sems, setSems] = useState<Sem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
    const [newCatalogData, setNewCatalogData] = useState<Omit<Catalog, 'id'>>(getInitialCatalogData());
    const [hasUnsaved, setHasUnsaved] = useState(false);
    const [duplicateToast, setDuplicateToast] = useState<string | null>(null);

    // Refs y estado para integración SearchBar-ExcelTable
    const excelTableRef = useRef<ExcelTableRef>(null);
    const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);

    // Atajo 'n' para crear nuevo catálogo
    useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const getProvincesByCatalogId = useCallback((catalogId: number) => {
        const semIds = catalogSems.filter(cs => cs.catalog_id === catalogId).map(cs => cs.sem_id);
        const provinces = sems.filter(sem => semIds.includes(sem.id)).map(sem => sem.province ?? '').filter(Boolean);
        return provinces.length > 0 ? provinces.join(', ') : "No disponible";
    }, [catalogSems, sems]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, catalogSemsData, semData] = await Promise.all([
                api.getCatalogs(),
                api.getCatalogSems(),
                api.getSems()
            ]);

            // Calcular estadísticas dinámicamente para cada catálogo
            const catalogsWithStats = await Promise.all(
                data.map(async (catalog) => {
                    const stats = await calculateCatalogStatistics(catalog.id);
                    return {
                        ...catalog,
                        exvoto_count: stats.exvoto_count,
                        related_places: stats.related_places
                    };
                })
            );

            // Ordenar por updated_at descendente (últimos modificados primero)
            const sortedCatalogs = catalogsWithStats.sort((a, b) => {
                const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return dateB - dateA;
            });

            setCatalogs(sortedCatalogs);
            setCatalogSems(catalogSemsData);
            setSems(semData);
        } catch (error) {
            console.error("Error fetching catalogs or SEMs:", error);
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
        if (editId && catalogs.length > 0) {
            const catalogId = parseInt(editId, 10);
            const catalog = catalogs.find(c => c.id === catalogId);
            if (catalog) {
                // Open edit modal
                setEditingCatalog(catalog);
                setNewCatalogData({
                    title: catalog.title,
                    reference: catalog.reference,
                    author: catalog.author,
                    publication_year: catalog.publication_year,
                    publication_place: catalog.publication_place,
                    catalog_location: catalog.catalog_location,
                    exvoto_count: catalog.exvoto_count,
                    location_description: catalog.location_description,
                    oldest_exvoto_date: catalog.oldest_exvoto_date,
                    newest_exvoto_date: catalog.newest_exvoto_date,
                    other_exvotos: catalog.other_exvotos,
                    numero_exvotos: catalog.numero_exvotos,
                    comments: catalog.comments
                });
                setIsModalOpen(true);
                
                // Clean URL parameter
                setSearchParams({});
            }
        }
    }, [searchParams, catalogs, setSearchParams]);

    const handleOpenModal = () => {
        setEditingCatalog(null);
        setNewCatalogData(getInitialCatalogData());
        setIsModalOpen(true);
        setHasUnsaved(false);
    };

    const handleEditCatalog = (id: number) => {
        const catalog = catalogs.find(c => c.id === id);
        if (catalog) {
            setEditingCatalog(catalog);
            setNewCatalogData({
                title: catalog.title,
                reference: catalog.reference,
                author: catalog.author,
                publication_year: catalog.publication_year,
                publication_place: catalog.publication_place,
                catalog_location: catalog.catalog_location,
                exvoto_count: catalog.exvoto_count,
                location_description: catalog.location_description,
                oldest_exvoto_date: catalog.oldest_exvoto_date,
                newest_exvoto_date: catalog.newest_exvoto_date,
                other_exvotos: catalog.other_exvotos,
                numero_exvotos: catalog.numero_exvotos,
                comments: catalog.comments
            });
            setIsModalOpen(true);
            setHasUnsaved(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingCatalog(null);
        setHasUnsaved(false);
    };

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let finalValue: string | number | null = value;
        
        if (type === 'number') {
            finalValue = value ? Number(value) : 0;
        }

        setNewCatalogData(prev => ({
            ...prev,
            [name]: finalValue
        }));
        setHasUnsaved(true);
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCatalog) {
            await api.updateCatalog(editingCatalog.id, newCatalogData);
        } else {
            await api.createCatalog(newCatalogData);
        }
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

    const handleViewDetail = (id: number) => {
        navigate(`/catalog/${id}`);
    };

    const handleCreateEmpty = async () => {
        try {
            const emptyCatalog = getInitialCatalogData();
            const created = await api.createCatalog(emptyCatalog);
            setCatalogs(prev => [...prev, created]);
            await fetchData();
        } catch (error) {
            console.error("Error creating empty catalog:", error);
        }
    };

    const handleDuplicate = async (catalog: Catalog) => {
        try {
            const { id, ...catalogData } = catalog;
            const duplicated = await api.createCatalog(catalogData);

            // Actualizar estado local sin recargar, manteniendo el orden por updated_at
            setCatalogs(prev => {
                const newList = [...prev, duplicated];
                return newList.sort((a, b) => {
                    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                    return dateB - dateA;
                });
            });

            // Mostrar feedback
            setDuplicateToast('Catálogo duplicado correctamente');
            setTimeout(() => setDuplicateToast(null), 3000);
        } catch (error) {
            console.error("Error duplicating catalog:", error);
            setDuplicateToast('Error al duplicar catálogo');
            setTimeout(() => setDuplicateToast(null), 3000);
        }
    };

    // Campos para la búsqueda
    const searchFields: (keyof Catalog)[] = [
        'title', 'reference', 'author', 'publication_place', 
        'catalog_location', 'location_description', 'other_exvotos', 'comments'
    ];

    // Handle de filtrado desde SearchBar
    const handleFilteredDataChange = useCallback((filtered: Catalog[], matchingIndexes: number[], query: string) => {
        setFilteredCatalogs(filtered);
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

    const renderFormField = useCallback((label: string, name: keyof Omit<Catalog, 'id'>, type = 'text') => {
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
    }, [newCatalogData, handleFormChange]);

    if (loading) {
        return <div className="text-center p-8">Cargando datos...</div>;
    }

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <h1 className="text-2xl font-bold text-slate-700">Gestión de Catálogos</h1>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start md:self-center"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Añadir Catálogo
                    </button>
                </div>
                
                <SearchBar
                    data={catalogs}
                    searchFields={searchFields}
                    columns={columns}
                    onFilteredDataChange={handleFilteredDataChange}
                    onSearchQuery={handleSearchQuery}
                    onNavigateToResult={handleNavigateToResult}
                    excelTableRef={excelTableRef}
                    searchResults={searchResults}
                    placeholder="Buscar en catálogos (título, referencia, autor, ubicación, etc.)..."
                    className="w-full"
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingCatalog ? "Editar Catálogo" : "Añadir Nuevo Catálogo"} shouldConfirmOnClose hasUnsavedChanges={hasUnsaved} confirmMessage="Tienes cambios sin guardar. ¿Descartarlos?">
                <form onSubmit={handleFormSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderFormField('Título', 'title')}
                        {renderFormField('Referencia', 'reference')}
                        {renderFormField('Autor', 'author')}
                        {renderFormField('Año de Publicación', 'publication_year', 'number')}
                        {renderFormField('Lugar de Publicación', 'publication_place')}
                        {renderFormField('Ubicación del Catálogo', 'catalog_location')}
                        {renderFormField('Número de Exvotos', 'exvoto_count', 'number')}
                        {renderFormField('Fecha Más Antigua (YYYY-MM-DD o X)', 'oldest_exvoto_date', 'text')}
                        {renderFormField('Fecha Más Reciente (YYYY-MM-DD o X)', 'newest_exvoto_date', 'text')}
                        {renderFormField('Número Total Exvotos', 'numero_exvotos', 'number')}
                        <div className="md:col-span-2">
                            {renderFormField('Descripción de Ubicación', 'location_description', 'textarea')}
                        </div>
                        <div className="md:col-span-2">
                            {renderFormField('Otros Exvotos', 'other_exvotos', 'textarea')}
                        </div>
                        <div className="md:col-span-2">
                            {renderFormField('Comentarios', 'comments', 'textarea')}
                        </div>
                    </div>
                    <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
                        <button type="button" onClick={handleModalClose} className="mr-3 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">{editingCatalog ? "Actualizar Catálogo" : "Guardar Catálogo"}</button>
                    </div>
                </form>
            </Modal>

            <ExcelTable<Catalog>
                ref={excelTableRef}
                data={filteredCatalogs.length > 0 || searchQuery ? filteredCatalogs : catalogs}
                columns={columns.map(col => {
                    if (col.key === 'provinces') {
                        return {
                            ...col,
                            getDisplayValue: (row: Catalog) => getProvincesByCatalogId(row.id)
                        };
                    }
                    return col;
                })}
                searchQuery={searchQuery}
                pageId="catalogs"
                onEdit={(rowIndex, columnKey, data) => {
                  handleEditCatalog(data.id);
                }}
                onView={(rowIndex, columnKey, data) => {
                  navigate(`/catalog/${data.id}`);
                }}
                onViewNewTab={(rowIndex, columnKey, data) => {
                  window.open(`/catalog/${data.id}`, '_blank');
                }}
                onInspect={(rowIndex, columnKey, data) => {
                  console.log('Inspeccionar Catálogo:', data);
                }}
                onPrint={() => {
                  window.print();
                }}
                onExport={() => {
                  console.log('Exportar Catálogos');
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

export default CatalogPage;
