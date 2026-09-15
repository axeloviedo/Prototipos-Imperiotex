# 02 — Modelo de Datos

> Documento de referencia para implementar la base de datos y los DTOs del backend.
> El modelo real está inferido a partir del código Angular del frontend (servicios, componentes, validadores) porque el backend comercial no está en este repositorio.

---

## 1. Diagrama entidad-relación (simplificado)

```
                  ┌──────────────┐         ┌──────────────┐
                  │   CLIENTE    │         │  CATEGORÍA   │
                  │  (client)    │         │  CLIENTE     │
                  └──────┬───────┘         └──────┬───────┘
                         │ 1                    * │
                         ├───────────────────────┤
                         │                       │
                         ▼ *                     ▼
                ┌────────────────────────────────────────────┐
                │                PROFORMA                   │
                │  (state_proforma, term_payment, coin, ...)│
                │  proforma_type ∈ {1=producto, 2=servicio} │
                └──┬───────────────────┬─────────────────┬──┘
                   │ *                 │ *               │ 0..1
        ┌──────────┘                   │                 └──────────────┐
        ▼                              ▼                                ▼
┌─────────────────┐         ┌────────────────────┐            ┌──────────────────┐
│ PROFORMA_DETAIL │         │       PAGO         │            │ PROFORMA_DELIVERY│
│ (línea de la    │         │ (proforma_id,      │            │ (sucursal, fecha,│
│  proforma)      │         │  method, banco,    │            │  dirección,      │
└────┬────────────┘         │  amount, voucher)  │            │  UBIGEO,         │
     │  *                    └────┬───────────────┘            │  encargado)      │
     │ 1                         │ 1                          └──────────────────┘
     ▼                           ▼
┌──────────────────┐    ┌───────────────────┐
│   PRODUCTO       │    │ METODO_PAGO       │
│   o SERVICIO     │    │ + BANCO (opcional)│
└──────────────────┘    └───────────────────┘

┌──────────────────┐         ┌───────────────────┐
│  PROFORMA_DETAIL │   1..*  │ PROFORMA_DETAIL_  │
│  (sale line)     │────────▶│    BATCH          │
└──────────────────┘         │ (batch_id, qty)   │
                              └─────────┬─────────┘
                                        │ *
                                        ▼
                                ┌───────────────┐
                                │ PRODUCT_BATCH │
                                └───────────────┘

┌──────────────────┐         ┌──────────────────────┐
│  DEVOLUCION      │  *─────▶│ DEVOLUCION_DETAIL    │
│  (state=1|2)     │  1     │ (tipo_devolucion)    │
└──────────────────┘         └──────────────────────┘

┌──────────────────┐         ┌──────────────────────┐
│  CAJA            │ 1───*   │ CAJA_SUCURSALE       │
│  (configuración) │         │ (instancia activa)   │
└──────────────────┘         └──────┬───────────────┘
                                    │ *
                  ┌─────────────────┼─────────────────────┐
                  ▼                 ▼                     ▼
            ┌──────────┐      ┌──────────┐          ┌──────────────┐
            │ INGRESO  │      │  EGRESO  │          │ MOVIMIENTO   │
            └──────────┘      └──────────┘          │ (proceso de  │
                                                    │  pago o dev) │
                                                    └──────────────┘

┌──────────────────┐
│  PRODUCTO        │  * ── * ┌──────────┐
│  (wallets[])     │◀────────│  WALLET  │
└──────────────────┘          │ (precios │
                              │ múltiples│
                              └──────────┘
```

---

## 2. Diccionario de entidades

> Convención: `id` siempre PK; `created_at`/`updated_at` en todas las tablas; FKs explícitos; soft-delete **no** implementado (se elimina físicamente).

### 2.1 `client`

```
id                  BIGINT PK
n_document          VARCHAR   documento (RUC, DNI, etc.)
type_document       VARCHAR   'DNI'|'RUC'|'CE'|...
full_name           VARCHAR
phone               VARCHAR
email               VARCHAR NULL
address             VARCHAR NULL
client_segment_id   BIGINT FK → client_segment
state               TINYINT  default 1 (activo)
created_at, updated_at
```

### 2.2 `client_segment`

```
id           BIGINT PK
name         VARCHAR
description  VARCHAR NULL
state        TINYINT
```

### 2.3 `coin` (moneda)

```
id           BIGINT PK
code         VARCHAR  'PEN', 'USD', ...
name         VARCHAR  'SOLES', 'DOLARES', ...
symbol       VARCHAR  'S/', '$', ...
state        TINYINT
```

### 2.4 `sucursale` (sucursal)

```
id           BIGINT PK
name         VARCHAR
address      VARCHAR
ubigeo_***   VARCHAR
state        TINYINT
```

### 2.5 `sucursale_deliverie` (lugar de entrega)

```
id           BIGINT PK
name         VARCHAR
description  VARCHAR NULL
state        TINYINT
```

### 2.6 `product` (producto del catálogo)

```
id                  BIGINT PK
title               VARCHAR
sku                 VARCHAR NULL
model               VARCHAR NULL
description         TEXT NULL
price_general       DECIMAL(12,2)  precio base en moneda principal
price_purchase_pen  DECIMAL(12,2)
price_purchase_usd  DECIMAL(12,2)
importe_iva         DECIMAL(5,2)   porcentaje
min_discount        DECIMAL(5,2)
max_discount        DECIMAL(5,2)
is_discount         TINYINT        1 = permite descuento, 0 = no
disponibilidad      TINYINT        1=siempre, 2=bloquea sin stock, 3=consulta server
tax_selected        TINYINT        1=Libre, 2=Gravado, 3=Exonerado
product_categorie_id BIGINT FK
state               TINYINT
image_url           VARCHAR NULL
```

Relaciones:
- `units[]` (unidades de medida; ej: unidad, caja, kg)
- `warehouses[]` (stock por almacén; no confundir con la entidad `warehouse`)
- `wallets[]` (precios múltiples, ver §2.13)

### 2.7 `service` (servicio del catálogo)

Mismas columnas que `product` excepto que no tiene `warehouses` ni `disponibilidad`. Tiene `service_categorie_id` en lugar de `product_categorie_id`.

### 2.8 `warehouse` (almacén)

```
id           BIGINT PK
name         VARCHAR
address      VARCHAR
sucursale_id BIGINT FK
state        TINYINT
```

> El stock por (producto, almacén) no está modelado explícitamente aquí. Se infiere por los endpoints `/ventas/search-products` y `/product-batches`. En una réplica, usar una entidad `stock(product_id, warehouse_id, quantity)`.

### 2.9 `product_batch` (lote)

```
id              BIGINT PK
product_id      BIGINT FK
warehouse_id    BIGINT FK
code            VARCHAR        código del lote
quantity        DECIMAL(12,2)
quantity_used   DECIMAL(12,2)
expiration_date DATE
state           TINYINT
```

### 2.10 `proforma` (cabecera unificada)

```
id                       BIGINT PK
proforma_type            TINYINT    1=producto, 2=servicio
state_proforma           TINYINT    1=cotización, 2=venta
state_payment            TINYINT    2=Parcial, 3=Pagado, default=Crédito
is_gift                  TINYINT    1=normal, 2=regalo (precio forzado a 0)
description              VARCHAR    nota/glosa
date_documento           DATE       fecha de emisión
date_entrega             DATE NULL  fecha comprometida de entrega
subtotal                 DECIMAL(12,2)
total                    DECIMAL(12,2)
igv                      DECIMAL(12,2)
debt                     DECIMAL(12,2)  saldo pendiente
paid_out                 DECIMAL(12,2)  total cobrado
external_document_type_id BIGINT FK NULL
document_referencial     VARCHAR NULL
external_document_type_id_referencial BIGINT FK NULL   -- redundante mantener
serie_comprobant_referencial VARCHAR NULL
nro_comprobant_referencial   VARCHAR NULL
document_type_id         BIGINT FK   tipo de comprobante interno
term_payment_id          BIGINT FK   2=CONTADO, otros=CRÉDITO
coin_id                  BIGINT FK
client_id                BIGINT FK
asesor_id                BIGINT FK NULL  vendedor
sucursale_id             BIGINT FK
sucursale_deliverie_id   BIGINT FK NULL  lugar de entrega
user_id                  BIGINT FK       quien registró
created_at, updated_at
deleted_at               TIMESTAMP NULL  (opcional, recomendado)
```

### 2.11 `proforma_detail` (líneas)

```
id                       BIGINT PK
proforma_id              BIGINT FK
product_id               BIGINT FK NULL  (para productos)
service_id               BIGINT FK NULL  (para servicios)
unit_id                  BIGINT FK NULL  (no aplica a servicios)
warehouse_id             BIGINT FK NULL  (no aplica a servicios)
quantity                 DECIMAL(12,2)
price_unit               DECIMAL(12,2)  precio unitario
discount                 DECIMAL(12,2)  descuento (monto, no porcentaje)
subtotal                 DECIMAL(12,2)
impuesto                 DECIMAL(12,2)
total                    DECIMAL(12,2)
description              VARCHAR NULL
product_descripcion_personalized VARCHAR NULL  (sólo servicios)
is_gift                  TINYINT
```

> **Mutuamente excluyentes**: `product_id XOR service_id` (uno u otro, nunca ambos).

### 2.12 `proforma_detail_batch` (asignación de lotes a la línea)

```
id                       BIGINT PK
proforma_detail_id       BIGINT FK
product_batch_id         BIGINT FK
quantity                 DECIMAL(12,2)
```

Sólo aplica cuando `proforma_type = 1` (productos) y se activó selección de lotes.

### 2.13 `wallet` (lista de precios múltiples)

```
id                       BIGINT PK
product_id | service_id  BIGINT FK   (uno u otro)
unit_id                  BIGINT FK
sucursale_id             BIGINT FK NULL
client_segment_id        BIGINT FK NULL
coin_id                  BIGINT FK NULL  NULL = todas las monedas
coin_price_multiple      DECIMAL(12,2)  precio específico
price_general            DECIMAL(12,2)  precio base
```

Reglas:
- Si hay match exacto `(unit + sucursale + segment + coin)` se usa `coin_price_multiple`.
- Si no, se busca por `(unit + sucursale + segment)`, después `(unit + sucursale)`, después `(unit + segment)`, después `(unit)`.
- Fallback: `product.price_general` (sólo si la moneda destino es la principal).

### 2.14 `proforma_payment` (pagos)

```
id                       BIGINT PK
proforma_id              BIGINT FK
method_payment_id        BIGINT FK
banco_id                 BIGINT FK NULL
amount                   DECIMAL(12,2)
date_payment             DATE
n_transaccion            VARCHAR NULL  (obligatorio si método ≠ EFECTIVO)
payment_file             VARCHAR NULL  URL del voucher (imagen)
verification             TINYINT  1=no procesado en caja, 2=procesado
date_validation          TIMESTAMP NULL
```

### 2.15 `method_payment`

```
id                       BIGINT PK
name                     VARCHAR  ('EFECTIVO','TRANSFERENCIA',...)
coin_id                  BIGINT FK   moneda del método (opcional)
description              VARCHAR NULL
state                    TINYINT
```

Relación: `bancos[]` (bancos aceptados por el método).

### 2.16 `banco`

```
id                       BIGINT PK
name                     VARCHAR
state                    TINYINT
```

### 2.17 `bank_account` (cuenta de fondos en caja)

```
id                       BIGINT PK
name                     VARCHAR
coin_id                  BIGINT FK
description              VARCHAR NULL
state                    TINYINT
```

### 2.18 `term_payment`

```
id                       BIGINT PK
name                     VARCHAR  ('CONTADO','CRÉDITO 30', ...)
state                    TINYINT
```

> `id == 2` se considera **CONTADO** en el frontend (ver `01-vision-general.md`).

### 2.19 `document_type` (tipo de comprobante interno)

```
id                       BIGINT PK
name                     VARCHAR  ('RECIBO DE VENTA','FACTURA',...)
state                    TINYINT
```

> Default en ventas: `'4' = RECIBO DE VENTA'`.

### 2.20 `external_document_type` (tipo de comprobante del cliente)

```
id                       BIGINT PK
name                     VARCHAR
state                    TINYINT
```

### 2.21 `proforma_deliverie` (entrega)

```
id                       BIGINT PK
proforma_id              BIGINT FK
sucursale_deliverie_id   BIGINT FK
date_entrega             DATE
address                  VARCHAR NULL
ubigeo_region            VARCHAR NULL
ubigeo_provincia         VARCHAR NULL
ubigeo_distrito          VARCHAR NULL
agencia                  VARCHAR NULL  (courier)
full_name_encargado      VARCHAR NULL
documento_encargado      VARCHAR NULL
telefono_encargado       VARCHAR NULL
```

> Validación: si el lugar de entrega **incluye** el nombre de la sucursal del usuario, los campos `agencia`, `full_name_encargado`, `documento_encargado`, `telefono_encargado` se ocultan/son opcionales. Si NO incluye, son obligatorios.

### 2.22 `devolucion` (devolución)

```
id                       BIGINT PK
proforma_id              BIGINT FK
state_devolucion         TINYINT  1=Pendiente, 2=Finalizada
external_document_type_id BIGINT FK NULL
type_comprobant          VARCHAR NULL
n_comprobant             VARCHAR NULL
cod_comprobant           VARCHAR NULL  serie+número concatenado
descuento                DECIMAL(12,2)
subtotal                 DECIMAL(12,2)
igv                      DECIMAL(12,2)
total                    DECIMAL(12,2)
detalle                  VARCHAR NULL  nota
payment_file             VARCHAR NULL  imagen voucher/devolución
user_id                  BIGINT FK
created_at, updated_at
```

### 2.23 `devolucion_detail` (líneas devueltas)

```
id                       BIGINT PK
devolucion_id            BIGINT FK
product_id               BIGINT FK
unit_id                  BIGINT FK
warehouse_id             BIGINT FK
quantity                 DECIMAL(12,2)
price_unit               DECIMAL(12,2)
subtotal                 DECIMAL(12,2)
impuesto                 DECIMAL(12,2)
total                    DECIMAL(12,2)
description              VARCHAR NULL
tipo_devolucion          TINYINT  1=Normal, 2=Mal estado, 3=Cambio
```

### 2.24 `caja` (caja registradora — config)

```
id                       BIGINT PK
sucursale_id             BIGINT FK
coin_id                  BIGINT FK
name                     VARCHAR
state                    TINYINT
```

### 2.25 `caja_sucursale` (apertura activa)

```
id                       BIGINT PK
caja_id                  BIGINT FK
sucursale_id             BIGINT FK
coin_id                  BIGINT FK
user_id                  BIGINT FK
amount_initial           DECIMAL(12,2)
amount_finish            DECIMAL(12,2) NULL  (lo que reporta el cajero al cierre)
efectivo_finish          DECIMAL(12,2) NULL
created_at, updated_at
state                    TINYINT  1=abierta, 2=cerrada
```

> Una sola caja abierta por `(sucursale_id, coin_id)`.

### 2.26 `caja_ingreso` (ingreso manual)

```
id                       BIGINT PK
caja_sucursale_id        BIGINT FK
income_categorie_id      BIGINT FK
description              VARCHAR  (≥ 5 chars)
amount                   DECIMAL(12,2)
transaction_date         DATE (≤ hoy)
user_id                  BIGINT FK
created_at, updated_at
```

### 2.27 `caja_egreso` (egreso manual)

```
id                       BIGINT PK
caja_sucursale_id        BIGINT FK
expense_categorie_id     BIGINT FK
description              VARCHAR
amount                   DECIMAL(12,2)
transaction_date         DATE (≤ hoy)
user_id                  BIGINT FK
created_at, updated_at
```

### 2.28 `caja_movement` (movimiento de caja — ventas/devoluciones)

```
id                       BIGINT PK
caja_sucursale_id        BIGINT FK
fund_account_id          BIGINT FK NULL
method_payment_id        BIGINT FK
banco_id                 BIGINT FK NULL
amount                   DECIMAL(12,2)
state                    TINYINT  1=Pendiente, 2=Procesado
type                     TINYINT  1=Venta, 2=Ingreso, 3=Egreso
description              VARCHAR
referencia_id            BIGINT NULL  (proforma_id o devolucion_id)
referencia_tipo          VARCHAR NULL ('proforma'|'devolucion')
user_id                  BIGINT FK
created_at, updated_at
```

### 2.29 `caja_process_payment` (procesamiento de pagos pendientes)

> No modelado explícitamente; se infiere como un endpoint que toma una proforma y procesa sus pagos en estado `verification=1`, marcando los correspondientes `caja_movement`. En una réplica, modelar como tabla de auditoría opcional.

### 2.30 `income_categorie` y `expense_categorie`

```
id           BIGINT PK
name         VARCHAR
state        TINYINT
```

### 2.31 `asesor` (vendedor)

```
id                       BIGINT PK
user_id                  BIGINT FK NULL
full_name                VARCHAR
state                    TINYINT
```

> Puede ser un usuario del sistema o un vendedor externo.

### 2.32 `user`, `role`, `permission`, `role_permission`

Modelo estándar:
- `user(id, name, email, password_hash, role_id, state, ...)`
- `role(id, name, description)`
- `role_permission(role_id, permission_id)`
- `permission(id, code, name, description)` — `code` es el string que viaja en el JWT.

### 2.33 Tablas de soporte

- `transport` — transportistas (para entregas).
- `purchase`, `purchase_detail`, `purchase_devolucion`, etc. — fuera del alcance de este documento (módulo de compras).
- `kardex` — historial de movimientos de stock (consumido por el módulo de inventario).

---

## 3. Reglas de integridad (a nivel base de datos)

| Regla | Cómo se implementa |
|---|---|
| `proforma.proforma_type = 1` ⇒ `proforma_detail.product_id` obligatorio y `service_id` NULL | `CHECK` o validación en trigger. |
| `proforma.proforma_type = 2` ⇒ `proforma_detail.service_id` obligatorio y `product_id` NULL | Idem. |
| `proforma_detail.quantity > 0` | `CHECK`. |
| `proforma_detail.price_unit >= 0` y `discount >= 0` | `CHECK`. |
| `proforma.total = subtotal + igv` | Trigger o calculo en backend. |
| `proforma.debt = total - paid_out` (sólo ventas) | Trigger o calculo. |
| `proforma_payment.amount > 0` | `CHECK`. |
| Una `caja_sucursale` activa por `(sucursale_id, coin_id)` | Índice único parcial `WHERE state = 1`. |
| `devolucion_detail.quantity ≤ cantidad vendida original del mismo (product, unit)` | Validación de aplicación. |
| `caja_ingreso/egreso.amount > 0` y `transaction_date ≤ today` | `CHECK`. |

---

## 4. Reglas de estado (máquinas de estado)

### 4.1 Proforma
- `state_proforma`: 1 (Cotización) → 2 (Venta) vía acción "Convertir".
- `state_payment`: se calcula automáticamente según pagos:
  - sin pagos ⇒ `Crédito` (default)
  - `0 < paid_out < total` ⇒ `Parcial` (2)
  - `paid_out == total` ⇒ `Pagado` (3)
- `is_gift`: 1 normal, 2 regalo (precio forzado a 0 en líneas).

### 4.2 Devolución
- `state_devolucion`: 1 (Pendiente) → 2 (Finalizada). Sólo las pendientes son editables.

### 4.3 Pago
- `verification`: 1 (no procesado) → 2 (procesado en caja).
- `date_validation`: se setea cuando el supervisor valida en caja.

### 4.4 Caja
- Apertura → activa (`caja_sucursale.state = 1`).
- Cierre → inactiva (`state = 2`, `amount_finish` y `efectivo_finish` capturados).

### 4.5 Movimiento de caja
- `state`: 1 (Pendiente) → 2 (Procesado). El "procesar" puede hacerse vía `process_payment`, `process_devolucion`, etc.

---

## 5. Vistas/consultas útiles (referencia para reportes)

- **Proformas pendientes de pago** (`/caja/ventas_pendientes_pago`):
  ```sql
  SELECT p.* FROM proforma p
  WHERE p.state_proforma = 2
    AND p.debt > 0
    AND p.coin_id = :coin_id
    AND (:n_proforma IS NULL OR p.id LIKE :n_proforma)
    AND (:search_client IS NULL OR c.full_name LIKE :search_client);
  ```

- **Resumen diario de caja**:
  ```sql
  SELECT m.method_payment_id, mp.name, SUM(m.amount) AS total
  FROM caja_movement m
  JOIN method_payment mp ON mp.id = m.method_payment_id
  WHERE m.caja_sucursale_id = :id
    AND m.state = 2
  GROUP BY m.method_payment_id, mp.name;
  ```

- **Stock disponible por producto/almacén**:
  ```sql
  SELECT w.warehouse_id, w.name,
         COALESCE(SUM(pb.quantity - pb.quantity_used), 0) AS available
  FROM product p
  LEFT JOIN product_batch pb ON pb.product_id = p.id
  LEFT JOIN warehouse w ON w.id = pb.warehouse_id
  WHERE p.id = :product_id
  GROUP BY w.warehouse_id, w.name;
  ```

---

## 6. Modelo alternativo simplificado (recomendado para réplica)

Si vas a implementar desde cero y buscas **simplicidad funcional**:

1. **Una tabla `proforma`** con `proforma_type` (producto|servicio) y `state_proforma` (cotización|venta). No partas en cuatro tablas.
2. **Una tabla `proforma_detail`** con `item_type` (producto|servicio) y FKs condicionales (`product_id` o `service_id`).
3. **Una tabla `wallet`** con `entity_type` ('product'|'service') y FK condicional.
4. **Una tabla `devolucion`** ligada a `proforma_id`; las líneas sólo de productos.
5. **Una tabla `caja_sucursale`** (apertura activa) + `caja_movement` (cualquier movimiento: venta/ingreso/egreso/devolución).
6. **No separar** `caja_ingreso` y `caja_egreso` si `caja_movement.type` ya lo distingue.

Ver `10-mejoras-y-defectos.md` para más detalles.

---

## 7. Próximos pasos

- Flujo de ventas de productos → [`03-flujo-ventas-productos.md`](./03-flujo-ventas-productos.md)
- Contratos REST → [`08-contratos-api.md`](./08-contratos-api.md)