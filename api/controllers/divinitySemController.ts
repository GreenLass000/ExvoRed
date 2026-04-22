import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { divinitySem } from '../db/schema.js';

export const divinitySemController = {
  // GET /api/divinity-sems - Obtener todas las relaciones divinity-sem
  async getAll(req: Request, res: Response) {
    try {
      const result = await db.select().from(divinitySem);
      res.json(result);
    } catch (error) {
      console.error('Error fetching divinity-sems:', error);
      res.status(500).json({ error: 'Failed to fetch divinity-sems' });
    }
  },

  // GET /api/divinity-sems/divinity/:divinityId - SEMs de una divinidad
  async getByDivinityId(req: Request, res: Response) {
    try {
      const divinityId = parseInt(req.params.divinityId);
      const result = await db.select().from(divinitySem).where(eq(divinitySem.divinity_id, divinityId));
      res.json(result);
    } catch (error) {
      console.error('Error fetching divinity-sems by divinity:', error);
      res.status(500).json({ error: 'Failed to fetch divinity-sems by divinity' });
    }
  },

  // GET /api/divinity-sems/sem/:semId - Divinidades de un SEM
  async getBySemId(req: Request, res: Response) {
    try {
      const semId = parseInt(req.params.semId);
      const result = await db.select().from(divinitySem).where(eq(divinitySem.sem_id, semId));
      res.json(result);
    } catch (error) {
      console.error('Error fetching divinity-sems by sem:', error);
      res.status(500).json({ error: 'Failed to fetch divinity-sems by sem' });
    }
  },

  // POST /api/divinity-sems - Crear relación divinity-sem
  async create(req: Request, res: Response) {
    try {
      const { divinity_id, sem_id } = req.body;
      const result = await db.insert(divinitySem).values({ divinity_id, sem_id }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating divinity-sem:', error);
      res.status(500).json({ error: 'Failed to create divinity-sem' });
    }
  },

  // DELETE /api/divinity-sems/:divinityId/:semId - Eliminar relación
  async delete(req: Request, res: Response) {
    try {
      const divinityId = parseInt(req.params.divinityId);
      const semId = parseInt(req.params.semId);
      const result = await db.delete(divinitySem)
        .where(and(eq(divinitySem.divinity_id, divinityId), eq(divinitySem.sem_id, semId)))
        .returning();
      if (result.length === 0) {
        return res.status(404).json({ error: 'Divinity-sem relationship not found' });
      }
      res.json({ message: 'Divinity-sem relationship deleted successfully' });
    } catch (error) {
      console.error('Error deleting divinity-sem:', error);
      res.status(500).json({ error: 'Failed to delete divinity-sem' });
    }
  }
};
