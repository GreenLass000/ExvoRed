import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { miracle, NewMiracle } from '../db/schema.js';

export const miracleController = {
  // GET /api/miracles - Obtener todos los milagros
  async getAll(req: Request, res: Response) {
    try {
      const miracles = await db.select().from(miracle);
      res.json(miracles);
    } catch (error) {
      console.error('Error fetching miracles:', error);
      res.status(500).json({ error: 'Failed to fetch miracles' });
    }
  },

  // GET /api/miracles/:id - Obtener un milagro por ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(miracle).where(eq(miracle.id, id));
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Miracle not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching miracle:', error);
      res.status(500).json({ error: 'Failed to fetch miracle' });
    }
  },

  // POST /api/miracles - Crear un nuevo milagro
  async create(req: Request, res: Response) {
    try {
      const { name } = req.body as NewMiracle;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await db.insert(miracle).values({ name }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating miracle:', error);
      res.status(500).json({ error: 'Failed to create miracle' });
    }
  },

  // PUT /api/miracles/:id - Actualizar un milagro
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name } = req.body as NewMiracle;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await db.update(miracle)
        .set({ name })
        .where(eq(miracle.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Miracle not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error updating miracle:', error);
      res.status(500).json({ error: 'Failed to update miracle' });
    }
  },

  // DELETE /api/miracles/:id - Eliminar un milagro
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const result = await db.delete(miracle)
        .where(eq(miracle.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Miracle not found' });
      }
      
      res.json({ message: 'Miracle deleted successfully' });
    } catch (error) {
      console.error('Error deleting miracle:', error);
      res.status(500).json({ error: 'Failed to delete miracle' });
    }
  }
};
