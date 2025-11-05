import { Sem, Catalog, Exvoto, Character, Miracle, CatalogSem } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

// --- SEM API ---
export const getSems = (page = 1, limit = 100): Promise<PaginatedResponse<Sem>> => {
    return apiCall<PaginatedResponse<Sem>>(`/sems?page=${page}&limit=${limit}`);
};

export const getAllSems = (): Promise<Sem[]> => {
    // Función legacy para obtener todos los SEMs (para dropdowns)
    return apiCall<PaginatedResponse<Sem>>('/sems?page=1&limit=10000').then(res => res.data);
};

export const getSemById = (id: number): Promise<Sem> => {
    return apiCall<Sem>(`/sems/${id}`);
};

export const createSem = (data: Omit<Sem, 'id'>): Promise<Sem> => {
    return apiCall<Sem>('/sems', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateSem = (id: number, data: Partial<Sem>): Promise<Sem> => {
    return apiCall<Sem>(`/sems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteSem = (id: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/sems/${id}`, {
        method: 'DELETE',
    });
};

// --- CATALOG API ---
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const getCatalogs = (page = 1, limit = 50): Promise<PaginatedResponse<Catalog>> => {
    return apiCall<PaginatedResponse<Catalog>>(`/catalogs?page=${page}&limit=${limit}`);
};

export const getAllCatalogs = (): Promise<Catalog[]> => {
    // Función legacy para compatibilidad - obtiene todos los catálogos sin paginar
    return apiCall<PaginatedResponse<Catalog>>('/catalogs?page=1&limit=10000').then(res => res.data);
};

export const getCatalogById = (id: number): Promise<Catalog> => {
    return apiCall<Catalog>(`/catalogs/${id}`);
};

export const createCatalog = (data: Omit<Catalog, 'id'>): Promise<Catalog> => {
    return apiCall<Catalog>('/catalogs', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateCatalog = (id: number, data: Partial<Catalog>): Promise<Catalog> => {
    return apiCall<Catalog>(`/catalogs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteCatalog = (id: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/catalogs/${id}`, {
        method: 'DELETE',
    });
};

// --- EXVOTO API ---
export const getExvotos = (page = 1, limit = 100): Promise<PaginatedResponse<Exvoto>> => {
    return apiCall<PaginatedResponse<Exvoto>>(`/exvotos?page=${page}&limit=${limit}`);
};

export const getAllExvotos = (): Promise<Exvoto[]> => {
    // Función legacy para compatibilidad
    return apiCall<PaginatedResponse<Exvoto>>('/exvotos?page=1&limit=100000').then(res => res.data);
};

export const getExvotoById = (id: number): Promise<Exvoto> => {
    return apiCall<Exvoto>(`/exvotos/${id}`);
};

export const createExvoto = (data: Omit<Exvoto, 'id'>): Promise<Exvoto> => {
    return apiCall<Exvoto>('/exvotos', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateExvoto = (id: number, data: Partial<Exvoto>): Promise<Exvoto> => {
    return apiCall<Exvoto>(`/exvotos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteExvoto = (id: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/exvotos/${id}`, {
        method: 'DELETE',
    });
};

// --- EXVOTO IMAGES API ---
import { ExvotoImage } from '../types';
export const addExvotoImages = (exvotoId: number, images: string[], captions?: (string | null)[]): Promise<ExvotoImage[]> => {
    return apiCall<ExvotoImage[]>(`/exvotos/${exvotoId}/images`, {
        method: 'POST',
        body: JSON.stringify({ images, captions }),
    });
};

export const getExvotoImages = (exvotoId: number): Promise<ExvotoImage[]> => {
    return apiCall<ExvotoImage[]>(`/exvotos/${exvotoId}/images`);
};

export const deleteExvotoImage = (exvotoId: number, imageId: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/exvotos/${exvotoId}/images/${imageId}`, {
        method: 'DELETE',
    });
};

// --- CHARACTER API ---
export const getCharacters = (): Promise<Character[]> => {
    return apiCall<Character[]>('/characters');
};

export const createCharacter = (name: string): Promise<Character> => {
    return apiCall<Character>('/characters', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
};

export const updateCharacter = (id: number, name: string): Promise<Character> => {
    return apiCall<Character>(`/characters/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    });
};

export const deleteCharacter = (id: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/characters/${id}`, {
        method: 'DELETE',
    });
};

// --- MIRACLE API ---
export const getMiracles = (): Promise<Miracle[]> => {
    return apiCall<Miracle[]>('/miracles');
};

export const createMiracle = (name: string): Promise<Miracle> => {
    return apiCall<Miracle>('/miracles', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
};

export const updateMiracle = (id: number, name: string): Promise<Miracle> => {
    return apiCall<Miracle>(`/miracles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    });
};

export const deleteMiracle = (id: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/miracles/${id}`, {
        method: 'DELETE',
    });
};

// --- DIVINITY API ---
import { Divinity } from '../types';
export const getDivinities = (page = 1, limit = 50): Promise<PaginatedResponse<Divinity>> => {
    return apiCall<PaginatedResponse<Divinity>>(`/divinities?page=${page}&limit=${limit}`);
};

export const getAllDivinities = (): Promise<Divinity[]> => {
    // Función legacy para compatibilidad
    return apiCall<PaginatedResponse<Divinity>>('/divinities?page=1&limit=10000').then(res => res.data);
};

export const createDivinity = (payload: Partial<Divinity>): Promise<Divinity> => {
    return apiCall<Divinity>('/divinities', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const updateDivinity = (id: number, data: Partial<Divinity>): Promise<Divinity> => {
    return apiCall<Divinity>(`/divinities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const deleteDivinity = (id: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/divinities/${id}`, {
        method: 'DELETE',
    });
};

// --- CATALOG SEM API ---
export const getCatalogSems = (): Promise<CatalogSem[]> => {
    return apiCall<CatalogSem[]>('/catalog-sems');
};

export const getCatalogSemsByCatalogId = (catalogId: number): Promise<CatalogSem[]> => {
    return apiCall<CatalogSem[]>(`/catalog-sems/catalog/${catalogId}`);
};

export const createCatalogSem = (catalogId: number, semId: number): Promise<CatalogSem> => {
    return apiCall<CatalogSem>('/catalog-sems', {
        method: 'POST',
        body: JSON.stringify({ catalog_id: catalogId, sem_id: semId }),
    });
};

export const deleteCatalogSem = (catalogId: number, semId: number): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/catalog-sems/${catalogId}/${semId}`, {
        method: 'DELETE',
    });
};

// --- UTILITY FUNCTIONS ---
export const getUniqueCharacters = async (): Promise<string[]> => {
    const exvotos = await getExvotos();
    const allCharacters = exvotos.map(e => e.characters).filter(Boolean) as string[];
    const uniqueCharacters = [...new Set(allCharacters.flatMap(c => c.split(',').map(item => item.trim())))];
    return uniqueCharacters;
};

export const getUniqueMiracles = async (): Promise<string[]> => {
    const exvotos = await getExvotos();
    const allMiracles = exvotos.map(e => e.miracle).filter(Boolean) as string[];
    const uniqueMiracles = [...new Set(allMiracles)];
    return uniqueMiracles;
};
