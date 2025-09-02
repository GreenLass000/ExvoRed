import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { catalog, NewCatalog } from '../db/schema.js';

export const catalogController = {
  // GET /api/catalogs - Obtener todos los catálogos
  async getAll(req: Request, res: Response) {
    try {
      const catalogs = await db.select().from(catalog);
      res.json(catalogs);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      res.status(500).json({ error: 'Failed to fetch catalogs' });
    }
  },

  // GET /api/catalogs/:id - Obtener un catálogo por ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(catalog).where(eq(catalog.id, id));
      
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
