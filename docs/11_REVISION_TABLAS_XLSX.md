# 11 · Revisión de acople con `Tablas.xlsx`

> ¿Nuestro modelo de datos (docs `02`, `06` + decisiones) se acopla a las tablas propuestas en `Tablas.xlsx`?
> Qué falta, qué cambiar. Fecha: 2026-09-09.
> **Conclusión rápida:** nuestro modelo es un **superconjunto** del Excel en el núcleo logístico, y está **alineado** en lo esencial. Pero el Excel incluye **piezas que aún no tenemos** (sobre todo el puente contable: *Asientos*, *Dimensiones*, y datos de *Bancos/Contactos*). Abajo, tabla por tabla.

---

## 1. Matriz tabla-por-tabla (Excel → nuestro modelo)

Leyenda: ✅ cubierto · ⚖️ divergencia intencional · ⚠️ parcial · ➕ falta (agregar).

| Tabla del Excel | Estado | Acción / nota |
|---|---|---|
| **Artículo** | ✅ | `articulo` cubre todo (código, nombre, grupo, flags, UM compra/venta/inventario, cód. barras, proveedor def., almacén def., maneja lote, activo). |
| **Resumen x Artículo** | ⚖️/⚠️ | `existencia` (almacén+artículo, Actual/Comprometido/Pedido/Costo Prom.). El Excel pone aquí **Cuenta Existencia/Ingresos/Gastos** por almacén; nosotros las llevamos **al Grupo (T4)**. Falta portar **Stock Mín/Máx** a esta tabla (hoy el mín está en la pestaña Planificación del artículo). |
| **Recursos** | ⚠️ | `recurso` tiene tipo/grupo/costo/activo. **Agregar del Excel:** `código UM` (UN/Horas) y `Cuenta de Mayor` (cuenta contable del recurso). |
| **Socio de Negocio** | ⚖️ | Mantenemos **Proveedor separado** (T6) con moneda/cond. pago/retención/impuestos. **Agregar:** `Cuenta Asociada` (cuenta contable del socio). |
| **Bancos** | ➕ | **Falta.** Maestro de bancos (ID, Descripción). |
| **Bancos x Socio de Negocio** | ➕ | **Falta.** Cuentas bancarias del proveedor (SN, banco, cuenta, CCI) — necesario para pagos/Tesorería. |
| **Contactos** | ⚠️ | Hoy el contacto va **inline** en el proveedor. El Excel lo modela como **tabla** (varios contactos por socio). Evaluar normalizar. |
| **Lista de Materiales** (cabecera) | ⚠️ | `ldm`. **Falta (⚠️-3, abierta):** `Tipo (Venta/Producción)` y `Almacén` en la cabecera. |
| **Lista de Materiales Detalle** | ✅ | `ldm_detalle` con Tipo(Artículo/Recurso/Texto), código, cantidad, almacén, método emisión, línea texto. (El Excel añade además `Tipo Item = I/R`, redundante con Tipo.) |
| **Orden Fabricación** (cab.) | ⚠️ | Modelado (doc 06); **producción = otro módulo**. Estado P/R/L/C y Tipo S/P (D se ignora, hoja Notas). |
| **Orden Fabricación Detalle** | ⚖️ | Excel = **una** tabla con Tipo; nosotros **dos** (Materiales+Recursos, decisión E5). Referencia Objeto Base=202 / ID OF / línea. |
| **Entrada de Inventario** (+Detalle) | ⚠️ | Modelado (doc 06, T2; en el backend tabla única `stock_movement`, I1), **no implementado** (motor real = Producción/Contabilidad). Objeto 59. |
| **Salida de Inventario** (+Detalle) | ⚠️ | Ídem, Objeto 60. **Nota nueva del Excel:** el detalle lleva **Dirección (0/1)** = incrementa/decrementa, y **Dimensión 01-05** (centros CEPRO). |
| **Almacenes Recosteo** | ✅ | Hoy es el flag `interviene_recosteo` del almacén; el Excel lo modela como tabla aparte (ID, Almacén). Equivalente. |
| **Almacén** | ⚠️ | El nuestro tiene más (descripción, estado, tránsito, kardex). **Agregar del Excel:** `Centro de Costo`. |
| **Lote** | ✅ | `lote` (nro, descripción, fecha ingreso, fecha vencimiento). |
| **Control de Lote** | ✅/⚠️ | `control_lote` (artículo, lote, almacén, cantidad). **Agregar:** Objeto Base/ID Base/Línea Base + **Dirección (0/1)** para trazar el movimiento. |
| **Saldo x Almacén** | ⚠️ | Vista de stock por almacén — se solapa con `existencia`. Puede derivarse (no requiere tabla nueva). |
| **Saldo x Lote** | ➕ | **Falta como vista/estructura:** stock actual **por lote** (artículo, lote, stock, centro de costo). Nuestro `control_lote` se le acerca. |
| **Asientos** | ➕ | **Falta — la pieza más importante ausente.** El puente contable: `cuenta contable, moneda, debe, haber, debe ME, haber ME, dimensión 01-05`. Es lo que conecta los movimientos con Contabilidad usando las cuentas del Grupo (28 conceptos). |
| **Motivo de Traslado** (38 SUNAT) | ✅ | Catálogo documentado; pendiente el mapeo motivo→concepto contable (⚠️-6). |
| **Stock Comprometido y Pedido** (matriz) | ✅ | Cubierto por T1 (Disponible=Actual−Comprometido, Pedido informativo) y T7 (compromiso al aprobar la SP). |

## 2. Lo que FALTA agregar a nuestro modelo (prioridad)

1. **Asientos contables** (alta prioridad): tabla de asiento `{cuenta, moneda, debe, haber, debe_ME, haber_ME, dim01..05, objeto_base, id_base, linea_base}`. Es el destino de las cuentas configuradas en el Grupo (28 conceptos) y de las Dimensiones. **Sin esto, la contabilidad queda desconectada.**
2. **Dimensiones contables 01-05** (centros de costo/proceso, ej. CEPRO01/02): en los **detalles de movimiento** y en los asientos. Falta el maestro de dimensiones y su uso.
3. **Bancos + Bancos x Socio de Negocio**: para pagos a proveedores (Tesorería).
4. **Cuenta Asociada** en Proveedor/Socio, **Cuenta de Mayor + UM** en Recurso, **Centro de Costo** en Almacén.
5. **Dirección (0/1)** y **Objeto Base/ID Base/Línea Base** en el motor de Entradas/Salidas y en Control de Lote (trazabilidad + signo del movimiento).
6. **Stock Mín/Máx** en `existencia` (Resumen x Artículo), no solo en el artículo.
7. **Contactos** como tabla (varios por socio), si se quiere normalizar.
8. Cerrar **⚠️-3** (LDM cabecera: Tipo Venta/Producción + Almacén).

## 3. Divergencias intencionales (mantener, ya decididas)

- **Cuentas contables en 1 nivel, por Grupo** (T4) — el Excel las pone por almacén (Resumen x Artículo). Nuestra elección es más simple; el puente real serán los **Asientos** usando la cuenta del Grupo.
- **Disponible = Actual − Comprometido** (T1) — el Excel suma `+ Pedido`; nuestro Pedido es informativo.
- **OF Detalle en dos tablas** (E5) — el Excel usa una con Tipo.
- **Socio de Negocio separado** en Proveedor/Cliente (T6) — el Excel lo unifica.
- **Solicitud de Materiales con propósito por línea** (G1) — el solicitante indica qué y a dónde; Logística define Compra o Transferencia al aprobar.

## 4. Lo que tenemos DE MÁS que el Excel (superconjunto, correcto)

El Excel es un **núcleo mínimo**. Nuestro modelo ya incluye, además: **Grupo de Artículo con 28 conceptos contables** (Finanzas), Categoría/Subcategoría, Atributos, múltiples Códigos de Barra, Conversiones de UM, Sedes, Series de documentos, GRE (SUNAT), **Solicitud de Materiales** (con propósito por línea y trazabilidad), **Solicitud de Pedido de Producción** (con requerimientos por artículo, almacén origen/destino), **Orden de Compra** (doble validación, importación, costos de destino), Facturas, Reclamos, Notas de Crédito, Sugerido de Compras, y permisos por rol. Esto era el objetivo: *"tener más de lo que propone el Excel, conservando sus conceptos"*.

## 5. Recomendación para "cerrar" el modelo de datos

El modelo se acopla bien; para dejarlo **completo y claro** conviene, en este orden:
1. Definir la **capa contable**: `Asientos` + `Dimensiones (centros de costo)` + el **mapeo Motivo de Traslado → concepto contable del Grupo** (⚠️-6). Es lo único estructuralmente ausente de peso.
2. Formalizar el **motor de movimientos** (Entradas/Salidas + Detalle con Objeto Base/Línea Base, Dirección 0/1, Dimensiones) — hoy documentado, no implementado (es del módulo de ejecución/Producción).
3. Añadir los **campos sueltos**: Cuenta Asociada (Proveedor), Cuenta de Mayor + UM (Recurso), Centro de Costo (Almacén), Stock Mín/Máx (Existencia), Bancos/Contactos.
4. Cerrar **⚠️-3** (cabecera LDM).

Con (1) y (2) resueltos, nuestro modelo cubriría el 100% de `Tablas.xlsx` y lo supera en el resto del alcance logístico.
