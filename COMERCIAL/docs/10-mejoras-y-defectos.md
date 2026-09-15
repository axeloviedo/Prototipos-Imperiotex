# 10 — Mejoras, Defectos y Puntos Fuertes

> Catálogo priorizado de **defectos observados**, **mejoras recomendadas** y **puntos fuertes a conservar**. La idea es que al replicar el sistema en otro lugar, **copies lo bueno** y **mejores lo malo** sin romper la simplicidad.

---

## 1. Puntos fuertes a conservar

| Área | Qué hace bien |
|---|---|
| **Modelo unificado de "proforma"** | Una sola tabla cabecera con `proforma_type` y `state_proforma`. No partas en 4 tablas: cotización, venta producto, venta servicio, cotización servicio. |
| **Resolución de precios por wallets** | Cascada explícita `(unit+suc+seg+coin) > ... > unit`. Fácil de mostrar y depurar. |
| **`CalculateTotalsService` centralizado** | Una sola función pura para el dinero: `fromPrice(...)`. Tests triviales. |
| **Permisos granulares** | `ver_*`, `crear_*`, `editar_*`, `eliminar_*` por ruta. Backend debe replicar. |
| **Patrón por feature** | Service único + componentes list/create/view/edit/delete + modales. Replicable. |
| **Loading overlay global** | `LoadingOverlayService.show(msg)/hide()` consistente. |
| **`ApiResponseHandlerService`** | Centraliza los toasts según `message` numérico. |
| **Multi-moneda con reversión** | Si no hay precio en la moneda destino, se cancela el cambio. UX clara. |
| **Caja multi-sucursal / multi-moneda** | Una caja activa por (sucursal, moneda). Lógico y simple. |
| **PDF + Excel integrados** | Sin salir del sistema. |
| **Modales reutilizables** | `search-products`, `search-clients` para todas las features. |
| **Validación de stock configurable** | `disponibilidad ∈ {1, 2, 3}` por producto. |
| **Pagos múltiples** | Una venta admite varios pagos por métodos distintos. |
| **Devoluciones con tipos** | `1=normal, 2=mal estado, 3=cambio`. |

---

## 2. Defectos y mejoras recomendadas

> Cada defecto incluye: **impacto**, **causa**, **solución propuesta** y **prioridad**. Las prioridades son:
> - 🔴 **Alta**: corregir en la primera iteración.
> - 🟡 **Media**: corregir en la segunda iteración.
> - 🟢 **Baja**: nice-to-have.

### 2.1 Datos y modelo

| # | Defecto | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| D1 | **Eliminación física de ventas** sin estado `ANULADO`. | Auditoría rota; no se sabe qué se borró. | Añadir `state_proforma ∈ {1, 2, 3 (anulada)}`. Backend debe implementar `DELETE` lógico; UI debe mostrar "anular" en vez de "eliminar". | 🔴 |
| D2 | **Cotización convertida no se marca como tal**. | Puede convertirse dos veces. | Añadir `state_proforma ∈ {1, 2, 3, 4 (CONVERTIDA)}`. Tras conversión, bloquear edición de la original. | 🔴 |
| D3 | **Devoluciones no tienen estado `ANULADA`**. | Imposible revertir una devolución errónea. | Añadir `state_devolucion ∈ {1, 2, 3 (anulada)}`. Endpoint `POST /devolucion-proformas/{id}/anular`. | 🔴 |
| D4 | **No hay historial** de cambios (cabecera o líneas). | Trazabilidad nula. | Crear tabla `audit_log(actor, action, entity, entity_id, before, after, created_at)` o usar `created_at/updated_at/user_id` en cada tabla + tabla de snapshots. | 🟡 |
| D5 | **No hay soft-delete** en entidades catálogo (clientes, productos, etc.). | Riesgo de romper ventas históricas. | Implementar `deleted_at` y filtrar en queries; UI muestra "eliminado" en lugar de borrar. | 🟡 |
| D6 | **`producto.units[]` y `producto.warehouses[]`** se cargan en el payload de cada `search-products`. | Payload grande; no escala. | Normalizar: una sola vez al cargar el producto, cachear en el cliente. | 🟡 |
| D7 | **Stock** no está modelado explícitamente; se infiere de `product_batches`. | Consultas de stock son costosas. | Crear vista materializada o tabla `stock(product_id, warehouse_id, quantity)` actualizada por triggers. | 🟡 |
| D8 | **Multi-moneda en cotizaciones**: cambiar moneda puede fallar si no hay wallet. | UX confusa si no se revert. | Mantener la reversión (ya existe), pero **persistir** los precios convertidos al guardar, no al cambiar. | 🟢 |

### 2.2 Frontend

| # | Defecto | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| F1 | **No hay edición de ventas guardadas** (sólo eliminar). | Errores en ventas requieren recrear. | Añadir ruta `/ventas/listado/editar/:id` y `EditVentaComponent` que use `POST /ventas/{id}`. Misma UX que `Create`. | 🔴 |
| F2 | **`add-payments` es placeholder vacío**. | Inconsistencia visual. | Implementar (al menos): ver pagos de una venta + agregar pago desde el listado de ventas. | 🟡 |
| F3 | **Sin validación de stock al editar ventas** (sólo al crear). | Sobreventa silenciosa. | Re-validar contra `product_batches.quantity - quantity_used` en cada `editProduct`. | 🔴 |
| F4 | **Catálogos duplicados** en cada módulo. | Mantenimiento tedioso. | Crear `CatalogosService` global con caché y `shareReplay(1)`. | 🟡 |
| F5 | **Estado en componentes**, no centralizado. | Dos pestañas no reflejan cambios de la otra. | Adoptar Signals (`signal()`) o NgRx/Pinia-equivalente. | 🟡 |
| F6 | **Formularios mixtos**: reactivos en algunos, template-driven en otros. | Tests más difíciles. | Estandarizar Reactive Forms en todos los CRUD. | 🟡 |
| F7 | **JWT expiration check comentado** en `AuthGuard`. | Sesión no expira; riesgo de seguridad. | Implementar verificación server-side + frontend (decodificar `exp` del JWT). | 🔴 |
| F8 | **Carpeta `componets` mal escrita**. | Cosmético pero molesto. | Renombrar a `components` (mantener alias por compat). | 🟢 |
| F9 | **`description` opcional**: si está vacía, el PDF sale sin glosa. | PDF incompleto. | Forzar `description ≥ 5 chars` en validación. | 🟡 |
| F10 | **No hay tests unitarios** visibles en los módulos comerciales. | Refactor riesgoso. | Añadir tests para `CalculateTotalsService`, `resolvePrice`, `validaciones`. | 🔴 |
| F11 | **No idempotencia** al guardar: doble-click puede duplicar. | Duplicación de ventas. | Añadir `Idempotency-Key` header (UUID generado en cliente); backend lo respeta por N minutos. | 🔴 |
| F12 | **`is_gift=2` permite precio 0** sin preguntar motivo. | Posible uso indebido. | Exigir `description` obligatorio si `is_gift=2`. | 🟡 |
| F13 | **`ConvertirVentaComponent` (servicios)** tiene los campos de entrega comentados. | No se puede editar entrega al convertir. | Descomentar y aplicar validaciones. | 🟡 |
| F14 | **Conversión no muestra un resumen de cambios** (precios recalculados, líneas eliminadas por falta de stock). | Usuario no sabe qué cambió. | Modal de revisión antes de confirmar. | 🟢 |

### 2.3 Backend

| # | Defecto | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| B1 | **Backend comercial no versionado**. | Cualquier cambio rompe clientes. | Publicar `/api/v1/...` y mantener `/api/...` como alias deprecated. | 🔴 |
| B2 | **Campo `message` numérico** para estado (no HTTP status). | Acoplamiento raro. | Migrar a HTTP status codes reales; el campo `message` se mantiene para compat temporal. | 🟡 |
| B3 | **No hay transacciones explícitas** descritas en código. | Riesgo de inconsistencia al crear cabecera+detalles+pagos. | Backend debe usar `BEGIN/COMMIT/ROLLBACK` con idempotencia. | 🔴 |
| B4 | **No hay rate-limit** visible. | DDoS trivial. | Implementar throttling en gateway. | 🟡 |
| B5 | **No hay refresh-token**: si el JWT expira, el usuario es expulsado sin aviso. | UX pobre. | Implementar refresh token rotativo. | 🟡 |
| B6 | **PDFs/Excel generados server-side**: cambios de formato requieren deploy. | Iteración lenta. | Plantillas en BD o por config (Mustache/Handlebars). | 🟢 |
| B7 | **Búsqueda `search-products` devuelve todos los campos**, incluyendo `wallets[]` con todos los tiers. | Payload enorme. | Devolver sólo lo necesario y un endpoint `/products/{id}/wallets` aparte. | 🟡 |
| B8 | **Falta endpoint `DELETE /cotizacion-details/{id}` consistencia**: en cotizaciones productos está pero en servicios no se ve igual. | UI con bugs. | Auditar todos los endpoints `DELETE` y unificar. | 🟡 |

### 2.4 Caja

| # | Defecto | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| C1 | **Nomenclatura confusa**: `getPagosSinProcesar` vs `getPagosSinValidar`. | Mantenimiento confuso. | Renombrar a `pagosSinValidar` y `pagosValidados`. | 🟡 |
| C2 | **Cierre de caja con pagos pendientes**: no se bloquea. | Dinero puede no entrar a caja. | Validar `caja_sucursale.pagos_pendientes == 0` antes de cerrar. | 🔴 |
| C3 | **Multi-usuario en misma caja**: sin lock. | Doble cierre. | Lock optimista (`updated_at`) o pesimista (`SELECT FOR UPDATE`). | 🔴 |
| C4 | **`type` en `caja_movement`** no distingue devoluciones de egresos manuales. | Reportes confusos. | Añadir `type = 4 (DEVOLUCION)`. | 🟡 |
| C5 | **Permiso `valid_payments` declarado pero no usado**. | Permisos fantasma. | Implementar flujo de validación manual de pagos (un supervisor aprueba). | 🟡 |
| C6 | **`process_payment` procesa todos los pagos pendientes** sin distinción. | Si uno es erróneo, falla todo. | Procesar uno a uno o agrupar por método. | 🟡 |
| C7 | **`fund_account` filtrado por moneda**: si la devolución es en otra moneda, no se puede procesar. | Falla silenciosa. | Forzar conversión de moneda o bloquear la devolución cross-currency. | 🟡 |

### 2.5 Devoluciones

| # | Defecto | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| R1 | **Tipo `CAMBIO` (3)** no genera automáticamente la contraparte. | Cambio manual. | Si `tipo_devolucion=3`, crear simultáneamente un nuevo movimiento de venta de "cambio". | 🟡 |
| R2 | **Multi-devolución por venta**: `max_quantity` puede no considerar anteriores. | Posible devolución excesiva. | En `showVenta(id)`, recibir parámetro `exclude_devolucion_id` para excluir lo ya devuelto en otras. | 🔴 |
| R3 | **Sin voucher obligatorio** cuando hay comprobante referencial. | Trazabilidad rota. | Validar `payment_file` cuando se setea `external_document_type_id`. | 🟡 |
| R4 | **No hay endpoint DELETE**: una devolución errónea no se puede eliminar. | Imposible corregir. | Endpoint `DELETE /devolucion-proformas/{id}` (lógicamente, marcar `state=3`). | 🟡 |
| R5 | **Sin historial** de cambios. | Auditoría rota. | Tabla `devolucion_audit` o `updated_at/user_id`. | 🟡 |

### 2.6 Cotizaciones

| # | Defecto | Impacto | Solución | Prioridad |
|---|---|---|---|---|
| Q1 | **No hay fecha de validez**. | Cotización "viva" para siempre. | Añadir `valid_until` DATE; mostrar warning si vence. | 🟡 |
| Q2 | **No se puede clonar**. | Recrear manualmente. | Botón "Clonar" en `ListCotizacionComponent` que copia cabecera + líneas a una nueva. | 🟢 |
| Q3 | **`AddDataCotizacionComponent` (en cotizaciones) es placeholder**. | Funcionalidad perdida. | Implementar o eliminar el componente. | 🟢 |
| Q4 | **No hay workflow de aprobación** por monto. | Control débil. | Si `total > threshold`, requerir `aprobacion_supervisor_id` antes de convertir a venta. | 🟢 |

---

## 3. Plan de remediación sugerido

### Iteración 1 (correcciones críticas) 🔴

1. **D1, D2, D3**: añadir `state_proforma/state_devolucion = 3 (ANULADA)` y bloquear doble conversión.
2. **F1**: implementar edición de ventas.
3. **F3**: re-validar stock al editar.
4. **F7**: verificación de JWT.
5. **F11**: idempotencia.
6. **B3**: transacciones en backend.
7. **C2**: bloqueo de cierre con pagos pendientes.
8. **C3**: lock de caja.
9. **R2**: exclusión de devoluciones anteriores en `showVenta`.

### Iteración 2 (mejoras funcionales) 🟡

1. **D4, D5**: auditoría + soft-delete.
2. **F2, F4, F5, F6**: refactor frontend.
3. **B2, B5**: HTTP status + refresh token.
4. **R1, R3, R4**: completar devoluciones.
5. **C1, C4, C6**: refactor caja.
6. **Q1**: validez de cotización.

### Iteración 3 (nice-to-have) 🟢

1. **D8, Q2, Q3, Q4**: detalles.
2. **B6, B7**: optimización backend.
3. **F8, F14**: cosmética/UX.

---

## 4. Decisiones de diseño a ratificar en la réplica

Antes de empezar a codificar la réplica, decidir:

1. **¿Mantenemos `proforma` unificada** (con `proforma_type` y `state_proforma`) o partimos en 4 tablas? → **Recomiendo mantener**, es la mayor fortaleza del sistema.
2. **¿Mantenemos wallets con cascada** o pasamos a una matriz fija `precios[][]`? → **Mantener wallets**; es más mantenible.
3. **¿Persistimos precio y subtotal en líneas** o calculamos siempre? → **Persistir** (como hace hoy); es necesario para auditoría y rápido en listados.
4. **¿Usamos Reactive Forms** en todo el frontend? → **Sí**, estandarizar.
5. **¿Usamos Signals** o NgRx o estado por componente? → **Signals** para Angular 17+; **NgRx** si la app crece mucho.
6. **¿Eliminamos el campo `message` numérico** o lo mantenemos por compat? → **Migrar a HTTP status**, deprecando `message`.
7. **¿Versión de API** `/api/v1/...` desde el día 1? → **Sí**, recomendable.
8. **¿Modelo de caja unificado** `caja_movement` con `type ∈ {1,2,3,4}` o dos tablas `caja_ingreso/caja_egreso`? → **Unificado**, más simple y consistente.

---

## 5. Próximo documento

- [`11-guia-replica.md`](./11-guia-replica.md) — checklist de implementación paso a paso.