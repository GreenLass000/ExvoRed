import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { exvoto, NewExvoto } from '../db/schema.js';

// Helper: detectar mime por cabecera
function detectMimeType(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return 'image/png';
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x39 || buffer[4] === 0x37) && buffer[5] === 0x61
  ) return 'image/gif';
  return 'image/jpeg';
}

function toBuffer(value: any): Buffer | null {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value as Buffer;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') {
    // Puede venir como data URL o base64 puro
    const dataUrlMatch = value.match(/^data:(.+);base64,(.*)$/);
    const base64 = dataUrlMatch ? dataUrlMatch[2] : value;
    try {
      return Buffer.from(base64, 'base64');
    } catch {
      return null;
    }
  }
  return null;
}

function bufferToDataUrl(value: any): string | null {
  if (value == null) return null;
  const buf = toBuffer(value);
  if (!buf) return null;
  const mime = detectMimeType(buf);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

export const exvotoController = {
  // GET /api/exvotos - Obtener todos los exvotos
  async getAll(req: Request, res: Response) {
    try {
      const rows = await db.select().from(exvoto);
      // Convertir imagen a data URL para el frontend
      const mapped = rows.map((r: any) => ({
        ...r,
        image: bufferToDataUrl(r.image)
      }));
      res.json(mapped);
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
      
      const row: any = result[0];
      row.image = bufferToDataUrl(row.image);
      res.json(row);
    } catch (error) {
      console.error('Error fetching exvoto:', error);
      res.status(500).json({ error: 'Failed to fetch exvoto' });
    }
  },

  // POST /api/exvotos - Crear un nuevo exvoto
  async create(req: Request, res: Response) {
    try {
      const exvotoData = req.body as any as NewExvoto;
      const now = new Date().toISOString();

      // Convertir imagen entrante a Buffer si es string
      let imageBuffer: Buffer | null = null;
      if (typeof (exvotoData as any).image === 'string') {
        imageBuffer = toBuffer((exvotoData as any).image);
      }

      const payload: any = { ...exvotoData, image: imageBuffer ?? null, updated_at: now };

      const result = await db.insert(exvoto).values(payload).returning();
      // Devolver con data URL para frontend
      const row: any = result[0];
      row.image = bufferToDataUrl(row.image);
      res.status(201).json(row);
    } catch (error) {
      console.error('Error creating exvoto:', error);
      res.status(500).json({ error: 'Failed to create exvoto' });
    }
  },

  // PUT /api/exvotos/:id - Actualizar un exvoto
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const exvotoData = req.body as any as Partial<NewExvoto>;
      const now = new Date().toISOString();

      const payload: any = { ...exvotoData, updated_at: now };
      if (typeof (exvotoData as any).image === 'string') {
        payload.image = toBuffer((exvotoData as any).image);
      }

      const result = await db.update(exvoto)
        .set(payload)
        .where(eq(exvoto.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Exvoto not found' });
      }
      
      const row: any = result[0];
      row.image = bufferToDataUrl(row.image);
      res.json(row);
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
