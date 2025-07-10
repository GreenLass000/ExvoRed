# ExvoRed API REST

API REST completa para la gestión de exvotos, desarrollada con Node.js, Express, TypeScript, DrizzleORM y SQLite.

## 🏗️ Arquitectura

### Base de Datos (SQLite)
- **ORM**: DrizzleORM
- **Base de datos**: SQLite (`api/db/database.db`)
- **Migraciones**: Generadas automáticamente con Drizzle Kit

### Estructura del Proyecto
```
api/
├── db/
│   ├── schema.ts          # Esquemas de las tablas
│   ├── index.ts           # Configuración de la base de datos
│   ├── seed.ts            # Datos iniciales
│   └── migrations/        # Migraciones automáticas
├── controllers/           # Lógica de negocio
├── routes/               # Definición de rutas
└── server.ts             # Configuración del servidor
```

## 📊 Modelo de Base de Datos

El modelo está basado en el archivo `MER.dbml` e incluye las siguientes tablas:

### Tablas Principales
1. **miracle** - Catálogo de milagros
2. **character** - Personajes representados
3. **sem** - Santuarios/Ermitas/Museos
4. **catalog** - Catálogos y publicaciones
5. **exvoto** - Registro principal de exvotos

### Tablas de Relación
- **catalog_exvoto** - Relación muchos a muchos entre catálogos y exvotos
- **catalog_sem** - Relación muchos a muchos entre catálogos y sems

## 🚀 Comandos Disponibles

### Base de Datos
```bash
npm run db:generate  # Generar migraciones
npm run db:push      # Aplicar cambios a la base de datos
npm run db:studio    # Abrir Drizzle Studio (interfaz web)
npm run db:seed      # Poblar base de datos con datos de ejemplo
```

### API
```bash
npm run api:dev      # Iniciar servidor de desarrollo (puerto 3000)
```

## 📡 Endpoints de la API

La API REST está disponible en `http://localhost:3000/api`

### Milagros (`/api/miracles`)
- `GET /api/miracles` - Obtener todos los milagros
- `GET /api/miracles/:id` - Obtener milagro por ID
- `POST /api/miracles` - Crear nuevo milagro
- `PUT /api/miracles/:id` - Actualizar milagro
- `DELETE /api/miracles/:id` - Eliminar milagro

**Estructura**:
```json
{
  "id": 1,
  "name": "Curación milagrosa"
}
```

### Personajes (`/api/characters`)
- `GET /api/characters` - Obtener todos los personajes
- `GET /api/characters/:id` - Obtener personaje por ID
- `POST /api/characters` - Crear nuevo personaje
- `PUT /api/characters/:id` - Actualizar personaje
- `DELETE /api/characters/:id` - Eliminar personaje

**Estructura**:
```json
{
  "id": 1,
  "name": "Virgen María"
}
```

### Sems (`/api/sems`)
- `GET /api/sems` - Obtener todos los sems
- `GET /api/sems/:id` - Obtener sem por ID
- `POST /api/sems` - Crear nuevo sem
- `PUT /api/sems/:id` - Actualizar sem
- `DELETE /api/sems/:id` - Eliminar sem

**Estructura**:
```json
{
  "id": 1,
  "name": "Santuario de la Virgen del Rocío",
  "region": "Andalucía",
  "province": "Huelva",
  "town": "Almonte",
  "associated_divinity": "Virgen del Rocío",
  "festivity": "Romería del Rocío",
  "pictorial_exvoto_count": 150,
  "numero_exvotos": 150,
  "comments": "Importante santuario mariano"
}
```

### Catálogos (`/api/catalogs`)
- `GET /api/catalogs` - Obtener todos los catálogos
- `GET /api/catalogs/:id` - Obtener catálogo por ID
- `POST /api/catalogs` - Crear nuevo catálogo
- `PUT /api/catalogs/:id` - Actualizar catálogo
- `DELETE /api/catalogs/:id` - Eliminar catálogo

**Estructura**:
```json
{
  "id": 1,
  "title": "Exvotos de Andalucía",
  "author": "Dr. García Hernández",
  "publication_year": 2020,
  "publication_place": "Sevilla",
  "exvoto_count": 200,
  "location_description": "Archivo General de Andalucía",
  "comments": "Estudio completo de exvotos andaluces"
}
```

### Exvotos (`/api/exvotos`)
- `GET /api/exvotos` - Obtener todos los exvotos
- `GET /api/exvotos/:id` - Obtener exvoto por ID
- `POST /api/exvotos` - Crear nuevo exvoto
- `PUT /api/exvotos/:id` - Actualizar exvoto
- `DELETE /api/exvotos/:id` - Eliminar exvoto

**Estructura (campos principales)**:
```json
{
  "id": 1,
  "internal_id": "EX001",
  "offering_sem_id": 1,
  "origin_sem_id": 1,
  "conservation_sem_id": 1,
  "province": "Huelva",
  "virgin_or_saint": "Virgen del Rocío",
  "exvoto_date": "2023-05-15",
  "benefited_name": "María González",
  "offerer_name": "Juan González",
  "offerer_gender": "Masculino",
  "offerer_relation": "Esposo",
  "miracle": "Curación milagrosa",
  "miracle_place": "Hospital de Sevilla",
  "material": "Óleo sobre lienzo",
  "dimensions": "30x40 cm",
  "conservation_status": "Bueno",
  "transcription": "Por el milagro concedido a mi esposa María"
}
```

## 🧪 Ejemplos de Uso

### Crear un nuevo milagro
```bash
curl -X POST http://localhost:3000/api/miracles \
  -H "Content-Type: application/json" \
  -d '{"name": "Protección divina"}'
```

### Obtener todos los sems
```bash
curl -X GET http://localhost:3000/api/sems
```

### Actualizar un personaje
```bash
curl -X PUT http://localhost:3000/api/characters/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Sagrada Virgen María"}'
```

### Eliminar un catálogo
```bash
curl -X DELETE http://localhost:3000/api/catalogs/1
```

## 🔧 Configuración

### Variables de Entorno
- `PORT`: Puerto del servidor (por defecto: 3000)

### CORS
La API está configurada para aceptar peticiones desde cualquier origen, ideal para desarrollo.

## 📦 Dependencias Principales

- **express**: Framework web
- **drizzle-orm**: ORM moderno para TypeScript
- **better-sqlite3**: Driver SQLite rápido
- **cors**: Middleware para CORS
- **tsx**: Ejecutor de TypeScript

## 🗃️ Datos de Prueba

La base de datos incluye datos de ejemplo:
- 5 milagros
- 5 personajes
- 2 sems (santuarios)
- 2 catálogos
- 2 exvotos

Para regenerar los datos de prueba:
```bash
npm run db:seed
```

## 🎯 Próximos Pasos

1. **Autenticación**: Implementar JWT para seguridad
2. **Validación**: Agregar validación de esquemas con Zod
3. **Paginación**: Implementar paginación para listas grandes
4. **Búsqueda**: Agregar endpoints de búsqueda y filtrado
5. **Imágenes**: Manejar carga y almacenamiento de imágenes
6. **Documentación**: Generar documentación automática con Swagger

## 🚨 Notas Importantes

- La API está configurada para desarrollo local
- SQLite es adecuado para desarrollo y aplicaciones pequeñas
- Para producción, considerar PostgreSQL o MySQL
- Los campos de fecha se almacenan como texto en formato ISO
