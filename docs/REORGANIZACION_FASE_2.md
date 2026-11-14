# Reorganizacion Fase 2: Limpieza De Logica Publica/Admin

## Objetivo

Completar la separacion de responsabilidades despues de mover la landing publica y el panel administrativo a rutas distintas.

## Cambios Aplicados

- `assets/js/admin.js` ya no crea cliente Supabase propio; usa `assets/js/supabase-client.js`.
- Se elimino de `admin.js` la logica publica de:
  - cargar servicios para landing publica,
  - renderizar tarjetas publicas,
  - enviar formulario publico de reserva.
- `assets/js/public.js` conserva exclusivamente:
  - lectura de servicios activos disponibles para reserva online,
  - lectura de productos activos con `public_visible = true`,
  - envio de solicitudes a `public_bookings`.
- El admin ahora prepara carga de datos administrativos para:
  - servicios con estado `active` y `online_booking_enabled`,
  - productos con estado `active` y `public_visible`.
- Se agregaron identificadores en `admin/index.html`:
  - `admin-service-grid`,
  - `admin-product-grid`.

## Verificacion

- `assets/js/public.js` pasa validacion de sintaxis.
- `assets/js/admin.js` pasa validacion de sintaxis.
- `assets/js/supabase-client.js` pasa validacion de sintaxis.
- La consulta publica de servicios devuelve registros activos.
- La consulta publica de productos responde correctamente con `public_visible`; actualmente devuelve vacio porque no hay productos marcados visibles.

## Siguiente Paso Recomendado

Construir formularios administrativos reales para:

1. Crear servicio.
2. Editar servicio.
3. Activar/desactivar servicio.
4. Habilitar/deshabilitar reserva online.
5. Crear producto.
6. Editar producto.
7. Activar/desactivar producto.
8. Hacer producto visible/oculto en la landing publica.
