# Database Migrations

## How to Apply Migrations on a New Machine

When you pull changes from GitHub that include new migrations, follow these steps:

### 1. Pull the latest changes
```bash
git pull origin main
```

### 2. Install dependencies (if needed)
```bash
npm install
```

### 3. Apply migrations
```bash
npm run db:migrate
```

This will apply all pending migrations in order.

## Migration 0006: Catalog Schema Update

**Date:** 2025-11-07
**Description:** Update catalog table schema

**Changes:**
- ✅ Removed `publication_place` column (Lugar de Publicación)
- ✅ Removed `numero_exvotos` column (Nº Total Exvotos)
- ✅ Renamed `location_description` → `location` (Descripción Ubicación → Ubicación)
- ✅ Added `related_places` column as editable text field (Lugares Relacionados)

**Files Updated:**
- `api/db/schema.ts` - Database schema definition
- `src/types.ts` - TypeScript type definitions
- `api/controllers/catalogController.ts` - API controller queries
- `src/pages/CatalogPage.tsx` - Frontend catalog page and form

**Note:** The `related_places` field is now a regular text field (not computed from related SEMs). You can manually edit it in the catalog form.

## Alternative: Use db:push (Development Only)

For quick schema updates during development (NOT recommended for production):

```bash
npm run db:push
```

This will sync your database schema directly without creating migration files.

**⚠️ Warning:** Use `db:push` only in development. For production, always use versioned migrations.
