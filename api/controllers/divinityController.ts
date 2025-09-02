import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { divinity } from '../db/schema.js';

export const divinityController = {
  // GET /api/divinities - Obtener todas las divinidades
  async getAll(req: Request, res: Response) {
    try {
      const rows = await db.select().from(divinity);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching divinities:', error);
      res.status(500).json({ error: 'Failed to fetch divinities' });
    }
  },

  // GET /api/divinities/:id - Obtener una divinidad por ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(divinity).where(eq(divinity.id, id));
      if (result.length === 0) {
        return res.status(404).json({ error: 'Divinity not found' });
      }
      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching divinity:', error);
      res.status(500).json({ error: 'Failed to fetch divinity' });
    }
  },

  // POST /api/divinities - Crear una nueva divinidad
  async create(req: Request, res: Response) {
    try {
      const payload = req.body as Partial<{
        name: string;
        attributes?: string | null;
        history?: string | null;
        representation?: string | null;
        comments?: string | null;
      }>;

      if (!payload.name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await db.insert(divinity).values({
        name: payload.name,
        attributes: payload.attributes ?? null,
        history: payload.history ?? null,
        representation: payload.representation ?? null,
        comments: payload.comments ?? null,
      }).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating divinity:', error);
      res.status(500).json({ error: 'Failed to create divinity' });
    }
  },

  // PUT /api/divinities/:id - Actualizar una divinidad
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const payload = req.body as Partial<{
        name: string;
        attributes?: string | null;
        history?: string | null;
        representation?: string | null;
        comments?: string | null;
      }>;

      const result = await db.update(divinity)
        .set({
          name: payload.name,
          attributes: payload.attributes,
          history: payload.history,
          representation: payload.representation,
          comments: payload.comments,
        })
        .where(eq(divinity.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Divinity not found' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Error updating divinity:', error);
      res.status(500).json({ error: 'Failed to update divinity' });
    }
  },

  // DELETE /api/divinities/:id - Eliminar una divinidad
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.delete(divinity)
        .where(eq(divinity.id, id))
        .returning();
      if (result.length === 0) {
        return res.status(404).json({ error: 'Divinity not found' });
      }
      res.json({ message: 'Divinity deleted successfully' });
    } catch (error) {
      console.error('Error deleting divinity:', error);
      res.status(500).json({ error: 'Failed to delete divinity' });
    }
  },
};
