import { Request, Response } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { divinity, divinitySem } from '../db/schema.js';

export const divinityController = {
  // GET /api/divinities - Obtener todas las divinidades con paginación
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const rows = await db.select().from(divinity)
        .orderBy(desc(divinity.updated_at))
        .limit(limit)
        .offset(offset);

      // Obtener el total de registros
      const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(divinity);
      const total = totalResult[0]?.count || 0;

      res.json({
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
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

      const now = new Date().toISOString();
      const result = await db.insert(divinity).values({
        name: payload.name,
        attributes: payload.attributes ?? null,
        history: payload.history ?? null,
        representation: payload.representation ?? null,
        comments: payload.comments ?? null,
        updated_at: now,
      } as any).returning();
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

      const now = new Date().toISOString();
      const result = await db.update(divinity)
        .set({
          name: payload.name,
          attributes: payload.attributes,
          history: payload.history,
          representation: payload.representation,
          comments: payload.comments,
          updated_at: now,
        } as any)
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
      // Block deletion if referenced by SEMs
      const refs = await db.select().from(divinitySem).where(eq(divinitySem.divinity_id, id));
      if (refs.length > 0) {
        return res.status(409).json({ error: 'Cannot delete divinity because it is referenced by one or more SEMs.' });
      }
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
