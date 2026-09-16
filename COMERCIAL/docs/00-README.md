# Documentación del Proceso de Ventas — ERP Multiservicios

Documentación funcional, de modelo de datos, API y arquitectura para el **proceso completo de ventas** (productos + servicios, cotizaciones, devoluciones y caja) del ERP Multiservicios. Su propósito es permitir **replicar el proceso con el mismo comportamiento funcional** en otro sistema de ventas, conservando lo bueno del actual y proponiendo mejoras concretas a los defectos detectados.

---

## Índice de documentos

| # | Archivo | Contenido |
|---|---|---|
| 00 | [`00-README.md`](./00-README.md) | Este índice. |
| 01 | [`01-vision-general.md`](./01-vision-general.md) | Visión del sistema, alcance, mapa de módulos, glosario. |
| 02 | [`02-modelo-datos.md`](./02-modelo-datos.md) | Entidades, relaciones, diccionario de campos, estados y reglas de integridad. |
| 03 | [`03-flujo-ventas-productos.md`](./03-flujo-ventas-productos.md) | Flujo end-to-end de venta de productos (crear → pagar → ver → eliminar). |
| 04 | [`04-flujo-ventas-servicios.md`](./04-flujo-ventas-servicios.md) | Flujo end-to-end de venta de servicios. |
| 05 | [`05-cotizaciones.md`](./05-cotizaciones.md) | Flujo de cotizaciones de productos y servicios, y su conversión a venta. |
| 06 | [`06-devoluciones.md`](./06-devoluciones.md) | Flujo de devoluciones de venta de productos y su procesamiento en caja. |
| 07 | [`07-caja.md`](./07-caja.md) | Flujo de caja: apertura, cierre, pagos, ingresos, egresos, devoluciones, reportes. |
| 08 | [`08-contratos-api.md`](./08-contratos-api.md) | Endpoints REST esenciales por módulo (entradas, salidas, errores). |
| 09 | [`09-arquitectura-frontend.md`](./09-arquitectura-frontend.md) | Arquitectura Angular, componentes, servicios compartidos, patrones y permisos. |
| 10 | [`10-mejoras-y-defectos.md`](./10-mejoras-y-defectos.md) | Defectos detectados, puntos fuertes y propuesta de mejoras conservando la simplicidad. |
| 11 | [`11-guia-replica.md`](./11-guia-replica.md) | Checklist de implementación para clonar el proceso en otro sistema. |
| 12 | [`12-prototipo-diseno.md`](./12-prototipo-diseno.md) | **V9** · Diseño del prototipo Comercial: decisiones K1–K18, pantallas, flujos, encaje con GI/CO/GP/GPV7, mejoras aplicadas y preguntas abiertas. |
| 13 | [`13-modelo-datos-v9.md`](./13-modelo-datos-v9.md) | **V9** · Modelo de datos con equivalencias al sistema documentado y a `comercial_db`. |
| 14 | [`14-contratos-funcionales.md`](./14-contratos-funcionales.md) | **V9** · Operaciones funcionales equivalentes a `08-contratos-api.md` con rutas sugeridas según ARNÉS. |
| 15 | [`15-codigos-pantallas.md`](./15-codigos-pantallas.md) | **V9** · Códigos CL-xx de cada pantalla, ficha y modal del prototipo, con su ruta y archivo. |

> **Prototipo navegable:** [`index.html`](./index.html). Los documentos 01–11 describen un sistema que ya funciona y son el lineamiento funcional; lo que manda en V9 está en 12–14.

---

## Cómo leer esta documentación

1. **Empieza por `01-vision-general.md`** para entender el alcance y el mapa conceptual.
2. **Salta a `02-modelo-datos.md`** si vas a implementar primero el backend o la base de datos.
3. **Lee `03-…` a `07-…`** según el módulo que estés replicando.
4. **`08-contratos-api.md`** es el resumen mínimo del backend REST que cualquier implementación debe exponer.
5. **`09-arquitectura-frontend.md`** es útil si vas a replicar el frontend Angular (o usarlo como referencia para React/Vue).
6. **`10-mejoras-y-defectos.md`** es independiente: léelo cuando quieras saber qué arreglar y qué conservar.
7. **`11-guia-replica.md`** es el checklist operativo: úsalo para verificar cobertura durante la implementación.

---

## Resumen ejecutivo del proceso

- **Una sola "proforma" representa tres cosas**: cotización, venta de productos y venta de servicios. Se diferencian por `proforma_type` (1 = producto, 2 = servicio) y `state_proforma` (1 = cotización, 2 = venta). Esto simplifica enormemente el modelo.
- **El carrito (DETAIL) se gestiona en el frontend** y se envía al backend como FormData al guardar. En cotizaciones, la edición de líneas se hace contra el backend línea por línea.
- **Precios por moneda**: las listas de precios (wallets) están indexadas por `unit + sucursale + client_segment + coin`. Si no hay match exacto, se hace fallback en cascada.
- **Pagos múltiples**: una venta admite varios pagos (`pagos[]`) por distintos métodos (efectivo, transferencia, etc.). Si la condición es CONTADO, la suma de pagos debe igualar el total (±0.01).
- **Caja es el módulo transaccional**: gestiona apertura/cierre, valida pagos de ventas pendientes, procesa devoluciones, ingresos y egresos. Todo lo que mueve dinero pasa por aquí.
- **Permisos finos por acción** (`ver_*`, `crear_*`, `editar_*`, `eliminar_*`) aplicados vía `PermissionGuard` por ruta.