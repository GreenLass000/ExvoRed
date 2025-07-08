
import { Sem, Catalog, Exvoto } from '../types';

let sems: Sem[] = [
    { id: 1, name: "Santuario de la Esperanza", region: "Murcia", province: "Murcia", town: "Calasparra", associated_divinity: "Virgen de la Esperanza", festivity: "8 de Septiembre", pictorial_exvoto_count: 0, oldest_exvoto_date: null, newest_exvoto_date: null, other_exvotos: "Figuras de cera", comments: "Gran afluencia de peregrinos.", references: "Catálogo de Exvotos de Murcia", contact: "info@santuarioesperanza.com" },
    { id: 2, name: "Museo de Artes y Costumbres", region: "Andalucía", province: "Sevilla", town: "Sevilla", associated_divinity: "N/A", festivity: "N/A", pictorial_exvoto_count: 0, oldest_exvoto_date: null, newest_exvoto_date: null, other_exvotos: "Fotografías, objetos personales", comments: "Colección de exvotos populares.", references: "N/A", contact: "contacto@museoartes.es" },
    { id: 3, name: "Ermita de San Roque", region: "Castilla y León", province: "Salamanca", town: "La Alberca", associated_divinity: "San Roque", festivity: "16 de Agosto", pictorial_exvoto_count: 0, oldest_exvoto_date: null, newest_exvoto_date: null, other_exvotos: "Lazos y pañuelos", comments: "Pequeña pero concurrida.", references: "N/A", contact: "" }
];

let catalogs: Catalog[] = [
    { id: 1, title: "Exvotos Pictóricos de Andalucía", reference: "ISBN-123-456", author: "Juan Pérez", publication_year: 2005, publication_place: "Madrid", catalog_location: "Biblioteca Nacional", exvoto_count: 500, related_places: "Sevilla, Granada", location_description: "Estudio exhaustivo.", comments: "Incluye fotografías de alta calidad." },
    { id: 2, title: "La fe del pueblo: exvotos murcianos", reference: "MUR-EXV-01", author: "María García", publication_year: 1998, publication_place: "Murcia", catalog_location: "Archivo Regional de Murcia", exvoto_count: 320, related_places: "Calasparra, Caravaca", location_description: "Centrado en el siglo XVIII.", comments: "" }
];

let exvotos: Exvoto[] = [
    { id: 1, internal_id: "EXP-001", offering_sem_id: 1, origin_sem_id: 1, conservation_sem_id: 1, province: "Murcia", virgin_or_saint: "Virgen de la Esperanza", exvoto_date: "1955-06-15", benefited_name: "Ana López", offerer_name: "Familia López", offerer_gender: "Femenino", offerer_relation: "Madre", characters: "Mujer en cama, Virgen apareciendo", profession: "Agricultor", social_status: "Humilde", miracle: "Curación de enfermedad", miracle_place: "Calasparra", material: "Óleo sobre tabla", dimensions: "30x40 cm", text_case: "Mayúsculas", text_form: "Manuscrito", extra_info: "Texto en la parte inferior.", transcription: "GRACIAS A LA VIRGEN POR CURAR A MI HIJA", conservation_status: "Bueno", image: null },
    { id: 2, internal_id: "SEV-045", offering_sem_id: 2, origin_sem_id: 2, conservation_sem_id: 2, province: "Sevilla", virgin_or_saint: "San Pancracio", exvoto_date: "1921-11-02", benefited_name: "Manuel Sánchez", offerer_name: "Manuel Sánchez", offerer_gender: "Masculino", offerer_relation: "Él mismo", characters: "Hombre trabajando, Santo", profession: "Carpintero", social_status: "Medio", miracle: "Encontrar trabajo", miracle_place: "Taller en Sevilla", material: "Óleo sobre lienzo", dimensions: "50x35 cm", text_case: "Mixto", text_form: "Manuscrito", extra_info: "Donado por la familia.", transcription: "Por el favor concedido de encontrar empleo. M.S.", conservation_status: "Restaurado", image: null },
    { id: 3, internal_id: "ALB-012", offering_sem_id: 3, origin_sem_id: 3, conservation_sem_id: 1, province: "Salamanca", virgin_or_saint: "San Roque", exvoto_date: "1890-08-20", benefited_name: "Ganado de Pedro", offerer_name: "Pedro Martín", offerer_gender: "Masculino", offerer_relation: "Propietario", characters: "Hombre con vacas, San Roque", profession: "Ganadero", social_status: "Humilde", miracle: "Protección de ganado", miracle_place: "Campo cerca de La Alberca", material: "Tinta sobre papel", dimensions: "20x15 cm", text_case: "Minúsculas", text_form: "Manuscrito", extra_info: "", transcription: "S. Roque protegió mi ganado de la peste.", conservation_status: "Frágil", image: null }
];

const simulateDelay = <T,>(data: T): Promise<T> => new Promise(res => setTimeout(() => res(data), 300));
let nextSemId = sems.length + 1;
let nextCatalogId = catalogs.length + 1;
let nextExvotoId = exvotos.length + 1;

// Helper function to calculate SEM statistics
const calculateSemStatistics = (semId: number) => {
    // Only count exvotos that are conserved in this SEM
    const conservedExvotos = exvotos.filter(e => e.conservation_sem_id === semId);
    
    const count = conservedExvotos.length;
    const dates = conservedExvotos
        .map(e => e.exvoto_date)
        .filter(date => date !== null && date !== undefined)
        .sort();
    
    return {
        pictorial_exvoto_count: count,
        oldest_exvoto_date: dates.length > 0 ? dates[0] : null,
        newest_exvoto_date: dates.length > 0 ? dates[dates.length - 1] : null
    };
};

// --- SEM API ---
export const getSems = () => {
    const semsWithStats = sems.map(sem => {
        const stats = calculateSemStatistics(sem.id);
        return {
            ...sem,
            ...stats
        };
    });
    return simulateDelay(semsWithStats);
};
export const createSem = (data: Omit<Sem, 'id'>) => {
    const stats = calculateSemStatistics(nextSemId);
    const newSem: Sem = { ...data, ...stats, id: nextSemId++ };
    sems = [...sems, newSem];
    return simulateDelay(newSem);
};
export const updateSem = (id: number, data: Partial<Sem>) => {
    let updatedSem: Sem | null = null;
    sems = sems.map(s => {
        if (s.id === id) {
            const stats = calculateSemStatistics(id);
            updatedSem = { ...s, ...data, ...stats };
            return updatedSem;
        }
        return s;
    });
    return simulateDelay(updatedSem);
};
export const deleteSem = (id: number) => {
    sems = sems.filter(s => s.id !== id);
    return simulateDelay({ success: true });
};

// --- CATALOG API ---
export const getCatalogs = () => simulateDelay(catalogs);
export const createCatalog = (data: Omit<Catalog, 'id'>) => {
    const newCatalog: Catalog = { ...data, id: nextCatalogId++ };
    catalogs = [...catalogs, newCatalog];
    return simulateDelay(newCatalog);
};
export const updateCatalog = (id: number, data: Partial<Catalog>) => {
    let updatedCatalog: Catalog | null = null;
    catalogs = catalogs.map(c => {
        if (c.id === id) {
            updatedCatalog = { ...c, ...data };
            return updatedCatalog;
        }
        return c;
    });
    return simulateDelay(updatedCatalog);
};
export const deleteCatalog = (id: number) => {
    catalogs = catalogs.filter(c => c.id !== id);
    return simulateDelay({ success: true });
};

// --- EXVOTO API ---
export const getExvotos = () => simulateDelay(exvotos);

export const getExvotoById = (id: number) => {
    const exvoto = exvotos.find(e => e.id === id);
    return simulateDelay(exvoto ?? null);
};

export const createExvoto = (data: Omit<Exvoto, 'id'>) => {
    const newExvoto: Exvoto = { ...data, id: nextExvotoId++ };
    exvotos = [...exvotos, newExvoto];
    
    // Update conservation SEM statistics
    if (data.conservation_sem_id) {
        const stats = calculateSemStatistics(data.conservation_sem_id);
        sems = sems.map(s => s.id === data.conservation_sem_id ? { ...s, ...stats } : s);
    }
    
    return simulateDelay(newExvoto);
};
export const updateExvoto = (id: number, data: Partial<Exvoto>) => {
    let updatedExvoto: Exvoto | null = null;
    const oldExvoto = exvotos.find(e => e.id === id);
    
    exvotos = exvotos.map(e => {
        if (e.id === id) {
            updatedExvoto = { ...e, ...data };
            return updatedExvoto;
        }
        return e;
    });
    
    // Update conservation SEMs statistics (both old and new if they changed)
    const semIds = new Set([
        oldExvoto?.conservation_sem_id,
        data.conservation_sem_id
    ].filter(Boolean));
    
    semIds.forEach(semId => {
        if (semId) {
            const stats = calculateSemStatistics(semId);
            sems = sems.map(s => s.id === semId ? { ...s, ...stats } : s);
        }
    });
    
    return simulateDelay(updatedExvoto);
};
export const deleteExvoto = (id: number) => {
    const exvoto = exvotos.find(e => e.id === id);
    exvotos = exvotos.filter(e => e.id !== id);
    
    // Update conservation SEM statistics
    if (exvoto && exvoto.conservation_sem_id) {
        const stats = calculateSemStatistics(exvoto.conservation_sem_id);
        sems = sems.map(s => s.id === exvoto.conservation_sem_id ? { ...s, ...stats } : s);
    }
    
    return simulateDelay({ success: true });
};

// --- UNIQUE VALUE API ---
export const getUniqueCharacters = () => {
    const allCharacters = exvotos.map(e => e.characters).filter(Boolean) as string[];
    const uniqueCharacters = [...new Set(allCharacters.flatMap(c => c.split(',').map(item => item.trim())))];
    return simulateDelay(uniqueCharacters);
};

export const getUniqueMiracles = () => {
    const allMiracles = exvotos.map(e => e.miracle).filter(Boolean) as string[];
    const uniqueMiracles = [...new Set(allMiracles)];
    return simulateDelay(uniqueMiracles);
};

// Create new character (adds to existing exvoto)
export const createCharacter = (character: string) => {
    // This would typically add to a separate characters table
    // For now, we'll just return success
    return simulateDelay({ success: true, character });
};

// Create new miracle (adds to existing exvoto)
export const createMiracle = (miracle: string) => {
    // This would typically add to a separate miracles table
    // For now, we'll just return success
    return simulateDelay({ success: true, miracle });
};
