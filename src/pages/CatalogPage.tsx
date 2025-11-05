
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ColumnDef } from '../components/DataTable';
import { ExcelTable, ExcelTableRef } from '../components/excel';
import { PlusIcon } from '../components/icons';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import RichTextEditor from '../components/RichTextEditor';
import { Catalog } from '../types';
import * as api from '../services/api';
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
    { key: 'exvoto_count', header: 'Nº Exvotos', type: 'number', readOnly: true },
    { key: 'related_places', header: 'Lugares Relacionados', readOnly: true },
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
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const itemsPerPage = 50;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
    const [newCatalogData, setNewCatalogData] = useState<Omit<Catalog, 'id'>>(getInitialCatalogData());
    const [hasUnsaved, setHasUnsaved] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Refs y estado para integración SearchBar-ExcelTable
    const excelTableRef = useRef<ExcelTableRef>(null);
    const [searchResults, setSearchResults] = useState<Array<{ rowIndex: number; columnKey: string; content: string }>>([]);

    // Función helper para mostrar mensajes toast
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Atajo 'n' para crear nuevo catálogo
    useNewShortcut({ isModalOpen, onNew: () => handleOpenModal() });

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const fetchData = useCallback(async (page = currentPage) => {
        setLoading(true);
        try {
            // API optimizada: obtiene catálogos con estadísticas en una sola query
            const response = await api.getCatalogs(page, itemsPerPage);

            setCatalogs(response.data);
            setTotalPages(response.pagination.totalPages);
            setTotalRecords(response.pagination.total);
            setCurrentPage(response.pagination.page);
        } catch (error) {
            console.error("Error fetching catalogs:", error);
            showToast('Error al cargar los datos. Por favor, recarga la página.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, currentPage]);

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage]);

    // Función para cambiar de página
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

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
        try {
            if (editingCatalog) {
                await api.updateCatalog(editingCatalog.id, newCatalogData);
                showToast('Catálogo actualizado correctamente', 'success');
            } else {
                await api.createCatalog(newCatalogData);
                showToast('Catálogo creado correctamente', 'success');
            }
            handleModalClose();
            await fetchData();
        } catch (error) {
            console.error('Error al guardar catálogo:', error);
            showToast(editingCatalog ? 'Error al actualizar el catálogo' : 'Error al crear el catálogo', 'error');
        }
    };

    const handleUpdate = async (id: number, data: Partial<Catalog>) => {
        try {
            const updatedCatalog = await api.updateCatalog(id, data);
            if (updatedCatalog) {
                setCatalogs(prev => prev.map(c => c.id === id ? { ...c, ...updatedCatalog } : c));
                showToast('Catálogo actualizado correctamente', 'success');
            }
        } catch (error) {
            console.error("Error updating catalog:", error);
            showToast('Error al actualizar el catálogo', 'error');
        }
    };

    const handleCreateEmpty = async () => {
        try {
            const emptyCatalog = getInitialCatalogData();
            const created = await api.createCatalog(emptyCatalog);
            setCatalogs(prev => [...prev, created]);
            await fetchData();
            showToast('Fila vacía creada correctamente', 'success');
        } catch (error) {
            console.error("Error creating empty catalog:", error);
            showToast('Error al crear fila vacía', 'error');
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

            showToast('Catálogo duplicado correctamente', 'success');
        } catch (error) {
            console.error("Error duplicating catalog:", error);
            showToast('Error al duplicar catálogo', 'error');
        }
    };

    // Campos para la búsqueda
    const searchFields: (keyof Catalog)[] = [
        'title', 'reference', 'author', 'publication_place', 
        'catalog_location', 'location_description', 'other_exvotos', 'comments'
    ];

    // Handle de filtrado desde SearchBar
    const handleFilteredDataChange = useCallback((filtered: Catalog[], _matchingIndexes: number[], query: string) => {
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
                    <RichTextEditor
                        id={name}
                        name={name}
                        value={String(value ?? '')}
                        onChange={(newValue) => {
                            const event = { target: { name, value: newValue } } as React.ChangeEvent<any>;
                            handleFormChange(event);
                        }}
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
                    excelTableRef={excelTableRef as React.RefObject<{ selectCell: (rowIndex: number, columnKey: string) => void }>}
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
                columns={columns}
                searchQuery={searchQuery}
                pageId="catalogs"
                onEdit={(_rowIndex, _columnKey, data) => {
                  handleEditCatalog(data.id);
                }}
                onView={(_rowIndex, _columnKey, data) => {
                  navigate(`/catalog/${data.id}`);
                }}
                onViewNewTab={(_rowIndex, _columnKey, data) => {
                  window.open(`/catalog/${data.id}`, '_blank');
                }}
                onInspect={(_rowIndex, _columnKey, data) => {
                  // Navegar a detalle en vez de hacer console.log
                  navigate(`/catalog/${data.id}`);
                }}
                onPrint={() => {
                  window.print();
                }}
                onExport={() => {
                  showToast('Exportación no implementada aún', 'warning');
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

            {/* Controles de paginación */}
            {!searchQuery && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="text-sm text-slate-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} de {totalRecords} catálogos
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ««
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            « Anterior
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente »
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            »»
                        </button>
                    </div>
                </div>
            )}

            {/* Toast de feedback unificado */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
                    toast.type === 'success' ? 'bg-green-500 text-white' :
                    toast.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                }`}>
                    {toast.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {toast.type === 'error' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.type === 'warning' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default CatalogPage;
