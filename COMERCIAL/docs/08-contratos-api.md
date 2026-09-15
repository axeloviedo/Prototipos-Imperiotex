# 08 — Contratos REST (API)

> Resumen de los endpoints consumidos por el frontend Angular. Sirve como **contrato mínimo** que el backend debe exponer para que el sistema funcione. No es exhaustivo (faltan endpoints de catálogo: clientes, productos, servicios, almacenes, etc., que son estándar CRUD).

**Base URL**: `{URL_SERVICIOS}` = `http://localhost:8000/api` (dev) / `http://161.132.53.229:8002/api` (prod).

**Auth**: `Authorization: Bearer <JWT>` en cada request. El token se envía desde `AuthService.token`.

---

## 0. Convenciones generales

### 0.1 Respuestas exitosas

```json
{ "success": true, "data": { ... } }
```

O para listados paginados:

```json
{
  "success": true,
  "data": [ ... ],
  "total": 123,
  "current_page": 1,
  "last_page": 5,
  "per_page": 20
}
```

### 0.2 Respuestas de error

```json
{ "success": false, "message": 404, "message_text": "No encontrado" }
```

> El campo `message` es **numérico** y la convención del frontend es:
> - `>= 500` ⇒ error (toast `error`).
> - `400–499` ⇒ warning (toast `warning`).
> - `200–299` ⇒ success (toast `success`).

Esto es importante: **no usar HTTP status codes en el cuerpo**; el frontend inspecciona `message` (campo legacy). En una réplica se recomienda **mantener la compatibilidad** con este contrato o documentar la migración.

### 0.3 Formato de creación

Casi todas las operaciones de escritura usan **`multipart/form-data`** (no JSON), porque admiten imágenes (vouchers). El backend debe tolerar ambos formatos.

---

## 1. Ventas (productos)

| Método | Endpoint | Body | Respuesta |
|---|---|---|---|
| GET | `/ventas/config` | — | `{ asesores, coins, method_payments, bancos, term_payments, document_types, external_document_types, sucursales, sucursale_deliveries, ubigeo_region[], ubigeo_provincia[], ubigeo_distrito[] }` |
| GET | `/ventas/search-clients?p=1&n_document=&full_name=&phone=` | — | `Client[]` |
| GET | `/ventas/search-products?p=1&search=` | — | `Product[]` (con `units, warehouses, wallets, importe_iva, min_discount, max_discount, disponibilidad, ...`) |
| GET | `/proformas/eval-disponibilidad/{productId}?unit_id=&quantity=` | — | `{ available: boolean, current_stock: number, requested: number }` |
| POST | `/ventas/index?page=N` | `{ search, client_segment_id, asesor_id, product_categorie_id, search_client, search_product, start_date, end_date, coin_id, state_payment_id, proforma_type=1, state_proforma=2 }` | `{ data: Proforma[], total, ... }` |
| GET | `/ventas/{id}` | — | `Proforma` con `details[], pagos[], proforma_deliverie, ...` |
| GET | `/ventas/cotizacion/{id}` | — | `Proforma` (cotización) para conversión. |
| POST | `/ventas` | FormData (§10) | `{ proforma, new_total, new_subt, new_impuesto, new_debt, stock_warnings?[] }` |
| POST | `/ventas/{id}` | FormData | mismo |
| POST | `/ventas/convertir/{id}` | FormData | `{ proforma, new_total, ..., stock_warnings?[] }` |
| DELETE | `/ventas/{id}` | — | `{ success }` |
| POST | `/ventas/price-sugested` | `{ product_id, client_segment_id, quantity, batches: [{batch_id, quantity}] }` | `{ price_unit }` |
| POST | `/proforma-details` | FormData (línea) | `{ detail, new_total, new_subt, new_impuesto, new_debt }` |
| PUT | `/proforma-details/{id}` | FormData | mismo |
| DELETE | `/proforma-details/{id}` | — | `{ success }` |
| GET | `/pdf/venta-productos/{id}` | — | `application/pdf` (blob) |
| GET | `/excel/export-proforma-generales?k=1{...filtros}` | — | `application/vnd.ms-excel` |
| GET | `/excel/export-proforma-details?k=1{...filtros}` | — | mismo |

### 1.1 GET `/ventas/config`

Devuelve catálogos con su forma ya armada. Los `ubigeo_*` son arrays para popular los selects en cascada (region → provincia → distrito).

### 1.2 Filtros en POST `/ventas/index`

Los filtros se mandan en el body (no en query), con `page` en query. Ejemplo:

```json
{
  "search": "",
  "client_segment_id": "",
  "asesor_id": "",
  "product_categorie_id": "",
  "search_client": "",
  "search_product": "",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "coin_id": "1",
  "state_payment_id": "",
  "proforma_type": 1,
  "state_proforma": 2
}
```

---

## 2. Ventas (servicios)

Mismo patrón pero con prefijos y sufijos `service-`:

| Método | Endpoint |
|---|---|
| GET | `/service-ventas/config` |
| GET | `/service-ventas/search-clients?p=1&...` |
| GET | `/service-ventas/search-services?p=1&search=` |
| POST | `/service-ventas/index?page=N` (filtros: `service_categorie_id`, `state_proforma=2`, `proforma_type=2`) |
| GET | `/service-ventas/{id}` |
| GET | `/service-ventas/cotizacion/{id}` |
| POST | `/service-ventas` (FormData, clave `DETAIL_SERVICE_VENTA`) |
| POST | `/service-ventas/{id}` |
| POST | `/service-ventas/convertir/{id}` |
| DELETE | `/service-ventas/{id}` |
| POST/PUT/DELETE | `/proforma-service-details[/{id}]` |
| GET | `/pdf/venta-servicios/{id}` |
| GET | `/excel/export-proforma-service-generales?k=1{LINK}` |
| GET | `/excel/export-proforma-service-details?k=1{LINK}` |

---

## 3. Cotizaciones (productos)

| Método | Endpoint |
|---|---|
| GET | `/cotizaciones/config` |
| GET | `/cotizaciones/search-clients?p=1&...` |
| GET | `/cotizaciones/search-products?p=1&search=` |
| POST | `/cotizaciones/index?page=N` (filtros: `state_proforma=1`, `proforma_type=1`) |
| GET | `/cotizaciones/{id}` |
| GET | `/cotizaciones/eval-disponibilidad/{id}?unit_id=&quantity=` |
| POST | `/cotizaciones` |
| POST | `/cotizaciones/{id}` (sólo cabecera) |
| DELETE | `/cotizaciones/{id}` |
| POST/PUT/DELETE | `/cotizacion-details[/{id}]` |
| GET | `/pdf/cotizacion/{id}` |
| GET | `/excel/export-proforma-generales?k=1{LINK}` |
| GET | `/excel/export-proforma-details?k=1{LINK}` |

---

## 4. Cotizaciones (servicios)

| Método | Endpoint |
|---|---|
| GET | `/service-cotizaciones/config` |
| GET | `/service-cotizaciones/search-clients?p=1&...` |
| GET | `/service-cotizaciones/search-services?p=1&search=` |
| POST | `/service-cotizaciones/index?page=N` |
| GET | `/service-cotizaciones/{id}` |
| POST | `/service-cotizaciones` |
| POST | `/service-cotizaciones/{id}` |
| DELETE | `/service-cotizaciones/{id}` |
| POST/PUT/DELETE | `/proforma-service-details[/{id}]` |
| GET | `/pdf/cotizacion-servicios/{id}` |
| GET | `/excel/export-proforma-generales?k=1{LINK}` |
| GET | `/excel/export-proforma-details?k=1{LINK}` |

---

## 5. Devoluciones

| Método | Endpoint | Notas |
|---|---|---|
| GET | `/devolucion-proformas/config` | Devuelve `state_devoluciones`, `tipo_devoluciones`, `external_document_types`. |
| POST | `/devolucion-proformas/index?page=N` | Filtros: `search`, `proforma_id`, `state_devolucion`, `start_date`, `end_date`. |
| GET | `/devolucion-proformas/{id}` | Devolución con líneas. |
| GET | `/devolucion-proformas/venta/{id}?devolucion_id=` | Venta original con `sold_quantity` (opcionalmente neto). |
| POST | `/devolucion-proformas` | Crear. FormData. |
| POST | `/devolucion-proformas/{id}` | Actualizar (sólo si `state_devolucion=1`). |

---

## 6. Caja

| Método | Endpoint | Notas |
|---|---|---|
| GET | `/caja/config?sucursale_id=&coin_id=` | Config + caja activa. |
| POST | `/caja/apertura_caja` | `{ caja_id, amount_initial }` (FormData). |
| POST | `/caja/cierre_caja` | `{ caja_sucursale_id, amount_pass, amount_finish }` (FormData). |
| POST | `/caja/report_caja?page=N` | Histórico. Body: filtros (sucursale_id, start_date, end_date, type_option, coin_id, n_proforma, search_client, client_segment_id, method_payment_id). |
| GET | `/caja/search_proformas/{client_id}?p=1&n_proforma=&state_payment=&coin_id=` | Ventas del cliente. |
| POST | `/caja/created_payment` | Crear pago adicional. |
| POST | `/caja/updated_payment/{id}` | Editar pago. |
| POST | `/caja/process_payment` | `{ proforma_id }` — procesa todos los pagos pendientes. |
| POST | `/caja/contract_process` | Lista pagos ya procesados. |
| GET | `/caja/ventas_pendientes_pago?p=1&n_proforma=&search_client=&coin_id=` | Ventas con deuda > 0. |
| POST | `/caja/fund-accounts/index` | Lista cuentas de fondos. |
| POST | `/caja/fund-accounts` | Crear cuenta. |
| POST | `/devolucion-proformas/index?page=N` | Devoluciones finalizadas (también usado desde caja). |
| POST | `/devolucion-purchases/index?page=N` | Idem compras. |
| POST | `/caja/process_devolucion` | `{ devolucion_id, fund_account_id, method_payment_id, banco_id, amount, state=2, description }`. |
| POST | `/caja/process_compra_devolucion` | Análogo para compras. |
| POST | `/caja/confirm_devolucion_process/{id}` | Confirmar movimiento. |
| POST | `/caja/anular_devolucion_process/{id}` | Anular movimiento. |
| POST | `/caja/confirm_compra_devolucion_process/{id}` | Análogo compras. |
| POST | `/caja/anular_compra_devolucion_process/{id}` | Análogo compras. |
| POST | `/caja/devolucion_process` | Lista movimientos de devoluciones ventas. |
| POST | `/caja/compra_devolucion_process` | Idem compras. |
| GET | `/devolucion-proformas/{id}` | Ver devolución venta. |
| GET | `/devolucion-purchases/{id}` | Ver devolución compra. |
| GET | `/caja/report_caja_day/{cajaSucursaleId}` | Resumen del día. |
| GET | `/excel/export-contract-processs?k=1{LINK}` | Excel "caja-exportada-{fecha}.xlsx". |
| GET | `/caja/resumen_historico_caja/{cajaSucursaleId}` | Datos para PDF histórico. |
| GET | `/pdf/caja-resumen/{cajaSucursaleId}` | PDF del resumen histórico. |

### 6.1 Ingresos

```
GET    /caja/ingresos?page=&caja_sucursale_id=
POST   /caja/ingresos
PUT    /caja/ingresos/{id}
DELETE /caja/ingresos/{id}
```

Body (POST/PUT, FormData):
```
caja_sucursale_id, income_categorie_id, description, amount, transaction_date
```

### 6.2 Egresos

Idéntico con `/caja/egresos` y `expense_categorie_id`.

---

## 7. Catálogos complementarios (no documentados exhaustivamente)

Estos son CRUDs estándar consumidos desde la sidebar del ERP. El backend debe exponerlos:

| Endpoint | Recurso |
|---|---|
| `/sucursales` | Sucursales |
| `/almacenes` | Almacenes |
| `/metodos_pago` | Métodos de pago |
| `/segmento_clientes` | Segmentos de cliente |
| `/tipo_documento` y `/tipo_documento_externo` | Tipos de comprobante |
| `/condicion_pago` | Condiciones de pago |
| `/categorias_productos` | Categorías de producto |
| `/categorias_servicios` | Categorías de servicio |
| `/categorias_egreso` | Categorías de egreso |
| `/categorias_ingreso` | Categorías de ingreso |
| `/proveedores` | Proveedores |
| `/entidades_contratantes` | Entidades contratantes |
| `/tipo_proveedor` | Tipos de proveedor |
| `/unidades` | Unidades de medida |
| `/monedas` | Monedas |
| `/clientes` | Clientes (CRUD) |
| `/productos` | Productos (CRUD) |
| `/servicios` | Servicios (CRUD) |
| `/roles` | Roles |
| `/usuarios` | Usuarios |
| `/auth/login` | Login → JWT |
| `/auth/me` | Usuario actual |
| `/auth/logout` | Logout |

> Las rutas exactas (`/clientes/{id}`, `/clientes/search?...`) pueden variar; **mantener consistencia** con los permisos del sidebar.

---

## 8. Productos / Batches (microservicio inventario)

> Estos sí están en el repo Java, en `inventario/`. Rutas expuestas vía gateway:

| Método | Endpoint | Notas |
|---|---|---|
| GET | `/api/product-batches?productId=&unitId=&warehouseId=` | Lista lotes. |
| GET | `/api/product-batches/{id}` | Lote individual. |
| POST | `/api/product-batches` | Crear. |
| PUT | `/api/product-batches/{id}` | Actualizar. |
| DELETE | `/api/product-batches/{id}` | Eliminar. |
| GET | `/api/product-batches/stock-dispatch?...` | Consulta stock. |
| POST | `/api/product-batches/dispatch` | Despachar (consumido por ventas). |
| POST | `/api/product-batches/ingreso` | Ingreso a stock. |
| POST | `/api/product-batches/proforma` | Registrar consumo desde proforma. |
| POST | `/api/product-batches/purchase` | Compra. |
| POST | `/api/product-batches/cpp-simulation` | Simular CPP. |
| POST | `/api/product-batches/price-suggest` | Sugerir precio. |

---

## 9. Movimientos (microservicio movimientos)

```
GET    /api/batch-movements
POST   /api/batch-movements
GET    /api/batch-movements/{id}
PUT    /api/batch-movements/{id}
DELETE /api/batch-movements/{id}
```

> Se usa para registrar el kardex de cada operación.

---

## 10. Payload completo (POST `/ventas` FormData)

```
proforma_type             = "1"
state_proforma            = "2"
is_gift                   = "1" | "2"
client_id                 = "<int>"
asesor_id                 = "<int>" | ""
document_type_id          = "4"  (RECIBO DE VENTA por default)
term_payment_id           = "2"  (CONTADO por default)
coin_id                   = "1"  (PEN por default)
sucursale_id              = "<int>"
sucursale_deliverie_id    = "<int>" | ""
date_documento            = "YYYY-MM-DD"
date_entrega              = "YYYY-MM-DD" | ""
address                   = "" | "<string>"
description               = "" | "<string>"

# Comprobante referencial (opcional, todo-o-nada)
external_document_type_id_referencial = "" | "<int>"
serie_comprobant_referencial          = "" | "<string>"
nro_comprobant_referencial            = "" | "<string>"

# Entrega (UBIGEO + encargado)
ubigeo_region            = "" | "<int>"
ubigeo_provincia         = "" | "<int>"
ubigeo_distrito          = "" | "<int>"
agencia                  = "" | "<string>"
full_name_encargado      = "" | "<string>"
documento_encargado      = "" | "<string>"
telefono_encargado       = "" | "<string>"

# Pago (sólo CONTADO)
method_payment_id        = "" | "<int>"
banco_id                 = "" | "<int>"
amount_payment           = "0" | "<decimal>"
payment_file             = <file> | ""

# Líneas
DETAIL_VENTA             = JSON.stringify([
  {
    "product_id":        "<int>",
    "unit_id":           "<int>",
    "warehouse_id":      "<int>",
    "description":       "<string>",
    "price_unit":        "<decimal>",
    "quantity":          "<decimal>",
    "discount":          "<decimal>",
    "importe_iva":       "<decimal>",
    "is_gift":           1 | 2,
    "batches":           [{"batch_id": "<int>", "quantity": "<decimal>"}]
  },
  ...
])

DETAIL_DEVOLUCION_BATCHES = JSON.stringify([...])  # opcional, alias usado en algunos formularios
```

> **Detalle**: el frontend usa MAYÚSCULAS con guiones bajos para las claves compuestas (convención). El backend puede recibir tal cual o normalizar (recomendado: aceptar ambas).

---

## 11. Errores comunes

| Código interno | Significado | Acción frontend |
|---|---|---|
| 200 | OK | toast success |
| 400 | Validación fallida | toast warning |
| 401 | No autenticado | redirigir login |
| 403 | Sin permiso | toast warning |
| 404 | No encontrado | toast warning |
| 422 | Stock insuficiente | toast warning (mostrar `resp.stock_warnings`) |
| 500+ | Error interno | toast error |

---

## 12. Notas de implementación

1. **JWT**: usar `Authorization: Bearer <token>`. Validar expiración server-side (en este repo el check de expiración está comentado en `AuthGuard` — defecto a corregir).
2. **CORS**: el frontend hace llamadas cross-origin (`http://localhost:4200` → `http://localhost:8000`). El backend debe permitir el origen.
3. **Rate limiting**: no implementado en el frontend; recomendable en backend.
4. **Idempotencia**: ningún endpoint usa `Idempotency-Key`. Riesgo de duplicación ante doble-click (defecto a corregir).
5. **Versión**: la URL no incluye `/v1/`. Esto es OK para una réplica inicial; en una segunda versión conviene versionar.

---

## 13. Próximo documento

- [`09-arquitectura-frontend.md`](./09-arquitectura-frontend.md) — arquitectura del frontend Angular.