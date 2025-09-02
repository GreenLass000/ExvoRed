# ExvoRed • Roadmap y TODO

Mantén un registro claro del progreso. Marca con [x] lo completado.

- Leyenda: [ ] Por hacer • [x] Hecho
- Consejos: agrupa tareas por PRs pequeñas y añade la referencia del issue/PR al lado si aplica.

## 📚 Índice
- [🆕 Añadidos](#-añadidos)
- [🛠️ Arreglos](#️-arreglos)
- [🧾 Tabla Exvoto](#-tabla-exvoto)
- [🏛️ Tabla SEM](#️-tabla-sem)
- [📗 Tabla Catálogo](#-tabla-catálogo)
- [✨ Mejoras](#-mejoras)

---

## 🆕 Añadidos

- [x] **Nueva tabla en la base de datos: DIVINIDADES**, con campos:
  - [x] Nombre
  - [x] Atributos / Especialidad
  - [x] Historia
  - [x] Representación
  - [x] Imagen de representación
  - [x] Comentarios
  - [x] Página de gestión de divinidades completamente funcional

- [x] **Buscador avanzado en todas las páginas**: 
  - [x] Búsqueda en tiempo real con normalización de texto (sin acentos, case-insensitive)
  - [x] Contador de coincidencias ("X de Y resultados")
  - [x] Navegación entre resultados con botones anterior/siguiente
  - [x] Resaltado en amarillo de términos buscados en las tablas
  - [x] Búsqueda en columnas relacionadas (ej: nombres de SEMs en tabla exvotos)
  - [x] Componente SearchBar reutilizable implementado
  - [x] Integrado en: ExvotoPage, SemPage, CatalogPage, DivinitiesPage, CharactersPage, MiraclesPage

- [ ] Modo "Excel":
  - [x] Movimiento estilo Excel
  - [x] Slider horizontal para columnas fuera de la pantalla
  - [x] Poder ocultar columnas
  - [x] Cambiar tamaño de columna
  - [ ] Filtro asc/desc en cabecera (como Explorador de Windows)
  - [ ] Si el texto de una celda se desborda, truncar y al pulsar ENTER mostrar en modal; ESCAPE cierra el modal
  - [x] Reordenar columnas
  - [ ] Cambiar color de celdas
  - [ ] Filtros de ordenación:
    - [ ] A-Z
    - [ ] Mayor a menor
    - [ ] Menor a mayor
    - [ ] Último modificado
    - [ ] Filtrar por provincia
    - [ ] Filtrar por épocas

- [x] Keybinds:
  - [x] e → edit field
  - [x] d → details (deprecated - use 'i')
  - [x] E → edit row (Shift+E from details pages)
  - [x] i → inspect (navega a detalles vinculados y referencias de FK)
  - [x] p → print (solo en detalles)

- [ ] Exportar a CSV o Excel

---

## 🛠️ Arreglos

- [ ] Las fechas deben escribirse a mano; no usar input type="date"
- [x] **En tabla Exvotos, añadir columna Época con intervalos de 25 años**:
  - [x] Componente EpochSelector con navegación por siglos (XIII-XXI)
  - [x] Intervalos de 25 años automáticos (1301-1325, 1326-1350, etc.)
  - [x] Navegación entre siglos con botones anterior/siguiente
  - [x] Cálculo automático de época basado en fecha del exvoto
  - [x] Utilidades para validación y cálculo de épocas
  - [x] Integrado en formulario de exvotos
- [ ] Quitar columna de acciones

---

## 🧾 Tabla Exvoto

- [ ] En la página de detalles, el título debe ser el ID interno del exvoto
- [ ] La página de detalle debe permitir editar (eliminar modal separado de edición; edición inline en detalle)
- [ ] Añadir imagen lateral fija en el modal de detalles; al hacer clic ampliar
- [ ] Permitir varias imágenes (mostrarlas una debajo de otra)
- [ ] En Transcripción e Información adicional, permitir texto decorado (rich text)
- [ ] Mini-buscador en cada desplegable
- [ ] Añadir columna de catálogo(s) en el que está el exvoto (pueden ser varios)
- [ ] Añadir columna Tipo de consulta con opciones: Trabajo de campo, Bibliografía
- [ ] Botón “+” en SEM para crear nuevo SEM desde “Añadir Exvoto” sin salir
- [ ] Opción “Desaparecido” en el desplegable de SEM Conservación
- [ ] “SEM origen” no es un SEM; debe ser texto “Lugar de Origen”
- [ ] Género con opciones: Masculino, Femenino, Ambos, Desconocido

---

## 🏛️ Tabla SEM

- [ ] Divinidad asociada: desplegable multiopción con divinidades correspondientes
- [ ] Arreglar “Exvoto más antiguo” y “más reciente” (actualmente no se muestran)
- [ ] En detalles de SEM, listar todos los exvotos del SEM y enlazar a sus detalles
- [ ] En Referencias, permitir añadir catálogos vinculados (no solo texto libre)

---

## 📗 Tabla Catálogo

- [ ] Quitar columna “Lugar de publicación”
- [ ] “Número de exvotos” será editable manualmente (no autogenerado)
- [ ] “Descripción de la ubicación” → “Descripción” con texto decorado
- [ ] “Provincias relacionadas” no funciona (corregir)

---

## ✨ Mejoras

- [ ] Todo ordenado alfabéticamente por defecto
- [ ] Que se vean todas las columnas de la tabla
