import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { character, NewCharacter } from '../db/schema.js';

export const characterController = {
  // GET /api/characters - Obtener todos los personajes
  async getAll(req: Request, res: Response) {
    try {
      const characters = await db.select().from(character);
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json({ error: 'Failed to fetch characters' });
    }
  },

  // GET /api/characters/:id - Obtener un personaje por ID
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(character).where(eq(character.id, id));
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Character not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching character:', error);
      res.status(500).json({ error: 'Failed to fetch character' });
    }
  },

  // POST /api/characters - Crear un nuevo personaje
  async create(req: Request, res: Response) {
    try {
      const { name } = req.body as NewCharacter;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const now = new Date().toISOString();
      const result = await db.insert(character).values({ name, updated_at: now } as any).returning();
      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json({ error: 'Failed to create character' });
    }
  },

  // PUT /api/characters/:id - Actualizar un personaje
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name } = req.body as NewCharacter;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const now = new Date().toISOString();
      const result = await db.update(character)
        .set({ name, updated_at: now } as any)
        .where(eq(character.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Character not found' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json({ error: 'Failed to update character' });
    }
  },

  // DELETE /api/characters/:id - Eliminar un personaje
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      const result = await db.delete(character)
        .where(eq(character.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Character not found' });
      }
      
      res.json({ message: 'Character deleted successfully' });
    } catch (error) {
      console.error('Error deleting character:', error);
      res.status(500).json({ error: 'Failed to delete character' });
    }
  }
};
