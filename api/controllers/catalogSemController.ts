import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { catalogSem } from '../db/schema.js';

export const catalogSemController = {
  // GET /api/catalog-sems - Obtener todas las relaciones catalog-sem
  async getAll(req: Request, res: Response) {
    try {
      const catalogSems = await db.select().from(catalogSem);
      res.json(catalogSems);
    } catch (error) {
      console.error('Error fetching catalog-sems:', error);
      res.status(500).json({ error: 'Failed to fetch catalog-sems' });
    }
  },

  // GET /api/catalog-sems/catalog/:catalogId - Obtener SEMs por catálogo
  async getByCatalogId(req: Request, res: Response) {
    try {
      const catalogId = parseInt(req.params.catalogId);
      const result = await db.select().from(catalogSem).where(eq(catalogSem.catalog_id, catalogId));
      res.json(result);
    } catch (error) {
      console.error('Error fetching catalog-sems by catalog:', error);
      res.status(500).json({ error: 'Failed to fetch catalog-sems by catalog' });
    }
  },

  // POST /api/catalog-sems - Crear una nueva relación catalog-sem
  async create(req: Request, res: Response) {
    try {
      const { catalog_id, sem_id } = req.body;
      
      const result = await db.insert(catalogSem).values({
        catalog_id,
        sem_id
      }).returning();
      
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating catalog-sem:', error);
      res.status(500).json({ error: 'Failed to create catalog-sem' });
    }
  },

  // DELETE /api/catalog-sems/:catalogId/:semId - Eliminar una relación catalog-sem
  async delete(req: Request, res: Response) {
    try {
      const catalogId = parseInt(req.params.catalogId);
      const semId = parseInt(req.params.semId);
      
      const result = await db.delete(catalogSem)
        .where(and(eq(catalogSem.catalog_id, catalogId), eq(catalogSem.sem_id, semId)))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Catalog-sem relationship not found' });
      }
      
      res.json({ message: 'Catalog-sem relationship deleted successfully' });
    } catch (error) {
      console.error('Error deleting catalog-sem:', error);
      res.status(500).json({ error: 'Failed to delete catalog-sem' });
    }
  }
};
