# Fase 1: Auditoria UX/UI - MALIS NAILST

## Estado Actual

El proyecto tiene una maqueta frontend estatica con 11 vistas principales:

- Dashboard Administrativo
- Gestion de Citas
- Gestion de Clientes
- Gestion de Servicios
- Ventas y Pagos
- Gestion de Inventario
- Gestion de Empleados
- Reportes Administrativos
- Pagina Publica
- Reserva en Linea
- Login

La base visual ya esta unificada con `Outfit`, `JetBrains Mono`, paleta neutra, acento dorado y componentes operativos. La estructura es suficiente para empezar a trabajar UX/UI por fases, pero todavia funciona como prototipo visual, no como producto listo.

## Objetivo De La Fase 1

Definir que debe mejorar primero en experiencia de usuario, jerarquia visual y claridad operativa antes de avanzar a componentes, backend o funcionalidades reales.

## Hallazgos Generales

### 1. La navegacion funciona, pero necesita arquitectura mas clara

Actualmente todas las pantallas viven en una sola pagina y se alternan con JavaScript. Esto es bueno para prototipo, pero para un sistema real conviene separar mentalmente tres mundos:

- Administracion interna: dashboard, citas, clientes, servicios, ventas, inventario, empleados, reportes.
- Experiencia publica: pagina publica y reserva en linea.
- Acceso: login.

Prioridad: alta.

Accion recomendada: mantenerlas juntas por ahora, pero disenar cada grupo con reglas UX distintas.

### 2. Las pantallas admin tienen buen punto de partida, pero faltan flujos

Las vistas muestran datos, pero todavia no muestran el flujo completo de trabajo. Por ejemplo:

- Crear una cita.
- Editar un cliente.
- Confirmar o cancelar una cita.
- Registrar un pago.
- Ver detalle de una venta.
- Recibir alerta de inventario bajo.

Prioridad: alta.

Accion recomendada: definir el flujo principal de cada modulo antes de agregar mas decoracion visual.

### 3. Hay metricas, pero falta intencion de negocio

El dashboard muestra ingresos, citas, clientes y ticket promedio. Es correcto, pero debe responder preguntas reales del salon:

- Que citas necesitan accion hoy?
- Que productos estan por agotarse?
- Que empleada tiene mayor carga?
- Que servicio deja mas ingresos?
- Hay clientes pendientes de seguimiento?

Prioridad: alta.

Accion recomendada: redisenar el dashboard como centro de decisiones, no solo como resumen.

### 4. Las tablas son utiles, pero necesitan herramientas

La tabla de clientes y ventas esta bien para mostrar informacion. Falta UX de trabajo:

- Filtros por estado.
- Busqueda por columna.
- Acciones por fila.
- Vista de detalle.
- Estados vacios.
- Paginacion o limite visible.

Prioridad: media-alta.

Accion recomendada: crear patron unico de tabla administrativa para reutilizarlo.

### 5. La reserva en linea debe convertirse en flujo por pasos

La reserva actual es un formulario directo. Para clientes finales, conviene reducir friccion:

1. Elegir servicio.
2. Elegir especialista opcional.
3. Elegir fecha y hora.
4. Ingresar datos.
5. Confirmar solicitud.

Prioridad: alta.

Accion recomendada: convertir reserva en experiencia guiada.

### 6. La pagina publica necesita mas confianza y conversion

La pagina publica ya tiene una hero clara, pero falta informacion comercial:

- Servicios principales con precios desde.
- Galeria real o visual de trabajos.
- Horarios.
- Ubicacion/contacto.
- Testimonios o senales de confianza.
- CTA persistente para reservar.

Prioridad: media.

Accion recomendada: convertirla en landing real, no solo portada.

### 7. Faltan estados del sistema

El prototipo no muestra:

- Cargando.
- Error.
- Exito.
- Sin datos.
- Sin resultados de busqueda.
- Permisos insuficientes.
- Confirmacion antes de eliminar/cancelar.

Prioridad: alta.

Accion recomendada: disenar estados antes de conectar backend.

## Auditoria Por Pantalla

## Dashboard Administrativo

Estado: buen inicio visual.

Problemas:

- Las metricas no tienen acciones asociadas.
- La agenda del dia es informativa, pero no operativa.
- No hay alertas de inventario, pagos pendientes o citas sin confirmar.

Mejoras:

- Agregar bloque "Requiere atencion".
- Convertir citas de hoy en lista accionable.
- Agregar accesos rapidos: nueva cita, registrar pago, nuevo cliente.
- Mostrar tendencia semanal con lectura clara.

Prioridad: 1.

## Gestion De Citas

Estado: tablero tipo kanban claro.

Problemas:

- Faltan estados cancelada/no asistio/reprogramada.
- No hay filtros por fecha, empleada o servicio.
- No hay detalle de cita.

Mejoras:

- Agregar selector de fecha.
- Agregar vista diaria tipo agenda.
- Definir acciones: confirmar, reprogramar, cancelar, cobrar.
- Mostrar duracion, especialista y deposito.

Prioridad: 1.

## Gestion De Clientes

Estado: tabla funcional.

Problemas:

- No hay perfil de cliente.
- No se ve historial de visitas.
- No hay etiquetas utiles como alergias, preferencias o frecuencia.

Mejoras:

- Crear vista detalle de cliente.
- Agregar historial de servicios.
- Agregar notas internas.
- Agregar estado de fidelidad.

Prioridad: 2.

## Gestion De Servicios

Estado: catalogo visual simple.

Problemas:

- No muestra duracion.
- No muestra categoria.
- No muestra disponibilidad o comision.

Mejoras:

- Agregar duracion estimada.
- Separar por categoria: manos, pies, diseno, mantenimiento.
- Agregar precio base y precio variable.
- Preparar formulario de crear/editar servicio.

Prioridad: 3.

## Ventas Y Pagos

Estado: resumen claro.

Problemas:

- Falta flujo de venta completo.
- No hay estado de pago pendiente/parcial.
- No hay cierre de caja.

Mejoras:

- Crear pantalla de registrar pago.
- Agregar recibo o factura.
- Agregar metodo de pago y referencia.
- Agregar cierre diario.

Prioridad: 2.

## Inventario

Estado: tarjetas legibles.

Problemas:

- Falta tabla de productos.
- No hay movimientos de entrada/salida.
- No hay proveedor ni costo.

Mejoras:

- Agregar alertas de stock bajo.
- Agregar historial de movimientos.
- Agregar niveles minimos.
- Agregar categorias: esmaltes, acrilicos, consumibles, herramientas.

Prioridad: 3.

## Empleados

Estado: visual correcto.

Problemas:

- Falta horario.
- Falta comision.
- Falta agenda asignada.
- Falta desempeno por periodo.

Mejoras:

- Agregar tarjetas de rendimiento.
- Agregar disponibilidad semanal.
- Agregar servicios que domina cada empleada.
- Agregar comisiones generadas.

Prioridad: 4.

## Reportes Administrativos

Estado: conceptual.

Problemas:

- Reportes muy generales.
- No hay filtros por fecha.
- No hay exportacion real.

Mejoras:

- Agregar filtros: dia, semana, mes, rango.
- Separar reportes: ingresos, servicios, clientes, empleadas, inventario.
- Preparar version exportable.

Prioridad: 4.

## Pagina Publica

Estado: buena base estetica.

Problemas:

- Falta informacion comercial.
- Falta prueba social.
- Falta contacto visible.

Mejoras:

- Agregar seccion de servicios.
- Agregar galeria.
- Agregar horarios y ubicacion.
- Agregar CTA visible en mobile.

Prioridad: 5.

## Reserva En Linea

Estado: formulario funcional como maqueta.

Problemas:

- Demasiado directo para usuaria final.
- No explica disponibilidad.
- No muestra resumen antes de confirmar.

Mejoras:

- Convertir en flujo por pasos.
- Mostrar resumen de reserva.
- Agregar confirmacion final.
- Agregar mensajes de validacion.

Prioridad: 1.

## Login

Estado: suficiente para prototipo.

Problemas:

- Falta error de credenciales.
- Falta recuperar contrasena.
- Falta estado de carga.

Mejoras:

- Agregar estado loading.
- Agregar error inline.
- Agregar recuperacion de acceso.

Prioridad: 5.

## Orden Recomendado De Trabajo UX/UI

1. Dashboard Administrativo
2. Gestion de Citas
3. Reserva en Linea
4. Gestion de Clientes
5. Ventas y Pagos
6. Gestion de Servicios
7. Inventario
8. Pagina Publica
9. Empleados
10. Reportes
11. Login

## Entregables De La Fase 1

- Auditoria UX/UI del prototipo actual.
- Priorizacion de pantallas.
- Problemas principales por modulo.
- Recomendaciones para pasar a sistema de diseno y redisenos puntuales.

## Criterio Para Pasar A Fase 2

La Fase 1 queda lista cuando se acepte este orden de trabajo y se elija la primera pantalla a redisenar en detalle.

Recomendacion: empezar con Dashboard Administrativo, porque define el lenguaje operativo del resto del sistema.
