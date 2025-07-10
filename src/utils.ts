import { Sem, CatalogSem } from './types';
import * as api from './services/api';

/**
 * Obtiene los SEMs relacionados con un catálogo específico
 * @param catalogId ID del catálogo
 * @returns Array de SEMs relacionados con el catálogo
 */
export const getSemsWithCatalog = async (catalogId: number): Promise<Sem[]> => {
    try {
        const [catalogSems, sems] = await Promise.all([
            api.getCatalogSems(),
            api.getSems()
        ]);

        // Filtrar las relaciones catalog_sem para el catálogo específico
        const catalogSemRelations = catalogSems.filter(cs => cs.catalog_id === catalogId);
        
        // Obtener los IDs de los SEMs relacionados
        const semIds = catalogSemRelations.map(cs => cs.sem_id);
        
        // Filtrar los SEMs que están relacionados con el catálogo
        const relatedSems = sems.filter(sem => semIds.includes(sem.id));
        
        return relatedSems;
    } catch (error) {
        console.error('Error getting SEMs for catalog:', error);
        return [];
    }
};

/**
 * Calcula estadísticas de un catálogo basándose en los SEMs relacionados
 * @param catalogId ID del catálogo
 * @returns Objeto con estadísticas calculadas
 */
export const calculateCatalogStatistics = async (catalogId: number) => {
    const sems = await getSemsWithCatalog(catalogId);
    
    const exvotoCount = sems.reduce((total, sem) => total + (sem.pictorial_exvoto_count || 0), 0);
    const relatedPlaces = sems.map(sem => sem.town || sem.name).filter(Boolean).join(', ');
    const provinces = [...new Set(sems.map(sem => sem.province).filter(Boolean))].join(', ');
    
    return {
        exvoto_count: exvotoCount,
        related_places: relatedPlaces,
        provinces
    };
};
