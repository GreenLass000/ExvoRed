# ADR-20251015-store-images-as-base64

## Status
Accepted

## Context
ExvoRed requires storing multiple images per exvoto, SEM, and divinity entity to document visual aspects of votive offerings, sanctuary architecture, and religious iconography. Images range from 100KB to 5MB in size, with most being scanned documents or photographs. The system supports multiple images per entity (one-to-many relationships via `exvoto_image`, planned `sem_image`, and `divinity_image` tables).

The application needs atomic transactions where image deletion happens automatically when parent records are deleted, preventing orphaned files. Backup and portability are critical for academic research data; the entire database must be backed up as a single unit without managing separate file storage. The API layer uses Express with JSON payloads, and the frontend React application displays images inline in tables and detail views. The development team wants to avoid managing file system storage, permissions, and CDN configuration complexity.

## Decision
Store images as blobs in SQLite database tables. When uploading from the frontend, convert images to base64 data URLs using `FileReader.readAsDataURL()`. Send base64 strings in JSON POST/PUT requests. In backend controllers, convert base64 strings to Buffer objects and store as blobs. When retrieving images, detect MIME type using magic byte inspection, convert blobs to base64 data URLs, and send to frontend via JSON. Set Express JSON payload limit to 10MB to accommodate large images.

## Consequences

### Positive
- Atomic transactions: Images are deleted automatically with parent records via foreign key cascades; no orphaned files on disk
- Simplicity: No file system management, no upload folder permissions, no filename collision handling, no CDN configuration
- Portability: Single database file contains all data and images; backup is a simple file copy with rsync or S3 sync
- Transactional integrity: Image uploads and metadata changes happen in the same database transaction; rollback on error
- No file system dependencies: Application works identically on Windows, Linux, and macOS without path separator issues
- Deployment simplicity: No need to configure static file serving, no storage volume mounts, no S3 credentials

### Negative
- Base64 overhead: 33% size increase when encoding images (e.g., 1MB image becomes 1.33MB); increases bandwidth usage and JSON parsing time
- Database bloat: Images stored in database increase file size significantly; a database with 1000 exvotos and 5 images each (1MB average) would be 6.65GB
- Memory usage: Converting large images to base64 can cause memory spikes; multiple simultaneous uploads could exhaust Node.js heap
- 10MB request limit: Cannot upload images larger than approximately 7.5MB (after base64 encoding overhead); must resize or compress before upload
- Backup size: Database backups are much larger due to included images; slower backup/restore operations
- Query performance: Loading images with every query increases response size; requires careful query design to exclude image columns when not needed

### Neutral
- Migration path available: If storage requirements grow beyond 10GB, can migrate to file system storage or S3 without changing API contract (URLs vs. data URLs)
- Caching strategy needed: Base64 conversion happens on every request; adding HTTP caching headers recommended for production

## Alternatives Considered

### Alternative 1: File System Storage with Database References
**Rejected because:** File system storage introduces complexity in managing upload directories, file permissions, and orphaned file cleanup. When deleting an exvoto, the application must remember to delete associated image files, creating potential for orphaned files if the deletion fails. Backups become more complex, requiring two separate operations (database dump + file sync). File path handling differs between operating systems (Windows vs. Unix separators). Serving files requires configuring Express static middleware or nginx, adding deployment complexity. Database portability suffers; copying the database file alone is insufficient for migration.

### Alternative 2: External CDN Storage (S3, Cloudflare R2)
**Rejected because:** External storage is overkill for a small academic application with 1-10 concurrent users. Setting up S3 requires AWS credentials, bucket configuration, IAM policies, and CORS rules, adding significant operational overhead. CDN costs may be low but add ongoing expenses for a non-profit research project. Uploads become two-step operations (upload to S3, save URL to database), increasing complexity and failure modes. Local development requires either S3 credentials or a local storage emulator (MinIO), complicating onboarding. Atomic deletion is impossible; deleting an exvoto requires a separate S3 API call, creating potential for orphaned S3 objects.

### Alternative 3: Object Storage URLs with Signed URLs
**Rejected because:** Signed URLs add authentication complexity without providing benefits for ExvoRed's use case. The application currently has no authentication layer, so signed URLs are premature. Generating signed URLs on every request adds latency and complexity. URL expiration requires frontend logic to refresh expired URLs. This approach inherits all disadvantages of external CDN storage (Alternative 2) while adding additional complexity.

## References
- Express JSON payload limit: https://expressjs.com/en/api.html#express.json
- SQLite blob documentation: https://www.sqlite.org/datatype3.html#blob
- Base64 encoding overhead: https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa
- Image handling utilities: `/home/marcos/Documentos/Programming/JavaScript/ExvoRed/src/utils/images.ts`
- Related ADR: ADR-20251015-use-sqlite-database.md
