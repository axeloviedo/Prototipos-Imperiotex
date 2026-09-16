# 12 · Prototipo Comercial V9 — diseño y decisiones

> 2026-09-15 · `PROTOTIPOS V9/COMERCIAL/`. Prototipo navegable del área comercial que encaja con Inventarios (GI), Compras (CO), Gestión de Pedido (GP) y Producción (GPV7).
> Los documentos `01`–`11` de esta carpeta describen un sistema de ventas que ya funciona. Son el **lineamiento funcional**, no la fuente de verdad: dentro de V9 manda lo que se decide aquí y en `../00_DECISIONES_CERRADAS.md`.
> El modelo de datos está en `13-modelo-datos-v9.md`, los contratos funcionales en `14-contratos-funcionales.md` y los códigos de pantallas y modales (CL-xx) en `15-codigos-pantallas.md`.
> **Base de datos compartida (2026-09-16):** Comercial trabaja sobre `BD.d` (clave `imperiotex.bd`), con el mismo stock, movimientos y artículos que Inventarios, Compras y Producción. Ver §11.
> **Revisión 2026-09-16:** ver §10 «Decisiones cerradas de la revisión 2026-09-16». Se aplican sobre el código que está en el repo (Cotización → Venta → Devolución, con pagos por validar en caja y sin orden de venta cargada). Donde choquen con K1–K17, manda §10.
> **Tercera versión (2026-09-15), simplificada a pedido del usuario:** «debe ser más simple, tal como lo hace SAP B1». Reemplaza la versión anterior, en la que la venta tenía estados de orden y de entrega, el comprobante iba aparte y los pagos se validaban.

---

## 1. Cómo abrirlo

| Qué | Dónde |
|---|---|
| Prototipo | `COMERCIAL/index.html` (multi-archivo, igual que `GPV7`) |
| Reglas de negocio, sin pantalla | `js/core/precios.js` (listas y totales), `ventas.js` (`Cli`, `Doc`, `Cot`, `OV`, `Ventas`, `Dev`), `caja.js`, `config.js` |
| Datos | `../COMPARTIDO/bd/datos/maestros-comercial.js` (maestros y colecciones de Comercial), `js/data/maestros.js` (fachada `M` de lectura), `js/data/demo.js` (`Demo.historia()`) · stock: `../COMPARTIDO/bd/stock.js` |
| Pantallas | `js/modules/*.js`: una por submódulo; `documento.js` reúne las piezas compartidas |

- En Chrome o Edge se abre con doble clic. Dentro del panel del ERP hay que servir la carpeta `PROTOTIPOS V9` por HTTP y entrar a `/COMERCIAL/index.html`, igual que con GPV7.
- Lo registrado se guarda en la base compartida (`localStorage` `imperiotex.bd`). El selector **Datos** de la barra superior y **↺ Reiniciar todo el prototipo** (CL-46) reinician TODOS los módulos con «Solo maestros» o «Con operación» (§11).
- Las fechas de la historia de la demo son fijas: 27/07/2026 a 31/07/2026 (§11).
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

Códigos **CL-xx** desde 2026-09-16: la tabla completa, con fichas y modales, está en `15-codigos-pantallas.md`.

| Código | Pantalla | Qué hace |
|---|---|---|
| CL-01 · CL-02 | Cotizaciones · ficha | Listado, nueva, edición línea por línea, clonar, anular, PDF y **Convertir en venta** |
| CL-05 · CL-07 · CL-09 | Ventas · nueva venta · ficha | Listado con saldo y estado del stock, **Desde cotización** y **+ Nueva venta**. Formulario con comprobante y pagos. Ficha: Pago, Devolución (solo con salida), Anular y PDF, con las pestañas Detalle, Pagos, Devoluciones, Movimientos de stock e Historial |
| CL-13 · CL-15 | Devoluciones · ficha | Listado, nueva desde una venta **con salida de stock**, ficha con ingreso de almacén y estado del dinero |
| CL-18 | Caja de la tienda | Abrir, cobros (validar o rechazar), por cobrar, ingresos y egresos, devolver dinero, reporte del día, cerrar |
| CL-28 | Historial de cajas | Detalle, PDF y Excel |
| CL-30 | Solicitudes de Fabricación | **Misma pantalla GI-21 / GI-22 / GI-23 de Inventarios** (documentos SF-000001): crear, editar, enviar, V°B°, aprobar, rechazar |
| CL-31 | Solicitudes de Materiales | **Misma pantalla GI-13 de Inventarios**: Comercial crea y consulta; Logística aprueba y define Compra o Transferencia |
| CL-32 | Existencias y movimientos | Actual, Comprometido (con lo que comprometen las ventas pendientes), Disponible y Kardex (motor V9) |
| CL-34 · CL-35 | Clientes · ficha | Listado, ficha (ventas, cotizaciones, devoluciones) y alta rápida |
| CL-40 | Listas de precios | Filas por nivel, simulador de la cascada |
| CL-43 | Artículos de venta | Precio sugerido, mínimo, descuento, IGV, control de stock |
| CL-45 | Configuración | Parámetros, categorías de caja, tiendas/cajas/series, medios de pago, perfiles y permisos |

> La pantalla de Órdenes de venta (antes CM-13, `js/modules/ordenes.js`) es de otra versión: `index.html` no la carga y no tiene código CL.

**Vista compartida (2026-09-15, actualizada 2026-09-16).** CL-30 y CL-31 no duplican código. Están en el menú **Abastecimiento** y abren las pantallas de `INVENTARIOS/index.html` sin su menú (`?vista=comercial&usuario=…#gi21` y `#gi13`). Las Solicitudes de Fabricación y de Materiales, con el comprometido que dejan, se guardan en la base compartida (`BD.d.sfs` y `BD.d.sols`). Así Logística y Comercial ven y editan los mismos documentos. Producción solo ve las aprobadas en PR-03. Los permisos son `ver_solicitud_fabricacion` (antes `ver_solicitud_pedido`) y `crear_solicitud_materiales`, para Vendedor y Supervisor comercial.

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
| **GI · Solicitudes** | La Solicitud de Fabricación (GI-21 / GI-22 / GI-23, documentos SF-000001) es una pantalla compartida (CL-30). Comercial crea Solicitudes de Materiales (CL-31, GI-13). Producción solo ve las aprobadas (PR-03). |
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
| USER12 Lucía Paredes (por defecto) | Supervisor comercial | Tienda #1 · Galería "Ya" (SB-TIENDA01) |
| USER10 Karina Salas | Vendedor | Tienda #1 · Galería "Ya" (SB-TIENDA01) |
| USER11 Pedro Ríos | Cajero | Tienda #1 · Galería "Ya" (SB-TIENDA01) |
| USER13 Diego Campos | Vendedor | Local Mayorista |
| USER14 Rosa Medina | Cajero | Local Mayorista |
| USER15 Iván Torres | Vendedor | Tienda #2 · Galería "Damero" (SB-TIENDA02) |

Escenario (versión anterior a la base compartida; la historia vigente está en §11):

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
| Q-C2 | Si una orden de venta mayorista no tiene producto terminado, ¿se genera la **Solicitud de Fabricación** (GI-21) desde la orden? |
| Q-C3 | ¿La **reposición a tienda** (transferencia GI-11 pedida por la tienda) se prototipa aquí o en GI? |
| Q-C4 | ¿Se prototipan SUNAT, envíos, cambios y liquidaciones que ya existen en el backend? |
| Q-C5 | ¿Un cliente puede pagar en la caja de **otra tienda**? Hoy el cobro entra a la caja de la tienda de la venta. |
| Q-C6 | Tipos de cliente: el prototipo usa 4 y el backend tiene 7 (incluye los de servicios). ¿Se unifican? |
| Q-C7 | ✅ **Resuelta:** no hay validación de pagos; registrar el cobro es cobrado (K8). |

---

## 10. Decisiones cerradas · revisión 2026-09-16

> Se aplican al prototipo que está en el repo (`index.html` carga Cotizaciones, Ventas, Devoluciones, Caja, Consultas, Maestros, Configuración y Solicitudes). En esa versión la venta tiene estado **Registrada / Anulada**, los pagos entran a caja **Por validar** y existe la condición de crédito.

| # | Decisión | Detalle |
|---|---|---|
| R1 | **DECISIÓN CERRADA · la venta pendiente compromete y el pago confirmado completo saca el stock** | Al registrar la venta, cada línea inventariable **compromete** su cantidad (UM de inventario) en su almacén: sube el Comprometido y baja el Disponible (Disponible = Actual − Comprometido). No se crea ningún movimiento. El pago confirmado es el pago **validado** en caja. Cuando la suma de pagos validados cubre el total, se registra la **Salida** GI-10 («Venta al por menor / al por mayor», concepto 21), una por almacén. La Salida baja el Actual, libera lo comprometido de la venta y guarda el costo. Un pago parcial validado no mueve stock. Un pago por validar tampoco. |
| R1.a | Avisos y bloqueo al registrar | El control de stock del artículo se revisa contra el **Disponible**, que ya descuenta lo comprometido por otras ventas pendientes. *Bloquear* impide registrar. *Avisar y permitir* deja registrar con aviso (CL-08): el comprometido puede superar al Actual y, al salir, el Actual puede quedar negativo. La Salida no vuelve a bloquear, porque dispararla es validar un pago en caja. |
| R1.b | Crédito | Misma regla que el contado. La condición de pago solo fija el vencimiento del saldo: el stock queda comprometido hasta que lo validado cubra el total. Si el negocio necesita entregar mercadería a crédito antes de cobrar, queda como pregunta abierta (Q-C8). |
| R1.c | Anular venta | Sin salida: **libera lo comprometido**, sin plazo y sin movimientos. Con salida: solo dentro del plazo (`plazoAnular`) y devuelve el stock con un Ingreso «Devoluciones de Clientes», como antes. En ambos casos los pagos por validar se anulan y lo validado queda **por devolver** en caja. |
| R1.d | Rechazar pago | Anula el pago y no toca el stock: la venta sigue con su stock comprometido. |
| R1.e | Devoluciones | Solo de lo que **ya salió**: la venta debe tener su Salida. Mientras el stock está comprometido no hay nada que devolver; si la venta ya no va, se anula. |
| R1.f | Consultas | CL-32 dice que Comercial sí compromete y muestra cuánto comprometido es de ventas pendientes. El Kardex solo muestra el Actual. La ficha de la venta muestra el estado del stock (**Stock comprometido / entregado / liberado / devuelto**) y el listado se filtra por él. El estado de pago suma «Por validar» (lo registrado cubre el total pero aún no está validado). |
| R1.g | Demo (versión 4) | Se arma con los mismos servicios. Ayer, cuatro ventas validadas con su salida. La mayorista a crédito tiene un pago parcial validado y el stock comprometido. La venta mixta tiene el Yape por validar y el stock comprometido. Una venta anulada liberó su compromiso. La devolución pendiente en mal estado es de una factura que ya salió. Comprometido = inicial de otros módulos + ventas pendientes, sin negativos. |
| R2 | **Sin tipo de cotización** | Se quitó «Tipo» (Productos / Servicios / Mixta, función `Doc.tipoDoc`) de listados, filtros, CSV y fichas de cotización. Como salía de la misma función, también se quitó de Ventas: columna, filtro y subtítulo del total. El filtro se reemplazó por «Stock». |
| R3 | **«Fecha de creación»** | Es la etiqueta de la fecha de cotizaciones, ventas, devoluciones, pagos, devoluciones de dinero y movimientos de caja, en listados, fichas, modales, PDF y CSV. La fecha de la venta la pone el sistema al registrar: el formulario ya no permite elegir una fecha anterior. Los movimientos de stock (documentos de Inventarios) conservan «Fecha». |
| R4 | **Códigos CL-xx** | Cada pantalla, ficha/formulario y modal tiene un código único correlativo (CL-01 … CL-46), visible en su encabezado. Reemplaza a CM-01…CM-12. Los ids de ruta (`cm01`, `cm02v`, …) no cambian. Tabla completa en `15-codigos-pantallas.md`. |
| R5 | **Solicitudes compartidas** | Menú **Abastecimiento**: Solicitudes de Fabricación (CL-30, `#gi21` de Inventarios; GI-21 listado, GI-22 formulario, GI-23 ficha; documentos SF-000001) y Solicitudes de Materiales (CL-31, `#gi13`). Permisos `ver_solicitud_fabricacion` (renombra `ver_solicitud_pedido`) y `crear_solicitud_materiales` para Vendedor y Supervisor comercial, también en la tabla de permisos de CL-45. Producción solo ve las aprobadas (PR-03). |
| R6 | **Reinicio global** | `Store.reiniciar()` («↺ Reiniciar todo el prototipo», modal CL-46) borra de `localStorage` todas las claves que empiezan con `imperiotex.` (Inventarios, Compras, Producción y Comercial) y recarga la demo de Comercial. Los otros módulos arman su escenario inicial al abrirse. |

| # | Pregunta abierta |
|---|---|
| Q-C8 | ¿Una venta a crédito debe entregar (sacar stock) antes de cobrar? Hoy sigue la misma regla que el contado (R1.b). |

---

## 11. Base de datos compartida (2026-09-16)

> Contrato: `../../docs/16_BASE_DATOS_COMPARTIDA.md`. Comercial deja de tener datos propios en `localStorage` (se eliminó `imperiotex.v9.comercial`) y su `js/core/stock.js`.

| # | Cambio | Detalle |
|---|---|---|
| B1 | **Una sola base** | `Store.d` es `BD.d`; `Store.iniciar` → `BD.iniciar`, `Store.guardar` → `BD.guardar`, `Store.sig` → `BD.sig` con series propias (`cli`, `cot`, `ven`, `dev`, `pag`, `caja`, `cmov`, `ree`, `lp`, `comp_<serie>`). `BD.alCambiar` refresca la pantalla cuando otro módulo guarda. `Store.completarBase()` agrega los datos de Comercial que falten a una base guardada antes. |
| B2 | **Maestros de Comercial** | `COMPARTIDO/bd/datos/maestros-comercial.js`: `maestros.comercial` (tiendas, cajas, monedas, condiciones, medios de pago, comprobantes y series, entrega, agencias, motivos, control de stock, afectación, tipos de documento y de cliente, ubigeos, usuarios, perfiles), servicios `SERV-VTA-0001..0003` (grupo SRV, `origen: 'comercial'`) y sus categorías; colecciones `clientes` (8), `listas` (22), `comercial.cfg` y vacías `cots`, `ventas`, `devs`, `sesiones`, `cmovs`. `js/data/maestros.js` es solo la fachada `M` que lee la base. |
| B3 | **Tiendas reales** | TDA-01 Tienda #1 Galería "Ya" → **SB-TIENDA01** · TDA-02 Tienda #2 Galería "Damero" → **SB-TIENDA02** · MAY-01 Local Mayorista → **SB-CENTRAL** (a confirmar). Devoluciones en mal estado → **SB-LIQUID**. Los almacenes elegibles en las líneas son los de venta de la base (producto terminado, liquidación, online y tiendas SB). |
| B4 | **Artículos** | Se venden los de `BD.d.maestros.articulos` con `venta: true`: Zuleika PT-0001..0004 (pestaña Venta: `precioVenta`, `precioMin`, `uVenta`, `dctoMin`, `dctoMax`, `stockCtrl`) y los servicios SERV-VTA-*. CL-43/CL-44 editan esa pestaña en la base; `verifMin` es un campo que agrega Comercial. Estado activo = `estado !== 'Inactivo'`. |
| B5 | **Stock compartido** | Todo con `Stock` de `COMPARTIDO/bd/stock.js`, `modulo: 'Comercial'` y tipo de movimiento: venta **SAL-VENTA**, devolución y anulación con salida **ING-DEVCLI**, devolución en mal estado: ING-DEVCLI a la tienda y **TRF-LIQUID** a SB-LIQUID, reposición de tienda **TRF-REPTIENDA**, carga inicial de la demo **ING-INICIAL**. Lo que vende Comercial aparece en el Kardex y movimientos de Inventarios; lo que fabrica Producción aparece disponible para vender. |
| B6 | **Cambio a R1.a** | El `Stock` compartido no deja el Actual en negativo. Con *Avisar y permitir* se puede registrar la venta aunque el comprometido supere al Actual, pero **validar el pago que completa el total se rechaza** (sin cambios a medias) hasta que haya Actual suficiente. |
| B7 | **CL-32** | Existencias de todos los almacenes de la base (por defecto los de venta), movimientos de todos los módulos con filtros por tipo, tipo de movimiento (`tipoMov`), módulo y almacén; Kardex de cualquier almacén. |
| B8 | **Escenarios y reinicio** | `BDSelector` en la barra superior («Datos: Solo maestros · Con operación · ↺ Reiniciar»). CL-46 se conserva y llama a `BD.reiniciar()` con el escenario actual y recarga. El usuario activo de la demo se guarda en `localStorage` `imperiotex.comercial.usuario` (el reinicio lo borra). En «Solo maestros» hay clientes, listas y configuración, sin cotizaciones, ventas, cajas ni movimientos. |
| B9 | **Demo.historia()** | Ya no crea el estado. Sobre la base (después de la historia de Producción, que deja PT en SB-CENTRAL): si falta producto terminado, carga inicial ING-INICIAL solo de lo que falta; reposición TRF-REPTIENDA a SB-TIENDA01 y SB-TIENDA02; 27/07 cotizaciones (una anulada, una de Tienda #2); 28-29/07 mayorista en docenas → factura a crédito (compromete en SB-CENTRAL), exportación en USD vigente hasta el 31/12/2026 y una con servicio; 30/07 caja de Tienda #1 con cuatro ventas validadas (salen), egreso y cierre con S/ 2.00 de faltante; 31/07 cajas abiertas, venta anulada (libera), pago parcial validado de la mayorista (sigue comprometida), cambio de prenda con devolución de dinero, factura de servicios, devolución pendiente en mal estado, venta mixta con Yape por validar (comprometida) y caja chica. Sin DOM; la ejecuta el generador de `escenario-operacion.js`. |

| # | Propuesta para el núcleo |
|---|---|
| PN1 | `BD.iniciar` debería completar los maestros y colecciones de área que falten en una base ya guardada (hoy lo hace `Store.completarBase`). |
| PN2 | Agregar `verifMin` (verificar precio mínimo por artículo) a la pestaña Venta del artículo (§3.2). |
| PN3 | Aclarar en el contrato si el local mayorista vende desde SB-CENTRAL o desde un almacén propio. |
