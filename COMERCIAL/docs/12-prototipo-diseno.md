# 12 · Prototipo Comercial V9 — diseño y decisiones

> 2026-09-15 · `PROTOTIPOS V9/COMERCIAL/`. Prototipo navegable del área comercial que encaja con Inventarios (GI), Compras (CO), Gestión de Pedido (GP) y Producción (GPV7).
> Los documentos `01`–`11` de esta carpeta describen un sistema de ventas que ya funciona. Son el **lineamiento funcional**, no la fuente de verdad: dentro de V9 manda lo que se decide aquí y en `../00_DECISIONES_CERRADAS.md`.
> El modelo de datos está en `13-modelo-datos-v9.md` y los contratos funcionales en `14-contratos-funcionales.md`.
> **Tercera versión (2026-09-15), simplificada a pedido del usuario:** «debe ser más simple, tal como lo hace SAP B1». Reemplaza la versión anterior, en la que la venta tenía estados de orden y de entrega, el comprobante iba aparte y los pagos se validaban.

---

## 1. Cómo abrirlo

| Qué | Dónde |
|---|---|
| Prototipo | `COMERCIAL/index.html` (multi-archivo, igual que `GPV7`) |
| Reglas de negocio, sin pantalla | `js/core/precios.js` (listas y totales), `stock.js`, `ventas.js` (`Cli`, `Doc`, `Cot`, `OV`, `Ventas`, `Dev`), `caja.js`, `config.js` |
| Datos de la demo | `js/data/maestros.js`, `js/data/demo.js` |
| Pantallas | `js/modules/*.js`: una por submódulo; `documento.js` reúne las piezas compartidas |

- En Chrome o Edge se abre con doble clic. Dentro del panel del ERP hay que servir la carpeta `PROTOTIPOS V9` por HTTP y entrar a `/COMERCIAL/index.html`, igual que con GPV7.
- Lo registrado se guarda en `localStorage`. **↺ Reiniciar datos de demo** vuelve al escenario inicial.
- Las fechas de la demo son **relativas al día en que se arma** (ayer, hoy, hace 20 días). Así la validez de las cotizaciones y el plazo de anulación siempre tienen sentido.
- El selector **Usuario** de la barra superior cambia de perfil y de tienda para probar los permisos.

---

## 2. El flujo en una línea

```
Cotización  ──Copiar a──▶  Orden de venta  ──Copiar a──▶  Venta (Boleta / Factura / Nota de venta)  ──▶  Cobro en caja
no mueve stock             compromete stock               Pendiente de pago → Pagada                 cobro completo = sale el stock
                           (se atiende por partes)        │
                                                          └──▶ Devolución (vuelve el stock, el dinero se devuelve en caja)
En el mostrador: Venta directa, sin cotización ni orden.
```

Cada pantalla muestra este flujo arriba y el **mapa de relaciones** del documento (cotización → orden → ventas → devoluciones), como el mapa de relaciones de SAP B1.

---

## 3. Decisiones

| # | Decisión | Detalle |
|---|---|---|
| K1 | **Cuatro documentos, como SAP B1** | Cotización (`OQUT`) → Orden de venta (`ORDR`) → Venta = comprobante (`OINV`: boleta, factura o nota de venta) → Cobro (`ORCT`). Se pasa de uno a otro con **«Copiar a»**. La devolución sale de la venta. En la tienda se puede hacer una **venta directa** sin cotización ni orden. |
| K2 | **La cotización no mueve stock** | Estados **Abierta → Cerrada** (se copió a una orden) **/ Cancelada**. Si pasó su «Válida hasta» se marca *vencida*: no se copia hasta extender la validez o clonarla. Se edita línea por línea mientras está Abierta. No tiene tipo (productos, servicios o mixta): lo decide cada línea. |
| K3 | **La orden de venta compromete stock** | Al crearla sube el **Comprometido** de cada línea en su almacén, así baja el Disponible (T1). Estados **Abierta → Cerrada / Cancelada**. Guarda la **entrega** (recojo, delivery o agencia). |
| K4 | **La orden se atiende por partes** | Cada línea muestra **Pedido / Atendido / Pendiente / Comprometido**. «Copiar a venta» propone lo pendiente; se puede vender menos o quitar líneas. El compromiso **pasa de la orden a la venta** sin duplicarse. La orden se **cierra sola** cuando todo está atendido. «Cerrar orden» (si ya tuvo ventas) libera lo que falta. «Cancelar» solo procede sin ventas y libera todo. |
| K5 | **La venta es el comprobante** | Al registrarla se elige **Nota de venta, Boleta o Factura**. Toma serie de la tienda y correlativo (`B001-002310`). La factura exige RUC. No hay documento de comprobante aparte ni emisión SUNAT. |
| K6 | **Solo contado** | Se quitó la condición de pago (crédito). La venta nace **Pendiente de pago** (el stock sigue comprometido) y pasa a **Pagada** cuando los cobros suman el total. |
| K7 | **Cobro completo = sale el stock** | Cuando el pago queda completo, se genera una **Salida** de GI-10 por almacén («Venta al por menor» o «al por mayor», concepto **21**). Baja el Actual, libera lo comprometido y guarda el costo. No existe un botón «Entregar» ni pagos por validar. |
| K8 | **Registrar cobro = cobrado** | Todo cobro entra a la **caja abierta de la tienda** en la moneda de la venta con estado **Cobrado**. Se puede cobrar al registrar la venta (uno o varios medios) o después desde la venta o la caja. Cada cobro es ≤ saldo. Mientras la venta sigue Pendiente de pago, un cobro se puede **anular** (`editar_caja`, caja abierta). |
| K9 | **Anular la venta** | Solo `anular_venta` y sin devoluciones. **Pendiente de pago:** libera lo comprometido. **Pagada:** dentro del plazo (3 días, congelado en la venta) vuelve el stock con un Ingreso. Si venía de una orden, las cantidades **vuelven a quedar pendientes** en ella (se reabre si estaba cerrada). Lo cobrado queda **por devolver** en caja. |
| K10 | **Devolución de una venta Pagada** | Registrar = efecto inmediato. Por línea: cantidad ≤ vendido − devuelto y estado **Normal** o **Mal estado**. Motivo obligatorio. Ingreso GI-09 «Devoluciones de Clientes» (concepto **23**) al costo con que salió; mal estado va a `SB-ALM-REM`. El dinero queda **por devolver** en caja. Un cambio es una devolución más una venta nueva. |
| K11 | **Un documento para productos y servicios** | La línea es un artículo: si no es inventariable (grupo SERVICIOS) no lleva almacén ni stock y admite descripción personalizada. |
| K12 | **Control de stock por artículo** | *Bloquear* / *Avisar* / *No verificar*. En la cotización solo avisa. En la orden y la venta directa, *Bloquear* impide pasar del Disponible. Al completar el cobro se revisa el Actual. |
| K13 | **Listas de precios en cascada** | Artículo + unidad de venta + moneda, con tienda y tipo de cliente opcionales. Orden: tienda y tipo → tienda → tipo → general → precio sugerido de GI-02 (solo PEN). IGV incluido. Descuento en rango, precio mínimo y obsequio con motivo. Si al cambiar la moneda falta un precio, **se revierte**. |
| K14 | **La caja es de la tienda** | Una caja abierta por tienda y moneda. Pestañas **Por cobrar**, **Cobros**, **Ingresos y egresos** y **Devoluciones de dinero**. Cierre con **conteo ciego**: el esperado solo lo ve el supervisor y la diferencia aparece al confirmar. Los movimientos no se borran: se anulan. |
| K15 | **Fecha de creación** | Todos los listados y fichas dicen «Fecha de creación». La fecha la pone el sistema: no se registra con fecha pasada. |
| K16 | **Permisos por acción** | `ver_*`, `crear_*`, `anular_venta`, `crear_devolucion_venta`, `crear_caja`, `editar_caja`, `asignar_vendedor`, `editar_precios`, `configurar_comercial`. Se exigen en las reglas, no solo ocultando botones. Perfiles de la demo: Vendedor, Cajero y Supervisor comercial. |
| K17 | **El cliente es un socio propio de Comercial** | No se unifica con el proveedor (T6). Documento único por empresa (DNI 8, RUC 11, CE). El tipo de cliente define el nivel de precios. El estado comercial se deriva de las compras. Baja lógica. |

---

## 4. Pantallas

| Código | Pantalla | Qué hace |
|---|---|---|
| CM-01 | Cotizaciones | Listado, nueva, edición línea por línea, clonar, cancelar, PDF y **Copiar a orden de venta** |
| CM-13 | Órdenes de venta | Listado con % atendido, nueva (directa o copiada de una cotización, con entrega) y ficha: Pedido/Atendido/Pendiente/Comprometido, **Copiar a venta**, Cerrar, Cancelar, PDF |
| CM-02 | Ventas | Listado con saldo, **Desde orden de venta** y **+ Venta directa**. Formulario con comprobante y cobros. Ficha: Cobrar, Devolución, Anular y PDF, con las pestañas Detalle, Cobros, Devoluciones, Movimientos de stock e Historial |
| CM-03 | Devoluciones | Listado, nueva desde una venta Pagada, ficha con ingreso de almacén y estado del dinero |
| CM-04 | Caja de la tienda | Abrir, por cobrar, cobros, ingresos y egresos, devolver dinero, reporte del día, cerrar |
| CM-05 | Historial de cajas | Detalle, PDF y Excel |
| CM-06 | Existencias y movimientos | Actual, Comprometido, Disponible y Kardex (motor V9) |
| CM-07 | Clientes | Listado, ficha (cotizaciones, órdenes, ventas, devoluciones) y alta rápida |
| CM-08 | Listas de precios | Filas por nivel, simulador de la cascada |
| CM-09 | Artículos de venta | Precio sugerido, mínimo, descuento, IGV, control de stock |
| CM-10 | Configuración | Parámetros, categorías de caja, tiendas/cajas/series, medios de pago, perfiles y permisos |
| CM-11 | Solicitudes de Pedido | **Misma pantalla GP-01/GP-03 de Logística**: crear, editar, enviar, V°B°, aprobar, rechazar |
| CM-12 | Solicitudes de Materiales | **Misma pantalla GI-13 de Logística**: Comercial crea y consulta; Logística aprueba y define Compra o Transferencia |

**Vista compartida (2026-09-15).** CM-11 y CM-12 no duplican código. Abren las pantallas de `INVENTARIOS/index.html` sin su menú (antes `Prototipo_GP.html`) (`?vista=comercial&usuario=…`). Las Solicitudes de Pedido y de Materiales, con el comprometido que dejan, se guardan en `localStorage` (`imperiotex.v9.solicitudes`). Así Logística y Comercial ven y editan los mismos documentos. Producción solo ve las aprobadas en PR-03. Los permisos nuevos son `ver_solicitud_pedido` y `crear_solicitud_materiales` (Vendedor y Supervisor comercial). En el listado GP-01 se quitó la columna «Artículos solicitados».

Cada listado exporta a **Excel** (CSV). Cotización, orden, venta y caja tienen **PDF** (vista de impresión).

---

## 5. Stock y dinero por documento

| Acción | Stock (T1/T2) | Caja |
|---|---|---|
| Crear cotización | — | — |
| Crear orden de venta | Comprometido + | — |
| Copiar orden a venta | El compromiso pasa de la orden a la venta | Cobros opcionales |
| Venta directa | Comprometido + | Cobros opcionales |
| Cobro que completa el total | **Salida** GI-10 por almacén: Actual −, Comprometido − | Cobro en la caja abierta |
| Cerrar / cancelar orden | Comprometido − (lo pendiente) | — |
| Anular venta Pendiente de pago | Comprometido − (vuelve a la orden si venía de una) | Lo cobrado, por devolver |
| Anular venta Pagada (en plazo) | **Ingreso** «Devoluciones de Clientes»: Actual + | Lo cobrado, por devolver |
| Devolución | **Ingreso** GI-09 (mal estado → `SB-ALM-REM`) | Total, por devolver |
| Devolver dinero | — | Movimiento tipo Devolución |

| Paso entre documentos | Regla (`js/core/ventas.js`) |
|---|---|
| Cotización → Orden | `OV.desdeCotizacion` + `OV.crear`: la cotización queda Cerrada con el número de la orden |
| Orden → Venta | `Ventas.desdeOrden` + `Ventas.registrar`: líneas con `ovLinea`; suma `atendida` y cierra la orden si no queda pendiente |
| Venta → Cobro | `Ventas.cobrar` → `_siPagada` → `Stock.salida` con `liberaComp` |
| Venta → Devolución | `Dev.crear` → `Stock.ingreso` + devolución de dinero Pendiente |
| Dinero por devolver → Caja | `Caja.procesarReembolso` |

---

## 6. Encaje con los otros prototipos V9

| Con | Cómo encaja |
|---|---|
| **GI** | Usa los mismos artículos, grupos, unidades y almacenes (`SB-ALM-PT`, `SB-TDA-01/02`, `SB-ALM-REM`). La venta pagada es la Salida «Venta al por menor / por mayor» de GI-10 y la devolución el Ingreso «Devoluciones de Clientes» de GI-09 (T2). Precio sugerido, precio mínimo y afectación IGV vienen de la pestaña **Venta** de GI-02. |
| **Existencias (T1/T7)** | Disponible = Actual − Comprometido. La **orden de venta** compromete igual que la Solicitud de Pedido aprobada o la transferencia aprobada, así le quita disponible a las demás. |
| **GPV7** | El producto terminado que se vende es el que recibe Producción. El costo de salida es el costo promedio que dejan los recibos. |
| **GP** | La Solicitud de Pedido es una pantalla compartida (CM-11). Comercial crea Solicitudes de Materiales (CM-12). Producción solo ve las aprobadas (PR-03). |
| **CO** | Del catálogo de condiciones de pago de CO-02 solo se usa **Contado**. El cliente no se unifica con el proveedor (T6). |
| **Backend `comercial`** | Toma del MS real la caja de la tienda (V47), el plazo de anulación congelado (V33), varios cobros por venta (V31), el cobro que sabe su caja (V44) y el rastro de la devolución de dinero (V46). |

---

## 7. Mejoras de `10-mejoras-y-defectos.md`

| # | Estado en el prototipo |
|---|---|
| D1 anulación lógica de ventas | ✅ Anulada con motivo, plazo y reversa de stock y dinero |
| D2 cotización convertida | ✅ Queda Cerrada con el número de la orden; no se copia dos veces |
| D4 historial | ✅ En cotización, orden y venta |
| D5 baja lógica de clientes | ✅ |
| F1 editar ventas guardadas | ⛔ No: se corrige anulando o devolviendo (como el backend) |
| F2 agregar pagos | ✅ «Cobrar» en la venta y en caja |
| F3 revalidar stock | ✅ Al crear la orden, al registrar la venta directa y al completar el cobro |
| F12 obsequio con motivo | ✅ |
| F13 entrega | ✅ En la orden de venta |
| C1 nombres confusos | ✅ Un solo estado de cobro: «Cobrado» |
| C2, C5, C6 validación de pagos | No aplica: registrar el cobro ya es cobrado (K8) |
| C4 devolución ≠ egreso | ✅ Movimiento tipo Devolución |
| C7 moneda de la devolución | ✅ En la caja de la misma moneda |
| R1 cambio | Devolución + venta nueva |
| R2 máximo con varias devoluciones | ✅ |
| D3 / R4 anular devolución | No: la devolución tiene efecto al registrarse |
| Q1 validez de cotización | ✅ Marca de vencida, no se copia |
| Q2 clonar cotización | ✅ |
| F11 idempotencia / B3 transacciones | Son del backend. El prototipo valida todo antes de cambiar datos |

---

## 8. Demo

| Usuario | Perfil | Tienda |
|---|---|---|
| USER12 Lucía Paredes (por defecto) | Supervisor comercial | Tienda Gamarra 1 |
| USER10 Karina Salas | Vendedor | Tienda Gamarra 1 |
| USER11 Pedro Ríos | Cajero | Tienda Gamarra 1 |
| USER13 Diego Campos | Vendedor | Local Mayorista |
| USER14 Rosa Medina | Cajero | Local Mayorista |
| USER15 Iván Torres | Vendedor | Tienda Gamarra 2 |

Escenario:

- **Cotizaciones.** Una vencida, una cancelada, una en dólares para exportación y una abierta con un servicio personalizado.
- **Mayorista.** Una cotización se copia a una orden de venta con envío por agencia. Esa orden se atiende **por partes**: se vende la mitad de PT-0003 con factura pagada por transferencia (sale el stock) y lo demás sigue comprometido. Luego se registra una devolución en mal estado, con el dinero por devolver en la caja mayorista.
- **Ayer, Tienda Gamarra 1.** Cuatro ventas directas cobradas en efectivo, POS y transferencia, un egreso y un cierre con S/ 2.00 de faltante.
- **Hoy, Tienda Gamarra 1:**
  - Una venta pagada y anulada, con el dinero devuelto.
  - Un cambio de talla (devolución más venta nueva).
  - Una factura de servicios **Pendiente de pago**.
  - Una venta con Yape a cuenta que sigue **Pendiente de pago**, con el stock comprometido.
  - Una **orden de venta** en la que un mayorista separa 4 casacas.
  - Movimientos de caja chica.

---

## 9. Fuera de alcance y preguntas abiertas

**Fuera de alcance:**

- Emisión SUNAT (boleta y factura electrónicas, baja, resumen diario, nota de crédito fiscal).
- Crédito y cuentas por cobrar con vencimiento.
- Envíos con seguimiento, liquidaciones, reposición a tienda y dashboards.
- Multiempresa real, idempotencia y seguridad de API.

| # | Pregunta |
|---|---|
| Q-C1 | ✅ **Resuelta (2026-09-15):** cuatro documentos. La orden compromete, la venta es el comprobante y el cobro completo saca el stock (K1–K8). |
| Q-C2 | Si una orden de venta mayorista no tiene producto terminado, ¿se genera la **Solicitud de Pedido** de GP desde la orden? |
| Q-C3 | ¿La **reposición a tienda** (transferencia GI-11 pedida por la tienda) se prototipa aquí o en GI? |
| Q-C4 | ¿Se prototipan SUNAT, envíos, cambios y liquidaciones que ya existen en el backend? |
| Q-C5 | ¿Un cliente puede pagar en la caja de **otra tienda**? Hoy el cobro entra a la caja de la tienda de la venta. |
| Q-C6 | Tipos de cliente: el prototipo usa 4 y el backend tiene 7 (incluye los de servicios). ¿Se unifican? |
| Q-C7 | ✅ **Resuelta:** no hay validación de pagos; registrar el cobro es cobrado (K8). |
