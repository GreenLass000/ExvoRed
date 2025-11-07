-- Migration: Update catalog table schema
-- Drop columns: publication_place, numero_exvotos
-- Rename column: location_description -> location
-- Add column: related_places

-- SQLite doesn't support DROP COLUMN or RENAME COLUMN directly in older versions
-- We need to recreate the table

-- Step 1: Create new table with updated schema
CREATE TABLE catalog_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT,
  reference TEXT,
  author TEXT,
  publication_year INTEGER,
  catalog_location TEXT,
  exvoto_count INTEGER,
  related_places TEXT,
  location TEXT,
  oldest_exvoto_date TEXT,
  newest_exvoto_date TEXT,
  other_exvotos TEXT,
  comments TEXT,
  updated_at TEXT
);

-- Step 2: Copy data from old table to new table
INSERT INTO catalog_new (
  id,
  title,
  reference,
  author,
  publication_year,
  catalog_location,
  exvoto_count,
  related_places,
  location,
  oldest_exvoto_date,
  newest_exvoto_date,
  other_exvotos,
  comments,
  updated_at
)
SELECT
  id,
  title,
  reference,
  author,
  publication_year,
  catalog_location,
  exvoto_count,
  NULL as related_places,
  location_description as location,
  oldest_exvoto_date,
  newest_exvoto_date,
  other_exvotos,
  comments,
  updated_at
FROM catalog;

-- Step 3: Drop old table
DROP TABLE catalog;

-- Step 4: Rename new table to original name
ALTER TABLE catalog_new RENAME TO catalog;
