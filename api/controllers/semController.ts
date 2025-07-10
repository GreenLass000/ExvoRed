import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sem, NewSem } from '../db/schema.js';

export const semController = {
  // GET /api/sems - Obtener todos los sems
  async getAll(req: Request, res: Response) {
    try {
      const sems = await db.select().from(sem);
      res.json(sems);
    } catch (error) {
      console.error('Error fetching sems:', error);
      res.status(500).json({ error: 'Failed to fetch sems' });
    }
  },

  // GET /api/sems/:id - Obtener un sem por ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(sem).where(eq(sem.id, id));
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Sem not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching sem:', error);
      res.status(500).json({ error: 'Failed to fetch sem' });
    }
  },

  // POST /api/sems - Crear un nuevo sem
  async create(req: Request, res: Response) {
    try {
      const semData = req.body as NewSem;
      
      const result = await db.insert(sem).values(semData).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating sem:', error);
      res.status(500).json({ error: 'Failed to create sem' });
    }
  },

  // PUT /api/sems/:id - Actualizar un sem
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const semData = req.body as Partial<NewSem>;

      const result = await db.update(sem)
        .set(semData)
        .where(eq(sem.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Sem not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error updating sem:', error);
      res.status(500).json({ error: 'Failed to update sem' });
    }
  },

  // DELETE /api/sems/:id - Eliminar un sem
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const result = await db.delete(sem)
        .where(eq(sem.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Sem not found' });
      }
      
      res.json({ message: 'Sem deleted successfully' });
    } catch (error) {
      console.error('Error deleting sem:', error);
      res.status(500).json({ error: 'Failed to delete sem' });
    }
  }
};
