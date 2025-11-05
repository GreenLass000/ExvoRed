import { Request, Response } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { catalog, NewCatalog, catalogSem, sem, catalogExvoto } from '../db/schema.js';

export const catalogController = {
  // GET /api/catalogs - Obtener todos los catálogos con estadísticas y paginación
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Query optimizada: calcula estadísticas en una sola query SQL
      const catalogsWithStats = await db
        .select({
          id: catalog.id,
          title: catalog.title,
          reference: catalog.reference,
          author: catalog.author,
          publication_year: catalog.publication_year,
          publication_place: catalog.publication_place,
          catalog_location: catalog.catalog_location,
          exvoto_count: sql<number>`COUNT(DISTINCT ${catalogExvoto.exvoto_id})`.as('exvoto_count'),
          related_places: sql<string>`GROUP_CONCAT(DISTINCT ${sem.town})`.as('related_places'),
          location_description: catalog.location_description,
          oldest_exvoto_date: catalog.oldest_exvoto_date,
          newest_exvoto_date: catalog.newest_exvoto_date,
          other_exvotos: catalog.other_exvotos,
          numero_exvotos: catalog.numero_exvotos,
          comments: catalog.comments,
          updated_at: catalog.updated_at,
        })
        .from(catalog)
        .leftJoin(catalogSem, eq(catalog.id, catalogSem.catalog_id))
        .leftJoin(sem, eq(catalogSem.sem_id, sem.id))
        .leftJoin(catalogExvoto, eq(catalog.id, catalogExvoto.catalog_id))
        .groupBy(catalog.id)
        .orderBy(desc(catalog.updated_at))
        .limit(limit)
        .offset(offset);

      // Obtener el total de registros
      const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(catalog);
      const total = totalResult[0]?.count || 0;

      res.json({
        data: catalogsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      res.status(500).json({ error: 'Failed to fetch catalogs' });
    }
  },

  // GET /api/catalogs/:id - Obtener un catálogo por ID con estadísticas
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      // Query optimizada con estadísticas
      const result = await db
        .select({
          id: catalog.id,
          title: catalog.title,
          reference: catalog.reference,
          author: catalog.author,
          publication_year: catalog.publication_year,
          publication_place: catalog.publication_place,
          catalog_location: catalog.catalog_location,
          exvoto_count: sql<number>`COUNT(DISTINCT ${catalogExvoto.exvoto_id})`.as('exvoto_count'),
          related_places: sql<string>`GROUP_CONCAT(DISTINCT ${sem.town})`.as('related_places'),
          location_description: catalog.location_description,
          oldest_exvoto_date: catalog.oldest_exvoto_date,
          newest_exvoto_date: catalog.newest_exvoto_date,
          other_exvotos: catalog.other_exvotos,
          numero_exvotos: catalog.numero_exvotos,
          comments: catalog.comments,
          updated_at: catalog.updated_at,
        })
        .from(catalog)
        .leftJoin(catalogSem, eq(catalog.id, catalogSem.catalog_id))
        .leftJoin(sem, eq(catalogSem.sem_id, sem.id))
        .leftJoin(catalogExvoto, eq(catalog.id, catalogExvoto.catalog_id))
        .where(eq(catalog.id, id))
        .groupBy(catalog.id);

      if (result.length === 0) {
        return res.status(404).json({ error: 'Catalog not found' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      res.status(500).json({ error: 'Failed to fetch catalog' });
    }
  },

  // POST /api/catalogs - Crear un nuevo catálogo
  async create(req: Request, res: Response) {
    try {
      const catalogData = req.body as NewCatalog;
      const now = new Date().toISOString();
      const result = await db.insert(catalog).values({ ...catalogData, updated_at: now } as any).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating catalog:', error);
      res.status(500).json({ error: 'Failed to create catalog' });
    }
  },

  // PUT /api/catalogs/:id - Actualizar un catálogo
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const catalogData = req.body as Partial<NewCatalog>;
      const now = new Date().toISOString();

      const result = await db.update(catalog)
        .set({ ...catalogData, updated_at: now } as any)
        .where(eq(catalog.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Catalog not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error updating catalog:', error);
      res.status(500).json({ error: 'Failed to update catalog' });
    }
  },

  // DELETE /api/catalogs/:id - Eliminar un catálogo
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const result = await db.delete(catalog)
        .where(eq(catalog.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Catalog not found' });
      }
      
      res.json({ message: 'Catalog deleted successfully' });
    } catch (error) {
      console.error('Error deleting catalog:', error);
      res.status(500).json({ error: 'Failed to delete catalog' });
    }
  }
};
