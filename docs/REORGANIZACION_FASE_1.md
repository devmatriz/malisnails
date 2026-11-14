# Reorganizacion Fase 1: Publico y Admin Separados

## Objetivo

Separar el sistema en dos areas claras:

- `index.html`: experiencia publica para clientas.
- `admin/index.html`: panel administrativo protegido.

## Cambios Aplicados

- Se creo la carpeta `admin/`.
- Se movio el panel administrativo actual a `admin/index.html`.
- Se creo `index.html` como landing publica limpia.
- Se eliminaron dashboard, citas, clientes, ventas, inventario y reportes del HTML publico.
- Se eliminaron landing publica y formulario publico de reserva del HTML administrativo.
- Se creo `assets/js/public.js` para logica publica.
- Se creo `assets/js/admin.js` para logica administrativa.
- Se creo `assets/js/supabase-client.js` como cliente compartido.
- Se creo `assets/css/public.css` para estilos publicos.
- Se creo `assets/css/admin.css` para estilos administrativos.
- Se movio la documentacion a `docs/`.
- Se eliminaron los archivos raiz antiguos `app.js` y `styles.css`.

## Estado Publico

La pagina publica ahora puede:

- Mostrar landing del salon.
- Mostrar servicios activos y disponibles para reserva online desde `services`.
- Mostrar productos visibles publicamente cuando la migracion este aplicada.
- Enviar solicitudes de reserva a `public_bookings`.

La pagina publica no puede:

- Crear servicios.
- Editar servicios.
- Eliminar servicios.
- Activar o desactivar servicios.
- Ver reservas pendientes.
- Gestionar productos.

## Estado Admin

El panel administrativo queda en `/admin/` y conserva:

- Login con Supabase Auth.
- Dashboard.
- Citas.
- Reservas online pendientes.
- Clientes.
- Servicios.
- Ventas.
- Inventario/productos.
- Empleados.
- Reportes.

## SQL Pendiente

Ejecutar `supabase/phase1_public_admin_split.sql` en Supabase para habilitar productos visibles publicamente sin exponer gestion administrativa.

## Verificacion

- `assets/js/public.js` pasa validacion de sintaxis.
- `assets/js/admin.js` pasa validacion de sintaxis.
- `assets/js/supabase-client.js` pasa validacion de sintaxis.
- Supabase responde correctamente para servicios publicos.
