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
export const db = drizzle(sqlite, { schema });

// Export schema for external use
export { schema };

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

console.log('Database connected at', dbPath);

export default db;
