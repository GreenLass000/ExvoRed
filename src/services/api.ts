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
export const getSems = (): Promise<Sem[]> => {
    return apiCall<Sem[]>('/sems');
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
export const getCatalogs = (): Promise<Catalog[]> => {
    return apiCall<Catalog[]>('/catalogs');
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
export const getExvotos = (): Promise<Exvoto[]> => {
    return apiCall<Exvoto[]>('/exvotos');
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

// --- DIVINITY API ---
import { Divinity } from '../types';
export const getDivinities = (): Promise<Divinity[]> => {
    return apiCall<Divinity[]>('/divinities');
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
