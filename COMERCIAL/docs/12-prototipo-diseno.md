# 12 · Prototipo Comercial V9 — diseño y decisiones

> 2026-09-15 · `PROTOTIPOS V9/COMERCIAL/`. Prototipo navegable del área comercial que encaja con Inventarios (GI), Compras (CO), Gestión de Pedido (GP) y Producción (GPV7).
> Los documentos `01`–`11` de esta carpeta describen un sistema de ventas que ya funciona. Son el **lineamiento funcional**, no la fuente de verdad: dentro de V9 manda lo que se decide aquí y en `../00_DECISIONES_CERRADAS.md`.
> El modelo de datos está en `13-modelo-datos-v9.md`, los contratos funcionales en `14-contratos-funcionales.md` y los códigos de pantallas y modales (CL-xx) en `15-codigos-pantallas.md`.
> **Base de datos compartida (2026-09-16):** Comercial trabaja sobre `BD.d` (clave `imperiotex.bd`), con el mismo stock, movimientos y artículos que Inventarios, Compras y Producción. Ver §11.
> **Revisión 2026-09-16:** ver §10 «Decisiones cerradas de la revisión 2026-09-16». Se aplican sobre el código que está en el repo (Cotización → Venta → Devolución, con pagos por validar en caja y sin orden de venta cargada). Donde choquen con K1–K17, manda §10.
> **Cambios y devoluciones (2026-09-18):** ver §13. Un cambio es una devolución con «Se lleva»; el dinero queda como **saldo a favor** del cliente y paga la venta nueva. Revisa K10.
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
                                                          └──▶ Cambio / devolución (vuelve el stock; el dinero queda como saldo a favor
                                                               y paga lo que se lleva: venta nueva con «Saldo a favor», §13)
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
| K10 | **Devolución de una venta Pagada** *(revisada 2026-09-18 por CD1–CD9, §13: el dinero queda como saldo a favor y el cambio se registra en la misma devolución)* | Registrar = efecto inmediato. Por línea: cantidad ≤ vendido − devuelto y estado **Normal** o **Mal estado**. Motivo obligatorio. Ingreso GI-09 «Devoluciones de Clientes» (concepto **23**) al costo con que salió; mal estado va a `SB-ALM-REM`. El dinero queda **por devolver** en caja. Un cambio es una devolución más una venta nueva. |
| K11 | **Un documento para productos y servicios** | La línea es un artículo: si no es inventariable (grupo SERVICIOS) no lleva almacén ni stock y admite descripción personalizada. |
| K12 | **Sin stock no se vende** *(L6, 2026-09-16)* | Ya no hay control de stock por artículo. En la cotización solo avisa (no reserva stock). La orden y la venta directa **siempre** impiden pasar del Disponible. Al completar el cobro se revisa el Actual. |
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
| CL-13 · CL-15 | Cambios y devoluciones · ficha | Listado con tipo (Cambio / Devolución) y dinero; ficha en dos columnas **Devuelve** / **Se lleva** con la diferencia en vivo; **Aceptar** (CL-16) ingresa el stock, abona el saldo a favor y registra la venta del cambio (§13) |
| CL-18 | Caja de la tienda | Abrir, cobros (validar o rechazar), por cobrar, ingresos y egresos, devolver dinero, reporte del día, cerrar |
| CL-28 | Historial de cajas | Detalle, PDF y Excel |
| CL-30 | Solicitudes de Fabricación | **Misma pantalla GI-21 / GI-22 / GI-23 de Inventarios** (documentos SF-000001): crear, editar, enviar, V°B°, aprobar, rechazar |
| CL-31 | Solicitudes de Materiales | **Misma pantalla GI-13 de Inventarios**: Comercial crea y consulta; Logística aprueba y define Compra o Transferencia |
| CL-32 | Existencias y movimientos | Stock de **todas las tiendas de la empresa** (Actual, Comprometido con lo de ventas pendientes, Disponible, Pedido). Movimientos y Kardex **solo de los almacenes de su sede** (R7) |
| CL-47 | Recepción de mercadería | Las Solicitudes de Transferencia que llegan a su sede: **Por recibir** / **Recibidas**, y **Recibir mercadería** (CL-48, total o incompleta). Misma ST y misma operación que GI-11 (R7) |
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
| Aceptar devolución o cambio (§13) | **Ingreso** GI-09 (mal estado → liquidación); lo que se lleva: venta nueva que compromete y sale al quedar pagada | Crédito → **saldo a favor** (o por devolver en caja, CD8); la venta nueva se paga con saldo; la diferencia, Por validar en caja |
| Devolver dinero | — | Movimiento tipo Devolución |

| Paso entre documentos | Regla (`js/core/ventas.js`) |
|---|---|
| Cotización → Orden | `OV.desdeCotizacion` + `OV.crear`: la cotización queda Cerrada con el número de la orden |
| Orden → Venta | `Ventas.desdeOrden` + `Ventas.registrar`: líneas con `ovLinea`; suma `atendida` y cierra la orden si no queda pendiente |
| Venta → Cobro | `Ventas.cobrar` → `_siPagada` → `Stock.salida` con `liberaComp` |
| Venta → Cambio / devolución | `Dev.crear` (Pendiente) → `Dev.finalizar` (o `Dev.aceptarNueva`): `Stock.ingreso` + `Saldo.abonar` + `Ventas.registrar` de lo que se lleva con pago `SALDO` |
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
| R1 cambio | ✅ Una devolución con «Se lleva»: al aceptarla se registra la venta nueva pagada con el saldo a favor (§13) |
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
  - Cambios y devoluciones con saldo a favor (§13.1).
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
| Q-C2 | ⛔ **Resuelta (2026-09-17):** no. La Solicitud de Fabricación se crea aparte (CL-30). |
| Q-C3 | ✅ **Resuelta (2026-09-17):** la pide Comercial desde su pantalla, con una Solicitud de Materiales (CL-31) que Logística atiende como Transferencia. |
| Q-C4 | ¿Se prototipan SUNAT, envíos, cambios y liquidaciones que ya existen en el backend? |
| Q-C5 | ⛔ **Resuelta (2026-09-17):** el cobro entra a la caja de la tienda de la venta; queda así. |
| Q-C6 | ⛔ **Resuelta (2026-09-17):** se mantienen los 4 del prototipo. |
| Q-C7 | ✅ **Resuelta:** no hay validación de pagos; registrar el cobro es cobrado (K8). |

---

## 10. Decisiones cerradas · revisión 2026-09-16

> Se aplican al prototipo que está en el repo (`index.html` carga Cotizaciones, Ventas, Devoluciones, Caja, Consultas, Maestros, Configuración y Solicitudes). En esa versión la venta tiene estado **Registrada / Anulada**, los pagos entran a caja **Por validar** y existe la condición de crédito.

| # | Decisión | Detalle |
|---|---|---|
| R1 | **DECISIÓN CERRADA · la venta pendiente compromete y el pago confirmado completo saca el stock** | Al registrar la venta, cada línea inventariable **compromete** su cantidad (UM de inventario) en su almacén: sube el Comprometido y baja el Disponible (Disponible = Actual − Comprometido). No se crea ningún movimiento. El pago confirmado es el pago **validado** en caja. Cuando la suma de pagos validados cubre el total, se registra la **Salida** GI-10 («Venta al por menor / al por mayor», concepto 21), una por almacén. La Salida baja el Actual, libera lo comprometido de la venta y guarda el costo. Un pago parcial validado no mueve stock. Un pago por validar tampoco. |
| R1.a | Avisos y bloqueo al registrar | El control de stock del artículo se revisa contra el **Disponible**, que ya descuenta lo comprometido por otras ventas pendientes. *Bloquear* impide registrar. *Avisar y permitir* deja registrar con aviso (CL-08): el comprometido puede superar al Actual y, al salir, el Actual puede quedar negativo. La Salida no vuelve a bloquear, porque dispararla es validar un pago en caja. |
| R1.b | Crédito *(revisada 2026-09-17, N4)* | La condición de pago fija el vencimiento del saldo. En una venta al crédito el usuario **decide si entrega**: al registrar puede marcar «Entregar ahora» (sale el stock, sin esperar el cobro) o dejarlo comprometido hasta que lo validado cubra el total, como el contado. También se entrega después con el botón **Entregar** de la ficha. La salida guarda su motivo (pago confirmado o entrega a crédito). Cierra Q-C8. |
| R1.c | Anular venta | Sin salida: **libera lo comprometido**, sin plazo y sin movimientos. Con salida: solo dentro del plazo (`plazoAnular`) y devuelve el stock con un Ingreso «Devoluciones de Clientes», como antes. En ambos casos los pagos por validar se anulan y lo validado queda **por devolver** en caja. |
| R1.d | Rechazar pago | Anula el pago y no toca el stock: la venta sigue con su stock comprometido. |
| R1.e | Devoluciones | Solo de lo que **ya salió**: la venta debe tener su Salida. Mientras el stock está comprometido no hay nada que devolver; si la venta ya no va, se anula. |
| R1.f | Consultas | CL-32 dice que Comercial sí compromete y muestra cuánto comprometido es de ventas pendientes. El Kardex solo muestra el Actual. La ficha de la venta muestra el estado del stock (**Stock comprometido / entregado / liberado / devuelto**) y el listado se filtra por él. El estado de pago suma «Por validar» (lo registrado cubre el total pero aún no está validado). |
| R1.g | Demo (versión 4) | Se arma con los mismos servicios. Ayer, cuatro ventas validadas con su salida. La mayorista a crédito tiene un pago parcial validado y el stock comprometido. La venta mixta tiene el Yape por validar y el stock comprometido. Una venta anulada liberó su compromiso. La devolución pendiente en mal estado es de una factura que ya salió. Comprometido = inicial de otros módulos + ventas pendientes, sin negativos. |
| R2 | **Sin tipo de cotización** | Se quitó «Tipo» (Productos / Servicios / Mixta, función `Doc.tipoDoc`) de listados, filtros, CSV y fichas de cotización. Como salía de la misma función, también se quitó de Ventas: columna, filtro y subtítulo del total. El filtro se reemplazó por «Stock». |
| R3 | **«Fecha de creación»** | Es la etiqueta de la fecha de cotizaciones, ventas, devoluciones, pagos, devoluciones de dinero y movimientos de caja, en listados, fichas, modales, PDF y CSV. La fecha de la venta la pone el sistema al registrar: el formulario ya no permite elegir una fecha anterior. Los movimientos de stock (documentos de Inventarios) conservan «Fecha». |
| R4 | **Códigos CL-xx** | Cada pantalla, ficha/formulario y modal tiene un código único correlativo (CL-01 … CL-46), visible en su encabezado. Reemplaza a CM-01…CM-12. Los ids de ruta (`cm01`, `cm02v`, …) no cambian. Tabla completa en `15-codigos-pantallas.md`. |
| R5 | **Solicitudes compartidas** | Menú **Abastecimiento**: Solicitudes de Fabricación (CL-30, `#gi21` de Inventarios; GI-21 listado, GI-22 formulario, GI-23 ficha; documentos SF-000001) y Solicitudes de Materiales (CL-31, `#gi13`). Permisos `ver_solicitud_fabricacion` (renombra `ver_solicitud_pedido`) y `crear_solicitud_materiales` para Vendedor y Supervisor comercial, también en la tabla de permisos de CL-45. Producción solo ve las aprobadas (PR-03). |
| R7 | **Recepción de transferencias y alcance por sede** *(2026-09-18, primera instancia para probar)* | **Flujo neutral:** no hay un flujo de Comercial y otro de Logística. Es la misma Solicitud de Transferencia (`BD.d.trfs`, ST-000001) con los mismos estados y la misma operación `Docs.trf.recibir` que GI-11. Comercial solo tiene una pantalla más simple para verla y confirmarla: **CL-47 Recepción de mercadería** (menú Abastecimiento) y el modal **CL-48**; Inventarios no cambia. En la tienda los estados se leen *En camino* (Aprobada), *Llegó incompleto* (Parcial), *Recibido* (Recibida) y *Anulado* (Cancelada). **Quién confirma:** el usuario cuya **sede** es la del almacén de destino (`almacén.sede` = sede física de su tienda) con el permiso `recibir_transferencia` (Vendedor, Cajero y Supervisor comercial), o un **usuario logístico general** (`acceso_logistico_general`, ningún perfil de Comercial lo tiene; Inventarios trabaja así). Una recepción puede empezarse en Comercial y terminarse en GI-11, o al revés. **Qué ve la vendedora:** en CL-32 consulta el **stock de todas las tiendas de la empresa** (solo consulta); los **movimientos y el Kardex solo de los almacenes de su sede** (TDA-01 → SB-TIENDA01, SB-TIENDALIQ01, SB-TIENDALIQ02; TDA-02 → SB-TIENDA02; MAY-01 → almacenes de Gamarra), salvo el usuario logístico general, que ve todo. En la vista compartida GI-13, el enlace a una ST abre CL-47 (antes no pasaba nada: GI-11 está fuera de la vista de Comercial). Código: `Store.almsSede`, `Store.almsTiendas`, `Store.enMiSede`, `js/modules/recepciones.js`. |
| R6 | **Reinicio global** | `Store.reiniciar()` («↺ Reiniciar todo el prototipo», modal CL-46) borra de `localStorage` todas las claves que empiezan con `imperiotex.` (Inventarios, Compras, Producción y Comercial) y recarga la demo de Comercial. Los otros módulos arman su escenario inicial al abrirse. |

| # | Pregunta abierta |
|---|---|
| Q-C8 | ✅ **Resuelta (2026-09-17, N4):** la entrega de una venta al crédito es opcional y la decide el usuario (R1.b). |

---

## 11. Base de datos compartida (2026-09-16)

> Contrato: `../../docs/16_BASE_DATOS_COMPARTIDA.md`. Comercial deja de tener datos propios en `localStorage` (se eliminó `imperiotex.v9.comercial`) y su `js/core/stock.js`: todo va sobre `BD.d` (clave `imperiotex.bd`), con los mismos artículos, stock, movimientos y documentos que Inventarios, Compras y Producción.

### 11.1 Cambios

| # | Cambio | Detalle |
|---|---|---|
| B1 | **Una sola base** | `Store.d` es `BD.d`; `Store.iniciar` → `BD.iniciar`, `Store.guardar` → `BD.guardar`, `Store.sig` → `BD.sig` con series propias (`cli`, `cot`, `ven`, `dev`, `pag`, `caja`, `cmov`, `ree`, `lp`, `comp_<serie>`). `BD.alCambiar` refresca la pantalla cuando otro módulo guarda. `Store.completarBase()` agrega los datos de Comercial que falten a una base guardada antes. |
| B2 | **Maestros de Comercial** | `COMPARTIDO/bd/datos/maestros-comercial.js`: `maestros.comercial` (tiendas, cajas, monedas, condiciones, medios de pago, comprobantes y series, entrega, agencias, motivos, afectación, tipos de documento y de cliente, ubigeos, usuarios, perfiles), servicios `SERV-VTA-0001..0003` (grupo SRV, `origen: 'comercial'`) y sus categorías; colecciones `clientes` (8), `listas` (22), `comercial.cfg` y vacías `cots`, `ventas`, `devs`, `sesiones`, `cmovs`. `js/data/maestros.js` es solo la fachada `M` que lee la base. |
| B3 | **Tiendas reales** | TDA-01 Tienda #1 Galería "Ya" → **SB-TIENDA01** · TDA-02 Tienda #2 Galería "Damero" → **SB-TIENDA02** · MAY-01 Local Mayorista → **SB-CENTRAL** (a confirmar). Devoluciones en mal estado → **SB-LIQUID**. Los almacenes elegibles en las líneas son todos los almacenes activos de la empresa: el usuario elige (L3). |
| B4 | **Artículos** | Se venden los de `BD.d.maestros.articulos` con `venta: true`: Zuleika PT-0001..0004 (pestaña Venta de GI-02: `precioVenta`, `precioMin`, `verifMin`, `uVenta` (una, referencial), `dctoMin`, `dctoMax`) y los servicios SERV-VTA-*. CL-43/CL-44 editan esa pestaña en la base; La línea puede usar cualquier UM con conversión a la de inventario; sin conversión no se agrega (L5). La verificación global del precio mínimo es la de Inventarios · Configuración General (L1). Activo = `estado !== 'Inactivo'`. |
| B5 | **Cambio a R1.a** | El `Stock` compartido no deja el Actual en negativo. Si el comprometido llegara a superar al Actual, **validar el pago que completa el total se rechaza** (sin cambios a medias) hasta que haya Actual suficiente. |
| B6 | **CL-32** | Existencias de las tiendas de la empresa con **Actual, Comprometido, Disponible y Pedido**, con un aviso de lo que viene en camino a su sede (se recibe en CL-47); movimientos con filtros por tipo, tipo de movimiento (`tipoMov`), módulo y almacén, y Kardex, **solo de los almacenes de su sede** (todos para el usuario logístico general, R7). |

### 11.2 Tipos de movimiento que usa Comercial

Todos con `modulo: 'Comercial'` (salvo la recepción de transferencias, que registra `Docs.trf` como Inventarios). No existe el tipo Ajuste (decisión J1): si hubiera que regularizar, se usa **ING-REGULARIZ** / **SAL-REGULARIZ** con motivo y observación; Comercial hoy no regulariza.

| Operación | Tipo | Dónde |
|---|---|---|
| Salida de la venta al validarse el pago que completa el total | **SAL-VENTA** | `Ventas._salidaSiPagada` |
| Devolución finalizada y anulación de una venta que ya salió | **ING-DEVCLI** | `Dev.finalizar`, `Ventas.anular` |
| Traslado de lo devuelto en mal estado al almacén de liquidación | **TRF-LIQUID** | `Dev.finalizar` (transferencia directa, ver 11.3) |
| Reposición de tienda desde SB-CENTRAL | **TRF-REPTIENDA** | `Demo.historia` (y GI-11 en Inventarios) |
| Carga inicial de producto terminado, solo si la base no trae lo suficiente para la historia | **ING-INICIAL** | `Demo.historia` |

### 11.3 Transferencias en dos pasos (T2/T7) y la excepción de liquidación

- La reposición a tienda es una **Solicitud de Transferencia** (`Docs.trf`, `ST-000001`, `BD.d.trfs`): `crear` → `aprobar` (compromete en el origen y suma **Pedido** en el destino) → `recibir` (mueve el stock; parcial o total) · `cancelar` libera lo pendiente. CL-32 muestra el Pedido; la tienda confirma la recepción en CL-47 (R7) o Logística en GI-11.
- **Decisión:** el traslado automático a liquidación de una devolución en mal estado usa `Docs.trf.directa` (crea, aprueba y recibe en el acto). Es la única excepción a los dos pasos: ocurre al finalizar la devolución y no hay nadie que confirme la recepción en ese momento. Antes de mover nada se verifica que lo devuelto quede disponible en la tienda.

### 11.4 Escenarios de datos y reinicio global

- **Solo maestros:** maestros comunes + los de Comercial; clientes, listas de precios y configuración con su valor inicial; sin stock, movimientos, cotizaciones, ventas, devoluciones, cajas ni movimientos de caja.
- **Con operación:** `COMPARTIDO/bd/datos/escenario-operacion.js`, generado ejecutando la historia de Producción y luego `Demo.historia()` de Comercial (mientras no exista, se usa «Solo maestros»).
- **Reinicio global:** el selector «Datos» de la barra superior (`BDSelector`) y «↺ Reiniciar todo el prototipo» (modal CL-46, que llama a `BD.reiniciar()` con el escenario actual y recarga) borran todas las claves `imperiotex.` y dejan a los cuatro módulos en el escenario elegido. El usuario activo de la demo se guarda aparte en `imperiotex.comercial.usuario` y también se borra.

### 11.5 Demo.historia()

Ya no crea el estado: trabaja sobre la base (normalmente después de la historia de Producción, que deja PT en SB-CENTRAL), sin DOM y con fechas fijas (`BD.reloj`/`UI.reloj`):

- **27/07:** si falta producto terminado, carga inicial ING-INICIAL solo de lo que falta. Se crean y **aprueban** las reposiciones TRF-REPTIENDA a SB-TIENDA01 y SB-TIENDA02. Cotizaciones: una que vencerá, una anulada y una de Tienda #2.
- **28/07:** las tiendas **reciben** las reposiciones. Cotización mayorista en docenas.
- **29/07:** esa cotización pasa a factura a crédito (compromete en SB-CENTRAL). Cotización de exportación en USD, vigente hasta el 31/12/2026, y otra con servicio.
- **30/07:** caja de Tienda #1 con cuatro ventas validadas (sale el stock), un egreso y cierre con S/ 2.00 de faltante.
- **31/07:**
  - Se abren las cajas.
  - Venta anulada (libera lo comprometido).
  - Pago parcial validado de la mayorista (sigue comprometida).
  - Cambios y devoluciones con el flujo de §13: cambio sin diferencia, cambio con diferencia en Yape, cambio del mayorista que deja S/ 88.00 a favor, devolución a saldo a favor y uso de ese saldo en una compra mayor (casos de §13.1).
  - Factura de servicios.
  - Devolución pendiente en mal estado.
  - Venta mixta con Yape por validar (comprometida).
  - Caja chica.
  - **Una reposición a SB-TIENDA02 aprobada sin recibir**, que se ve como Pedido.

| # | Propuesta para el núcleo |
|---|---|
| PN1 | `BD.iniciar` debería completar los maestros y colecciones de área que falten en una base ya guardada (hoy lo hace `Store.completarBase`). |
| PN2 | ~~Agregar `verifMin` a la pestaña Venta del artículo~~ Hecho (L1). |
| PN3 | Aclarar en el contrato si el local mayorista vende desde SB-CENTRAL o desde un almacén propio. |
| PN4 | `Docs.trf.recibir` fija `modulo: 'Inventarios'`; convendría aceptar el módulo que llama (p. ej. Comercial en la reposición o en la devolución a liquidación). |

---

## 13. Cambios y devoluciones con saldo a favor (2026-09-18)

> Caso: una venta ya pagada y con salida de stock necesita un cambio de prenda (talla, color o modelo). El negocio dijo **«solo cambios, no devoluciones de dinero»**.
> Referencia SAP B1: el comprobante no se edita, se corrige con una **nota de crédito**; los cobros originales no se tocan; la nota deja un **saldo a favor** que se aplica a la factura nueva; no existe un documento «Cambio» (es nota de crédito + venta nueva); la baja del comprobante solo aplica a un error del mismo día.
> Respuestas del usuario (2026-09-18): el N° de la nota de crédito **se escribe a mano** (se emite en el sistema de facturación) · el saldo a favor **no vence** · aceptan el **Vendedor y el Supervisor comercial**.
> Revisa K10, R1.e y el paso «Venta → Devolución» de §5. Rama `feat/comercial-cambios-saldo-favor`.

| # | Decisión | Detalle |
|---|---|---|
| CD1 | **Un cambio es una devolución con «Se lleva»** | Se mantiene el menú (ahora **Cambios y devoluciones**) y los estados **Pendiente / Finalizada / Anulada**. CL-15 tiene dos columnas: **Devuelve** (líneas de la venta, estado **Normal** o **Mal estado**; el tipo «Cambio» de línea desaparece) y **Se lleva** (artículos nuevos con el mismo buscador CL-39 y los mismos precios de cualquier venta: tienda, cliente y moneda de la venta original). Abajo, en vivo: **Devuelve S/ X · Se lleva S/ Y · Diferencia**. Se entra con **«↩ Registrar cambio / devolución»** desde la ficha de la venta o con **«+ Cambio / devolución»** en CL-13. Sin «Se lleva» es una devolución. |
| CD2 | **Aceptar = un solo paso, todo o nada** | «Aceptar» es el antiguo Finalizar (la vendedora recibe la prenda). Primero se valida todo y después, junto: ingresa lo devuelto (ING-DEVCLI; mal estado → TRF-LIQUID a liquidación, como antes), el crédito se abona al saldo a favor y, si hay «Se lleva», se registra la venta nueva con `Ventas.registrar` (mismo comprobante que la original) pagada con el medio **Saldo a favor**. Si algo falla (p. ej. no hay stock de lo que se lleva) **no queda nada a medias**: la base vuelve a como estaba. Desde una venta se puede **Guardar pendiente** o **Aceptar** directamente (sin el paso intermedio). |
| CD3 | **Los pagos originales no se tocan** | El crédito = lo que el cliente pagó por lo que devuelve (si la venta tenía saldo pendiente, primero se descuenta de ese saldo). Queda en la venta original como «dinero devuelto al cliente» con destino **Saldo a favor** (ya procesado, sin caja), así su pagado y su neto cuadran; sus cobros siguen en su venta y en su caja. |
| CD4 | **Medio de pago «Saldo a favor»** (`SALDO`) | Se valida solo, **no entra a caja** (no cuenta en el arqueo ni en «Cobros»), no pide banco, operación ni voucher. Solo se ofrece si el cliente tiene saldo en la moneda de la venta (nueva venta CL-07 y «+ Pago» CL-10; con la caja cerrada es el único medio posible). No se usa más de lo que hay. |
| CD5 | **Diferencia** | **El cliente paga más:** el modal de Aceptar (CL-16) pide el medio de pago de la diferencia; es un pago normal de la venta nueva, **Por validar en caja**; su stock queda comprometido y sale al validarlo. **Sobra:** queda como saldo a favor; no sale dinero de caja. |
| CD6 | **Saldo a favor del cliente** (`BD.d.saldos`) | Movimientos **Abono** y **Uso** con su origen (devolución, venta, anulación), usuario y fecha; nunca se borran. Por cliente y moneda, **no vence**. Se ve en la ficha del cliente (CL-35, pestaña **Saldo a favor** y KPI) con los movimientos que lo generaron o usaron. |
| CD7 | **Anular una venta pagada con saldo** | La parte pagada con saldo **vuelve al saldo**; el resto sigue como dinero por devolver en caja, igual que hoy (R1.c). Anular la venta queda para un error completo dentro del plazo; todo lo demás se resuelve con un cambio o una devolución. |
| CD8 | **Parámetro «Dinero de una devolución»** (CL-45, `cfg.dineroDev`) | **Saldo a favor** (por defecto, «solo cambios») o **Se devuelve en caja** (comportamiento anterior, para otros negocios). Aplica a la devolución sin «Se lleva» y a lo que **sobra** en un cambio; lo que paga la prenda nueva siempre sale del crédito. |
| CD9 | **Sustento y permisos** | Documento de sustento: **Nota de crédito** (boleta o factura) o **Nota de devolución interna** (nota de venta), propuesto según el comprobante; **su N° se escribe a mano** porque se emite en el sistema de facturación. `editar_devolucion_venta` («Aceptar cambios y devoluciones») también para **Vendedor**, agregado a las bases guardadas con `Store.PERMISOS_NUEVOS`. Anular sigue siendo solo de una Pendiente, con motivo, quién y cuándo. |

### 13.1 Cómo se refleja cada caso (demo «Con operación», 31/07/2026, Tienda #1)

| Caso | Documento | Stock | Dinero y caja | Dónde se ve |
|---|---|---|---|---|
| 1 · Cambio de talla sin diferencia (María Fernanda: T30 negro → T28 negro, S/ 124.90) | DEV-2026-000001 → venta nueva VEN-2026-000007 | Entra 1 PT-0004 a SB-TIENDA01 y sale 1 PT-0003 en el acto | La venta nueva se paga toda con saldo a favor (S/ 124.90); la caja no se mueve; el saldo queda en 0 | CL-13 · CL-15 · CL-09 (Origen: Cambio) · CL-35 › Saldo a favor (Abono + Uso) |
| 2 · Cambio con diferencia en contra (Sofía: S/ 109.90 → modelo de S/ 124.90) | DEV-2026-000002 → VEN-2026-000008 | Entra 1 PT-0002; PT-0003 queda **comprometido** hasta validar la diferencia y luego sale | Saldo a favor S/ 109.90 + **Yape S/ 15.00 por validar**; la cajera lo valida: a caja solo entran S/ 15.00 | CL-09 › Pagos (uno «No entra a caja», otro en CAJ) · CL-18 › Cobros |
| 3 · Cambio con saldo a favor (mayorista Jorge Luis: devuelve 2 × S/ 89, se lleva 1 × S/ 90) | DEV-2026-000004 → VEN-2026-000010 (factura) | Entran 2 PT-0002; sale 1 PT-0004 | Abono S/ 178.00, uso S/ 90.00: **quedan S/ 88.00 a favor**; caja sin movimiento | CL-35 del cliente: KPI «Saldo a favor S/ 88.00» y sus dos movimientos |
| 4 · Devolución sin «Se lleva» (Andrea: 1 × S/ 119.90) | DEV-2026-000005, registrada por la vendedora y aceptada por la supervisora | Entra 1 PT-0001 | Todo a saldo a favor S/ 119.90; nada por devolver en caja | CL-13 «A favor S/ 119.90» · la venta original queda Pagada con neto 0 |
| 5 · Uso del saldo en una compra mayor (Andrea vuelve: S/ 244.80) | VEN-2026-000011 | Salen PT-0001 y PT-0003 al validar el efectivo | Saldo a favor S/ 119.90 + efectivo S/ 124.90 (validado en caja) | CL-09 › Pagos · CL-35 (Uso) |
| 6 · Devolución en mal estado Pendiente (factura del mayorista) | DEV-2026-000003 | Aún nada; al aceptar entra y pasa a SB-LIQUID | Al aceptar: a saldo a favor | CL-13 «Pendientes de aceptar» |

### 13.2 Dónde está

| Qué | Dónde |
|---|---|
| Reglas | `js/core/ventas.js`: `Saldo` (`de`, `movs`, `porMoneda`, `abonar`, `usar`), `Dev` (`borradorLleva`, `resumen`, `finalizar(d, pagoDif)`, `aceptarNueva`, `_atomico`, `dineroTxt`), `Ventas.esSaldo`, `_pagoSaldo`, `_aSaldo`, y los ajustes a `revisarPago`, `revisar`, `registrar`, `agregarPago` y `anular` |
| Datos | `COMPARTIDO/bd/datos/maestros-comercial.js`: medio `SALDO`, `tiposDev` sin «Cambio», `editar_devolucion_venta` para Vendedor, `cfg.dineroDev`, colección `saldos`. `Store.completarBase` agrega el medio y el permiso a una base guardada y reemplaza `tiposDev` (`Store.CATALOGOS_CODIGO`) |
| Pantallas | `js/modules/devoluciones.js` (CL-13, CL-14, CL-15, CL-16, CL-17) · `ventas.js` (CL-07, CL-09) · `documento.js` (CL-10) · `clientes.js` (CL-35) · `configuracion.js` (CL-45) |
| Demo y pruebas | `js/data/demo.js` (casos 1–6) · `node COMERCIAL/pruebas/probar-comercial.js` (`casos-cambios.js`: diferencia a favor, en contra, devolución sin «Se lleva», uso del saldo, anulación con saldo, parámetro «caja», todo o nada, mal estado, base guardada antes) |

### 13.3 Para el desarrollo

- **No hay DELETE**: la devolución Pendiente se **anula** con motivo, quién y cuándo; una aceptada no se anula (ya movió stock y dinero). Los movimientos de saldo a favor no se borran ni se editan: un error se corrige con otro movimiento.
- **Aceptar es una transacción** en el back: ingreso de stock, traslado a liquidación, abono y uso del saldo, venta nueva y pago de la diferencia, todo o nada (idempotente por `devolucion_id`).
- El **saldo** se calcula de los movimientos (Σ abonos − Σ usos por cliente, empresa y moneda); validar en el back que un uso no lo deje negativo (bloqueo por cliente al usarlo).
- El pago con saldo **no tiene caja** (`caja_sesion_id` nulo) y queda Validado por el sistema; el arqueo y el reporte de caja lo excluyen.
- El N° de la nota de crédito llega del sistema de facturación; si más adelante se emite desde el ERP, se numera por serie de tienda y tipo (BC01 / FC01) sin cambiar el flujo.
