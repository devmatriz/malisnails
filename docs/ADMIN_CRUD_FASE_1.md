# Admin CRUD Fase 1: Servicios Y Productos

## Objetivo

Dar al panel administrativo capacidad inicial para gestionar catalogo de servicios y productos sin mezclar funciones con la landing publica.

## Servicios

Se agrego formulario administrativo para:

- Crear servicio.
- Editar servicio.
- Activar o desactivar servicio.
- Habilitar o deshabilitar reserva online.
- Eliminar servicio cuando la base de datos lo permita.

Campos incluidos:

- Nombre.
- Categoria.
- Precio base.
- Duracion en minutos.
- Descripcion.
- Activo.
- Disponible en reserva online.

## Productos

Se agrego formulario administrativo para:

- Crear producto.
- Editar producto.
- Activar o desactivar producto.
- Mostrar u ocultar producto en la pagina publica.
- Eliminar producto.

Campos incluidos:

- Nombre.
- Marca.
- Categoria.
- Unidad.
- Stock actual.
- Stock minimo.
- Costo.
- Proveedor.
- Activo.
- Visible en pagina publica.

## Separacion Publico/Admin

- La landing publica solo lee servicios activos con `online_booking_enabled = true`.
- La landing publica solo lee productos activos con `public_visible = true`.
- El panel admin puede ver estados administrativos: activo, reserva online y visible publico.
- La escritura de servicios y productos ocurre solo en `assets/js/admin.js`.

## Verificacion

- `assets/js/admin.js` pasa validacion de sintaxis.
- `assets/js/public.js` pasa validacion de sintaxis.
- Los endpoints publicos de servicios y productos responden correctamente.

## Siguiente Paso Recomendado

La aprobacion de reservas online ya crea cliente, cita y servicio asociado. El siguiente paso recomendado es hacer que la agenda administrativa lea y gestione citas reales:

1. Cargar `appointments` por fecha.
2. Mostrar servicio, cliente, estado y horario reales en la linea de tiempo.
3. Crear y editar citas desde admin.
4. Cambiar estados: pendiente, confirmada, en proceso, completada, cancelada y no asistio.
5. Luego agregar gestion de disponibilidad:

- Dias y horarios de atencion.
- Bloqueos por fecha.
- Horarios disponibles en el formulario publico de reserva.
