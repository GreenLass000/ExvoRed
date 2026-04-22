import { Request, Response } from 'express';
import { like, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { exvoto, sem, catalog, divinity, character, miracle } from '../db/schema.js';

export interface SearchResult {
    table: string;
    id: number;
    displayText: string;
    matchedColumn: string;
    matchedValue: string;
}

function normalize(str: string): string {
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export const searchController = {
    async search(req: Request, res: Response) {
        const q = (req.query.q as string || '').trim();
        if (!q || q.length < 2) {
            return res.json([]);
        }

        const pattern = `%${q}%`;
        const results: SearchResult[] = [];

        try {
            // Search exvotos
            const exvotos = await db.select({
                id: exvoto.id,
                internal_id: exvoto.internal_id,
                benefited_name: exvoto.benefited_name,
                offerer_name: exvoto.offerer_name,
                virgin_or_saint: exvoto.virgin_or_saint,
                miracle: exvoto.miracle,
                province: exvoto.province,
                lugar_origen: exvoto.lugar_origen,
            }).from(exvoto).where(or(
                like(exvoto.internal_id, pattern),
                like(exvoto.benefited_name, pattern),
                like(exvoto.offerer_name, pattern),
                like(exvoto.virgin_or_saint, pattern),
                like(exvoto.miracle, pattern),
                like(exvoto.province, pattern),
                like(exvoto.lugar_origen, pattern),
            )).limit(30);

            for (const e of exvotos) {
                const qNorm = normalize(q);
                let matchedColumn = '';
                let matchedValue = '';
                const fields = [
                    ['ID Interno', e.internal_id],
                    ['Beneficiado', e.benefited_name],
                    ['Oferente', e.offerer_name],
                    ['Divinidad', e.virgin_or_saint],
                    ['Milagro', e.miracle],
                    ['Provincia', e.province],
                    ['Lugar Origen', e.lugar_origen],
                ] as const;
                for (const [col, val] of fields) {
                    if (val && normalize(val).includes(qNorm)) {
                        matchedColumn = col;
                        matchedValue = val;
                        break;
                    }
                }
                results.push({
                    table: 'exvoto',
                    id: e.id,
                    displayText: e.internal_id || `Exvoto #${e.id}`,
                    matchedColumn,
                    matchedValue,
                });
            }

            // Search SEMs
            const sems = await db.select({
                id: sem.id,
                name: sem.name,
                province: sem.province,
                town: sem.town,
                region: sem.region,
            }).from(sem).where(or(
                like(sem.name, pattern),
                like(sem.province, pattern),
                like(sem.town, pattern),
                like(sem.region, pattern),
            )).limit(20);

            for (const s of sems) {
                const qNorm = normalize(q);
                let matchedColumn = '';
                let matchedValue = '';
                const fields = [
                    ['Nombre', s.name],
                    ['Provincia', s.province],
                    ['Población', s.town],
                    ['Región', s.region],
                ] as const;
                for (const [col, val] of fields) {
                    if (val && normalize(val).includes(qNorm)) {
                        matchedColumn = col;
                        matchedValue = val;
                        break;
                    }
                }
                results.push({
                    table: 'sem',
                    id: s.id,
                    displayText: s.name || `SEM #${s.id}`,
                    matchedColumn,
                    matchedValue,
                });
            }

            // Search catalogs
            const catalogs = await db.select({
                id: catalog.id,
                title: catalog.title,
                author: catalog.author,
                reference: catalog.reference,
            }).from(catalog).where(or(
                like(catalog.title, pattern),
                like(catalog.author, pattern),
                like(catalog.reference, pattern),
            )).limit(20);

            for (const c of catalogs) {
                const qNorm = normalize(q);
                let matchedColumn = '';
                let matchedValue = '';
                const fields = [
                    ['Título', c.title],
                    ['Autor', c.author],
                    ['Referencia', c.reference],
                ] as const;
                for (const [col, val] of fields) {
                    if (val && normalize(val).includes(qNorm)) {
                        matchedColumn = col;
                        matchedValue = val;
                        break;
                    }
                }
                results.push({
                    table: 'catalog',
                    id: c.id,
                    displayText: c.title || `Catálogo #${c.id}`,
                    matchedColumn,
                    matchedValue,
                });
            }

            // Search divinities
            const divinities = await db.select({
                id: divinity.id,
                name: divinity.name,
            }).from(divinity).where(
                like(divinity.name, pattern)
            ).limit(10);

            for (const d of divinities) {
                results.push({
                    table: 'divinity',
                    id: d.id,
                    displayText: d.name || `Divinidad #${d.id}`,
                    matchedColumn: 'Nombre',
                    matchedValue: d.name || '',
                });
            }

            // Search characters
            const characters = await db.select({
                id: character.id,
                name: character.name,
            }).from(character).where(
                like(character.name, pattern)
            ).limit(10);

            for (const c of characters) {
                results.push({
                    table: 'character',
                    id: c.id,
                    displayText: c.name,
                    matchedColumn: 'Nombre',
                    matchedValue: c.name,
                });
            }

            // Search miracles
            const miracles = await db.select({
                id: miracle.id,
                name: miracle.name,
            }).from(miracle).where(
                like(miracle.name, pattern)
            ).limit(10);

            for (const m of miracles) {
                results.push({
                    table: 'miracle',
                    id: m.id,
                    displayText: m.name,
                    matchedColumn: 'Nombre',
                    matchedValue: m.name,
                });
            }

            return res.json(results);
        } catch (error) {
            console.error('Search error:', error);
            return res.status(500).json({ error: 'Error en la búsqueda' });
        }
    }
};
