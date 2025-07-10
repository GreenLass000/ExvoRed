import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Inicializar conexión a la base de datos
const sqlite = new Database('./api/db/database.db');
export const db = drizzle(sqlite, { schema });

// Export schema for external use
export { schema };

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

console.log('Database connected successfully');

export default db;
