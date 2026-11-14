# Configuracion Supabase - MALIS NAILST

## 1. Crear Proyecto

1. Entra a Supabase y crea un proyecto nuevo.
2. Usa PostgreSQL como base de datos.
3. Guarda la contrasena de base de datos en un lugar seguro.

## 2. Aplicar Esquema

1. Abre Supabase Dashboard.
2. Ve a `SQL Editor`.
3. Copia el contenido de `supabase/schema.sql`.
4. Ejecuta el script completo.

Esto crea tablas, relaciones, indices, enums y politicas RLS iniciales.

Si tu base fue creada antes de que `products.public_visible` existiera en `schema.sql`, ejecuta `supabase/phase1_public_admin_split.sql` para habilitar productos visibles en la pagina publica sin abrir permisos administrativos.

Tambien ejecuta `supabase/public_available_slots.sql` para que la reserva publica calcule horarios disponibles sin exponer la tabla de citas al publico.

## 3. Configurar Credenciales En El Frontend

1. Abre `supabase-config.js`.
2. Reemplaza `SUPABASE_URL` con la URL del proyecto.
3. Reemplaza `SUPABASE_ANON_KEY` con la anon public key.

No pegues la service role key en el frontend.

## 4. Crear Primer Usuario Admin

1. En Supabase ve a `Authentication > Users`.
2. Crea un usuario con correo y contrasena.
3. Copia el `User UID` generado.
4. En `SQL Editor`, ejecuta:

```sql
insert into public.branches (name, phone, address)
values ('Sucursal principal', '+505 0000 0000', 'Direccion pendiente')
returning id;
```

5. Copia el `id` de la sucursal y ejecuta:

```sql
insert into public.profiles (id, branch_id, full_name, role)
values ('USER_UID_AQUI', 'BRANCH_ID_AQUI', 'Admin MALIS NAILST', 'admin');
```

## 5. Insertar Datos Iniciales

Ejecuta el contenido de `supabase/seed.sql` para que la reserva online tenga servicios, empleadas, horarios y productos publicos iniciales. Ese archivo puede ejecutarse mas de una vez sin duplicar registros existentes.

## 6. Probar

1. Sirve el proyecto con un servidor local. No uses doble click directo al HTML para modulos ES.
2. Abre `index.html` desde el servidor local.
3. Entra a `Login`.
4. Inicia sesion con el usuario creado en Supabase Auth.
5. Entra a `Reserva en linea` y envia una solicitud.
6. Verifica que aparezca en la tabla `public_bookings`.

Comando recomendado si tienes Python instalado:

```bash
python -m http.server 5173
```

Luego abre `http://localhost:5173`.

## Estado Actual

- Login real preparado con Supabase Auth.
- Logout preparado.
- Reserva publica preparada para insertar en `public_bookings`.
- Servicios de reserva se cargan desde `services` cuando Supabase esta configurado.
- La vista `Citas` muestra solicitudes pendientes de `public_bookings` cuando hay sesion iniciada.
- Las solicitudes pendientes pueden rechazarse desde la vista `Citas`.
- Al aprobar una solicitud pendiente, el sistema busca o crea el cliente, crea una cita confirmada en `appointments`, agrega el servicio en `appointment_services` y marca la solicitud como `approved`.
- La agenda administrativa carga citas reales desde `appointments` por fecha y permite cambios basicos de estado.
- La vista `Citas` permite crear citas manuales desde admin, reutilizando o creando cliente y asociando un servicio.
- Las citas existentes pueden editarse desde la linea de tiempo para actualizar horario, cliente, servicio y notas.
- Las citas pueden asignarse a especialistas activos desde `employees`.
- La agenda puede filtrarse por especialista y estado usando datos reales.
- El detalle de cita muestra ventas y pagos asociados cuando existen registros en `sales` y `payments`.
- El detalle de cita puede registrar pagos y crear una venta asociada si aun no existe.
- La vista `Ventas` carga pagos reales desde `payments`, calcula totales de caja y filtra por metodo de pago.
- La vista `Ventas` prepara cierre diario con checklist dinamico y exportacion CSV de pagos del dia.
- La vista `Clientes` carga clientes reales desde `clients`, muestra resumen, perfil rapido e historial basico de citas/ventas.
- La vista `Clientes` permite crear y editar clientes con preferencias, alergias y notas internas.
- La vista `Empleados` carga empleados reales desde `employees`, muestra resumen operativo y permite crear, editar, activar o desactivar especialistas.
- Los cambios en `Empleados` actualizan los selectores de especialistas usados por agenda y citas.
- El schema ahora incluye `employee_working_hours` y `employee_time_blocks` para disponibilidad real.
- La vista `Empleados` permite crear horarios semanales, crear bloqueos por fecha y eliminar registros de disponibilidad.
- La reserva publica calcula horas disponibles desde horarios, bloqueos y citas existentes cuando `supabase/public_available_slots.sql` esta aplicado; si no, conserva el calculo local por horarios y bloqueos como fallback.
- Si Supabase no esta configurado, el proyecto sigue funcionando como prototipo visual.
