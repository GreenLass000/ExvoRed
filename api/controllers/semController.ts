import { Request, Response } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sem } from '../db/schema.js';
import type { NewSem } from '../db/schema.js';

export const semController = {
  // GET /api/sems - Obtener todos los sems con paginación
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = (page - 1) * limit;

      const sems = await db.select().from(sem)
        .orderBy(desc(sem.updated_at))
        .limit(limit)
        .offset(offset);

      // Obtener el total de registros
      const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(sem);
      const total = totalResult[0]?.count || 0;

      res.json({
        data: sems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
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
      const now = new Date().toISOString();
      const result = await db.insert(sem).values({ ...semData, updated_at: now } as any).returning();
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
      const now = new Date().toISOString();

      const result = await db.update(sem)
        .set({ ...semData, updated_at: now } as any)
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
