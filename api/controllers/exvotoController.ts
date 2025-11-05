import { Request, Response } from 'express';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { exvoto, exvotoImage, NewExvoto } from '../db/schema.js';

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

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = (page - 1) * limit;

      const rows = await db.select().from(exvoto)
        .orderBy(desc(exvoto.updated_at))
        .limit(limit)
        .offset(offset);

      // Convertir imagen a data URL para el frontend
      const mapped = rows.map((r: any) => ({
        ...r,
        image: bufferToDataUrl(r.image)
      }));

      // Obtener el total de registros
      const totalResult = await db.select({ count: sql<number>`COUNT(*)` }).from(exvoto);
      const total = totalResult[0]?.count || 0;

      res.json({
        data: mapped,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
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
        if (imageBuffer) {
          const mime = detectMimeType(imageBuffer);
          if (!ALLOWED_IMAGE_MIME.has(mime)) {
            return res.status(400).json({ error: 'Solo se permiten imágenes JPG, JPEG o PNG.' });
          }
        }
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
        const buf = toBuffer((exvotoData as any).image);
        if (buf) {
          const mime = detectMimeType(buf);
          if (!ALLOWED_IMAGE_MIME.has(mime)) {
            return res.status(400).json({ error: 'Solo se permiten imágenes JPG, JPEG o PNG.' });
          }
        }
        payload.image = buf;
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
  },

  // POST /api/exvotos/:id/images - Añadir una o varias imágenes adicionales
  async addImages(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { images, captions } = req.body as { images: string[]; captions?: (string | null)[] };
      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'images must be a non-empty array' });
      }
      const now = new Date().toISOString();
      const rowsToInsert = images.map((img, idx) => {
        const buf = toBuffer(img);
        if (!buf) return null;
        const mime = detectMimeType(buf);
        if (!ALLOWED_IMAGE_MIME.has(mime)) return 'INVALID';
        return {
          exvoto_id: id,
          image: buf,
          caption: captions && captions[idx] ? captions[idx] : null,
          updated_at: now,
        };
      });
      if (rowsToInsert.includes('INVALID' as any)) {
        return res.status(400).json({ error: 'Solo se permiten imágenes JPG, JPEG o PNG.' });
      }
      const cleanRows = rowsToInsert.filter(Boolean) as any[];
      const inserted = await db.insert(exvotoImage).values(cleanRows as any).returning();
      const mapped = inserted.map((r: any) => ({
        ...r,
        image: bufferToDataUrl(r.image),
      }));
      res.status(201).json(mapped);
    } catch (error) {
      console.error('Error adding exvoto images:', error);
      res.status(500).json({ error: 'Failed to add images' });
    }
  },

  // GET /api/exvotos/:id/images - Listar imágenes de un exvoto
  async getImages(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const rows = await db.select().from(exvotoImage).where(eq(exvotoImage.exvoto_id, id));
      const mapped = rows.map((r: any) => ({ ...r, image: bufferToDataUrl(r.image) }));
      res.json(mapped);
    } catch (error) {
      console.error('Error fetching exvoto images:', error);
      res.status(500).json({ error: 'Failed to fetch images' });
    }
  },

  // DELETE /api/exvotos/:id/images/:imageId - Eliminar una imagen
  async deleteImage(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const imageId = parseInt(req.params.imageId);
      const result = await db.delete(exvotoImage)
        .where(and(eq(exvotoImage.id, imageId), eq(exvotoImage.exvoto_id, id)))
        .returning();
      if (result.length === 0) return res.status(404).json({ error: 'Image not found' });
      res.json({ message: 'Image deleted' });
    } catch (error) {
      console.error('Error deleting exvoto image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
};
