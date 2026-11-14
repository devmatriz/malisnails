# Avance UX/UI: Gestion de Citas

## Objetivo

Convertir la pantalla de citas en una agenda operativa para el trabajo diario del salon.

La pantalla debe ayudar a:

- Confirmar citas pendientes.
- Identificar estados de pago o deposito.
- Ver rapidamente especialista, servicio y duracion.
- Preparar acciones antes de atender.
- Detectar oportunidades en la agenda.

## Cambios Aplicados

- Se cambio el titulo a "Agenda del dia" para orientar la vista a trabajo diario.
- Se agrego selector de fecha con navegacion anterior/siguiente.
- Se agregaron filtros por especialista y estado.
- Se agrego resumen del dia: pendientes, confirmadas, completadas y canceladas.
- Se reemplazo el tablero simple por una linea de tiempo por hora.
- Cada cita ahora muestra cliente, servicio, especialista, duracion o cabina.
- Cada cita tiene estado visual: pagada, confirmar, deposito, confirmada.
- Se agregaron acciones por cita: confirmar, reprogramar, cobrar, detalle, recibo, notas.
- Se agrego panel lateral de pendientes antes de atender.
- Se agrego una nota operativa para oportunidades de agenda.
- La linea de tiempo ahora puede cargar citas reales desde `appointments` por fecha cuando hay sesion iniciada.
- El resumen del dia se recalcula con citas reales: pendientes, confirmadas, en proceso y completadas.
- Las citas reales permiten cambios basicos de estado desde la agenda: confirmar, iniciar, completar o cancelar.
- Las reservas online aprobadas ahora crean cliente, cita y servicio asociado.
- Se agrego formulario administrativo para crear citas manuales con cliente, telefono, servicio, fecha, hora y notas.
- Al guardar una cita manual, el sistema busca o crea cliente, crea `appointments` y agrega el servicio en `appointment_services`.
- Las citas reales ahora pueden cargarse en el formulario con `Editar` para actualizar cliente, telefono, servicio, fecha, hora y notas.
- El formulario de citas ahora carga especialistas activos desde `employees` y guarda `employee_id` en `appointments`.
- Los filtros de agenda por especialista y estado ahora recargan la consulta real de `appointments`.
- Cada cita real tiene accion `Detalle` para mostrar cliente, servicio, especialista, horario, estado, notas y ventas/pagos asociados.
- El detalle de cita permite registrar pagos; si no existe venta asociada, crea `sales`, inserta `payments` y actualiza el estado de venta.

## Criterio UX

La pantalla ya no funciona como lista pasiva. Ahora responde:

1. Que citas tengo hoy?
2. Cuales requieren accion?
3. Que debo preparar?
4. Que puedo cobrar o confirmar?
5. Donde hay espacio libre en la agenda?

## Siguientes Ajustes Recomendados

- Disenar modal o panel lateral de detalle de cita.
- Conectar filtros de especialista y estado a la consulta real.
- Agregar estado cancelada y no asistio.
- Agregar vista semanal real.
- Agregar estado vacio para dia sin citas.
- Agregar skeleton de carga para agenda.
- Completar cierre de caja y exportacion desde ventas reales.
