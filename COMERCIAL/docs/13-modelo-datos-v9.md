# 13 · Modelo de datos Comercial (V9)

> 2026-09-15 (tercera versión: cuatro documentos SAP B1). Es el modelo que sigue el prototipo `COMERCIAL/`, con la notación de `../02_MODELO_DATOS.md` (SAP B1 / `Tablas.xlsx`).
> Cada tabla indica su equivalente en la documentación del sistema actual (`02-modelo-datos.md`) y en el backend real (`comercial_db`).
> Notación: **PK** clave primaria · **FK** clave foránea · *(calc)* no se persiste · *(snap)* copia congelada al crear.
> Multiempresa: todas las tablas llevan `empresa` (FK). Se omite abajo para no repetirla.
> **Revisión 2026-09-16:** el prototipo del repo (venta Registrada / Anulada con pagos por validar, sin orden de venta cargada) sigue la regla de stock de `12-prototipo-diseno.md` §10 (R1). Sus campos están en §3 «Venta · prototipo del repo» y en §5.

---

## 1. Diagrama

```
cliente ──< cotizacion ──< cotizacion_linea >── articulo
   │            │ copiar a (0..1)
   ├──────< orden_venta ──< orden_venta_linea >── articulo ── existencia (almacén × artículo)
   │            │ copiar a (0..n, por partes)       ▲ comprometido
   └──────< venta ──< venta_linea ─────────────────┘ (orden_venta_linea 0..1)
               │  ├──< cobro >── caja_sesion ──< caja_movimiento
               │  ├──< devolucion_dinero ────────────────┘
               │  └──< devolucion ──< devolucion_linea
               └── salida de inventario (T2, objeto base = venta, al quedar Pagada)
devolucion ── entrada de inventario (T2, objeto base = devolución)
lista_precio >── articulo      caja >── sede      sede >── almacen      serie_comprobante >── sede
```

---

## 2. Maestros

### Cliente (socio de negocio de Comercial, T6)

| Campo | Tipo | Notas | Doc actual | `comercial_db` |
|---|---|---|---|---|
| codigo | PK | `CLI-000001`, correlativo por empresa | `client.id` | `customer.code` |
| tipo_documento | enum | DNI / RUC / CE | `type_document` | `id_document_type` |
| numero_documento | text | Único por (empresa, tipo, número). DNI 8, RUC 11 | `n_document` | `document_number` |
| nombre | text | Nombres o razón social | `full_name` | `name` |
| tipo_cliente | FK → catálogo | MINORISTA / MAYORISTA / EXPORTACIÓN / SERVICIOS. Define el nivel de precios | `client_segment_id` | `customer_type` |
| telefono, email, direccion, ubigeo | text | ubigeo CHAR(6) | igual | igual |
| observaciones | text | | — | `notes` |
| activo | Y/N | Baja lógica | `state` | `active` |
| estado_comercial | *(calc)* | Sin compras / Nuevo (≤30 días) / Activo (≤60) / Por recuperar. Cuenta las ventas no anuladas | — | `customer.status` (V19) |

> Sin condición de pago: solo contado.

### Listas de precios y ofertas

> 2026-09-18: se carga **por lista** y no por artículo (decisiones LP1–LP5 en `12-prototipo-diseno.md` §12). Colección `BD.d.listasPrecio`.

**lista_precio**

| Campo | Tipo | Notas | Doc actual |
|---|---|---|---|
| codigo | PK | `LP-01` | — |
| nombre | texto, único | | — |
| moneda | enum | PEN / USD | `coin_id` |
| sede | FK → Sede (maestro compartido), nulo | Nulo = todas. El documento usa la sede de su tienda | `sucursale_id` |
| tipo_cliente | FK, nulo | Segmento; nulo = todos | `client_segment_id` |
| valida_desde · valida_hasta | fecha, nulo | Con fechas es una **oferta**; hasta nulo = sin fin | — |
| activa | bool | | — |
| creada_por · creada_en | usuario · fecha | | — |
| cancelada_por · cancelada_en · motivo_cancelacion | usuario · fecha · texto, nulos | **No se borra: se cancela** (LP6) | — |

**lista_precio_historial** · lista, accion, detalle (anterior → nuevo), usuario, fecha. Toda modificación de la lista y sus filas (LP6).

**lista_precio_fila** · una por (lista, articulo, um) o por (lista, grupo)

| Campo | Tipo | Notas | Doc actual |
|---|---|---|---|
| lista | FK → lista_precio | | — |
| articulo | FK → Artículo, nulo | | `product_id` / `service_id` |
| grupo | FK → Grupo de artículo, nulo | Solo con % | — |
| um | FK → UM, nulo | Nulo = todas las unidades (solo con %) | `unit_id` |
| precio | decimal, nulo | Incluye IGV. Precio **o** %: uno de los dos es obligatorio (LP7) | `price_general` |
| pct_descuento | decimal, nulo | Sobre el precio de la lista menos específica (o de lista, en una oferta) | — |

Resolución: oferta vigente → sede+tipo → sede → tipo → general → `articulo.precio_sugerido` (solo PEN). La línea del documento guarda `precio`, `origen`, `lista`, `oferta` y `precio_lista`.

### Artículo: datos de venta (pestaña Venta de GI-02)

| Campo | Notas | Doc actual |
|---|---|---|
| es_venta, um_venta | GI-02 · una UM referencial; se vende en cualquier UM con conversión a la de inventario (L5) | `units[]` |
| precio_sugerido | PEN por UM de inventario | `price_general` |
| precio_minimo, verificar_minimo | GI-02 + parámetro de empresa de Inventarios (Configuración General) | — |
| descuento_min_pct, descuento_max_pct | Rango del descuento por línea | `min_discount`, `max_discount` |
| afectacion_igv | Gravado / Exonerado / Inafecto | `tax_selected` |

> Productos y servicios son **el mismo maestro**: un servicio es un artículo no inventariable (grupo SERVICIOS).

### Catálogos y configuración

| Tabla | Campos | Notas |
|---|---|---|
| sede (tienda) | codigo, nombre, direccion, almacen_venta, canal | `config_db.site` |
| caja | codigo, nombre, sede, moneda | Una por tienda y moneda |
| serie_comprobante | sede, tipo (NV/BV/FA), serie, ultimo_numero | `voucher_series` / `voucher_sequence` |
| medio_pago | codigo, nombre, es_efectivo, monedas, bancos[] | `method_payment` + `banco` |
| categoria_caja | tipo (Ingreso/Egreso), nombre | `income_categorie` / `expense_categorie` |
| lugar_entrega | codigo, nombre, propio, pide_ubigeo, pide_agencia | `sucursale_deliverie` |
| parametro_comercial | igv, tipo_cambio, dias_validez_cotizacion, dias_anulacion, verificar_precio_minimo, almacen_mal_estado | `config_db.parametro` (ámbito COMERCIAL) |

---

## 3. Documentos

Cabecera común (cotización, orden y venta): `sede`, `vendedor`, `usuario`, **`fecha_creacion`** (la pone el sistema), `cliente` + `cliente_snap` (documento, nombre, tipo), `moneda`, `op_gravada`, `op_exonerada`, `igv`, `total`, `tasa_igv`, `observacion` (obligatoria si hay obsequios), `historial[]`.

Línea común: `documento`, `n` (PK compuesta), `articulo` + `nombre` *(snap)* + `descripcion_personalizada` (solo servicios), `um`, `factor` (DOC = 12), `almacen` (solo inventariables), `cantidad`, `precio`, `origen_precio`, `descuento_unitario`, `obsequio`, `base`, `igv`, `total`.

### Cotización · *SAP B1 `OQUT`, objeto 23*

| Campo | Notas | Doc actual | `comercial_db` |
|---|---|---|---|
| id | PK `COT-AAAA-NNNNNN` | `proforma.id` (state_proforma=1) | `quote.quote_number` |
| valida_hasta | fecha_creacion + parámetro; editable | — | `valid_until` |
| estado | **Abierta / Cerrada / Cancelada** | `state_proforma` | `status` |
| vencida | *(calc)* Abierta y hoy > valida_hasta | — | — |
| orden_venta | FK a la orden a la que se copió | — (defecto D2) | `sale_number` (V14) |
| cancelacion | fecha, usuario, motivo | — | — |

> Ya no hay `tipo` (productos / servicios / mixta).

### Orden de venta · *SAP B1 `ORDR`, objeto 17*

| Campo | Notas | `comercial_db` |
|---|---|---|
| id | PK `OV-AAAA-NNNNNN` | `sale` en PENDIENTE (V29) |
| cotizacion | FK de origen (0..1) | `quote_number` (V13) |
| entrega | lugar, fecha, direccion, ubigeo, agencia, recibe_nombre / _documento / _telefono. Solo con productos | `delivery_type`, `shipment` |
| estado | **Abierta / Cerrada / Cancelada** | `status` |
| ventas | *(calc)* ventas copiadas de la orden | — |
| **línea:** atendida | Cantidad ya copiada a ventas no anuladas | — |
| **línea:** comprometido | Unidades de inventario comprometidas = pendiente × factor | — |
| pendiente, avance % | *(calc)* cantidad − atendida | — |

### Venta · *SAP B1 factura de deudores `OINV` (13)* · la salida de stock ocurre al quedar Pagada

| Campo | Notas | Doc actual | `comercial_db` |
|---|---|---|---|
| id | PK `VEN-AAAA-NNNNNN` | `proforma.id` (state_proforma=2) | `sale.sale_number` |
| tipo_comprobante, numero | NV / BV / FA · `serie-correlativo` (B001-002310). FA ⇒ cliente con RUC | `document_type_id` | `voucher` |
| orden_venta | FK de origen (0..1); nula = venta directa | — | — |
| entrega | *(snap)* de la orden | `proforma_deliverie` | `shipment` |
| estado | **Pendiente de pago / Pagada / Anulada** | — (defecto D1) | `status` |
| pagada_el | Fecha en que los cobros completaron el total | — | — |
| anulable_hasta | fecha_creacion + parámetro, congelado; aplica a Pagada | — | V33 |
| anulacion | fecha, usuario, motivo, estaba_pagada | — | `notes` |
| movimientos_stock | Salidas al pagar; ingresos si se anula pagada | — | — |
| cobrado, saldo, devuelto, por_devolver | *(calc)* | `paid_out`, `debt` | *(calc)* |
| **línea:** orden_venta_linea | FK a la línea de la orden (0..1) | — | — |
| **línea:** comprometido | Unidades comprometidas mientras está Pendiente de pago; 0 al pagar o anular | — | — |
| **línea:** costo_unitario | Costo promedio del almacén al salir | — | — |

### Venta · prototipo del repo (revisión 2026-09-16)

Lo que guarda y calcula `js/core/ventas.js`. Reemplaza, para este prototipo, a la tabla anterior.

| Campo | Notas |
|---|---|
| id, comp, compNum | `VEN-AAAA-NNNNNN` · NV / BV / FA · `serie-correlativo` |
| fecha | **Fecha de creación**, la pone el sistema al registrar (no se elige) |
| cond | Condición de pago (contado o crédito): solo fija el vencimiento del saldo, no cambia la regla de stock |
| estado | **Registrada / Anulada** |
| salida | `null` mientras el stock está comprometido. Al cubrirse el total con pagos validados: `{f, u, pago, movs[]}` (fecha, usuario, pago que completó el total y salidas GI-10) |
| plazoAnular | fecha_creacion + parámetro, congelado. Solo aplica si hay `salida` |
| movs | Salidas al confirmarse el pago completo; ingresos si se anula con salida |
| anulacion | fecha, usuario, motivo |
| confirmado | *(calc)* Σ pagos **Validados** |
| pagado, deuda, devuelto, porDevolver | *(calc)* pagado cuenta Por validar y Validado, menos devoluciones de dinero entregadas |
| estadoPago | *(calc)* Pagado / **Por validar** (lo registrado cubre el total pero no todo está validado) / Parcial / Pendiente de pago / Por devolver / Anulada |
| estadoStock | *(calc)* vacío (solo servicios) / **Stock comprometido** / **Stock entregado** / **Stock liberado** (anulada sin salida) / **Stock devuelto** (anulada con salida) |
| **línea:** comp | Unidades de inventario comprometidas (cant × factor) desde el registro hasta la salida o la anulación; luego 0 |
| **línea:** costo | Costo promedio del almacén al salir (por UM de venta) |

> Ya no hay `tipo` de documento (productos / servicios / mixta) en cotización ni en venta.

### Cobro · *SAP B1 pago recibido `ORCT`, objeto 24*

| Campo | Notas | Doc actual | `comercial_db` |
|---|---|---|---|
| id | PK `PAG-NNNNNN` | `proforma_payment.id` | `sale_payment` |
| venta | FK | `proforma_id` | `id_sale` |
| caja_sesion | FK: caja abierta **en la que entró** | — | V44 |
| medio_pago, banco, numero_operacion | Banco si el medio lo pide; operación si no es efectivo | `method_payment_id`, `banco_id`, `n_transaccion` | igual |
| monto, fecha, usuario | 0 < monto ≤ saldo | `amount`, `date_payment` | |
| estado | **Cobrado / Anulado** (anular solo con la venta Pendiente de pago y la caja abierta) | `verification` | `status` |
| motivo_anulacion | | — | |

### Devolución de dinero

| Campo | Notas | `comercial_db` |
|---|---|---|
| id | PK `DD-NNNNNN` | V46 |
| venta, origen | origen = devolución o «Anulación» | |
| monto, estado | **Pendiente / Devuelto** | |
| caja_movimiento, caja_sesion | Al entregarlo | |

### Devolución · *SAP B1 devolución `ORDN`, objeto 16*

| Campo | Notas | Doc actual |
|---|---|---|
| id | PK `DEV-AAAA-NNNNNN` | `devolucion.id` |
| venta, numero_venta *(snap)*, cliente_snap, sede, moneda | Solo de una venta **Pagada**; moneda de la venta | `proforma_id` |
| motivo | Obligatorio | `detalle` |
| subtotal, igv, total | | `subtotal`, `igv`, `total` |
| devolucion_dinero, movimientos_stock | Se crean al registrar | — |
| **línea:** linea_venta, articulo, um, factor, almacen, cantidad, tipo (Normal / Mal estado), precio, costo, total | cantidad ≤ vendido − devuelto | `devolucion_detail` |

> No tiene estados: registrar = ingreso de stock y dinero por devolver.

---

## 4. Caja

### Sesión de caja

| Campo | Notas | Doc actual | `comercial_db` |
|---|---|---|---|
| id | PK `CAJ-NNNNNN` | `caja_sucursale.id` | `cash_session` |
| caja, sede, moneda | Una **Abierta** por (sede, moneda) | `caja_id`, `sucursale_id`, `coin_id` | `open_marker` UNIQUE |
| apertura: fecha, usuario, monto_inicial, observacion | | `amount_initial` | `opening_amount` |
| estado | Abierta / Cerrada | `state` | `status` |
| cierre: fecha, usuario, contado, esperado, diferencia, observacion | Conteo ciego | `amount_finish` | `closing_amount_*`, `difference` |
| resumen_cierre | *(snap)* por medio de pago | — | `close_breakdown` (V12) |

**Efectivo esperado** *(calc)* = inicial + cobros en efectivo + ingresos − egresos − devoluciones en efectivo.

### Movimiento de caja

| Campo | Notas | Doc actual |
|---|---|---|
| id | PK `MC-NNNNNN` | `caja_movement` / `caja_ingreso` / `caja_egreso` |
| sesion | FK | `caja_sucursale_id` |
| tipo | Ingreso / Egreso / **Devolución** | `type` |
| categoria, descripcion (≥ 5), monto | | `income/expense_categorie_id`, `description`, `amount` |
| medio_pago, banco, numero_operacion | Devolución: cómo se entregó | `method_payment_id`, `banco_id` |
| venta, devolucion_dinero | Solo tipo Devolución | `referencia_id` |
| estado, anulado: fecha, usuario, motivo | Registrado / Anulado (no se borra) | `state` |

> Los **cobros** no se duplican como movimientos: el arqueo los lee de `cobro` con su `caja_sesion`.

---

## 5. Stock (motor V9, no tablas nuevas)

| Documento comercial | Movimiento T2 | Existencias (T1) | Concepto |
|---|---|---|---|
| Cotización | — | — | — |
| Orden de venta (crear) | — | **Comprometido +** | — |
| Orden → venta | — | Sin cambio: el compromiso pasa de la línea de la orden a la de la venta | — |
| Venta directa (registrar) | — | **Comprometido +** | — |
| Cobro que completa el total | **Salida** «Venta al por menor / al por mayor», una por almacén; objeto base = venta | Actual −, Comprometido − | 21 Costo de ventas |
| Orden (cerrar o cancelar) | — | Comprometido − (lo pendiente) | — |
| Venta Pendiente de pago (anular) | — | Comprometido −; si venía de orden, la orden vuelve a comprometer su pendiente | — |
| Venta Pagada (anular en plazo) | **Entrada** «Devoluciones de Clientes»; objeto base = venta | Actual + | 23 |
| Devolución | **Entrada** «Devoluciones de Clientes»; objeto base = devolución. Mal estado → `SB-ALM-REM` | Actual + | 23 |

Comercial **no toca el Pedido** (OnOrder). Coincide con la hoja *Stock Comprometido y Pedido* de `Tablas.xlsx`: orden de venta = «Pedido de cliente» (+ IsCommited), cerrar o cancelar = «Cancelación / cierre de pedido» (− IsCommited). La venta pagada hace de «Entrega de mercancía» (− Actual, − IsCommited).

**Invariante:** Comprometido de cada existencia = compromisos de otros módulos + Σ `comprometido` de líneas de órdenes Abiertas + Σ `comprometido` de líneas de ventas Pendientes de pago.

### Prototipo del repo (revisión 2026-09-16, DECISIÓN CERRADA)

| Evento | Movimiento T2 | Existencias (T1) |
|---|---|---|
| Registrar venta | — | **Comprometido +** (cant × factor por línea inventariable, en su almacén) |
| Validar un pago que **no** completa el total | — | Sin cambio |
| Validar el pago que completa el total (Σ validados ≥ total) | **Salida** «Venta al por menor / al por mayor», una por almacén; objeto base = venta | **Actual −, Comprometido −** |
| Rechazar pago | — | Sin cambio (sigue comprometido) |
| Anular venta sin salida | — | **Comprometido −** (sin plazo) |
| Anular venta con salida (en plazo) | **Entrada** «Devoluciones de Clientes» | Actual + |
| Finalizar devolución (solo ventas con salida) | **Entrada** «Devoluciones de Clientes»; mal estado → `SB-ALM-REM` | Actual + |

**Invariante del prototipo:** Comprometido de cada existencia = comprometido inicial de otros módulos + Σ `linea.comp` de ventas Registradas sin `salida`. Nunca negativo.

---

## 6. Reglas de integridad

| Regla | Dónde |
|---|---|
| Documento de cliente único por empresa | UNIQUE (empresa, tipo_documento, numero_documento) |
| Una sesión Abierta por (empresa, sede, moneda) | columna generada + UNIQUE (`open_marker`) |
| Línea: cantidad > 0, precio ≥ 0, descuento ≥ 0 | CHECK |
| Almacén obligatorio solo en inventariables | Negocio |
| Solo se copia una cotización Abierta y no vencida; una vez | Negocio |
| Venta desde orden: cantidad ≤ pendiente de la línea; moneda y cliente de la orden | Negocio |
| La orden se cierra sola cuando no queda pendiente; se cancela solo sin ventas | Negocio |
| Número de comprobante único por (serie, correlativo); FA ⇒ RUC | UNIQUE + negocio |
| Σ cobros ≤ total; cobro > 0 y ≤ saldo; exige caja abierta de la tienda y moneda | Negocio |
| Pagada ⇔ Σ cobros Cobrados ≥ total (dispara la salida de stock) | Negocio |
| Anular cobro solo con la venta Pendiente de pago y su caja abierta | Negocio |
| Anular venta: sin devoluciones; Pagada solo hasta `anulable_hasta` | Negocio |
| Devolución solo de ventas Pagadas; cantidad ≤ vendido − devuelto | Negocio |
| Ingreso/Egreso: monto > 0, descripción ≥ 5 | CHECK |
