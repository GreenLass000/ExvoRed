# Migration Notes - Catalog Schema Update (2025-11-07)

## Summary of Changes

This migration updates the catalog table schema with the following changes:

### Removed Columns
- ❌ `publication_place` (Lugar de Publicación)
- ❌ `numero_exvotos` (Nº Total Exvotos)

### Modified Columns
- 🔄 `location_description` → `location` (renamed)
- 🔄 `related_places` - Changed from read-only computed field to editable textarea

## How to Apply This Migration on Another Machine

### Step 1: Pull the changes
```bash
git pull origin main
```

### Step 2: Apply the migration
```bash
npm run db:migrate
```

That's it! The migration file `0006_catalog_schema_update.sql` will be applied automatically.

## Files Changed

### Backend
- `api/db/schema.ts` - Updated catalog table definition
- `api/controllers/catalogController.ts` - Updated select queries
- `api/db/migrations/0006_catalog_schema_update.sql` - Migration file
- `api/db/migrations/meta/_journal.json` - Migration registry

### Frontend
- `src/types.ts` - Updated Catalog interface
- `src/pages/CatalogPage.tsx` - Updated columns, form fields, and search fields

## Testing

After applying the migration, verify:

1. ✅ Catalog page loads without errors
2. ✅ All catalog data is preserved
3. ✅ Forms work correctly with new field structure
4. ✅ Search includes new fields (location, related_places)
5. ✅ "Lugares Relacionados" field is editable in forms

## Rollback (if needed)

If you need to rollback this migration, you'll need to manually reverse it:

```sql
-- Create table with old schema and copy data back
-- (SQLite doesn't support easy rollbacks of ALTER TABLE)
```

It's recommended to backup your database before applying migrations in production.

## Migration File Location

The migration SQL file is located at:
```
api/db/migrations/0006_catalog_schema_update.sql
```

You can inspect it to see exactly what database changes will be applied.
