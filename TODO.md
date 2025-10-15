# MEJORAS Y MODIFICACIONES EXVORED

## COSAS GENERALES

- **Buscador por palabras clave:**  
  Que aparezca la lista completa de los resultados para poder buscar en contexto.  
  La palabra buscada debe aparecer **subrayada dentro de la frase**, al estilo Word.

- **Evitar pérdida de datos:**  
  Si al añadir un nuevo exvoto, SEM, etc., se pincha fuera del cuadro sin guardar, se borra todo.  
  → Evitar esto de alguna manera.

- **Inspeccionar (“i”):**  
  Que la ficha se abra en otra pestaña distinta o al menos dé la opción.  
  (Mismo comportamiento para las imágenes).

- **Navegación entre fichas:**  
  Que se pueda pasar a la ficha anterior o siguiente con flechas.

- **Numeración de filas:**  
  Que las filas estén numeradas como en Excel.

- **Cuadros flotantes:**  
  No se leen bien. Sería mejor un cuadro más grande para leer más texto de un vistazo.

- **Errores detectados:**
  - No se pueden borrar filas.  
  - No se pueden borrar ni editar milagros o personajes.  
  - Los elementos (exvotos, catálogos, etc.) aparecen desordenados incluso con filtro.

- **Copiar filas completas:**  
  Sería útil poder seleccionar/copiar filas enteras para duplicar datos similares.

- **Copiar/pegar con teclado:**  
  Permitir `Ctrl + C` y `Ctrl + V` en celdas.

---

## ATAJOS

- **Error:**  
  La tecla “e” abre en modo lectura en SEM, Catálogos y Divinidades (solo funciona en Exvotos).

- **Cambiar:**  
  Al hacer doble clic en una celda debe abrir en modo **editar**, no “ver”.

- **Navegación con teclado:**  
  Poder moverse entre campos con flechas (↑ ↓ ← →) al crear nuevos registros.

- **Error:**  
  Tras “Inspeccionar”, la mayoría de los atajos dejan de funcionar (excepto `Shift + e`).

---

## EXVOTOS

- **Nueva celda:**  
  Añadir campo `Referencias` (texto) para bibliografía específica.  
  → Vincular a la tabla **Catálogos** (que al pinchar lleve al catálogo concreto).

- **Vinculación:**  
  Con la tabla de **Divinidades**.

- **Orden de columnas:**
  - La columna **Imagen** debe ir al final.
  - La columna **Lugar de origen** debe ir entre “Estatus social” y “Milagro”.

- **Errores y mejoras:**
  - En modo visualización, algunas celdas muestran números en lugar de texto (SEM ofrenda, SEM conservación, Imagen).  
  - Al pinchar en esas celdas debería llevar a su ficha SEM (en nueva pestaña).
  - El filtro “más antiguo (modif.)” no funciona bien.
  - Diferencia de fechas entre tabla y ficha (la ficha muestra un día antes).

- **Desde la ficha:**
  - Poder añadir milagros y personajes nuevos directamente.
  - Las opciones de SEM deben aparecer **ordenadas alfabéticamente** y ser **buscables**.
  - La fecha debe poder escribirse manualmente (`AÑO-MES-DÍA`, ej. `1787-X-01`).

- **Campos de texto (Información adicional, Forma de texto, Transcripción):**
  - Soporte para párrafos, negritas, subrayados, justificación.
  - En “Transcripción”, permitir **superíndices** (ejemplo de exvoto transcrito incluido en el documento original).

- **Campo “Género”:**
  - Añadir opciones: `Ambos`, `Desconocido`.  
  - Eliminar `Otro`.

- **Imágenes:**
  - Ampliar en pestaña nueva.  
  - Opción para descargar.  
  - Zoom con la rueda del ratón.  
  - Si hay varias, poder pasar entre ellas.  
  - Añadir notas o subtítulos a la imagen (fuente, procedencia…).

- **Reorganización visual de la ficha:**

  1. **Ubicación:** Lugar de ofrenda + lugar de conservación + provincia.  
     - “Lugar de origen del milagro” pasa a “Personas involucradas” como “Lugar de origen devoto/a”.

  2. **Detalles del Milagro:**  
     - Fecha `AÑO/MES/DÍA`  
     - La provincia va en “Ubicación”.

  3. **Personas involucradas:**  
     - Añadir “Personajes representados”.  
     - Añadir “Lugar de origen devoto/a”.

  4. **Descripción del Exvoto:**  
     - Orden: Material → Estado → Forma del texto → Uso de mayúsculas.  
     - Quitar “Personajes representados”.

  5. **Transcripción**  
  6. **Información Adicional**  
  7. **Referencias (nuevo):**  
     - Vincular con catálogos + texto libre.

- **Importante:**  
  Cuando una ficha está en modo visualización, los campos vacíos no deben desaparecer.  
  Deben aparecer vacíos explícitamente.

---

## SEM

- Vincular con **Divinidades** (puede haber más de una).  
- **Error:** No deja añadir exvotos conservados en cada SEM.  
  → Igual que desde exvoto se puede crear SEM, desde SEM se debería poder crear exvoto.  
- Mostrar la lista de exvotos vinculados.  
- Permitir añadir imágenes.

---

## CATÁLOGOS

- **Eliminar:** Campo “Lugar de publicación”.  
  → Sustituir por “Lugares relacionados” (texto libre).

- **Errores:**
  - El campo “Nº de Exvotos” no se guarda.  
  - “Descripción de la ubicación” → cambiar a “Descripción” (texto libre con formato).  
  - En celdas de texto: permitir **negrita**, **cursiva**, etc., visibles también en los cuadros flotantes.
  - Aparecen duplicadas las casillas “Nº de Exvotos” y “Nº Total Exvotos”.
  - “Lugares relacionados” no se guarda.  
    → Renombrar a “SEM incluidos en el catálogo”.  
    → No está bien vinculado a SEM.  
  - No aparecen automáticamente las provincias catalogadas.

- **Nota:**  
  No siempre tiene sentido vincular SEM ↔ Catálogo (algunos son demasiado amplios o mezclan casos).

---

## DIVINIDADES

- **SEM en los que se le da culto:**  
  Añadirlo a la tabla. Una misma divinidad puede aparecer en varios SEM.

- **Imágenes:**  
  No permite añadir JPG (debería permitir varias fotos).

- **Errores:**
  - La tecla “e” abre en modo lectura (no editable).  
  - La tecla “i” no funciona (no abre detalles).

---

