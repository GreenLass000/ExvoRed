import { sqliteTable, AnySQLiteColumn, integer, text, blob } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const catalog = sqliteTable("catalog", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    title: text({ length: 200 }),
    reference: text({ length: 200 }),
    author: text({ length: 100 }),
    publication_year: integer("publication_year"),
    publication_place: text("publication_place", { length: 100 }),
    catalog_location: text("catalog_location"),
    exvoto_count: integer("exvoto_count"),
    location_description: text("location_description"),
    oldest_exvoto_date: text("oldest_exvoto_date"),
    newest_exvoto_date: text("newest_exvoto_date"),
    other_exvotos: text("other_exvotos"),
    numero_exvotos: integer("numero_exvotos"),
    comments: text(),
    updated_at: text("updated_at"),
});

export const catalogExvoto = sqliteTable("catalog_exvoto", {
    catalog_id: integer("catalog_id").notNull(),
    exvoto_id: integer("exvoto_id").notNull(),
});

export const catalogSem = sqliteTable("catalog_sem", {
    catalog_id: integer("catalog_id").notNull(),
    sem_id: integer("sem_id").notNull(),
});

export const character = sqliteTable("character", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    name: text().notNull(),
    updated_at: text("updated_at"),
});

export const exvoto = sqliteTable("exvoto", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    internal_id: text("internal_id", { length: 20 }),
    offering_sem_id: integer("offering_sem_id"),
    conservation_sem_id: integer("conservation_sem_id"),
    province: text({ length: 50 }),
    virgin_or_saint: text("virgin_or_saint", { length: 100 }),
    exvoto_date: text("exvoto_date"),
    benefited_name: text("benefited_name", { length: 100 }),
    offerer_name: text("offerer_name", { length: 100 }),
    offerer_gender: text("offerer_gender", { length: 10 }),
    offerer_relation: text("offerer_relation", { length: 100 }),
    characters: text({ length: 200 }),
    profession: text({ length: 100 }),
    social_status: text("social_status", { length: 100 }),
    miracle: text({ length: 50 }),
    miracle_place: text("miracle_place", { length: 200 }),
    material: text({ length: 100 }),
    dimensions: text({ length: 50 }),
    text_case: text("text_case", { length: 20 }),
    text_form: text("text_form", { length: 20 }),
    extra_info: text("extra_info", { length: 500 }),
    transcription: text(),
    conservation_status: text("conservation_status", { length: 100 }),
    image: blob(),
    epoch: text({ length: 25 }),
    lugar_origen: text("lugar_origen", { length: 200 }),
    updated_at: text("updated_at"),
});

export const miracle = sqliteTable("miracle", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    name: text().notNull(),
    updated_at: text("updated_at"),
});

export const sem = sqliteTable("sem", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    name: text({ length: 100 }),
    region: text({ length: 100 }),
    province: text({ length: 100 }),
    town: text({ length: 100 }),
    associated_divinity: text("associated_divinity", { length: 100 }),
    festivity: text({ length: 100 }),
    pictorial_exvoto_count: integer("pictorial_exvoto_count"),
    oldest_exvoto_date: text("oldest_exvoto_date"),
    newest_exvoto_date: text("newest_exvoto_date"),
    other_exvotos: text("other_exvotos"),
    numero_exvotos: integer("numero_exvotos"),
    comments: text(),
    references: text(),
    contact: text(),
    updated_at: text("updated_at"),
});

export const divinity = sqliteTable("divinity", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    name: text({ length: 150 }).notNull(),
    attributes: text(),
    history: text(),
    representation: text(),
    representation_image: blob("representation_image"),
    comments: text(),
    updated_at: text("updated_at"),
});

export const divinitySem = sqliteTable("divinity_sem", {
    divinity_id: integer("divinity_id").notNull(),
    sem_id: integer("sem_id").notNull(),
});

export const exvotoImage = sqliteTable("exvoto_image", {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    exvoto_id: integer("exvoto_id").notNull(),
    image: blob().notNull(),
    caption: text(),
    updated_at: text("updated_at"),
});

// Backend-facing convenience types
export type Catalog = typeof catalog.$inferSelect;
export type NewCatalog = typeof catalog.$inferInsert;
export type CatalogExvoto = typeof catalogExvoto.$inferSelect;
export type NewCatalogExvoto = typeof catalogExvoto.$inferInsert;
export type CatalogSem = typeof catalogSem.$inferSelect;
export type NewCatalogSem = typeof catalogSem.$inferInsert;
export type Character = typeof character.$inferSelect;
export type NewCharacter = typeof character.$inferInsert;
export type Exvoto = typeof exvoto.$inferSelect;
export type NewExvoto = typeof exvoto.$inferInsert;
export type Miracle = typeof miracle.$inferSelect;
export type NewMiracle = typeof miracle.$inferInsert;
export type Sem = typeof sem.$inferSelect;
export type NewSem = typeof sem.$inferInsert;
export type Divinity = typeof divinity.$inferSelect;
export type NewDivinity = typeof divinity.$inferInsert;
export type ExvotoImage = typeof exvotoImage.$inferSelect;
export type NewExvotoImage = typeof exvotoImage.$inferInsert;
