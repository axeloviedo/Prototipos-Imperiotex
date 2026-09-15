# 02 · Modelo de datos objetivo (PROTOTIPOS V9)

> Modelo simplificado inspirado en `Tablas.xlsx` (SAP B1), con las decisiones de `00_DECISIONES_CERRADAS.md`.
> Nuestro modelo será más grande que el del Excel, pero conserva sus conceptos y tablas base.
> Notación: **PK** clave primaria · **FK** clave foránea · *(calc)* no se persiste.

---

## Artículo

| Campo | Tipo | Notas |
|---|---|---|
| codigo | PK | Numeración según Grupo (interna/externa). |
| nombre | text | Único e irrepetible. |
| descripcion | text | |
| grupo_articulo | FK → Grupo de Artículo | **Bridge contable** (antes "Tipo"). |
| categoria | FK → Categoría | Opcional (hija del grupo). |
| subcategoria | FK → Subcategoría | Opcional (hija de la categoría). |
| es_compra / es_venta / es_inventariable | Y/N | Activan pestañas. |
| um_inventario | FK → UM | Base para trabajar todo. |
| um_compra / um_venta | FK → UM | Predeterminadas (ayuda). Conversión vía maestro global. |
| control | enum | Nada / Lote / Serie. |
| vence | Y/N | Solo si control = Lote. |
| valorizacion | fijo | Promedio ponderado. |
| proveedor_defecto | FK → Proveedor | Opcional. |
| activo | Y/N | |

> La **cuenta contable NO está en el artículo** (decisión A5/T4): se hereda del Grupo.
> Atributos, códigos de barra y mínimos por almacén son sub-tablas del artículo.

## Grupo de Artículo (antes "Tipo de Artículo")

| Campo | Tipo | Notas |
|---|---|---|
| codigo | PK | |
| nombre | text | Ej. MATERIA PRIMA, PRODUCTOS TERMINADOS. |
| prefijo | text | Para el código del artículo. |
| asignacion_codigo | enum | Interna / Externa. |

**Sub-tabla `grupo_cuenta` (pestaña Finanzas):** `(grupo, concepto_codigo, cuenta_contable)` — catálogo fijo de 28 conceptos, ver `04_GRUPO_ARTICULO_FINANZAS.md`.

## Categoría / Subcategoría

- `categoria (codigo PK, grupo FK, nombre)` — cuelga del Grupo.
- `subcategoria (codigo PK, categoria FK, nombre)` — cuelga de la Categoría.
- Ambas **opcionales** en el artículo.

## Almacén

| Campo | Tipo | Notas |
|---|---|---|
| codigo | PK | |
| nombre | text | |
| descripcion | text | **NUEVO.** Reemplaza a Clase/Uso como texto libre. |
| sede | FK → Sede | |
| estado | Activo/Inactivo | |
| en_transito | Y/N | **Se mantiene** (ej. maquila/terceros). |
| kardex_valorizado | Y/N | "involucra Kardex valorizado". |
| interviene_recosteo | Y/N | |
| restringe_tipos | Y/N | + sub-tabla de grupos admitidos (opcional). |

**Sub-tabla `almacen_permiso`:** `(almacen, rol)` — **solo roles** (decisión B6). Sin usuarios individuales.

> Se **quita** `clase` (Físico/Virtual) y `uso` (dropdown). Decisiones B2/B3.

## Existencias (Resumen x Artículo — reducido)

Clave: **(almacen, articulo_codigo)**. Decisión T5 (por código).

| Campo | Notas |
|---|---|
| stock_actual | OnHand. Lo mueven Entradas/Salidas. |
| stock_comprometido | IsCommitted. Sube al liberar OF / reservar; baja al consumir/cancelar. |
| stock_pedido | OnOrder. Mercadería en camino (transferencias en tránsito + OC pendientes de ingreso). Antes se llamaba "Esperado". |
| stock_disponible *(calc)* | **= actual − comprometido** (decisión T1, en línea). El **Pedido NO entra** en el disponible (es informativo). |
| costo_promedio | Por almacén (promedio ponderado). |

> Clave por **código** de artículo (decisión T5). **Es un prototipo**: la estructura refleja la clave por código, pero el motor en memoria (`STOCK` en el HTML) no se reescribe — sigue funcionando por nombre para la demo.

## Movimientos — Entradas y Salidas (decisión T2, revisada por I1)

> En el backend Entradas y Salidas se guardan en la **tabla única `stock_movement`** (I1, supera las dos tablas de T2). Los campos de abajo siguen valiendo.

**Entrada de Inventario** (cabecera) + **Entrada Detalle** (líneas).
**Salida de Inventario** (cabecera) + **Salida Detalle** (líneas).

Cabecera (ambas):

| Campo | Notas |
|---|---|
| id_interno | PK |
| fecha_contabilizacion / fecha_documento | |
| tipo_documento | |
| motivo_traslado | FK → catálogo SUNAT (ver hoja "Motivo de Traslado" del Excel). |
| comentarios | |
| tipo_objeto | 59 = entrada, 60 = salida (identificador de objeto). |

Detalle (ambas):

| Campo | Notas |
|---|---|
| linea | |
| articulo_codigo | |
| cantidad | |
| precio_unitario | |
| almacen | |
| um | |
| cuenta_contable | Derivada del concepto contable del grupo. |
| objeto_base / id_interno_base / linea_base | **Trazabilidad** del documento origen (OC, OF, reclamo…). |
| dimension_01..05 | Dimensiones contables (opcional). |

Reglas:
- **Regularización** (no hay tipo Ajuste) → Ingreso con motivo "Regularización de inventario (sobrante)" o Salida con "(faltante)", con observación; sin visto bueno.
- **Transferencia** → crea una Salida (origen) + una Entrada (destino).

## Lotes (decisión T3)

- `lote (nro_lote PK, articulo, descripcion, fecha_ingreso, fecha_vencimiento)`.
- `control_lote (articulo, lote, almacen, cantidad, objeto_base, id_interno_base, linea_base, direccion)` — existencia de lote por almacén, con trazabilidad al movimiento.

## Recurso (para LDM y OF)

`recurso (codigo PK, nombre, tipo_recurso FK, grupo_recurso FK, costo_estandar, activo)`. Ya existe en GP-07.

## Lista de Materiales (LDM)

**Cabecera:** `ldm (codigo PK, producto_final FK→Artículo, descripcion, cantidad_produce, predeterminada, tipo)`.
- `predeterminada`: una sola por artículo (la que GP-03 usa por defecto). **Sin versionado** (decisión C3).
- `tipo`: Venta / Producción (del Excel).

**Detalle:** `ldm_detalle (ldm FK, linea, tipo, codigo_componente, linea_texto, cantidad, um, almacen, metodo_emision)`.
- **`tipo`: Artículo / Recurso / Texto** (decisión C1) — homogéneo con OF Detalle.
- `metodo_emision`: Notificación / Manual.

## Orden de Fabricación (OF) — ya en V7

**Cabecera:** `of (id_interno PK, codigo_producto, estado[P/R/L/C], tipo[S/P], cantidad_planificada, fecha_of, fecha_inicio, fecha_fin, cliente, tipo_objeto=202)`.
**Detalle:** `of_detalle (of FK, linea, tipo[Artículo/Recurso/Texto], linea_texto, articulo, cantidad_base, cantidad_requerida, almacen, metodo_emision)`.

> El detalle de OF y el de LDM comparten el indicador `tipo` (decisión C1/E1).

## Proveedor (revisar contra "Socio de Negocio" del Excel — decisión T6)

Mantener maestro de Proveedores separado, pero considerar agregar de "Socio de Negocio":
`ruc_dni`, `moneda` (Soles/Dólares/Todas), `condiciones_pago`, `sujeto_retencion` (Y/N), `indicador_impuestos` (IGV/EXEIGV…), `telefono`, `movil`, `correo`.
