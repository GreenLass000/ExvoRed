# Plan de rendimiento (sin aplicar cambios de código)

## Resumen de los cuellos de botella
- Los listados devuelven todos los campos largos y las imágenes en base64 en cada fila; serializar y renderizar eso bloquea servidor y UI.
- SQLite ejecuta `SELECT/COUNT/ORDER BY` sin índices, recorriendo la tabla completa.
- La tabla “Excel” re-renderiza todas las celdas en cada pulsación (selección cambia estado global) y hace `scrollIntoView` con animación en cada flecha.
- No hay virtualización: se pintan 100×N celdas con rich text/imágenes aunque no estén en viewport.
- Cargas redundantes: SEMs, personajes y milagros se piden en cada página aunque casi nunca cambien.
- Búsquedas/normalizaciones en cliente recorren todo el dataset en cada cambio de query.

## Pasos sugeridos (orden recomendado)

### 1) Aligerar payload de API
- En `/api/exvotos` devolver:
  - Texto largo/richtext truncado (p. ej. 200-300 chars) + flag `hasMore`, salvo en detalle/modal.
  - Imagen principal como URL/thumbnail generada aparte o no incluirla en la lista, sólo en detalle.
- Afecta: `api/controllers/exvotoController.ts` y DTOs en `src/services/api.ts`, `src/pages/ExvotoPage.tsx`, `src/pages/ExvotoDetailPage.tsx`, `src/components/excel/ExcelTable.tsx` (render condicional si viene truncado).

### 2) Índices en SQLite
- Crear migración para índices en campos usados en ORDER/PAGINACIÓN/FKs:
  - `exvoto(updated_at)`, `exvoto(offering_sem_id)`, `exvoto(conservation_sem_id)`, `exvoto(exvoto_date)`.
  - `sem(id)`, `character(id)`, `miracle(id)` si no existen.
  - Índices compuestos en tablas relación: `catalog_sem(catalog_id)`, `catalog_exvoto(catalog_id, exvoto_id)`.
- Afecta: migraciones `api/db/migrations` y `api/db/schema.ts` (añadir `indexes`).

### 3) Virtualización y render de tabla
- Usar virtualización (p. ej. `react-window` o `@tanstack/react-virtual`) en `src/components/excel/ExcelTable.tsx` para renderizar sólo las filas/columnas visibles.
- Evitar re-render global:
  - Hacer las celdas `React.memo` y mover estado de selección a nivel de celda (o usar context selector) para que sólo la celda activa cambie.
  - Evitar pasar valores inline (funciones/objetos nuevos) en `columns` y `row` props.
- Afecta: `src/components/excel/ExcelTable.tsx`, `src/hooks/useExcelMode.ts`, celdas/renderers.

### 4) Scroll y navegación
- Quitar `scrollIntoView` con `behavior: 'smooth'` en selección de celda; usar scroll sin animación y sólo cuando la celda está fuera de viewport.
- Desacoplar `selectedCell` de los renders pesados (ver punto 3) para que flechas sean instantáneas.
- Afecta: `src/hooks/useExcelKeyboard.ts`, `src/hooks/useExcelMode.ts`, `src/components/excel/ExcelTable.tsx`.

### 5) Cargas y caché de datos maestros
- SEMs, personajes y milagros: cargarlos una vez y cachear en contexto (o SWR/RTK Query) en vez de pedirlos en cada página.
- Afecta: `src/services/api.ts`, `src/pages/ExvotoPage.tsx`, proveedores de datos compartidos.

### 6) Buscar/filtrar en cliente
- Mover normalización pesada fuera del render (memoizar resultados por query) o limitar búsqueda a columnas cortas.
- Si el dataset crece, delegar búsqueda a backend con filtros y LIMIT.
- Afecta: `src/components/SearchBar.tsx`, `src/components/excel/ExcelTable.tsx`.

### 7) Imágenes
- Guardar y servir miniaturas (128–256 px) para la vista de lista; no incrustar base64 en el JSON.
- Afecta: backend de imágenes en `api/controllers/exvotoController.ts`, utilidades de imagen, y render en tabla.

### 8) Rich text
- Para columnas richtext en la lista, renderizar versión plana/truncada y abrir modal/detalle para HTML completo.
- Afecta: renderers en `src/pages/ExvotoPage.tsx`, `src/components/excel/CellModal.tsx` y API (ver punto 1).

## Cadena de validación recomendada
1) Añadir índices y repetir `/api/exvotos?page=1&limit=100` midiendo tiempo en servidor.
2) Quitar/optimizar payload (sin imágenes/base64, texto truncado) y medir tamaño de respuesta.
3) Implementar virtualización + memo en tabla y medir interacción (flechas) con profiler de React.
4) Verificar que navegación con flechas no dispara re-render masivo ni scroll animado.
5) Cargar maestros una vez y confirmar que no hay peticiones redundantes al navegar páginas.
