# MALIS NAILST · Interfaz pública

Revisión de UI/UX del 4 de septiembre de 2026, limitada a `index.html` y su hoja de estilos. La identidad del administrador documentada en `DESIGN.md` se conserva.

## Dirección

Marfil, carbón y dorado cálido. Outfit para titulares, cuerpo, controles y marcas; JetBrains Mono únicamente para precios. El recorrido sigue siendo presentación → servicios → productos → experiencia → reserva → contacto.

## Sistema

- Variables semánticas en `assets/css/public.css` para superficies, texto, estados, tipografía, espaciado y radios.
- Titular de portada entre 40 y 70 px; encabezados entre 32 y 50 px, con interlineado abierto y separación explícita del cuerpo.
- Navegación y controles de al menos 44 px; campos de 50 px, con fuente de 16 px para evitar zoom automático móvil.
- Catálogo de servicios en filas comparables: categoría, nombre, descripción y precio. La estructura también sirve para las tarjetas generadas por la API.
- Productos en una, dos o tres columnas según el espacio. Contenido en contenedores fluidos con máximo de 1240 px.
- Formulario en cuatro pasos, con números, subrayado y colores para diferenciar avance. Mensajes de validación, envío, éxito y error usan las clases y atributos existentes.
- Ajustes responsive a 600, 820 y 1050 px; 320 px soportado sin desplazamiento horizontal. La reserva se apila antes de que las columnas estrechen los campos.
- Foco visible, colores de alto contraste, selección de texto personalizada, `prefers-reduced-motion`, áreas seguras y tratamiento de colores forzados.
- El acceso fijo móvil a reserva desaparece cuando el destino es el formulario o un campo tiene foco.

## Fotografías

Tres imágenes de stock locales en WebP. La galería se identifica como inspiración y sus créditos están en `assets/images/CREDITS.md`. No representan instalaciones ni trabajos documentados del salón.

## Alcance funcional

No se modificaron JavaScript, Supabase, esquema de datos, disponibilidad, precios, validaciones, envío, rutas ni administrador. Se conservaron IDs, nombres de campos y atributos usados por el flujo de reservas. Los datos de contacto y textos legales pendientes permanecen visibles.

## Verificación

Diseño revisado en navegador a 1440, 768, 390 y 320 px. Reserva recorrida con un backend simulado local, separado del entregable: selección, fecha, hora, datos, resumen, validación, envío, error recuperable y éxito. No se crearon reservas reales. La conexión real no cargó servicios en el entorno de revisión, por lo que el guardado contra Supabase no se verificó.

El detector de Impeccable se ejecutó una vez; funcionó en modo degradado por falta de sus parsers y no encontró coincidencias mediante regex. Se verificaron por separado los contrastes de los tokens y las dimensiones renderizadas. No se afirma una auditoría integral WCAG ni pruebas en dispositivos físicos.

## Refinamiento del 12 de noviembre de 2026

Se mantuvo la identidad visual existente. Cambios funcionales y de interacción:

- **Reserva**: servicios y horas como opciones seleccionables (radios nativos con estilo de fila y botón) en lugar de listas desplegables. Indicadores de paso navegables hacia atrás, botón "Cambiar" en cada línea del resumen, campo opcional de notas (`public_bookings.notes`), Enter avanza de paso, foco y desplazamiento al paso activo.
- **Estados**: carga de servicios, error con "Intentar de nuevo" (antes el formulario quedaba sin opciones y no se podía reservar), búsqueda de horas, sin horas disponibles, domingo cerrado, envío en curso y pantalla de solicitud enviada con resumen.
- **Servicios**: cada servicio cargado desde Supabase tiene "Reservar", que lo preselecciona y lleva al paso de horario. La etiqueta usa la categoría real o la duración, no un texto inventado por posición.
- **Galería**: se eliminó la foto repetida de la portada; dos imágenes con composición escalonada y un acceso a la reserva.
- **Movimiento**: revelado de la foto de portada al cargar, transición corta entre pasos, botón fijo móvil que se oculta al llegar a la reserva. Todo se desactiva con `prefers-reduced-motion`.
- **Código**: `public.js` reescrito sin duplicación, con protección contra respuestas de horario fuera de orden; `supabase-client.js` comparte una sola carga del cliente entre llamadas simultáneas.

Hallazgo: en el proyecto Supabase actual no existen `get_public_available_slots` ni `employee_working_hours`. Hasta ejecutar `supabase/schema.sql` actualizado y `supabase/public_available_slots.sql`, la reserva muestra horas de referencia con un aviso.

## Productos a la venta (12 de noviembre de 2026)

Tarjeta de producto rediseñada como vitrina: imagen o ilustración por categoría, categoría, marca, nombre, descripción, disponibilidad (texto + indicador, nunca solo color), precio y acción "Pedir en mi cita". Cuatro columnas en escritorio, dos en tablet y tarjeta horizontal en móvil.

- "Pedir en mi cita" agrega una línea `Productos para llevar: …` al campo de notas de la reserva; volver a pulsar la quita. Se envía con la solicitud en `public_bookings.notes`.
- Las cuatro tarjetas del HTML son **contenido de ejemplo**: precios, existencias y descripciones son provisionales y se reemplazan cuando Supabase devuelve productos visibles.
- `public.js` ya interpreta estos campos opcionales; para usarlos, agrégalos a la tabla y al `select` de `loadProducts()`:
  - `description` (texto público), `sale_price` (precio de venta), `image_url` (foto 4:5).
  - `current_stock` y `minimum_stock` para "Disponible / Pocas unidades / Agotado".
- Sin `sale_price` la tarjeta muestra "Precio en el salón"; sin `image_url`, la ilustración de su categoría.
- Seguridad: la política pública de `products` permite leer todas las columnas de los productos visibles, incluido `cost`. Antes de publicar, exponer los productos mediante una vista o función con solo las columnas públicas.
