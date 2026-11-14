# Panel admin · Refinamiento UX/UI (12 de noviembre de 2026)

Se conservó la identidad visual (carbón, porcelana, dorado, Outfit + JetBrains Mono) y toda la lógica de datos. Cambios:

## Honestidad operativa
- Se eliminaron los datos inventados escritos en el HTML: métricas, prioridades, próximas citas, mezcla de servicios, checklist, resumen de agenda (7/19/8/2), "Martes, 23 junio", nota de "Karla 15:30", pendientes con nombres ficticios, tarjetas de servicios y productos de ejemplo y todo el contenido de Reportes.
- Cada bloque muestra "Cargando…", su estado vacío o "Inicia sesión"; las tarjetas de resumen muestran "—" en lugar de ceros cuando no hay datos.
- Prioridades del dashboard: solo aparecen las que tienen pendientes; si no hay ninguna, "Todo al día". Plurales correctos.
- Reportes: estado claro de "todavía no conectado" con acceso a la exportación de Ventas.
- Controles que no hacían nada se quitaron: campana de notificaciones, selector de periodo del gráfico, "Vista semanal", filtros de clientes sin conexión, "Agregar nota". "Registrar pago" ahora lleva a Citas, donde se cobra.

## Flujo de trabajo
- Los formularios de cita, cliente, servicio, producto y especialista son paneles laterales: se abren con "Agendar / Nuevo / Editar", cierran con Esc, la X o el fondo, mantienen el foco dentro y lo devuelven al botón que los abrió. La agenda y las listas quedan siempre visibles.
- Al guardar, el panel se cierra y aparece una confirmación breve (toast).
- En el perfil de clienta, "Agendar cita" abre la cita ya con nombre y teléfono.
- Móvil: las pestañas superiores incluyen todas las vistas con desplazamiento horizontal.

## Calidad técnica
- Iconos: se reemplazó la fuente Material Symbols (si fallaba, mostraba palabras como "chevron_left") por un sprite SVG en línea. Una petición de fuente menos.
- Gráfico de ingresos: ahora ocupa todo el ancho del panel y se redibuja al cambiar de tamaño (antes quedaba en ~240 px).
- Eliminados los rótulos dorados sobre los títulos (contraste 2.8:1, por debajo de AA) y el salto de botones al pasar el cursor.
- `admin.css`: de 2.823 a ~2.200 líneas al eliminar estilos huérfanos (restos de la página pública y bloques eliminados).
- Tablas: montos con cifras tabulares; mensajes de estado con la fuente normal.
- Formularios de horarios y bloqueos con controles consistentes.
- Acentos corregidos en títulos y textos visibles.
