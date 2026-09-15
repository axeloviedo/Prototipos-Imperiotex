# 01 — Visión General del Proceso de Ventas

## 1. Propósito del documento

Describir a nivel funcional el **proceso completo de ventas** del ERP Multiservicios, incluyendo:

- Ventas de **productos** y **servicios** (tratados como un único flujo parametrizable).
- **Cotizaciones** de productos y servicios, y su conversión a ventas.
- **Devoluciones** de ventas (sólo productos).
- **Caja** (apertura, cierre, pagos, ingresos, egresos, devoluciones).

El objetivo es que un equipo de desarrollo pueda **replicar el proceso** en otro sistema conservando el mismo comportamiento funcional.

---

## 2. Contexto técnico

| Aspecto | Valor |
|---|---|
| **Frontend** | Angular (template Metronic 8.2.1), módulos en `src/app/modules/`. |
| **Backend referenciado** | REST en `URL_SERVICIOS = http://localhost:8000/api` (entorno dev) / `http://161.132.53.229:8002/api` (prod). El puerto 8000 y la estructura de rutas es consistente con **Laravel** (`/api/...` + JWT Bearer), pero el contrato es agnóstico al lenguaje. |
| **Auth** | JWT (`Authorization: Bearer <token>`) + permisos en `user.permissions[]`. |
| **Almacenamiento de tokens** | `localStorage` clave `token`; usuario en `user`. |
| **Notificaciones** | `ngx-toastr`. |
| **Loading** | Overlay global (`LoadingOverlayService`). |
| **Errores de API** | `ApiResponseHandlerService`: `message >= 500` ⇒ error, `400–499` ⇒ warning. |
| **PDFs y Excel** | Endpoints `/pdf/...` y `/excel/...` que devuelven `blob`; el frontend los abre/descarga. |

> Los microservicios en `inventario/` y `movimientos/` (Java/Spring Boot) **no implementan** el flujo comercial. Sólo exponen `/api/product-batches/**` y `/api/batch-movements/**` (gestión de lotes y kardex). El backend comercial vive fuera de este repositorio y **se documenta sólo a nivel de contrato REST** en `08-contratos-api.md`.

---

## 3. Mapa conceptual de módulos

```
                  ┌─────────────────────────┐
                  │   CATÁLOGO BASE         │
                  │  Productos / Servicios  │
                  │  Clientes / Segmentos   │
                  │  Almacenes / Sucursales │
                  │  Monedas / Métodos Pago │
                  │  Impuestos / Wallets    │
                  └────────────┬────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
 ┌───────────────┐     ┌────────────────┐     ┌────────────────┐
 │ COTIZACIONES  │     │     VENTAS     │     │   DEVOLUCIONES │
 │  (productos + │────▶│ (productos +   │◀────│  (sólo produc- │
 │   servicios)  │     │   servicios)   │     │     tos)       │
 └───────────────┘     └────────┬───────┘     └────────┬───────┘
                               │ pagos[]              │
                               ▼                      ▼
                          ┌─────────────────────────────┐
                          │            CAJA             │
                          │  apertura/cierre/ingresos/  │
                          │  egresos/procesa pagos/     │
                          │  procesa devoluciones/      │
                          │  reportes / historico       │
                          └─────────────────────────────┘
```

---

## 4. Glosario

| Término | Significado |
|---|---|
| **Proforma** | Documento cabecera unificado para cotización o venta. Se diferencia por `proforma_type` (1=producto, 2=servicio) y `state_proforma` (1=cotización, 2=venta). |
| **ProformaDetail** | Línea de la proforma: un producto o un servicio con cantidad, precio, descuento, almacén/unidad, lotes (sólo productos). |
| **Pago (Payment)** | Abono parcial o total contra una venta. Cada pago lleva método, banco, monto, voucher y estado de verificación. |
| **Wallet** | Lista de precios por (moneda, unidad, sucursal, segmento de cliente). Es el mecanismo de resolución de precios. |
| **Coin** | Moneda del documento (PEN, USD, …). |
| **Sucursal** | Local físico / caja donde se emite el documento. |
| **Asesor** | Vendedor asignado a la venta (opcional, configurable por permiso). |
| **CajaSucursale** | Instancia activa de una caja en una sucursal+moneda. Una caja abierta por (sucursal, moneda). |
| **Método de pago** | Efectivo, transferencia, etc. Algunos métodos requieren banco. |
| **Banco** | Banco asociado al método de pago cuando aplica. |
| **Documento interno** | Tipo de comprobante propio (Recibo de venta, Factura, etc.). `document_type_id`. |
| **Documento externo** | Tipo de comprobante referencial del cliente (factura que el cliente entrega como respaldo). |
| **Término de pago** | `term_payment_id`: 2 = CONTADO, otros = CRÉDITO. |
| **Impuesto (IVA)** | `importe_iva` por producto; usado en `CalculateTotalsService.fromPrice(...)`. |
| **Disponibilidad** | `1` = vende siempre, `2` = bloquea sin stock, `3` = consulta al servidor si no hay stock. |
| **Tipo de devolución** | `1` = Normal, `2` = Mal estado, `3` = Cambio. |
| **State_devolución** | `1` = Pendiente (editable), `2` = Finalizada. |
| **Verification (pago)** | `1` = no procesado en caja, `2` = procesado en caja (deja de contar como "pendiente de validar"). |

---

## 5. Actores y permisos

Todos los permisos son strings simples almacenados en `user.permissions[]` (vienen del JWT). El frontend aplica `PermissionGuard` por ruta. El backend debe replicar la verificación server-side.

| Módulo | Permisos |
|---|---|
| Ventas (productos) | `ver_venta`, `crear_venta`, `asignar_vendedor_venta_producto` |
| Ventas (servicios) | `ver_venta_servicio`, `crear_venta_servicio`, `asignar_vendedor_venta_servicio` |
| Cotizaciones (productos) | `ver_cotizacion`, `crear_cotizacion`, `editar_cotizacion`, `eliminar_cotizacion` |
| Cotizaciones (servicios) | `ver_cotizacion_servicio`, `crear_cotizacion_servicio`, `editar_cotizacion_servicio`, `eliminar_cotizacion_servicio` |
| Devoluciones (ventas) | `ver_devolucion_venta`, `crear_devolucion_venta`, `editar_devolucion_venta` |
| Caja | `ver_caja`, `crear_caja`, `editar_caja`, `valid_payments` |

**Super-Admin** se detecta por `role_name === 'Super-Admin'` y bypassa cualquier guard.

---

## 6. Reglas de negocio transversales

1. **Multi-moneda**. Toda cabecera y línea lleva `coin_id`. Al cambiar moneda, se recalculan los precios usando `wallets[]` filtrados por moneda; si alguna línea no tiene precio en la nueva moneda, **se revierte el cambio**.

2. **Precios por niveles** (resolución en cascada):
   - (Unit + Sucursal + Segmento de cliente) → más específico
   - (Unit + Sucursal)
   - (Unit + Segmento)
   - (Unit, genérico)
   - Fallback: `product.price_general` (sólo si la moneda destino es la base)

3. **Descuento acotado**. Cada producto tiene `min_discount` y `max_discount` (porcentaje). El descuento por línea debe estar en el rango `[price × min/100, price × max/100]`.

4. **Impuestos**. Cada producto lleva `importe_iva` (porcentaje). Los precios en UI son **tax-inclusive** (incluyen IGV). `CalculateTotalsService.fromPrice(price, discount, qty, ivaRate)` devuelve `{ precioNeto, subtotal, impuesto, total }`.

5. **Término de pago**.
   - `term_payment_id == 2` (CONTADO): suma de pagos = total (±0.01).
   - Otros (CRÉDITO): suma de pagos ≤ total; si es < total, queda como PARCIAL.
   - `paid > total` o `paid < 0` ⇒ inválido.

6. **Stock (sólo productos)**.
   - `disponibilidad == 1`: vende sin chequear stock.
   - `disponibilidad == 2`: bloquea si no hay stock en almacén.
   - `disponibilidad == 3`: la primera vez pregunta al servidor vía `GET /proformas/eval-disponibilidad/{id}?unit_id=&quantity=`.

7. **Lotes (batches)**. En ventas de productos, si se activa "selección de lotes", se elige manualmente de qué lote(s) sale cada unidad (FEFO implícito, no obligatorio).

8. **Comprobante referencial**. Si la venta referencia un comprobante externo del cliente, los campos `external_document_type_id`, `serie_comprobant_referencial`, `nro_comprobant_referencial` deben ir todos juntos o ninguno.

9. **Devoluciones**. Sólo productos (no servicios en este flujo). La cantidad devuelta por (producto, unidad) **no puede superar** la cantidad vendida original (en la misma devolución, o acumulado en devoluciones anteriores del mismo documento).

10. **Caja como sumidero transaccional**. Antes de poder cobrar, registrar ingresos/egresos o procesar devoluciones, la caja correspondiente a la sucursal+moneda debe estar **abierta** (`caja_sucursale` activa).

---

## 7. Estados de documentos

```
                     ┌──────────────┐
                     │  COTIZACIÓN  │ state_proforma = 1
                     │  (state=1)   │
                     └──────┬───────┘
                            │ "Convertir a venta"
                            ▼
              ┌────────────────────────────┐
              │           VENTA            │ state_proforma = 2
              │                            │ state_payment ∈ {Crédito, Parcial, Pagado}
              │  ─ pagos[] ─► Caja         │
              │  ─► Devolución → Caja      │
              └────────────────────────────┘
```

| Documento | Estados |
|---|---|
| **Proforma** | `state_proforma`: 1=Cotización, 2=Venta. `state_payment`: default=Crédito, 2=Parcial, 3=Pagado. `is_gift`: 1=normal, 2=regalo. |
| **Devolución** | `state_devolucion`: 1=Pendiente (editable), 2=Finalizada. Por línea: `tipo_devolucion` 1=Normal, 2=Mal estado, 3=Cambio. |
| **Pago** | `verification`: 1=no procesado en caja, 2=procesado en caja. `date_validation`: timestamp cuando se validó. |
| **Caja** | apertura → activa (caja_sucursale.amount_initial > 0) → cierre. Una sola caja abierta por (sucursal, moneda). |
| **Movimiento de caja** | `state`: 1=Pendiente, 2=Procesado. `type`: 1=Venta, 2=Ingreso, 3=Egreso. |

---

## 8. Estructura de carpetas del frontend (referencia rápida)

```
src/app/modules/
├── ventas/                  ← ventas de productos (PROFORMAS)
├── service-ventas/          ← ventas de servicios
├── cotizaciones/            ← cotizaciones de productos
├── service-cotizaciones/    ← cotizaciones de servicios
├── devolucion-ventas/       ← devoluciones de ventas
└── cajas/                   ← caja (apertura/cierre/pagos/ingresos/egresos)
```

Cada módulo sigue el patrón:
- `service/<feature>.service.ts` (servicio HTTP único)
- `<feature>-routing.module.ts` (rutas con `PermissionGuard`)
- `<feature>.module.ts` (declara componentes + NgbModal)
- `create-*` / `list-*` / `view-*` / `edit-*` / `delete-*` (componentes CRUD)
- `componets/*` (modales: `search-products`, `search-clients`, `edit-product-detail-*`, `add-payments`, etc.)

> **Defecto menor**: la carpeta `componets` está mal escrita (le falta la `n`). Se mantiene así por compatibilidad con imports ya existentes; **en una réplica, escribir `components` correctamente**.

---

## 9. Resumen del flujo de alto nivel

1. **Catálogo base** se carga vía `/config` por dominio (`/ventas/config`, `/cotizaciones/config`, `/caja/config`, etc.).
2. El usuario **selecciona cliente** (busca o crea).
3. Agrega **productos o servicios** al carrito: resuelve precio por wallet, valida stock, valida descuentos.
4. Elige **tipo de documento**, **término de pago**, **moneda**, **sucursal**, **lugar y fecha de entrega**.
5. Si es **CONTADO**, completa los pagos (método + banco + monto + voucher) en el mismo formulario.
6. Si es **CRÉDITO**, deja el pago para gestión de caja (parciales o totales).
7. Al guardar (POST FormData), el backend crea la cabecera + detalles + pagos + devolución potencial.
8. **Cotizaciones** siguen el mismo flujo pero sin exigir tipo de documento, fecha de entrega ni pago. Pueden convertirse a venta luego.
9. **Devoluciones** se crean desde el listado, referencian la venta original y cargan las líneas vendidas para que el usuario marque cantidades y tipo (normal / mal estado / cambio).
10. **Caja** unifica pagos pendientes, ingresos, egresos, devoluciones y reportes; es el módulo "transaccional" del dinero.

---

## 10. Lo que se conserva del sistema actual (puntos fuertes)

- **Modelo "proforma unificada"** para cotización/venta/producto/servicio con sólo dos flags: simple y potente.
- **Resolución de precios por wallets** con cascada explícita en el frontend: el usuario ve el fallback y entiende por qué un precio.
- **Cálculo de totales centralizado** en `CalculateTotalsService.fromPrice(...)` (testeable, puro).
- **Permisos por acción** vía `PermissionGuard` y `data: { permissions: [...] }`: trivial añadir/quitar.
- **Modales reutilizables** para búsqueda de clientes y productos.
- **Generación de PDF y Excel** integrada en cada módulo: el usuario no necesita salir del sistema.
- **Validación de stock** configurable por producto (`disponibilidad`).
- **Caja multi-moneda y multi-sucursal** con control de apertura/cierre.

## 11. Lo que se documenta como defectos / mejoras

Ver `10-mejoras-y-defectos.md` para el detalle. Resumen:

- **Falta validación de stock en edición** de ventas; sólo se valida al crear y al convertir.
- **Falta transacción única** al guardar cabecera + detalles + pagos: actualmente se hace todo en un único POST FormData, lo cual es frágil si la red falla a mitad.
- **Sin idempotencia explícita**: si el usuario hace doble clic en "Guardar", pueden duplicarse ventas.
- **Auth sin refresh token**: la verificación de expiración del JWT está comentada.
- **Falta un estado "ANULADO"** en ventas: hoy se elimina físicamente desde la UI.
- **Caja no soporta múltiples usuarios concurrentes** sobre la misma caja abierta.
- **No hay sincronización cliente↔tiempo real**: caja y ventas son asíncronas (refresh manual).
- **El servicio `add-payments` está vacío** (placeholder).
- **El catálogo está en archivos duplicados**: cada módulo repite `search-products`, `search-clients`, `add-data-cotizacion`, etc. Se podría centralizar.

---

## 12. Próximos pasos de lectura

- Modelo de datos → [`02-modelo-datos.md`](./02-modelo-datos.md)
- Flujo detallado de ventas de productos → [`03-flujo-ventas-productos.md`](./03-flujo-ventas-productos.md)