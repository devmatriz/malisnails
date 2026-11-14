# MALIS NAILS

Sistema web para el salón de uñas **MALIS NAILS**: página pública con reserva online y panel administrativo para operar el día a día.

## Funcionalidades

**Página pública (`index.html`)**
- Catálogo de servicios y productos visibles.
- Reserva online en pasos: servicio, fecha y horario disponible, datos de contacto.
- Las reservas quedan como *solicitudes pendientes* hasta que el salón las aprueba.

**Panel administrativo (`admin/`)**
- **Dashboard:** ingresos del día, citas, clientes nuevos, ticket promedio y prioridades.
- **Citas:** agenda diaria, solicitudes online con contador de pendientes y aprobación.
- **Calendario:** vistas día, semana y mes por estilista, con filtros y reprogramación por arrastre con validación de conflictos.
- **Clientes, Servicios, Ventas, Inventario, Empleados y Reportes.**

## Tecnología

- HTML, CSS y JavaScript (ES modules), sin paso de build.
- [Supabase](https://supabase.com) para base de datos PostgreSQL, autenticación y políticas RLS.

## Estructura

```
index.html              Página pública y reserva online
admin/index.html        Panel administrativo
assets/css/             Estilos (public*.css, admin*.css)
assets/js/              Lógica (public.js, admin.js, supabase-client.js)
assets/images/          Imágenes y favicon
supabase/               Esquema SQL, datos semilla y funciones
supabase-config.js      URL y clave publicable de Supabase
docs/                   Documentación de fases, diseño y configuración
```

## Puesta en marcha

1. Configura Supabase siguiendo [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) (esquema, funciones y usuario administrador).
2. Escribe la URL y la clave **publicable** (anon) del proyecto en `supabase-config.js`.
3. Sirve la carpeta con cualquier servidor estático, por ejemplo:

   ```bash
   npx serve .
   ```

4. Abre `/` para la página pública y `/admin/` para el panel.

> Los módulos ES no funcionan abriendo los archivos con `file://`; usa siempre un servidor local.

## Seguridad

- `supabase-config.js` solo debe contener la clave **publicable**. Está pensada para el navegador y los datos se protegen con las políticas RLS de `supabase/schema.sql`.
- **Nunca** subas la `service_role` key, contraseñas de base de datos ni archivos `.env` al repositorio.
- El acceso al panel requiere un usuario con perfil activo (`admin` o `reception`) en la tabla `profiles`.

## Flujo de trabajo con Git

- `main` contiene la versión estable.
- Crea una rama por cambio: `feature/<nombre>`, `fix/<nombre>` o `docs/<nombre>`.
- Usa mensajes de commit descriptivos con prefijo: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.
- Integra los cambios en `main` mediante Pull Request.
