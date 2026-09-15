# 06 · Modelo de datos derivado del prototipo (V7)

> Ingeniería inversa de las **estructuras JS reales** de los 3 prototipos (GI/CO/GP), mapeadas a tablas
> propuestas y cruzadas con `logistica-info/Tablas.xlsx`. Complementa `02_MODELO_DATOS.md` (modelo objetivo).
> Aquí queda el "qué hay hoy en el prototipo" → "qué tabla propone" → "equivalente en el Excel".
> Notación: `campoJS` (nombre en el prototipo). Recordatorio: **es un prototipo**, los datos viven en memoria.

---

## Módulo GI · Inventario

### `ARTICULOS` → tabla **articulo** · (Excel: *Artículo*)
JS: `{id, n, e, u, inv, t, c, sc, ctrl, venta, compra, manu, attrs[], bcs[]}`

| JS | Tabla | Excel | Nota |
|---|---|---|---|
| `id` | codigo (PK) | Código Artículo | Numeración según Grupo. |
| `n` | nombre | Nombre de Artículo | Único. |
| `t` | grupo_articulo (FK) | Grupo de Artículo | Antes "tipo". Bridge contable. |
| `c` / `sc` | categoria / subcategoria (FK) | — | Opcionales. |
| `u` | um_inventario (FK) | C. UM (Inventario) | Base. |
| — | um_compra / um_venta | C. UM compras / ventas | En pestañas Compra/Venta. |
| `inv` / `venta` / `compra` | is_inventariable / is_venta / is_compra | Art. inventariable / venta / compra (Y/N) | |
| `manu` | apto_produccion | — | Puede ser producto final de LDM. |
| `ctrl` | control (Nada/Lote/Serie) | Maneja Lote (Y/N) | + `vence`. |
| `attrs[]` | articulo_atributo (sub-tabla) | — | `[nombreAtr, valor]`. |
| `bcs[]` | articulo_codigo_barra (sub-tabla) | Código de Barras | `{tipo, cod}`. |
| — | almacen_defecto | Almacén por defecto | Excel lo tiene; el proto no aún. |
| — | proveedor_defecto | Proveedor predeterminado | En pestaña Compra. |

### `TIPOS` → tabla **grupo_articulo** · (Excel: *Grupo de Artículo* / SAP Item Group)
JS: `{cod, nom, pref, asig, cta(legacy), fin{}}`
- `fin{}` = mapa `conceptoCodigo → cuenta` (pestaña Finanzas). **Sub-tabla `grupo_cuenta (grupo, concepto_codigo, cuenta)`**.
- `CONCEPTOS_FIN[]` = catálogo fijo de **28 conceptos** `{c, n}` (ver `04_GRUPO_ARTICULO_FINANZAS.md`).
- `cta` es legado (migrado a `fin["01"]`).

### `CATEGORIAS` / `SUBCATS` → **categoria** / **subcategoria**
- `CATEGORIAS {cod, tipo(grupo), nom}` — cuelga del Grupo.
- `SUBCATS {cod, cat, nom}` — cuelga de la Categoría. Ambas opcionales.

### `UNIDADES` / `CONVERSIONES` → **unidad_medida** / **uom_conversion**
- `UNIDADES {cod, nom}`.
- `CONVERSIONES {de, a, factor}` — **global por par** (Excel lo liga al artículo; ver ⚖️-6). `1 "de" = factor × "a"`.

### `STOCK` → tabla **existencia** · (Excel: *Resumen x Artículo*)
JS: `{alm, art, u, real, res, esp, sem, lot, t, c, sc}`

| JS | Tabla | Excel | Nota |
|---|---|---|---|
| `alm` + `art` | (almacen, articulo_codigo) PK | Almacén + Código Artículo | **Debe ser código** (hoy `art` es nombre — deuda del proto, T5). |
| `real` | stock_actual | Stock Actual | |
| `res` | stock_comprometido | Stock Comprometido | |
| `esp` | stock_pedido | Stock Pedido | Renombrado de "Esperado" (T1). |
| *(calc)* | stock_disponible | Stock Disponible | **= actual − comprometido** (Pedido NO entra; ⚖️-1). |
| `sem` | *(derivado)* | — | Semáforo ok/bajo/cero. |
| `lot` | → control_lote | Lote | |
| — | costo_promedio, stock_min, stock_max | Costo Promedio, Mín, Máx | Excel los tiene aquí; en el proto el mín está en la pestaña Planificación del artículo. |

### `LOTES` → **lote** + **control_lote** · (Excel: *Lote* / *Control de Lote*)
- `lote {nro_lote, articulo, descripcion, fecha_ingreso, fecha_vencimiento}`.
- `control_lote {articulo, lote, almacen, cantidad, objeto_base, id_interno_base, linea_base, direccion}`.

### `LDMS` → **ldm** + **ldm_detalle** · (Excel: *Lista de Materiales* / *…Detalle*)
JS cabecera: `{id, prod, prodNom, desc, cant, pred, items[]}`
JS línea: `{tipo, cod, nom, u, qty, alm, emision}` — `tipo` ∈ {Artículo, Recurso, Texto}.

| JS | Tabla | Excel | Nota |
|---|---|---|---|
| `id` | codigo (PK) | — | |
| `prod` | producto_final (FK) | Artículo | |
| `cant` | cantidad_produce | Cantidad | |
| `pred` | predeterminada | — | **Sin versionado** (C3). |
| línea `tipo` | detalle.tipo | Tipo (Item/Recurso/Texto) | ✅ homogéneo con OF (⚠️-1 resuelta: la OF mantiene dos tablas, E5). |
| línea `cod/nom` | codigo_componente | Código de componente | Recurso desde `RECURSOS_LDM`. |
| línea `qty` | cantidad | Cantidad | |
| línea `alm` | detalle.almacen | Almacén | ✅ Implementado (C4). |
| línea `emision` | detalle.metodo_emision | Método emisión | ✅ Notificación / Manual (C4). |
| — | cabecera.tipo (Venta/Prod), cabecera.almacen | Tipo, Almacén | ⚠️-3 abierta (bajo impacto). |

### Recurso (LDM): `RECURSOS_LDM {cod, nom, u}` → **recurso**
- En GP existe el maestro completo `RECURSOS {cod, nom, tipo, grupo, costoEstandar, activo}` + `TIPOS_REC`, `GRUPOS_REC`. Unificar hacia ese maestro.

### Movimientos (proto: `MOV`/`DETALLES`/`TRF`) → **entrada** / **salida** (Excel)
> El proto NO tiene la estructura del Excel; se documenta el objetivo (T2). En el backend ambas van en la tabla única `stock_movement` (I1).

- **entrada** `{id_interno, fecha_contab, fecha_doc, tipo_doc, motivo_traslado, comentarios, tipo_objeto=59}` + **entrada_detalle** `{linea, articulo, cantidad, precio_unit, almacen, um, cuenta, objeto_base, id_interno_base, linea_base, dim01..05}`.
- **salida** análoga (tipo_objeto=60).
- **Regularización** (no hay tipo Ajuste) → entrada (sobrante) o salida (faltante) con motivo. **Transferencia** → salida + entrada.
- `MOTIVO_TRASLADO` = catálogo SUNAT de 38 códigos (hoja del Excel).

### Otros maestros GI
- `SEDES {cod, nom, dir}` → **sede**. `TIPOS_BC {nom}` → **tipo_codigo_barra**. `ATRIBUTOS {nom, vals[]}` → **atributo** + **atributo_valor**.
- **almacen** (ver `02_MODELO_DATOS.md`): `{codigo, nombre, descripcion, sede, estado, en_transito, kardex_valorizado, interviene_recosteo}` + `almacen_permiso(almacen, rol)`. Se quitó `clase`, `uso`, `restringe_grupos`.

---

## Módulo CO · Compras

### `OCS` → **orden_compra** + **orden_compra_detalle** · (Excel: no la modela; es nuestra)
JS: `{id, est, sol, solKey, prov, provTipo, cond, mon, tc, fecha, valLog, valGer, rec, fac, ref, op, obs, items[{cod,nom,u,cant,pu,igv,recq}], ca{adu,nac,fle}, docs[]}`
- `valLog/valGer` → doble validación. `ca{}` → costos de importación. `docs[]` → bitácora/trazabilidad.
- Recepción crea **entrada** con `objeto_base = OC`.

### `PROV` + `GRUPOS` → **proveedor** + **grupo_proveedor** · (Excel: *Socio de Negocio*, no unificado)
- Portar del "Socio de Negocio" del Excel (decisión T6): `ruc_dni`, `moneda`, `condiciones_pago`, `sujeto_retencion`, `indicador_impuestos`, `telefono`, `movil`, `correo`.

### Resto CO
- `FACS` → **factura_compra** (+detalle, +NC aplicadas). `RECS` → **reclamo** (+líneas qrec/qfall). `NCS` → **nota_credito_proveedor`.
- `CCDS` → **comprobante_costo_destino**.
- `SUGERIDO` → cálculo (no tabla persistente). Catálogos: `MOTIVOS`, `AVIOS`, `CTAS_COSTO`.

---

## Módulo GP · Gestión de Pedido / Producción

### `SPS` → **solicitud_pedido** + detalle · (origina la demanda)
JS: `{id, fecha, mes, modelo, modeloId, marca, solic, est, vb, ger, obs, motivo, devuelta, lineas[{color,talla,qty}], mp[], scs[], ldmSel, opk, hist[]}`
- `lineas[]` → detalle por color×talla. `mp[]` → cálculo de MP (no se persiste; se recalcula). `hist[]` → historial de firmas.
- Las OF (una por artículo) las crea **Producción (GPV7)**, no GP. **E3**: implementado, LDM por línea en GP-03 (F4).

### Orden de Fabricación → **orden_fabricacion** + detalle · (Excel: *Orden Fabricación* / *…Detalle*)
> En V9 GP ya no tiene `OPFS` (GP-04 retirado): la OF vive en **Producción (GPV7)**, con artículo, cantidad, almacén, **N° Referencia**, estado y tipo.
- Estado Planificado/Liberado/Cerrado/Cancelado (Excel P/R/L/C). Tipo Estándar/Especial (Excel S/P; D se ignora).
- **Detalle en dos tablas** (decisión E5 — se mantienen separadas, NO se unifican):
  - `of-mats` (materiales): `{cod, material, u, planificado, comprometido, consumido, disponible, estado}`.
  - `of-recs` (recursos): `{cod, recurso, u, planificado, consumido, costo_unit, costo_imputado}`.
  - El Excel propone una sola `of_detalle` con `Tipo`; nosotros **conservamos las dos tablas** por claridad y porque materiales y recursos llevan columnas distintas.
- `tipo_objeto = 202`.

### Catálogos de producto (GP)
- `PLANTILLAS` (modelos base), `VARIANTES` (color|talla), `COLORES_STD`, `TALLAS_STD`, `UMBRALES` (stock mín. por variante), `BOM`/`LDM_OPTS`.
- `RECURSOS {cod, nom, tipo, grupo, costoEstandar, activo}` + `TIPOS_REC` + `GRUPOS_REC` → **recurso** (+ tipo_recurso + grupo_recurso).

---

## Tabla de correspondencia con `Tablas.xlsx`

| Tabla del Excel | Nuestra tabla | Estado |
|---|---|---|
| Artículo | articulo | ✅ (proto) |
| Resumen x Artículo | existencia (+ costo/mín/máx) | ✅ parcial |
| Recursos | recurso | ✅ (GP) |
| Socio de Negocio | proveedor (separado) | ⚖️-4 |
| Lista de Materiales / Detalle | ldm / ldm_detalle | ✅ (detalle con almacén/método; cabecera Tipo/Almacén ⚠️-3 abierta) |
| Orden Fabricación / Detalle | orden_fabricacion / of_detalle | dos tablas Materiales+Recursos (decisión E5) |
| Entrada / Salida de Inventario (+Detalle) | entrada / salida (+detalle) | doc (T2) |
| Almacenes Recosteo | almacen.interviene_recosteo | ✅ (como flag) |
| Lote / Control de Lote | lote / control_lote | ✅ |
| Motivo de Traslado (38 SUNAT) | motivo_traslado | doc (⚠️-6 mapeo a concepto contable) |

## Borrador de mapeo Motivo de Traslado → Concepto contable (⚠️-6)
*(A confirmar con Contabilidad. Ejemplos.)*

| Motivo (SUNAT) | Concepto contable (código) |
|---|---|
| 02 Compra nacional / 18 Importación | 03 Cuenta de compra / 10 Mercadería recibida por facturar |
| 10 Salida a producción | 13 Consumo de materia prima a la orden |
| 19 Entrada de producción | 17 Ingreso de producto terminado / 16 en proceso |
| 11/21 Transferencia entre almacenes | 28 Transferencia entre almacenes |
| 28 Diferencia de inventario (regularización sobrante/faltante) | 25 / 26 Regularización por sobrante / faltante de inventario |
| 13 Mermas | 19 Registro de merma |
| 01 Venta nacional | 20 Ingreso por venta + 21 Costo de ventas |
| 27 Salida por servicio de producción | 14 Salida a maquila / 15 Retorno de maquila |
| 16 Saldo inicial | 27 Carga inicial de stock |
