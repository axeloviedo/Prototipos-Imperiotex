# 03 — Flujo de Ventas de Productos

> Alcance: `src/app/modules/ventas/` + `src/app/modules/ventas/componets/`. Cubre todo el ciclo: **crear → listar/ver → convertir (desde cotización) → editar → eliminar → exportar**.

---

## 1. Resumen funcional

El módulo "Ventas de productos" gestiona el ciclo de vida completo de una **venta de productos**:

- Crear venta nueva (directa).
- Crear venta desde una cotización (módulo "Cotizaciones").
- Listar, buscar, filtrar y paginar ventas.
- Ver el detalle de una venta (cabecera, pagos, entrega, líneas).
- Eliminar (borrado físico desde la UI).
- Exportar PDF por venta, Excel general (cabeceras) y Excel detallado (líneas).

Una venta siempre tiene:

- Un **cliente** obligatorio.
- Una o más **líneas de productos** con cantidad, precio, descuento, unidad y almacén.
- Un **tipo de documento interno** (Recibo, Factura, …; default = RECIBO DE VENTA, id=4).
- Una **moneda** (default PEN, id=1).
- Un **término de pago** (CONTADO/CRÉDITO; default CONTADO, id=2).
- Una **sucursal** del usuario (asignada en sesión).
- **Pagos** si es CONTADO.
- **Datos de entrega** (lugar, fecha, dirección, UBIGEO, encargado) si aplica.

---

## 2. Rutas y permisos

| Ruta | Componente | Permisos requeridos |
|---|---|---|
| `/ventas/crear` | `CreateVentaComponent` | `crear_venta` |
| `/ventas/listado` | `ListVentaComponent` | `ver_venta` o `crear_venta` |
| `/ventas/listado/ver/:id` | `ViewVentaComponent` | `ver_venta` |
| `/ventas/convertir/:id` | `ConvertirVentaComponent` | `crear_venta` |

> `PermissionGuard` aplica la verificación con `data.permissions[]`. Super-Admin bypassa.

---

## 3. Servicio: `VentasService`

Archivo: `src/app/modules/ventas/service/ventas.service.ts`. Estado expuesto: `isLoading$` (BehaviorSubject booleano).

### 3.1 Endpoints consumidos

| Método | HTTP | Endpoint | Uso |
|---|---|---|---|
| `searchClients(...)` | GET | `/ventas/search-clients?p=1&...` | Buscar clientes (filtros: n_document, full_name, phone). |
| `searchProducts(search)` | GET | `/ventas/search-products?p=1&search=` | Buscar productos. |
| `configAll()` | GET | `/ventas/config` | Cargar catálogos (asesores, monedas, métodos, bancos, sucursales, etc.). |
| `listProformas(page, data)` | POST | `/ventas/index?page=N` | Listar ventas con filtros. |
| `showProforma(id)` | GET | `/ventas/{id}` | Traer una venta. |
| `evalDisponibilidad(productId, unitId, qty)` | GET | `/proformas/eval-disponibilidad/{id}?unit_id=&quantity=` | Chequear stock proyectado. |
| `createProforma(data)` | POST | `/ventas` | Crear venta (FormData). |
| `editProforma(id, data)` | POST | `/ventas/{id}` | Editar venta (FormData). |
| `showCotizacion(id)` | GET | `/ventas/cotizacion/{id}` | Traer una cotización para convertirla. |
| `convertirAVenta(id, data)` | POST | `/ventas/convertir/{id}` | Convertir cotización → venta. |
| `deleteProforma(id)` | DELETE | `/ventas/{id}` | Eliminar venta. |
| `addDetailProforma(data)` | POST | `/proforma-details` | Agregar línea (en edición de cotización). |
| `editDetailProforma(id, data)` | PUT | `/proforma-details/{id}` | Editar línea (en edición de cotización). |
| `deleteDetailProforma(id)` | DELETE | `/proforma-details/{id}` | Eliminar línea (en edición de cotización). |
| `getPriceSugested(data)` | POST | `/ventas/price-sugested` | Precio sugerido por segmento+cantidad+lotes. |
| `exportVenta(id)` | GET (blob) | `/pdf/venta-productos/{id}` | **Abre PDF en nueva pestaña**. |
| `exportVentaGeneral(LINK)` | GET (blob) | `/excel/export-proforma-generales?k=1{LINK}` | **Descarga XLSX "ventas-generales-exportadas-{fecha}.xlsx"**. |
| `exportVentaDetails(LINK)` | GET (blob) | `/excel/export-proforma-details?k=1{LINK}` | **Descarga XLSX "venta-detalles-exportadas-{fecha}.xlsx"**. |

> Sub-servicio: `BatchesVentaService` (`/product-batches?productId=&unitId=&warehouseId=`) para selección de lotes.

---

## 4. Componente principal: `CreateVentaComponent`

Archivo: `src/app/modules/ventas/create-venta/create-venta.component.ts`. Es el formulario más complejo del módulo.

### 4.1 Estados (state)

```
CLIENT_SELECTED          cliente (objeto)
n_document, full_name, phone (criterios búsqueda)
PRODUCT_SELECTED         producto (objeto)
search_product
price, quantity_product, unidad_product, almacen_product
description_product, amount_discount
DETAIL_VENTA: any[]      carrito de líneas
is_gift: 1|2
isBatchesActive, selectedBatches[]
asesores, ASESOR_SELECTED, sucursale_asesor
method_payments, method_payment_id, METHOD_PAYMENT_SELECTED, bancos
document_types, document_type_id (default '4')
term_payments, term_payment_id (default '2')
coins, coin_id (default '1'), COIN_SELECTED, prev_coin_id
external_document_types, external_document_type_id_referencial
serie_comprobant_referencial, nro_comprobant_referencial
document_referencial
payment_file, imagen_previzualiza
sucursale_deliverie_id, date_entrega, date_documento, address
agencia, full_name_encargado, documento_encargado, telefono_encargado
ubigeo_region/provincia/distrito, region/provincia/distrito
TOTAL_PROFORMA, SUBTOTAL_PROFORMA, TOTAL_IMPUESTO_PROFORMA
DEBT_PROFORMA, PAID_OUT_PROFORMA
```

### 4.2 Flujo paso a paso

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ngOnInit() → configAll()                                 │
│    Carga asesores, monedas, métodos pago+bancos, documentos,│
│    términos, sucursales entrega, ubigeo (reg/prov/dist).    │
├──────────────────────────────────────────────────────────────┤
│ 2. Selección de cliente                                      │
│    searchClients() → si >1 abre modal VentaSearchClients →   │
│    emite ClientSelected.                                     │
│    Botones: createClientPerson / createClientCompany         │
│    (abren modales del módulo clients).                       │
├──────────────────────────────────────────────────────────────┤
│ 3. Selección de producto                                     │
│    searchProducts() → si >1 abre modal VentaSearchProducts → │
│    emite ProductSelected.                                    │
│    Auto-rellena precio por defecto (resolvePrice).           │
├──────────────────────────────────────────────────────────────┤
│ 4. Configuración de la línea                                 │
│    changeUnitProduct() → filtra almacenes disponibles.       │
│    resolvePrice(wallets, unitId):                            │
│       Unit+Suc+Seg+Coin > Unit+Suc+Seg > Unit+Suc >         │
│       Unit+Seg > Unit > product.price_general                │
│    Validación de stock según disponibilidad (1, 2, 3).       │
│    Validación de descuento en keyup (min/max%).              │
│    Cambio de moneda → recalcula precios y revierte si falta. │
├──────────────────────────────────────────────────────────────┤
│ 5. Agregar al carrito (addProduct)                           │
│    Valida: cliente, producto, qty>0, precio>0 (si !gift),    │
│    unidad, almacén, NO duplicado por product.id.             │
│    Calcula totales con CalculateTotalsService.fromPrice(...). │
│    Push a DETAIL_VENTA.                                      │
│    Si is_gift=2 → precio se fuerza a 0.                      │
├──────────────────────────────────────────────────────────────┤
│ 6. Configuración de cabecera                                 │
│    document_type_id (default '4').                           │
│    term_payment_id (default '2'=CONTADO).                     │
│    coin_id (default '1'=SOL).                                │
│    sucursale_deliverie_id, date_entrega, address.            │
│    date_documento (≤ hoy).                                   │
│    Encargado/entrega (si NO es lugar propio).                │
│    Comprobante referencial (opcional, todo-o-nada).          │
├──────────────────────────────────────────────────────────────┤
│ 7. Pagos (sólo si CONTADO)                                   │
│    method_payment_id, banco_id (si method tiene bancos).     │
│    amount_payment debe sumar = TOTAL (±0.01).                │
│    payment_file (imagen obligatoria si method ≠ EFECTIVO).   │
├──────────────────────────────────────────────────────────────┤
│ 8. validaciones() (~30 reglas)                               │
│    Ver §4.3.                                                 │
├──────────────────────────────────────────────────────────────┤
│ 9. save() → POST /ventas (FormData)                          │
│    Keys: proforma_type=1, client_id, asesor_id,              │
│          document_type_id, term_payment_id, coin_id,         │
│          sucursale_id, sucursale_deliverie_id,               │
│          date_documento, date_entrega, address,              │
│          is_gift, description, external_*,                   │
│          serie/nro_comprobant_referencial,                   │
│          ubigeo_*, agencia, full_name/documento/telefono,    │
│          method_payment_id, banco_id, amount_payment,        │
│          payment_file,                                       │
│          DETAIL_VENTA (JSON con cada línea),                 │
│          DETAIL_DEVOLUCION_BATCHES (lotes, JSON).            │
│    Respuesta: proforma + new_total/subt/imp/debt.            │
│    Navega a /ventas/listado.                                 │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Reglas de validación (`validaciones()`)

| # | Regla |
|---|---|
| 1 | Cliente seleccionado. |
| 2 | Al menos 1 línea en `DETAIL_VENTA`. |
| 3 | `document_type_id` obligatorio. |
| 4 | `term_payment_id` obligatorio. |
| 5 | `sucursale_deliverie_id` obligatorio. |
| 6 | `date_entrega` obligatoria. |
| 7 | `date_documento` ≤ hoy. |
| 8 | Si el lugar de entrega no incluye el nombre de la sucursal propia, `agencia`, `full_name_encargado`, `documento_encargado`, `telefono_encargado` son obligatorios. |
| 9 | Si `sucursale_deliverie_id == 6`, `ubigeo_region/provincia/distrito` obligatorios. |
| 10 | Si `term_payment_id == 2` (CONTADO): `method_payment_id`, `banco_id` (si método tiene bancos), `amount_payment > 0`, suma de pagos = total (±0.01). |
| 11 | Si `term_payment_id != 2` (CRÉDITO): suma de pagos `< total`. |
| 12 | `paid > total` → error. `paid < 0` → error. |
| 13 | Comprobante referencial: los tres campos (`external_document_type_id_referencial`, `serie_comprobant_referencial`, `nro_comprobant_referencial`) deben estar todos o ninguno. |
| 14 | Descuento por línea en `[price × min/100, price × max/100]`. |
| 15 | Stock según `product.disponibilidad`: `1` ⇒ ok; `2` ⇒ bloquea si `warehouse.quantity < qty`; `3` ⇒ llama a `eval-disponibilidad` la primera vez. |
| 16 | No duplicar (product.id) en `DETAIL_VENTA`. |

### 4.4 Acciones por línea

- **Editar** (`editProduct(DETAIL, INDEX)`) → modal `EditProductDetailVentaComponent` que edita qty, unit, warehouse, price, discount, batches y recalcula totales. Si la venta ya existe (PROFORMA_ID), usa los endpoints `PUT /proforma-details/{id}`.
- **Eliminar** (`deleteProduct(DETAIL, INDEX)`) → modal `DeleteProductDetailVentaComponent`. Si la venta ya existe, llama `DELETE /proforma-details/{id}`.
- **Selección de lotes** (`SelectBatchesVentaComponent`) → si el producto tiene lotes y se activa la opción, se elige manualmente el/los lotes. Auto-redistribuye qty y valida contra `quantityAvailable`.

### 4.5 Cambio de moneda

`changeCoin()`:
1. Filtra `wallets` por `coin_id` destino.
2. Para cada línea, recalcula `price_unit` con `resolvePrice`.
3. Si alguna línea queda con `price=0` **y no es gift**, **revierte** la moneda (devuelve `coin_id` al anterior y muestra toast de error).
4. Vuelve a calcular totales.

---

## 5. Listado: `ListVentaComponent`

Archivo: `src/app/modules/ventas/list-venta/list-venta.component.ts`.

### 5.1 Filtros
- `search` (texto libre: cliente, nro proforma, nro documento).
- `client_segment_id`, `asesor_id`, `product_categorie_id`.
- `search_client`, `search_product`.
- `start_date`, `end_date`.
- `coin_id`, `state_payment_id`.

### 5.2 Estado fijo al listar
- `proforma_type = 1` (productos).
- `state_proforma = 2` (ventas, no cotizaciones).

### 5.3 Acciones por fila
- **Ver** → `ViewVentaComponent`.
- **PDF** → `proformaPdf()` llama `VentasService.exportVenta(id)` → abre PDF en nueva pestaña.
- **Importar cotización** → modal `AddDataCotizacionComponent` que pide código y redirige a `/ventas/convertir/{id}`.
- **Eliminar** → modal `DeleteVentaComponent` → `DELETE /ventas/{id}`.
- **Exportar Excel general** → `exportProformas()` → arma LINK con filtros y llama `exportVentaGeneral(LINK)`.
- **Exportar Excel detalles** → `exportProformasDetails()` → análogo.
- **Columnas visibles** → `openColumnSelector()` (persistido en localStorage por `ColumnsService`, módulo `ventas_productos`).
- **Ordenamiento** → `OrdenTablaService` (cliente-side).

---

## 6. Ver: `ViewVentaComponent`

Archivo: `src/app/modules/ventas/view-venta/view-venta.component.ts`. Sólo lectura. Carga `proforma` y muestra:

- Cabecera (cliente, asesor, fecha, total, deuda, moneda).
- Tipo de documento y término.
- Comprobante referencial.
- Entrega (con `validationDeliverie()` que oculta encargado si la entrega es a la propia sucursal).
- Detalles (líneas).
- Pagos (tabla de abonos).

---

## 7. Convertir: `ConvertirVentaComponent`

Archivo: `src/app/modules/ventas/convertir-venta/convertir-venta.component.ts`.

### 7.1 Flujo
1. Carga la cotización vía `showCotizacion(id)`.
2. Las líneas están **bloqueadas** (read-only); sólo se editan:
   - `document_type` (obligatorio, arranca vacío).
   - `term_payment`.
   - `coin`.
   - `method_payment`, `banco`, `amount_payment` (si CONTADO).
   - `date_documento`.
   - Comprobante referencial.
   - Datos de entrega.
3. `validaciones()` mismo set que creación.
4. `convertir()` → `POST /ventas/convertir/{id}` con FormData.
5. Respuesta puede traer `stock_warnings[]` → se muestran como toast warnings.
6. Navega a `/ventas/listado`.

---

## 8. Eliminar: `DeleteVentaComponent`

Modal simple: confirma y llama `DELETE /ventas/{id}`. Toast success/error.

---

## 9. Sub-componentes (modales)

| Componente | Archivo | Función |
|---|---|---|
| `VentaSearchProductsComponent` | `componets/search-products/` | Lista productos candidatos; muestra precio por wallet/coin; rechaza sin stock. Emite `ProductSelected`. |
| `VentaSearchClientsComponent` | `componets/search-clients/` | Lista clientes; emite `ClientSelected`. |
| `EditProductDetailVentaComponent` | `componets/edit-product-detail-venta/` | Edita una línea del carrito. Recalcula totales. Si `PROFORMA_ID` está set, usa API. |
| `DeleteProductDetailVentaComponent` | `componets/delete-product-detail-venta/` | Confirma eliminación de línea. Si `PROFORMA_ID` está set, usa API. |
| `OpenDetailVentaComponent` | `componets/open-detail-venta/` | Modal read-only (sin lógica). |
| `AddDataCotizacionComponent` | `componets/add-data-cotizacion/` | Pide código de cotización, llama `showCotizacion()`, navega a `/ventas/convertir/{id}`. |
| `AddPaymentsComponent` | `componets/add-payments/` | **Placeholder vacío**. No implementado. |
| `SelectBatchesVentaComponent` | `componets/select-batches-venta/` | Selección manual de lotes. |

---

## 10. Estructura del payload (POST FormData `/ventas`)

```
multipart/form-data:
  proforma_type             = 1
  state_proforma            = 2
  is_gift                   = 1 | 2
  client_id                 = <id>
  asesor_id                 = <id> | '' (opcional)
  document_type_id          = 4 (default)
  term_payment_id           = 2 (default CONTADO)
  coin_id                   = 1 (default PEN)
  sucursale_id              = <id>
  sucursale_deliverie_id    = <id>
  date_documento            = YYYY-MM-DD
  date_entrega              = YYYY-MM-DD
  address                   = ...
  description               = ...
  external_document_type_id_referencial = '' | <id>
  serie_comprobant_referencial          = '' | <str>
  nro_comprobant_referencial            = '' | <str>
  ubigeo_region, ubigeo_provincia, ubigeo_distrito = ''|<id>
  agencia, full_name_encargado, documento_encargado, telefono_encargado = ...
  method_payment_id         = '' | <id>  (sólo CONTADO)
  banco_id                  = '' | <id>
  amount_payment            = 0 | <decimal>
  payment_file              = <file> | ''
  DETAIL_VENTA              = JSON.stringify([{ product_id, unit_id, warehouse_id,
                                                description, price_unit, quantity,
                                                discount, importe_iva, is_gift,
                                                batches: [{batch_id, quantity}] }, ...])
  DETAIL_DEVOLUCION_BATCHES = JSON.stringify([...])  (si aplica)
```

> Las claves en FormData usan MAYÚSCULAS con guiones bajos (convención del frontend). **El backend debe recibirlas tal cual**.

---

## 11. Diagrama de secuencia (crear venta directa)

```
[CreateVentaComponent]   [VentasService]    [Backend]    [LoadingOverlay]   [Toastr]
        │                      │                     │             │               │
        │ ngOnInit → configAll │                     │             │               │
        │─────────────────────▶│ GET /ventas/config  │             │               │
        │                      │────────────────────▶│             │               │
        │                      │◀────────────────────│ {asesores,  │               │
        │                      │       coins, ...}   │             │               │
        │                      │                     │             │               │
        │ searchClients()      │                     │             │               │
        │─────────────────────▶│ GET search-clients   │             │               │
        │                      │────────────────────▶│             │               │
        │                      │◀────────────────────│ [clientes]  │               │
        │◀─────────────────────│                     │             │               │
        │ (modal o auto-fill)  │                     │             │               │
        │                      │                     │             │               │
        │ addProduct()         │                     │             │               │
        │ valida carrito       │                     │             │               │
        │ validaciones()       │                     │             │               │
        │ save()               │                     │             │               │
        │─────────────────────▶│ POST /ventas         │             │               │
        │                      │ (FormData)──────────▶│             │               │
        │                      │                     │ transacción │               │
        │                      │                     │ INSERT cab. │               │
        │                      │                     │ INSERT det. │               │
        │                      │                     │ INSERT pgo. │               │
        │                      │◀────────────────────│ {ok, ...}   │               │
        │◀─────────────────────│                     │             │               │
        │ toast.success        │                     │             │               │
        │ navigate(listado)    │                     │             │               │
```

---

## 12. Edge cases y reglas "menos obvias"

1. **Re-cálculo al cambiar moneda**: si una línea no tiene precio en la moneda destino, se cancela el cambio. El usuario debe editar la línea o cambiar manualmente el precio.
2. **`is_gift = 2`** fuerza precio 0 y aplica IVA = 0; la línea sigue contando como ingreso (subtotal = 0, total = 0).
3. **Stock consultivo (`disponibilidad = 3`)**: el primer intento llama `eval-disponibilidad`; el resultado se cachea en la línea y siguientes cambios ya no preguntan.
4. **Editar vs crear**: en `create`, las líneas se envían todas juntas en el POST. En `edit` (sólo cotización, no venta), cada cambio de línea va como PUT/DELETE/POST individual.
5. **El catálogo `/ventas/config` se carga una sola vez al entrar al formulario**. No se recarga en cambios de moneda ni sucursal — esto es un defecto menor (ver `10-mejoras-y-defectos.md`).
6. **No se valida que el usuario pertenezca a la sucursal del documento**. Esto se asume a nivel sesión.
7. **PDF y Excel no se generan en frontend**: son blobs del backend. El frontend sólo los abre/descarga.

---

## 13. Puntos fuertes del módulo

- Resolución de precios transparente (cascada visible en código).
- Validaciones centralizadas y reproducidas en frontend y backend.
- Soporte multi-moneda con reversión clara.
- Soporte de regalos (is_gift) sin bifurcaciones.
- Componente `AddDataCotizacionComponent` permite "promover" cualquier cotización en una venta.

## 14. Defectos del módulo

Ver `10-mejoras-y-defectos.md`. Resumen:

- **No hay edición de ventas ya guardadas** (sólo creación, eliminación y conversión desde cotización). El botón "Editar" no existe.
- **`add-payments` placeholder vacío**.
- **El catálogo no se recarga** tras cambios de moneda/sucursal.
- **Eliminación física**: no hay `state=ANULADO`.
- **Falta validación de stock en edición**.
- **No idempotencia** ante doble click en Guardar.
- **No se traducen los `code` numéricos** a texto en la UI (los muestra tal cual).

---

## 15. Próximo documento

- [`04-flujo-ventas-servicios.md`](./04-flujo-ventas-servicios.md) — mismo flujo aplicado a servicios.