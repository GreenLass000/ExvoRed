# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ExvoRed is a web application for managing and cataloging **exvotos** (votive offerings) - religious offerings made in gratitude for miracles. The application manages exvotos, sanctuaries/shrines/museums (SEMs), catalogs, divinities, characters, and miracles.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + React Router
- Backend: Node.js + Express + TypeScript
- Database: SQLite + Drizzle ORM
- UI Components: Heroicons

## Development Commands

### Frontend
```bash
npm run dev          # Start Vite dev server (default port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend API
```bash
npm run api:dev      # Start Express API server (port 3000)
```

### Database Management (Drizzle ORM)
```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:push      # Apply schema changes directly to database (faster for dev)
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio web interface for database inspection
npm run db:seed      # Populate database with example data
```

**Important:** Use `db:push` for quick schema updates during development. Use `db:generate` + `db:migrate` when you need versioned migrations for production.

## Architecture

### Database Schema & Relationships

The database is centered around **exvotos** with supporting entities. All relationships are defined in `api/db/schema.ts` using Drizzle ORM.

**Core Tables:**
- `exvoto` - Main table for votive offerings (includes fields like internal_id, exvoto_date, epoch, transcription, etc.)
- `sem` - Sanctuaries/Shrines/Museums (physical locations)
- `catalog` - Publications and catalogs documenting exvotos
- `divinity` - Divinities (Virgins and Saints) with attributes, history, and representation
- `character` - Unique character catalog (personas represented in exvotos)
- `miracle` - Unique miracle types catalog
- `exvoto_image` - Multiple images per exvoto (one-to-many)

**Junction Tables (many-to-many):**
- `catalog_exvoto` - Links catalogs ↔ exvotos
- `catalog_sem` - Links catalogs ↔ SEMs
- `divinity_sem` - Links divinities ↔ SEMs

**Key Relationships:**
- An exvoto has three different SEM references: `offering_sem_id` (where offered), `conservation_sem_id` (where stored), and `lugar_origen` (origin place - stored as text, not FK)
- An exvoto can belong to multiple catalogs via `catalog_exvoto`
- An exvoto can have multiple images via `exvoto_image`
- A SEM can have multiple associated divinities via `divinity_sem`

**Note:** The MER diagram in `MER.dbml` references `origin_sem_id`, but in the actual schema this was changed to `lugar_origen` (text field) per requirements.

### Project Structure

```
/api/
  /db/
    schema.ts        # Drizzle ORM schema definitions (source of truth for DB)
    index.ts         # Database connection setup
    seed.ts          # Seed data script
    database.db      # SQLite database file
    /migrations/     # Auto-generated Drizzle migrations
  /controllers/      # Business logic for each entity (CRUD operations)
  /routes/          # Express route definitions
  server.ts         # Express server setup with CORS and routes

/src/
  /components/
    DataTable.tsx    # Main reusable data table with Excel-like features
    SearchBar.tsx    # Advanced search component with highlighting and navigation
    Modal.tsx        # Reusable modal component
    Layout.tsx       # App layout with navigation
    EpochSelector.tsx # 25-year epoch interval selector (13th-21st centuries)
  /pages/           # Main application pages (lazy loaded)
    ExvotoPage.tsx, ExvotoDetailPage.tsx
    SemPage.tsx, SemDetailPage.tsx
    CatalogPage.tsx, CatalogDetailPage.tsx
    DivinitiesPage.tsx, CharactersPage.tsx, MiraclesPage.tsx
    KeybindsPage.tsx # Keyboard shortcuts documentation
  /services/
    api.ts          # API client functions for backend communication
  /utils/
    highlightText.tsx # Text highlighting utility for search results
    epochUtils.ts    # Epoch calculation utilities (25-year intervals)
    images.ts        # Image handling utilities
  /hooks/
    useExcelMode.ts  # Excel-like navigation and editing
    useExcelKeyboard.ts # Keyboard navigation
    useGlobalShortcut.ts # Global keyboard shortcuts
  types.ts          # TypeScript type definitions (mirrors backend types)
  App.tsx           # React Router setup with lazy loading
```

### Frontend-Backend Communication

- Frontend runs on `http://localhost:5173` (Vite default)
- Backend API runs on `http://localhost:3000`
- API calls go to `/api/{entity}` endpoints (e.g., `/api/exvotos`, `/api/sems`)
- CORS is enabled for development
- JSON payload limit is 10MB to support base64 image uploads

**API Pattern:** All entities follow RESTful CRUD:
- `GET /api/{entity}` - List all
- `GET /api/{entity}/:id` - Get by ID
- `POST /api/{entity}` - Create
- `PUT /api/{entity}/:id` - Update
- `DELETE /api/{entity}/:id` - Delete

### Key Features

**1. Excel-like Table Navigation (`useExcelMode`, `useExcelKeyboard`):**
- Arrow key navigation between cells
- Enter to edit, Escape to cancel
- Column reordering, resizing, hiding/showing
- Horizontal scrolling for overflow columns

**2. Advanced Search System (`SearchBar.tsx`):**
- Real-time search with text normalization (accent-insensitive)
- Search across related tables (e.g., SEM names when searching exvotos)
- Result counter ("X of Y results")
- Prev/Next navigation through results
- Yellow highlighting of search terms in tables

**3. Keyboard Shortcuts (see `KeybindsPage.tsx`):**
- `e` - Edit field
- `i` - Inspect (navigate to detail/related records)
- `Shift+E` - Edit entire row (from detail pages)
- `p` - Print (detail pages only)

**4. Epoch System:**
- Exvotos have an `epoch` field with 25-year intervals (e.g., "1551-1575")
- `EpochSelector` component provides century navigation (XIII-XXI)
- Auto-calculation from `exvoto_date` using `epochUtils.ts`

**5. Image Handling:**
- Images stored as blobs in SQLite
- Frontend expects base64 data URLs
- Multiple images per exvoto via `exvoto_image` table
- Image utilities in `src/utils/images.ts`

## Important Notes

### Database Changes
- Always update `api/db/schema.ts` first (source of truth)
- Mirror type changes in `src/types.ts` for frontend
- Run `npm run db:push` to apply changes immediately (dev)
- Update `MER.dbml` to reflect structural changes (documentation)

### Date Handling
- SQLite stores dates as text (ISO format: YYYY-MM-DD)
- **Requirements specify manual text input for dates** (not `<input type="date">`)
- Dates should be validated but allow flexible input

### TypeScript Types
- Backend types are inferred from Drizzle schema using `$inferSelect` and `$inferInsert`
- Frontend types in `src/types.ts` should match backend structure
- All dates and nullable fields use `string | null` or `number | null`

### Styling
- Tailwind CSS for all styling
- No custom CSS files except `index.css` for Tailwind directives
- Use `clsx` and `tailwind-merge` for conditional classes

### Component Patterns
- Use lazy loading for route components (`React.lazy`)
- Reusable components in `/components`
- Page-specific logic stays in `/pages`
- API calls centralized in `src/services/api.ts`
- Use hooks for complex state logic (`/hooks`)

## Active Development Areas

Based on `TODO.md` and `PROJECT_STATUS.md`:

**Completed:**
- ✅ Advanced search system across all pages
- ✅ Divinities table and management page
- ✅ Excel-mode navigation (arrow keys, column operations)
- ✅ Epoch selector with 25-year intervals
- ✅ Keyboard shortcuts (e, i, Shift+E, p)

**High Priority:**
- Switch date inputs from `type="date"` to manual text entry
- Remove "Actions" column from tables (use inline editing in detail pages)
- Improve detail pages with inline editing (eliminate separate edit modals)

**Medium Priority:**
- Column sorting (asc/desc) in table headers
- CSV/Excel export functionality
- Cell text overflow handling (truncate + modal on Enter)
- Cell color customization
- Advanced filtering (by province, epoch, etc.)

**Long Term:**
- Rich text editor for transcriptions
- Multiple image management UI
- Mini-search in dropdowns
- Linked catalog references
- "Desaparecido" (disappeared) option for SEM conservation

## Running the Full Stack

1. Start backend API:
   ```bash
   npm run api:dev
   ```

2. In a separate terminal, start frontend:
   ```bash
   npm run dev
   ```

3. Access application at `http://localhost:5173`

4. (Optional) Open Drizzle Studio to inspect database:
   ```bash
   npm run db:studio
   ```
