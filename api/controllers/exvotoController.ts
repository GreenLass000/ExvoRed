import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { exvoto, NewExvoto } from '../db/schema.js';

export const exvotoController = {
  // GET /api/exvotos - Obtener todos los exvotos
  async getAll(req: Request, res: Response) {
    try {
      const exvotos = await db.select().from(exvoto);
      res.json(exvotos);
    } catch (error) {
      console.error('Error fetching exvotos:', error);
      res.status(500).json({ error: 'Failed to fetch exvotos' });
    }
  },

  // GET /api/exvotos/:id - Obtener un exvoto por ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(exvoto).where(eq(exvoto.id, id));
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Exvoto not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching exvoto:', error);
      res.status(500).json({ error: 'Failed to fetch exvoto' });
    }
  },

  // POST /api/exvotos - Crear un nuevo exvoto
  async create(req: Request, res: Response) {
    try {
      const exvotoData = req.body as NewExvoto;
      
      const result = await db.insert(exvoto).values(exvotoData).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating exvoto:', error);
      res.status(500).json({ error: 'Failed to create exvoto' });
    }
  },

  // PUT /api/exvotos/:id - Actualizar un exvoto
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const exvotoData = req.body as Partial<NewExvoto>;

      const result = await db.update(exvoto)
        .set(exvotoData)
        .where(eq(exvoto.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Exvoto not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error updating exvoto:', error);
      res.status(500).json({ error: 'Failed to update exvoto' });
    }
  },

  // DELETE /api/exvotos/:id - Eliminar un exvoto
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const result = await db.delete(exvoto)
        .where(eq(exvoto.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Exvoto not found' });
      }
      
      res.json({ message: 'Exvoto deleted successfully' });
    } catch (error) {
      console.error('Error deleting exvoto:', error);
      res.status(500).json({ error: 'Failed to delete exvoto' });
    }
  }
};
