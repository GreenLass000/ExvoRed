import { sqliteTable, integer, text, blob, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Tabla miracle
export const miracle = sqliteTable('miracle', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  name: text('name').notNull(),
updated_at: text('updated_at'),
});

// Tabla character
export const character = sqliteTable('character', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  name: text('name').notNull(),
updated_at: text('updated_at'),
});

// Tabla sem (santuario/ermita/museo)
export const sem = sqliteTable('sem', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  name: text('name', { length: 100 }),
  region: text('region', { length: 100 }),
  province: text('province', { length: 100 }),
  town: text('town', { length: 100 }),
  associated_divinity: text('associated_divinity', { length: 100 }),
  festivity: text('festivity', { length: 100 }),
  pictorial_exvoto_count: integer('pictorial_exvoto_count'),
  oldest_exvoto_date: text('oldest_exvoto_date'), // SQLite doesn't have date type, using text
  newest_exvoto_date: text('newest_exvoto_date'),
  other_exvotos: text('other_exvotos'),
  numero_exvotos: integer('numero_exvotos'),
  comments: text('comments'),
  references: text('references'),
  contact: text('contact'),
updated_at: text('updated_at'),
});

// Tabla catalog
export const catalog = sqliteTable('catalog', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  title: text('title', { length: 200 }),
  reference: text('reference', { length: 200 }),
  author: text('author', { length: 100 }),
  publication_year: integer('publication_year'),
  publication_place: text('publication_place', { length: 100 }),
  catalog_location: text('catalog_location'),
  exvoto_count: integer('exvoto_count'),
  location_description: text('location_description'),
  oldest_exvoto_date: text('oldest_exvoto_date'),
  newest_exvoto_date: text('newest_exvoto_date'),
  other_exvotos: text('other_exvotos'),
  numero_exvotos: integer('numero_exvotos'),
  comments: text('comments'),
updated_at: text('updated_at'),
});

// Tabla exvoto (principal)
export const exvoto = sqliteTable('exvoto', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  internal_id: text('internal_id', { length: 20 }),
  offering_sem_id: integer('offering_sem_id'),
  lugar_origen: text('lugar_origen', { length: 200 }),
  conservation_sem_id: integer('conservation_sem_id'),
  province: text('province', { length: 50 }),
  virgin_or_saint: text('virgin_or_saint', { length: 100 }),
  exvoto_date: text('exvoto_date'), // SQLite date as text
  epoch: text('epoch', { length: 25 }), // Intervalo de 25 años, p.ej. "1551-1570"
  benefited_name: text('benefited_name', { length: 100 }),
  offerer_name: text('offerer_name', { length: 100 }),
  offerer_gender: text('offerer_gender', { length: 10 }),
  offerer_relation: text('offerer_relation', { length: 100 }),
  characters: text('characters', { length: 200 }),
  profession: text('profession', { length: 100 }),
  social_status: text('social_status', { length: 100 }),
  miracle: text('miracle', { length: 50 }),
  miracle_place: text('miracle_place', { length: 200 }),
  material: text('material', { length: 100 }),
  dimensions: text('dimensions', { length: 50 }),
  text_case: text('text_case', { length: 20 }),
  text_form: text('text_form', { length: 20 }),
  extra_info: text('extra_info', { length: 500 }),
  transcription: text('transcription'),
  conservation_status: text('conservation_status', { length: 100 }),
  image: blob('image'),
updated_at: text('updated_at'),
});

// Tabla intermedia catalog_exvoto
export const catalogExvoto = sqliteTable('catalog_exvoto', {
  catalog_id: integer('catalog_id').notNull(),
  exvoto_id: integer('exvoto_id').notNull(),
});

// Tabla intermedia catalog_sem
export const catalogSem = sqliteTable('catalog_sem', {
  catalog_id: integer('catalog_id').notNull(),
  sem_id: integer('sem_id').notNull(),
});

// Tabla divinity (divinidades)
export const divinity = sqliteTable('divinity', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  name: text('name', { length: 150 }).notNull(),
  attributes: text('attributes'), // Atributos / Especialidad
  history: text('history'),
  representation: text('representation'),
  representation_image: blob('representation_image'), // Imagen de representación
  comments: text('comments'),
updated_at: text('updated_at'),
});

// Tabla intermedia divinity_sem (relación muchos-a-muchos)
export const divinitySem = sqliteTable('divinity_sem', {
  divinity_id: integer('divinity_id').notNull(),
  sem_id: integer('sem_id').notNull(),
});

// Relaciones
export const semRelations = relations(sem, ({ many }) => ({
  offering_exvotos: many(exvoto, { relationName: 'offering_sem' }),
  conservation_exvotos: many(exvoto, { relationName: 'conservation_sem' }),
  catalog_sems: many(catalogSem),
  divinity_sems: many(divinitySem),
}));

export const exvotoRelations = relations(exvoto, ({ one, many }) => ({
  offering_sem: one(sem, {
    fields: [exvoto.offering_sem_id],
    references: [sem.id],
    relationName: 'offering_sem',
  }),
  conservation_sem: one(sem, {
    fields: [exvoto.conservation_sem_id],
    references: [sem.id],
    relationName: 'conservation_sem',
  }),
  catalog_exvotos: many(catalogExvoto),
}));

export const catalogRelations = relations(catalog, ({ many }) => ({
  catalog_exvotos: many(catalogExvoto),
  catalog_sems: many(catalogSem),
}));

export const catalogExvotoRelations = relations(catalogExvoto, ({ one }) => ({
  catalog: one(catalog, {
    fields: [catalogExvoto.catalog_id],
    references: [catalog.id],
  }),
  exvoto: one(exvoto, {
    fields: [catalogExvoto.exvoto_id],
    references: [exvoto.id],
  }),
}));

export const catalogSemRelations = relations(catalogSem, ({ one }) => ({
  catalog: one(catalog, {
    fields: [catalogSem.catalog_id],
    references: [catalog.id],
  }),
  sem: one(sem, {
    fields: [catalogSem.sem_id],
    references: [sem.id],
  }),
}));

export const divinityRelations = relations(divinity, ({ many }) => ({
  divinity_sems: many(divinitySem),
}));

export const divinitySemRelations = relations(divinitySem, ({ one }) => ({
  divinity: one(divinity, {
    fields: [divinitySem.divinity_id],
    references: [divinity.id],
  }),
  sem: one(sem, {
    fields: [divinitySem.sem_id],
    references: [sem.id],
  }),
}));

// Tipos TypeScript
export type Miracle = typeof miracle.$inferSelect;
export type NewMiracle = typeof miracle.$inferInsert;

export type Character = typeof character.$inferSelect;
export type NewCharacter = typeof character.$inferInsert;

export type Sem = typeof sem.$inferSelect;
export type NewSem = typeof sem.$inferInsert;

export type Catalog = typeof catalog.$inferSelect;
export type NewCatalog = typeof catalog.$inferInsert;

export type Exvoto = typeof exvoto.$inferSelect;
export type NewExvoto = typeof exvoto.$inferInsert;

export type Divinity = typeof divinity.$inferSelect;
export type NewDivinity = typeof divinity.$inferInsert;
