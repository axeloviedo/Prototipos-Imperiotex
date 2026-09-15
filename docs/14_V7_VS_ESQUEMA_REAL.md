# 14 · Decisiones V7 → esquema real de `logistica_db` (brechas)

> Punto de partida para **desarrollar el modelo de datos de logística** (sin capa contable).
> Compara las decisiones V7 (docs 00–13) contra el esquema real del backend
> `imperiotex-GestionLogistica` (migraciones V1–V10 y V12, rama `feat/modelo-datos-v7`).
> Fecha: 2026-09-10.

---

## 0. Estado y reglas de partida

- **No partimos de cero.** `logistica_db` ya tiene ~35 tablas probadas (kardex, promedio ponderado, solicitud de pedido, BOM, compras). El trabajo es **evolucionarlo con migraciones nuevas (V13+)**.
- **Rama del hito:** `feat/modelo-datos-v7` (sale de `develop`, sin mergear):
  - `3c754bb` V10 — maestro de artículos (conversiones globales de UM, flags inventariable/se vende/se compra).
  - `35049b9` V12 — lotes.
  - `05f7935` la antigua V11 (cuentas por grupo) apartada en `docs/fase-2/` → Fase 2, se rehace sobre Clase de Valoración.
  - `22dcfbc` borrador V7 de `ms-logistica.md` · `c1291d6` V12 rehecha sin `batch_movement`.
  - `a053123` el V°B° avisa en vez de bloquear (M8) · `ff3a035` V13 códigos `CAT-####`/`SUB-####` (M9).
  - `e179e10` V14 LDM por artículo (+ V901 reescrita).
- **Reglas del repo que mandan** (`AGENTS.md`/ARNÉS): multiempresa por `id_company` (§5.5), sin FK entre esquemas (§6.1), migraciones solo hacia delante (§6.2), y **no se crea tabla que no esté descrita en `ms-logistica.md`** (§12.1).

### Decisiones tomadas hoy (ver `00_DECISIONES_CERRADAS.md` §I)
| # | Decisión |
|---|---|
| I1 | **Movimientos: se mantiene `stock_movement` unificado** (revisa T2). Se le suma trazabilidad de origen (tipo de objeto aplazado; tipo de operación SUNAT → Fase 2). |
| I2 | **Fronteras:** almacenes → `config_db.warehouse` (configuraciones); proveedores → `config_db.partner` + rol propio en logística (D5). |
| I3 | V10 y V12 en la rama del hito; V11 apartada a Fase 2. |
| I4 | **Recursos viven en Producción.** La LDM guarda solo `id_resource` (referencia lógica). |

---

## 1. Resumen por bloque

| Bloque | Tabla(s) real(es) | Cubre V7 | Brecha principal |
|---|---|---|---|
| Maestro de artículos | `article`, `article_group`, `category`, `subcategory`, `uom`, `uom_conversion`, atributos, barras, `article_min_stock` | ✅ casi todo | ~~`subcategory` sin código~~ (V13 ✅); sin stock máximo; Clase de Valoración salió en V10 (vuelve en Fase 2) |
| Solicitud de Pedido | `manufacturing_request` (+línea, +aprobación) | ◐ | **Cuelga de UN modelo**; faltan almacén destino (H1), tipo de fabricación y LDM por línea (E3/F4), requerimientos por artículo (H3) |
| LDM | `article_bom` (+línea, +excepción por talla) | ◐ | **Cuelga del modelo**; faltan Tipo de línea (C1), recurso (C2), texto, método de emisión (C4). El almacén por línea **ya existe** |
| Inventario | `stock_movement` (+línea), `movement_subtype`, `stock`, `kardex_entry` | ◐ | **Sin Comprometido** (T1/T7); sin tipo de objeto (aplazado); tipo de operación SUNAT → Fase 2; transferencia sin estado "en tránsito" |
| Lotes | `batch`, `batch_movement` (V12) | ⚠️ | `batch_movement` **duplica** el lote que ya llevan `stock`/`stock_movement_line` |
| Solicitud de Materiales | `material_request` (+línea) | ◐ | el propósito pasa de la cabecera a la línea, vacío hasta que Logística aprueba (G1); `PRODUCCION` y almacén en la línea ya resueltos en V18 |
| Orden de Compra | `purchase_order` (+línea) | ◐ | doble validación ✅; faltan moneda/TC, importación, condición de pago |
| Orden de Pedido de Fabricación | `production_order` (V5) | ✅ | coherente con F2/E2 (1 SP → 1 orden; la ejecución es de Producción) |

---

## 2. Brechas en detalle

### 2.1 Maestro de artículos
- ✅ Artículo = SKU; color y talla como atributos contra catálogo; grupo/categoría/subcategoría; UM de inventario/venta/compra; flags (V10); control NADA/LOTE/SERIE; vencimiento (V12); precios; proveedor habitual (ref. lógica a `partner`); afectación IGV; mínimo por almacén.
- ✅ ~~`subcategory` **sin `code`**~~ → V13: `SUB-####` y `CAT-####` correlativos por empresa (M9).
- ➕ Stock **máximo** por almacén (el Excel lo pide junto al mínimo): columna en `article_min_stock` o tabla hermana.
- ➕ Almacén por defecto del artículo (Excel) — opcional.
- 📝 Clase de Valoración: la V3 original la tenía en `category` (con copia en el artículo), **igual que la jerarquía del usuario** (categoría → CV). V10 la quitó. En Fase 2 vuelve con ese mismo diseño.

### 2.2 Solicitud de Pedido (`manufacturing_request`)
- ⚠️ **Cuelga de UN modelo** (`id_article_model NOT NULL`, FK compuesta que obliga a que cada línea sea un SKU de ese modelo). En V7 el detalle admite artículos de **cualquier** modelo → decisión **M2**.
- ➕ **Almacén destino** en cabecera (H1): `id_warehouse_target` (ref. lógica a `config_db.warehouse`).
- ➕ Por línea: **tipo de fabricación** (`ESTANDAR`/`ESPECIAL`) y **LDM elegida** (`id_article_bom`, solo si Especial) — E3/F4.
- ➕ **Requerimientos por artículo** (H3): tabla nueva `manufacturing_request_requirement` (línea de la SP × material): material o recurso, cantidad, **almacén origen**, método de emisión, origen `LDM|MANUAL`. Es el dato atómico: la SOL es su suma y la OP su filtro.
- ✅ Estados, rastro de aprobaciones (`manufacturing_request_approval`, con huella de líneas que invalida el V°B° si el detalle cambia — equivale al aviso T8), bloqueo optimista.

### 2.3 LDM (`article_bom` / `article_bom_line` / `article_bom_line_size`)
- ⚠️ **Cuelga del modelo**, con excepciones de consumo por talla. En V7 la LDM es por **artículo** ("Producto final" = un SKU) → decisión **M1**.
- ✅ Alternativas (A/B…) con una **predeterminada** garantizada por índice; **almacén por línea ya existe** (`id_warehouse`, C4).
- ➕ `line_type ENUM('ARTICULO','RECURSO','TEXTO')` (C1).
- ➕ `id_resource` (ref. lógica a Producción, I4) y `text_line`; `id_article` pasa a opcional (y el `UNIQUE (bom, article)` hay que ajustarlo para permitir recursos/textos).
- ➕ `issue_method ENUM('NOTIFICACION','MANUAL')` (C4).
- 📝 Multinivel: V7 usa intermedios (crudo → lavado → acabado) como componentes con su propia LDM. El diseño por modelo lo admite si los intermedios tienen modelo; a validar en M1.

### 2.4 Inventario (`stock_movement`, `stock`, `kardex_entry`)
- ✅ Kardex = libro mayor append-only, `stock` = su saldo; promedio ponderado; `affects_avg_cost` como dato del subtipo; saldo por (artículo, almacén, lote, serie) — **esto ya es el "Saldo x Lote" del Excel**.
- ⚠️ **No existe Comprometido** — solo `stock.quantity` (= Actual). T1/T7 lo necesitan → decisión **M3**.
- 📝 **Pedido** (mercadería en camino) puede **derivarse** (OC pendientes de recibir + transferencias en tránsito) sin guardarlo → decisión **M4**.
- 📝 **Tipo de operación SUNAT** (la hoja *Motivo de Traslado* es la *Tabla 12*): `sunat_reason_code` en `movement_subtype` → **Fase 2**, con Contabilidad (M10).
- 📝 **Tipo de objeto** del movimiento (59 entrada / 60 salida / 67 transferencia) → catálogo `object_type`, **aplazado** hasta que algo lo lea (M6 matizado).
- 📝 **Trazabilidad:** el backend usa **FK explícitas** (`id_purchase_order`, `id_manufacturing_request`, `id_production_order`) a propósito, para tener integridad real. Recomendación: **híbrido** — se mantienen esas FK y se añade `object_type` + referencia de línea base solo donde haga falta.
- ⚠️ **Transferencia en un paso** (`BORRADOR→CONFIRMADO`, origen y destino a la vez). El prototipo tiene *Aprobada / En tránsito / Recibida parcial* con reserva en origen → falta el estado intermedio (a decidir con M3).

### 2.5 Lotes (V12)
- ✅ `batch` (número, ingreso, **vencimiento**) — útil, faltaba.
- ⚠️ `batch_movement` **duplica** lo que ya hacen `stock_movement_line.lot_code` + `stock` (grano con lote). Dos fuentes de la verdad del lote pueden divergir → decisión **M5**. Como la V12 **no está mergeada ni aplicada fuera de local**, se puede rehacer dentro de la rama sin romper nada.

### 2.6 Solicitud de Materiales y Orden de Compra
- ➕ Propósito: `PRODUCCION` ya salió (V18). Ahora el propósito pasa de `material_request` a `material_request_line` (`COMPRA`/`TRANSFERENCIA`), **vacío hasta que Logística aprueba** (G1). Migración pendiente.
- ➕ `material_request_line`: agregar **almacén origen** y cambiar el `UNIQUE (request, article)` por `(request, article, warehouse_source)`, porque la SOL consolidada (H5) puede pedir el mismo material desde dos orígenes.
- ✅ La SOL guarda su SP de origen (`id_manufacturing_request`) y la OC su SOL: la trazabilidad de V7 ya está.
- ➕ OC: moneda, tipo de cambio congelado, nacional/importación, condición de pago → ver M7.

### 2.7 Fuera de `logistica_db` (fronteras, I2/I4)
| Tema V7 | Dónde va | Acción |
|---|---|---|
| Almacenes (B1–B7: descripción, en tránsito, Kardex valorizado, permisos por rol) | `config_db.warehouse` | Proponer al equipo de configuraciones. Hoy "no valoriza" es la propiedad `logistica.inventory.non-valuing-warehouses`; ya tienen tipo `PRINCIPAL/TRANSITO/DEVOLUCIONES/OTRO`. |
| Proveedores (T6: moneda, condición de pago, retención, detracción, bancos, contactos) | `config_db.partner` + `contabilidad_db.creditor` | En logística solo un **rol** (`id_partner` + datos de compra: grupo de proveedor, nacional/internacional…). |
| Recursos (mano de obra, máquina) | `produccion_db` | La LDM guarda `id_resource` lógico. |
| Orden de Fabricación y su ejecución (emisión, recibo, cierre) | `produccion_db` | Ya decidido (F2). |

### 2.8 Lo de CO que el backend todavía no tiene
Facturas de compra, reclamos, notas de crédito, costos de destino, sugerido de compras. Parte es de Contabilidad (Fase 2) y parte de Compras → decisión **M7**.

---

## 3. Decisiones M1–M7 (resueltas 2026-09-10)

| # | Decisión | Resolución |
|---|---|---|
| **M1** | LDM por modelo o por artículo | **Por ARTÍCULO.** Ya no existe "modelo" ni "plantilla": todo es por artículo (SKU), como en el prototipo. Se retira `article_model`; la excepción por talla (`article_bom_line_size`) sobra, porque cada SKU ya tiene su talla y su propia LDM. |
| **M2** | SP de un modelo o mixta | **Mixta**: la Solicitud de Pedido admite cualquier artículo. Al final **explota en varias Órdenes de Producción** (una por artículo, en Producción — H6). |
| **M3** | Dónde vive el Comprometido | En una tabla **Resumen x Artículo** (artículo × almacén), tal como `Tablas.xlsx`: Actual, Comprometido, Pedido, Mín, Máx, Costo promedio. |
| **M4** | ¿Pedido guardado o calculado? | **Guardado en el Resumen x Artículo** (consecuencia de M3 y del Excel). Lo mantienen los documentos según la matriz *Stock Comprometido y Pedido*. |
| **M5** | `batch_movement` (V12) | *Por defecto:* rehacer la V12 en la rama — queda `batch` (maestro con vencimiento), sale `batch_movement` (duplicaba `stock`). |
| **M6** | Tipo de objeto | *Por defecto:* híbrido — se mantienen las FK explícitas y se agrega el catálogo `object_type`. |
| **M7** | CO avanzado ahora | *Por defecto:* solo moneda, tipo de cambio e importación en la OC. Facturas, NC, reclamos y costos de destino → más adelante (Contabilidad/Fase 2). |

> M5–M7 quedan con la opción recomendada salvo que se indique lo contrario.

**Segunda ronda (2026-09-10):**

| # | Decisión | Resolución |
|---|---|---|
| **M8** | V°B° de Logística con MP sin cubrir | **Avisa, no bloquea** (como el V7). La cobertura trae `warning`; la auditoría del V°B° guarda qué faltaba. Solo corta la falta de LDM. Sale `MATERIALS-NOT-COVERED`. **Hecho** (commit `a053123`). |
| **M9** | Códigos de categoría/subcategoría | **Correlativo por empresa** `CAT-0001` / `SUB-0001`. **Hecho** en la V13 (commit `ff3a035`). |
| **M10** | Tipo de operación SUNAT (Tabla 12) | **Fase 2**, con Contabilidad. |
| **M11** | Cómo se valida | **BD local de descarte + unitarios** (sin Docker). |

> **M6 matizado:** el catálogo `object_type` no tiene todavía quién lo lea (las FK explícitas ya
> dicen de dónde viene cada cosa), así que **no entra en la V13**. Se crea cuando lo necesite una
> referencia de origen genérica.

### ¿Y quién explica el Comprometido? (sin tabla de reservas)
Como en SAP B1: el Resumen guarda **los números** y los **documentos** guardan **el porqué**. Los requerimientos de la SP aprobada (tabla nueva, H3) dicen qué solicitud comprometió cuánto de cada material y en qué almacén; las líneas de OC dicen qué está pedido. Así no hace falta una tabla de reservas aparte.

---

## 4. Modelo objetivo (solo lo que cambia)

### 4.1 Artículo (sin modelo)
- `article`: **sale** `id_article_model` (y su `UNIQUE (id_article, id_article_model)`). **Entra** `id_brand` opcional (la marca pasa del modelo al artículo; ej. IMPERIOTEX tiene SARA BQ y SARA DENIM).
- **Se elimina** `article_model`. `brand` se queda como catálogo por empresa.
- `category.code`: pasa a correlativo `CAT-####` por empresa. `subcategory`: **entran** `id_company` y `code` (`SUB-####`), con FK compuesta (empresa, categoría). **Hecho (V13).**

### 4.2 LDM por artículo
**`article_bom`**: `id_article` (producto final, reemplaza `id_article_model`) · `code` · `name` · `base_quantity` (cantidad que produce, default 1) · `alternative` · `is_default` (una sola por artículo) · `status`. (El `is_subcontracted` existente sobra: la tercerización se decide en la OF de Producción, J3.)

**`article_bom_line`**:

| Columna | Nota |
|---|---|
| `line_number` | orden de la línea; `UNIQUE (id_article_bom, line_number)` |
| `line_type` | `ARTICULO` · `RECURSO` · `TEXTO` (C1) |
| `id_article` | solo si ARTICULO |
| `id_resource` | solo si RECURSO — referencia lógica a Producción (I4) |
| `text_line` | solo si TEXTO |
| `quantity_per_unit` | NULL en TEXTO |
| `id_warehouse` | almacén origen por defecto (ya existía); NULL en TEXTO |
| `issue_method` | `NOTIFICACION` · `MANUAL` (C4) |

**Se elimina** `article_bom_line_size`.

### 4.3 Solicitud de Pedido mixta
- `manufacturing_request`: **sale** `id_article_model`; **entra** `id_warehouse_target` (almacén destino, H1; referencia lógica).
- `manufacturing_request_line`: **sale** `id_article_model`; **entran** `manufacturing_type` (`ESTANDAR`/`ESPECIAL`) e `id_article_bom` (la LDM usada: la predeterminada en Estándar, la elegida en Especial).
- **Nueva `manufacturing_request_requirement`** (H3, el dato atómico): `id_manufacturing_request_line` · `line_type` (`ARTICULO`/`RECURSO`) · `id_article` o `id_resource` · `unit_quantity` · `required_quantity` · `id_warehouse_source` · `issue_method` · `origin` (`LDM`/`MANUAL`). Es la base de la SOL (suma), del Comprometido al aprobar (T7) y de cada OP (filtro por artículo).
- `production_order` (Orden de Pedido): **sale** `id_article_model`. Sigue siendo **una por solicitud** (es el documento que se entrega a Producción); la explosión en N órdenes de producción, una por artículo, la hace Producción (H6).

### 4.4 Resumen x Artículo (nueva) — `article_warehouse_summary`
PK `(id_article, id_warehouse)` + `id_company`:

| Columna | Qué es | Lo mueve |
|---|---|---|
| `on_hand` | Stock Actual (= suma de `stock` de todos sus lotes) | confirmar movimientos |
| `committed` | Stock Comprometido | + al aprobar la SP (T7) y al aprobar una transferencia en origen; − al consumir, recibir o cancelar |
| `on_order` | Stock Pedido (en camino) | + OC validada y transferencia aprobada en destino; − al recibir o cancelar |
| `min_quantity` / `max_quantity` | Mínimo y máximo | maestro (**reemplaza `article_min_stock`**, que se migra y se elimina) |
| `avg_cost` | Costo promedio vigente | confirmar movimientos que valorizan |

**Disponible = `on_hand − committed`** (calculado, T1). `stock` se queda como saldo por lote/serie. Regla verificable: `on_hand` = suma de `stock` del mismo artículo y almacén (igual que hoy se contrasta `stock` contra el kardex). Las columnas de cuentas del Excel → Fase 2.

### 4.5 Inventario, lotes, SOL y OC
- ~~`movement_subtype.sunat_reason_code`~~ → **Fase 2** (M10): es el código de la *Tabla 12 — Tipo de Operación* y va con Contabilidad.
- Catálogo `object_type` (59 entrada, 60 salida, 67 transferencia, 202 OF, 22 OC…): **aplazado** hasta que una referencia de origen genérica lo necesite (M6 matizado).
- `material_request.purpose`: **sale** `PRODUCCION` (hecho en V18) y luego **sale de la cabecera**: el propósito pasa a `material_request_line.purpose` (`COMPRA`/`TRANSFERENCIA`), vacío hasta que Logística aprueba (G1). `material_request_line`: **entra** `id_warehouse_source`; el `UNIQUE` pasa a `(request, article, warehouse_source)`.
- `purchase_order`: **entran** `currency`, `exchange_rate` (se congela al validar), `origin` (`NACIONAL`/`IMPORTACION`), `payment_term`.
- Lotes: `batch` se queda; `batch_movement` sale (M5).

---

## 5. Plan de trabajo

### 5.1 Orden de migraciones
El orden importa: `article_model` no se puede borrar hasta quitar todas las FK que apuntan a él.

1. **V12 (rehecha en la rama):** lotes sin `batch_movement`. ✅
2. **V13 · códigos:** `CAT-####` y `SUB-####` por empresa. ✅ *(Sin `object_type` ni SUNAT: M6 matizado y M10.)*
3. **V14 · LDM por artículo:** `article_bom` pasa a `id_article`; tipos de línea, recurso, texto, método de emisión; fuera `article_bom_line_size`. ✅ *(commit `e179e10`: cada lista del modelo se copió a cada SKU con el consumo de su talla; la cobertura explota la lista de cada línea y nombra los artículos sin lista.)*
4. **V15 · SP mixta:** fuera el modelo de la SP, sus líneas y la Orden de Pedido; almacén destino, tipo de fabricación, LDM por línea; tabla de requerimientos. ✅ *(commit `310bc0e`: `ManufacturingRequestDetailService` —Estándar solo cambia almacén, Especial agrega a mano—; la cobertura suma requerimientos guardados; evento `converted` v2.)*
5. **V16 · retirar el modelo:** fuera `article.id_article_model`, marca al artículo, `DROP TABLE article_model`. ✅ *(commit `c69297e`; buscador de artículos por `brandId`.)* Front adaptado en `erp-imperiotex-front`, rama `feat/modelo-datos-v7` (commit `71e9a32`: solo contratos; aún no hay pantallas de solicitudes).
6. **V17 · Resumen x Artículo:** tabla nueva, carga inicial desde `stock` y `article_min_stock`, fuera `article_min_stock`. ✅ *(commit `5f392e8`: la empresa va en la PK para que un upsert con la empresa equivocada choque con la FK; `GET /api/v1/stock-summary`; liberaciones pendientes — M13.)*
7. **V18 · SOL:** fuera `PRODUCCION`, almacén en la línea. ✅ *(commit `5a0a0c2`: una por pedido, una OC por almacén — M14.)*
8. **V19 · OC:** moneda, tipo de cambio, importación. ✅ *(commit `001bb58`; la condición de pago queda con el proveedor — M15.)*

Front (`erp-imperiotex-front`, rama `feat/modelo-datos-v7`): `71e9a32` (SP mixta y marca), `2cf3d18` (Resumen), `a087cac` (SOL), `9a6eba8` (OC).

### 5.2 Lo que arrastra (no es solo SQL)
- **Código Java:** quitar el modelo toca **26 archivos** (entidades, repositorios, negocio de la SP, conversión a Orden de Pedido, Solicitud de Materiales, `MaterialRequirementService`) y **7 tests**. El cálculo de requerimientos pasa de "LDM del modelo + excepción por talla" a "LDM del artículo".
- **Semillas de desarrollo:** V900 y V901 citan modelos, marcas y excepciones por talla → se reescriben (la base local se recrea).
- **Datos existentes:** si alguna base de servidor ya aplicó V1–V9, cada migración debe **trasladar** los datos, no solo borrar columnas.
- **`ms-logistica.md`:** hoy describe la SP y la LDM por modelo; hay que actualizarlo antes de crear tablas (§12.1). Preparo el borrador para tu aprobación.
- **Verificación (M11):** cada migración se aplica con las semillas sobre una BD de descarte en el MySQL local (:3308) y se borra; `./mvnw clean test` en verde. `verify` (con los `*IT`) queda para cuando haya Docker.
- **V°B° (M8):** ya no bloquea por MP; hecho antes de tocar la SP para que la V15 parta de la regla nueva.

---

## 6. Pendientes que no bloquean el arranque
- Aceptar **ADR-0006** (el maestro de producto vive en `logistica_db`): sigue en *Propuesto*.
- Contrato de los eventos `production.stock.*` con Producción (faltan empresa, almacén, identidad del ítem, fecha del movimiento).
- Capa contable completa → **Fase 2** (docs 12 y 13).
