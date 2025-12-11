import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { fileURLToPath } from 'url';

// Inicializar conexión a la base de datos (ruta robusta, relativa a este archivo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.db');

const sqlite = new Database(dbPath);

// Ensure new rich-text columns exist in legacy databases
try {
  const existingColumns = new Set(
    sqlite.prepare(`PRAGMA table_info('exvoto')`).all().map((c: any) => c.name)
  );
  const missing: string[] = [];
  if (!existingColumns.has('writing_type')) missing.push('writing_type');
  if (!existingColumns.has('linguistic_competence')) missing.push('linguistic_competence');
  if (!existingColumns.has('references')) missing.push('references');

  if (missing.length > 0) {
    const alterSql = missing
      .map(col => `ALTER TABLE exvoto ADD COLUMN "${col}" TEXT;`)
      .join('\n');
    sqlite.exec(alterSql);
    console.log(`SQLite: añadidas columnas faltantes en exvoto -> ${missing.join(', ')}`);
  }
} catch (err) {
  console.warn('No se pudo verificar/añadir columnas de exvoto:', err);
}

export const db = drizzle(sqlite, { schema });

// Export schema for external use
export { schema };

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

console.log('Database connected at', dbPath);

export default db;
