# ExvoRed Whole Frontend — Audit Report

## Date

- 2026-09-14

## Scope reviewed

- Route/page/module: the whole React frontend (`src/`), including every configured route, shared UI, Excel-style table system, hooks, client API layer, and global styling.
- Supporting trust-boundary scope: Express route assembly, controllers, database schema, and image handling under `api/` were inspected where needed to validate frontend security and data-integrity findings.
- Files reviewed: all authored files under `src/` and `api/`, plus `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, project documentation, and the generated dependency graph.
- Runtime assumptions: the documented local setup uses Vite on port 5173, Express on port 3000, and a local SQLite database. Risk rises sharply if port 3000 is reachable from another device, reverse-proxied, or deployed publicly.

## Stack classification

- React 19 + TypeScript + Vite + React Router 6 + Tailwind CSS.
- This is not a Web Components application; Web Components-specific checks were not applied.

## Inputs and methodology

- Skills used: `analize-code`, current Vercel Web Interface Guidelines, `frontend-design`, React performance guidance, React composition guidance, and `graphify` for repository topology.
- Code areas inspected: routes and loading boundaries; list/detail/edit flows; forms and dialogs; search; table keyboard behavior; local persistence; raw HTML; URL and image handling; API calls; Express middleware and routing; controllers; schema; dependencies; build configuration.
- Runtime/build verification performed:
  - `npm run build`: passed; 399 modules transformed. Largest initial JS chunk: 222.23 kB raw / 71.23 kB gzip.
  - `npx tsc --noEmit`: failed with 62 TypeScript errors.
  - `npm audit --omit=dev --audit-level=moderate`: reported 12 advisories (6 high, 6 moderate).
  - Graph extraction: 457 nodes, 823 edges, 27 communities, and no import cycles.
- Limitations:
  - No live browser, screen reader, keyboard walkthrough, Lighthouse run, or visual-regression comparison was performed. Visual/responsive conclusions are source-based.
  - The API was inspected statically and was not exercised against a copy of the database.
  - No deployment configuration was supplied, so network reachability and reverse-proxy protections could not be verified.
  - The generated graph reported 135 dangling-endpoint edges and 30/32 directed/undirected endpoint-pair collapses. It was used only to guide navigation; every reported issue below is grounded in direct source evidence.

## Executive summary

ExvoRed has a useful domain model, consistent list/detail concepts, route-level lazy loading, and a feature-rich keyboard-oriented table. Its current security boundary is unsafe for any shared or public deployment: every API route is unauthenticated, CORS accepts arbitrary origins, request bodies are broadly trusted, and stored rich text is injected into the DOM without sanitization. Together, these form a confirmed stored-XSS path and expose the entire catalog to unauthorized reads, writes, and deletion.

The next most important issue is accessibility. The main data experience is constructed from non-semantic `div` elements, automatically selects a virtual cell without moving DOM focus, and installs a document-level keyboard handler that prevents Tab and arrow-key defaults outside inputs. Dialogs do not trap or restore focus, nested dialogs register competing Escape handlers, and several search/form controls lack programmatic names. The workflow may feel efficient to a mouse/power-keyboard user while being effectively unavailable to screen-reader and conventional keyboard users.

Engineering safety is also weaker than the green Vite build suggests. Vite transpiles the project, but the strict TypeScript configuration currently reports 62 errors and there is no type-checking build gate. The core table and page modules are large, prop-heavy hubs with duplicated CRUD and feedback logic. Address the security boundary first, then keyboard/dialog semantics and the broken type gate, before visual polish.

## Findings by severity

### Critical

#### C1 — Confirmed stored XSS through unsanitized rich text

- Classification: confirmed issue.
- Why it matters: an attacker who can create or update a rich-text field can persist arbitrary HTML that later executes in another user's browser. Because API writes require no identity, this is not limited to a trusted editor when the API is network-reachable.
- Evidence:
  - The editor writes arbitrary HTML into and reads arbitrary HTML from `contentEditable`: `src/components/RichTextEditor.tsx:29-38`.
  - Raw stored strings are rendered with `dangerouslySetInnerHTML` in the table and cell modal: `src/components/excel/ExcelTable.tsx:530-560`, `src/components/excel/CellModal.tsx:262-268`.
  - The same pattern exists on detail screens: `src/pages/ExvotoDetailPage.tsx:323-326`, `src/pages/SemDetailPage.tsx:132-135`, `src/pages/CatalogDetailPage.tsx:166-169`, `src/pages/DivinityDetailPage.tsx:177-180`.
  - Controllers accept those strings and persist them without HTML sanitization, for example `api/controllers/semController.ts:74-96`, `api/controllers/catalogController.ts:102-135`, and `api/controllers/exvotoController.ts:140-171`.
- Affected files: rich-text editor, Excel table/modal, four detail pages, and write controllers.
- Recommended fix: define an explicit rich-text allowlist and sanitize on the server before persistence. Sanitize again at the render boundary as defense in depth, migrate/clean existing records, reject dangerous URLs/attributes, and add stored-XSS regression tests covering event attributes, SVG, `javascript:` URLs, malformed markup, and pasted HTML. Do not treat a client-only sanitizer as the security boundary.

#### C2 — No authentication or authorization on database and image APIs

- Classification: confirmed control absence; impact is deployment-dependent but critical wherever the API is reachable by untrusted clients.
- Why it matters: any caller can enumerate records and images, create or change cultural records, alter relationships, and delete data. There is no user, role, session, or ownership boundary anywhere in the route chain.
- Evidence:
  - Express enables default permissive CORS and mounts all API routers directly: `api/server.ts:11-28`.
  - CRUD and image mutation routes have no authentication/authorization middleware: `api/routes/exvotoRoutes.ts:4-17`, `api/routes/semRoutes.ts:4-10`, with the same pattern across the remaining route modules.
  - The client sends no credential or authorization material: `src/services/api.ts:5-19`.
- Affected files: `api/server.ts`, all `api/routes/*`, all mutation controllers, and `src/services/api.ts`.
- Recommended fix: decide whether this is a single-user localhost tool or a multi-user service and encode that decision. For shared/public use, add authenticated sessions, CSRF protection for cookie-based sessions, role/permission checks on every mutation, audit logging, a restrictive origin allowlist, secure headers, rate limits, and authorization tests. For a strictly local tool, bind Express to loopback explicitly and document/firewall that boundary rather than relying on convention.

### High

#### H1 — Request validation, field allowlisting, and resource bounds are missing

- Classification: confirmed issue.
- Why it matters: TypeScript casts do not validate runtime input. Broad object spreads allow clients to submit server-managed or unexpected fields, invalid IDs fall through to database operations, pagination can request arbitrarily large/negative ranges, and image arrays are not bounded by count or decoded size. This magnifies corruption and denial-of-service risk, especially alongside C2.
- Evidence:
  - Unvalidated request bodies are spread directly into inserts/updates: `api/controllers/semController.ts:74-96`, `api/controllers/catalogController.ts:102-135`, `api/controllers/exvotoController.ts:140-169`.
  - Page and limit values are accepted without min/max checks: `api/controllers/semController.ts:27-35`, `api/controllers/exvotoController.ts:85-94`.
  - Image uploads validate only that `images` is non-empty; no per-file decoded-size or count bound exists: `api/controllers/exvotoController.ts:288-313`.
  - MIME detection defaults unknown bytes to JPEG, so the allowlist accepts arbitrary byte streams as `image/jpeg`: `api/controllers/exvotoController.ts:14-35`.
- Recommended fix: validate params, query strings, and bodies with shared schemas; reject unknown keys; separate create/update DTOs from database row types; cap pagination; cap image count and decoded bytes; verify image signatures and decoding; set `X-Content-Type-Options: nosniff`; and return structured 4xx errors.

#### H2 — Global spreadsheet shortcuts break conventional keyboard navigation

- Classification: confirmed issue.
- Why it matters: the core table automatically selects a logical cell but does not focus a DOM grid cell, then captures keyboard events on `document`. Tab, arrows, Home/End, and other keys are prevented outside form inputs, which can stop users from reaching navigation, search, table controls, or dialogs through the normal focus order.
- Evidence:
  - A cell is selected automatically on mount: `src/components/excel/ExcelTable.tsx:183-188`.
  - Tab and navigation keys are included in the global prevent-default set: `src/hooks/useExcelKeyboard.ts:82-90`.
  - The handler is attached to `document`, not to a focused grid widget: `src/hooks/useExcelKeyboard.ts:538-550`.
  - Rendered rows and cells are non-focusable `div` elements with no grid roles or accessible coordinates: `src/components/excel/ExcelTable.tsx:635-744`.
- Recommended fix: implement a semantic `<table>` where feasible, or an ARIA grid with a single roving `tabIndex=0`, `role="row"`/`gridcell`, row/column labels, `aria-selected`, and DOM focus synchronized to selection. Scope key handling to the focused grid and never intercept Tab as a global application shortcut.

#### H3 — Dialogs lack required focus and background isolation behavior

- Classification: confirmed issue.
- Why it matters: users can tab behind an open dialog; assistive technology is not reliably tied to the title; focus is not restored to the opener; body scrolling is not controlled; and nested quick-create dialogs leave the parent open with multiple document Escape listeners, so one Escape event can close more than one layer.
- Evidence: `src/components/Modal.tsx:22-68`; nested modal states remain simultaneously mounted in `src/pages/ExvotoPage.tsx:550-557` and `src/pages/ExvotoPage.tsx:708-870`.
- Recommended fix: use the native `<dialog>` element or a proven accessible dialog primitive. Add labelled title IDs, focus trapping, opener restoration, background `inert`, scroll locking/overscroll containment, and a dialog stack so only the top layer handles Escape.

#### H4 — The strict TypeScript contract is broken while the release build remains green

- Classification: confirmed issue.
- Why it matters: 62 type errors include real contract drift in core code, while `npm run build` calls only Vite. Releases can therefore pass CI/build even when handlers, API assumptions, and component contracts are inconsistent.
- Evidence:
  - `package.json:7-10` has no typecheck script and the build script is `vite build` only.
  - `npx tsc --noEmit` reports 62 errors. Examples include incompatible React node access (`src/components/SearchBar.tsx:51-52`), column type mismatch and textarea handler mismatch (`src/components/excel/ExcelTable.tsx:471-473`, `src/components/excel/ExcelTable.tsx:763-769`), invalid API response usage (`src/services/api.ts:306-317`), and missing model fields (`src/pages/CatalogPage.tsx:14-27`).
- Recommended fix: resolve semantic errors before unused-symbol cleanup, add `typecheck: tsc --noEmit`, and make CI/build run typecheck before Vite. Generate or share DTO types so frontend/API/schema contracts cannot silently diverge.

#### H5 — Production dependencies contain current high-severity advisories

- Classification: probable risk; installed-version exposure is confirmed, but the reviewed code does not prove every vulnerable path is reachable.
- Why it matters: the current lockfile contains 6 high and 6 moderate advisories. High findings include React Router/open-redirect issues, Drizzle identifier SQL injection, `path-to-regexp` denial of service, and `tar-fs` extraction issues.
- Evidence: `npm audit --omit=dev --audit-level=moderate` on 2026-09-14; relevant declared versions include `react-router-dom` 6.23, `drizzle-orm` 0.44, and Express 5.1 in `package.json:14-28`.
- Recommended fix: update non-breaking fixes first, assess the Drizzle upgrade separately because npm marks it as breaking, rerun type/build/integration checks, and document why any deferred advisory is not reachable. Do not run `npm audit fix --force` without reviewing the resulting dependency changes.

### Medium

#### M1 — API origin is hard-coded to the developer machine

- Classification: probable deployment defect.
- Why it matters: a deployed frontend would call `http://localhost:3000` in each visitor's browser, and HTTPS pages would also encounter mixed-content restrictions.
- Evidence: `src/services/api.ts:3-7`; image URLs derive the same origin in `src/utils/images.ts:16-28`.
- Recommended fix: use same-origin `/api` behind a reverse proxy, or an explicitly validated `VITE_API_BASE_URL` with per-environment configuration.

#### M2 — Search, filters, sorting, and pagination are split between local state and incomplete URLs

- Classification: confirmed UX issue / improvement opportunity.
- Why it matters: list search operates only on the currently fetched page, table filters/sorts apply only to that page, and pagination/filter/sort state is not represented in the URL. Result counts can be mistaken for whole-dataset results, and views cannot be shared or restored.
- Evidence: pages fetch fixed slices (`src/pages/ExvotoPage.tsx:118-152`), then pass only that slice to client search/table (`src/pages/ExvotoPage.tsx:872-877`); page controls store page only in component state (`src/pages/ExvotoPage.tsx:926-965`); table filters/sorts are local (`src/hooks/useExcelMode.ts:226-337`).
- Recommended fix: choose one model explicitly. Prefer server-side search/filter/sort with `page`, query, filters, and sort encoded in URL parameters; clearly label page-local search if retained.

#### M3 — Client request flows can race and do not cancel stale work

- Classification: probable issue.
- Why it matters: fast typing or route/page changes can allow older responses to overwrite newer state, and unmounted components still complete unnecessary work.
- Evidence: debounced global search has no `AbortController` or request sequence check (`src/components/GlobalSearch.tsx:34-57`); page/detail effects likewise fetch without cancellation (`src/pages/ExvotoPage.tsx:118-152`, `src/pages/ExvotoDetailPage.tsx:63-107`).
- Recommended fix: add abort signals/request IDs or use a query library that handles cancellation, deduplication, stale data, retries, and mutation invalidation.

#### M4 — Initial data loading overfetches and contains an avoidable waterfall

- Classification: confirmed improvement opportunity.
- Why it matters: the Exvoto list waits for four master datasets before requesting the primary page and asks for up to 10,000 SEMs/divinities. Detail pages repeat the same masters without shared caching.
- Evidence: `src/pages/ExvotoPage.tsx:118-137`, `src/services/api.ts:27-30`, `src/services/api.ts:216-219`, `src/pages/ExvotoDetailPage.tsx:71-81`.
- Recommended fix: start the page request and independent master requests together, cache shared dictionaries, load selector options on demand, and expose compact lookup endpoints instead of full records.

#### M5 — Core UI architecture is concentrated in prop-heavy monoliths and duplicated page controllers

- Classification: confirmed maintainability issue.
- Why it matters: `ExcelTable` accepts many optional behavior flags/callbacks and owns selection, editing, copy/paste, searching, filters, density, navigation, modals, and viewport sizing. Large list pages duplicate fetch/loading/toast/modal/CRUD/pagination logic, increasing divergence and regression cost.
- Evidence: `src/components/excel/ExcelTable.tsx:14-91` and its 876-line implementation; `src/pages/ExvotoPage.tsx` is 997 lines; similar controllers appear in `SemPage`, `CatalogPage`, and `DivinitiesPage`. Several declared props are unused according to TypeScript (`onInspect`, `enableExcelMode`, `rowActions`, `enableInlineEdit`).
- Recommended fix: split a table state provider from composed grid parts, expose explicit variants rather than optional boolean modes, and extract reusable list-resource/query/toast/dialog flows. Keep domain-specific column and form definitions close to each feature.

#### M6 — Responsive navigation and dense controls are not designed for narrow screens

- Classification: probable UX issue based on source.
- Why it matters: seven nowrap navigation links plus global search share a fixed 64px row with no collapse or horizontal-overflow strategy. Dense table controls and pagination also assume wide layouts.
- Evidence: `src/components/Layout.tsx:24-46`; `src/components/excel/ExcelTable.tsx:586-633`; pagination at `src/pages/ExvotoPage.tsx:926-965`.
- Recommended fix: introduce a mobile navigation drawer or wrapped secondary navigation, keep search accessible at small widths, allow controls/pagination to wrap, and test at 320/375/768px plus zoomed desktop layouts.

#### M7 — Unsaved-change protection covers modal close but not navigation/reload

- Classification: confirmed UX/data-loss risk.
- Why it matters: edit forms prompt when the shared modal's close action is used, but route navigation, refresh, and browser close are not guarded.
- Evidence: confirmation exists only in `src/components/Modal.tsx:13-20`; no `beforeunload` or router blocker exists in `src/`.
- Recommended fix: centralize dirty-form state and guard both browser unload and in-app navigation. Clear the guard only after a confirmed save/discard.

### Low

#### L1 — Several accessibility names and form relationships are missing

- Classification: confirmed issue.
- Evidence: global/local search inputs have placeholder-only names (`src/components/GlobalSearch.tsx:84-102`, `src/components/SearchBar.tsx:232-245`); icon-only search controls use `title` but no `aria-label` (`src/components/SearchBar.tsx:247-281`); detail page labels are not associated with inputs (`src/pages/SemDetailPage.tsx:106-112`, similar patterns in Catalog/Divinity detail); the column panel checkbox has no associated label (`src/components/excel/ColumnVisibilityPanel.tsx:180-225`).
- Recommended fix: add visible labels where space permits, otherwise `aria-label`; connect labels with `htmlFor`/`id`; hide decorative SVGs from assistive technology; add meaningful `name`, `autocomplete`, and input types.

#### L2 — Live feedback is visual-only

- Classification: confirmed issue.
- Evidence: save/copy/toast/search-result updates render visually without `aria-live`, `role="status"`, or `role="alert"`, for example `src/components/excel/ExcelTable.tsx:576-584` and `src/pages/ExvotoPage.tsx:968-991`.
- Recommended fix: use a shared live-region component, announce concise success/error messages, and move focus to the first invalid field for form errors.

#### L3 — Motion and transition rules do not honor user preferences

- Classification: confirmed issue.
- Evidence: toast/spinner animations have no reduced-motion override (`src/index.css:42-56`, `src/components/GlobalSearch.tsx:103-105`), and `transition-all` appears in draggable/scrollbar elements (`src/components/excel/DraggableColumn.tsx:165-170`, `src/components/excel/HorizontalScrollBar.tsx:143-149`).
- Recommended fix: add `prefers-reduced-motion` variants and transition only the properties that actually change.

#### L4 — Build and document shell contain stale configuration

- Classification: confirmed maintainability issue plus probable secret-exposure hazard.
- Evidence: `index.html:9-19` carries a development import map mixing React 18 and React 19 even though Vite bundles dependencies; `vite.config.ts:5-12` loads all env variables and defines `GEMINI_API_KEY` for client replacement despite no current frontend consumer; `vite.config.ts:18-20` also contains an invalid Vite server option flagged by TypeScript.
- Recommended fix: remove the import map and unused key definitions. Never expose a provider secret to client code; put provider calls behind the server. Remove or correct unsupported Vite configuration.

## UI / UX / Accessibility review

- Visual hierarchy: pages use a consistent slate/blue vocabulary and clear page-level actions, but most surfaces are generic utility panels with limited visual differentiation between browsing, editing, and destructive contexts. Use stronger section hierarchy and reserve accent colors consistently for primary action, selection, warning, and destructive intent.
- Spacing and density: the table's density selector is helpful. Toolbars, pagination, search controls, and sticky form actions become crowded when combined; allow wrapping and simplify rarely used actions into menus.
- Responsiveness: the wide navigation and spreadsheet-first layout have no credible small-screen mode in source. Horizontal table scrolling is expected, but surrounding controls must adapt independently.
- Touch targets: several icon buttons and drag/resize handles are below a comfortable touch target. Column reorder/resize is mouse-drag dependent and has no equivalent button/keyboard operation.
- Contrast and readability: the general slate palette is readable, but placeholder text, disabled/secondary text, and text on yellow success/warning surfaces need measured contrast verification.
- Keyboard/focus behavior: this is the largest accessibility weakness. The global grid handler overrides conventional navigation; grid cells lack focus/semantics; dialogs do not manage focus; drag interactions lack keyboard alternatives.
- Loading, empty, and error states: routes and pages have basic loading/error/empty messaging. Many updates are not announced, no skeleton preserves table geometry, and global search does not distinguish an error from zero results to the user.
- Copy clarity: Spanish copy is generally direct, but visible text mixes `Resetear`, raw symbols (`««`, `»»`), quoted straight strings, and some English fallback dialog text. Standardize vocabulary and provide specific accessible labels such as “Primera página”.
- Images: images have alt text in most meaningful contexts and lazy loading on the table thumbnail, which is healthy. Rendered images lack explicit intrinsic dimensions, and upload previews/large images depend only on CSS sizing, increasing layout-shift risk.

## Stack-specific best-practices review

### React

- Rendering: route-level lazy loading in `src/App.tsx:6-16` is good, and several expensive column/maps are memoized. However, the table performs nested column lookups while rendering/searching and renders every row/cell in the page; current 50/100 page sizes make this tolerable, but the architecture will not scale to the 10k/100k legacy fetch paths.
- State ownership: related table state is spread across `ExcelTable`, `useExcelMode`, `useExcelKeyboard`, page search state, and modal state. Some state is duplicated (`filtered*`, query, search results, selected cell) and coordinated by effects/imperative refs.
- Effects and async flows: most listeners clean up correctly. Request effects lack cancellation, `DivinitiesPage` rebuilds `fetchData` after setting `allSems` and therefore refetches once, and RichTextEditor mirrors a prop into the DOM via an effect rather than using a sanitized editor model.
- Data fetching: direct effects duplicate fetch state and caching logic. Independent fetches are sometimes parallelized on detail pages, but the Exvoto list has a master-data waterfall and lookup endpoints overfetch.
- Bundle/hydration: this is client-rendered Vite, so server hydration mismatch is not presently relevant. Route chunks are reasonable. The base chunk remains the main bundle focus; remove stale import-map/config code before deeper bundle work.
- Local storage: page configuration is versioned and limited to UI preferences, which is healthy. `useExcelMode` calls `usePageConfig` conditionally (`src/hooks/useExcelMode.ts:102-111`), violating hook-order safety if `pageId` changes, and the returned actions object is recreated and used as an effect dependency (`src/hooks/useExcelMode.ts:191-201`), causing unnecessary save scheduling.
- Composition: the optional-prop surface of `ExcelTable` should become provider-backed compound parts or explicit variants. React 19 is installed, but the table still uses `forwardRef`; this is not urgent compared with the security, accessibility, and type issues.

## Architecture / Maintainability review

- Component API design: the generic table contract and implementation have drifted; TypeScript errors and unused options prove that the public API no longer describes behavior reliably.
- Separation of concerns: API calls are centralized, which is good. Validation, data DTOs, caching, error normalization, and auth concerns are absent, so page components still carry too much orchestration.
- Reusability: Modal, SearchBar, RichTextEditor, and Excel components are shared, but their accessibility/security defects are consequently cross-cutting. Fixing them centrally will yield high leverage.
- Screen vs shared boundaries: page-specific field definitions are appropriate, while common list resource behavior is copied. Extract behavior, not every visual fragment.
- Provider/store responsibilities: no global state library is required for this app. A small query/cache layer plus table/dialog providers would reduce imperative refs and synchronized local state.
- Maintainability risks: manually duplicated frontend/backend types, schema aliases, `any` casts, runtime mass assignment, stale documentation/configuration, and a missing test/type gate.
- Graph evidence: `apiCall`, `ColumnDef`, shared UI, routes/pages, and the Excel system are high-degree hubs. There are no import cycles, but UI/table communities have low cohesion, consistent with over-broad responsibilities. Graph integrity warnings limit finer conclusions.

## Security review

- Auth and session handling: absent. No login, session, token, CSRF, role, or permission checks were found.
- Authorization boundaries: absent on all read/write/delete routes. Junction-table mutations and image operations are equally exposed.
- Private data exposure: all records and images are enumerable to any API caller. Whether names/contact/transcriptions are legally or ethically sensitive needs a data-classification decision.
- Unsafe user-controlled content: confirmed stored-XSS chain through rich-text HTML. Plain React interpolations are otherwise escaped, and Drizzle value predicates are parameterized in the inspected queries.
- Upload, URL, and redirect risks: image byte verification and bounds are weak; arbitrary `data:`/HTTP(S) strings are accepted by the client image helper; new-tab calls do not consistently use `noopener`. No user-controlled application redirect was confirmed in source.
- API trust boundaries: controllers cast rather than validate and often spread request objects into database operations.
- Missing validation/sanitization: rich HTML, DTO shapes, numeric ranges, date formats, relationship IDs, text lengths, image dimensions/count/decoded size, and duplicate junction relationships need enforcement.
- Dependency posture: 12 production-tree advisories require triage. None replaces the need to fix the application-level XSS and open API first.
- Backend scope note: the supporting API was inspected enough to confirm enforcement is absent. Infrastructure controls, database file permissions, backups, TLS, proxies, and network ACLs were not available, so no conclusion is made about them.

## Cross-cutting improvements

1. Establish a real server boundary: authentication/authorization, validation schemas, field allowlists, sanitization, safe errors, limits, headers, and audit logs.
2. Create shared DTO schemas that generate/infer both server and client types; validate API responses as well as requests.
3. Replace custom dialog behavior and virtual spreadsheet semantics with accessible primitives while keeping ExvoRed's useful keyboard workflow scoped to a focused grid.
4. Introduce a query/cache layer and URL-owned list state to solve races, repeated master fetches, sharing, back/forward behavior, and mutation refresh consistency together.
5. Decompose ExcelTable around a provider and explicit subcomponents/variants, then extract reusable list-page control logic.
6. Add a quality gate: typecheck, unit tests for normalization/epoch/table reducers, controller validation tests, stored-XSS tests, accessibility tests, and a production build.

## Prioritized action plan

1. Immediate fixes
   1. Restrict API network exposure until C2 is resolved.
   2. Sanitize rich text server-side and at render boundaries; clean existing records.
   3. Add authentication/authorization and restrictive CORS, or bind/document a loopback-only single-user architecture.
   4. Add request schemas, field allowlists, pagination/upload bounds, and safe image validation.
   5. Stop globally preventing Tab/arrows; scope keyboard behavior to a focused semantic grid.
2. Short-term cleanup
   1. Fix the 62 TypeScript errors and add a mandatory typecheck script/CI gate.
   2. Upgrade/triage vulnerable dependencies without blind force-upgrades.
   3. Adopt an accessible dialog primitive and repair labels/live regions/focus states.
   4. Move API base configuration to same-origin or an explicit public environment variable.
3. Structural improvements
   1. Move list state to URLs and server-side query parameters.
   2. Add request cancellation, shared query caching, compact lookup endpoints, and optimistic mutation patterns.
   3. Split table state/behavior into provider-backed composable parts and extract shared resource-page orchestration.
4. Optional polish
   1. Add responsive navigation and wrapping control layouts.
   2. Refine visual hierarchy, empty/loading geometry, touch targets, and copy.
   3. Add reduced-motion handling, intrinsic image dimensions, and remove stale import-map/Vite configuration.

## Open questions / assumptions

- Is ExvoRed intentionally single-user and loopback-only, or will multiple researchers access it over a LAN/public host? This changes the deployment framing, but not the confirmed absence of controls.
- Which roles should be able to view contact/name data, edit records, manage relationships, upload images, and delete records?
- Which rich-text elements/attributes are genuinely required? A narrow allowlist is safer than preserving arbitrary pasted HTML.
- Should table search/filter/sort apply to the whole database or only the loaded page? The UI currently does the latter without clearly saying so.
- Are partial/historical dates intentionally non-ISO strings? Existing ADRs say yes; server validation must preserve that requirement instead of forcing native date inputs.
- Are image originals archival records that require size, format, metadata, checksum, and retention policies beyond ordinary web uploads?
- No automated test files or CI workflow were found in the reviewed tree. If they live outside this repository, the quality-gate finding should be adjusted accordingly.
