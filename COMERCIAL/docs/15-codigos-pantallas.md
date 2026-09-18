# 15 · Códigos de pantallas, fichas y modales de Comercial (CL-xx)

> 2026-09-16 · Prototipo `COMERCIAL/` (versión del repo: Cotización → Venta → Devolución, con caja y pagos por validar).
> Cada pantalla, ficha/formulario y modal de Comercial tiene un código único **CL-xx**, correlativo y ordenado según el menú.
> Reemplaza a los códigos **CM-01…CM-12**, que ya no se muestran.

## Cómo se ve el código

- **Pantallas y fichas:** etiqueta `<span class="code">CL-xx</span>` en el encabezado (`.screen-head`).
- **Modales:** la misma etiqueta en el encabezado del modal. Se pasa con `UI.modal({ …, code: 'CL-xx' })` o como último argumento de `UI.confirmar(…, code)` y `UI.motivo(…, code)`.
- **Rutas internas:** los ids de ruta (`cm01`, `cm02v`, …) y los hashes (`#cm02v/VEN-2026-000230`) **no cambian**. La columna «Ruta» enlaza cada código con su id.
- Las ventanas de impresión (PDF de cotización, venta y caja) no son modales: no llevan código.
- Un modal que se abre desde dos lugares tiene un solo código. Es el caso de CL-11 «Rechazar pago», que se abre desde la ficha de la venta y desde la caja.

## Tabla

| Código | Tipo | Pantalla / modal | Ruta o función | Archivo |
|---|---|---|---|---|
| CL-01 | Pantalla | Cotizaciones (listado) | `cm01` | `js/modules/cotizaciones.js` |
| CL-02 | Ficha | Cotización (nueva y edición línea por línea) | `cm01f` | `js/modules/cotizaciones.js` |
| CL-03 | Modal | Guardar cotización con avisos de stock | `CM01F.guardar` | `js/modules/cotizaciones.js` |
| CL-04 | Modal | Anular cotización (motivo) | `CM01F.anular` | `js/modules/cotizaciones.js` |
| CL-05 | Pantalla | Ventas (listado) | `cm02` | `js/modules/ventas.js` |
| CL-06 | Modal | Venta desde una cotización | `CM02.desdeCot` | `js/modules/ventas.js` |
| CL-07 | Formulario | Nueva venta (directa o desde cotización) | `cm02f` | `js/modules/ventas.js` |
| CL-08 | Modal | Registrar con avisos de stock (contra el Disponible) | `CM02F.registrar` | `js/modules/ventas.js` |
| CL-09 | Ficha | Venta (Detalle, Pagos, Devoluciones, Movimientos de stock, Historial) | `cm02v` | `js/modules/ventas.js` |
| CL-10 | Modal | Registrar pago | `PAGOUI.abrir` | `js/modules/documento.js` |
| CL-11 | Modal | Rechazar pago (motivo) | `CM02V.rechazar` · `CM04.rechazar` | `js/modules/ventas.js`, `js/modules/caja.js` |
| CL-12 | Modal | Anular venta (motivo) | `CM02V.anular` | `js/modules/ventas.js` |
| CL-13 | Pantalla | Devoluciones (listado) | `cm03` | `js/modules/devoluciones.js` |
| CL-14 | Modal | Nueva devolución · elegir la venta | `CM03.nueva` | `js/modules/devoluciones.js` |
| CL-15 | Ficha | Devolución (registrar, editar, finalizar, anular) | `cm03f` | `js/modules/devoluciones.js` |
| CL-16 | Modal | Finalizar devolución | `CM03F.finalizar` | `js/modules/devoluciones.js` |
| CL-17 | Modal | Anular devolución (motivo) | `CM03F.anular` | `js/modules/devoluciones.js` |
| CL-18 | Pantalla | Caja de la tienda (Cobros, Por cobrar, Ingresos y egresos, Devoluciones de dinero) | `cm04` | `js/modules/caja.js` |
| CL-19 | Modal | Abrir caja | `CM04.abrir` | `js/modules/caja.js` |
| CL-20 | Modal | Cobrar · ventas con saldo | `CM04.cobrar` | `js/modules/caja.js` |
| CL-21 | Modal | Validar todos los pagos | `CM04.validarTodos` | `js/modules/caja.js` |
| CL-22 | Modal | Nuevo o editar ingreso / egreso de caja | `CM04.mov` | `js/modules/caja.js` |
| CL-23 | Modal | Anular movimiento de caja (motivo) | `CM04.anularMov` | `js/modules/caja.js` |
| CL-24 | Modal | Devolver dinero al cliente | `CM04.devolver` | `js/modules/caja.js` |
| CL-25 | Modal | Reporte del día | `CM04.reporte` | `js/modules/caja.js` |
| CL-26 | Modal | Cerrar caja · conteo ciego | `CM04.cerrar` | `js/modules/caja.js` |
| CL-27 | Modal | Caja cerrada (resultado del arqueo) | `CM04.guardarCerrar` | `js/modules/caja.js` |
| CL-28 | Pantalla | Historial de cajas | `cm05` | `js/modules/caja.js` |
| CL-29 | Modal | Detalle de una caja | `CM05.ver` | `js/modules/caja.js` |
| CL-30 | Pantalla | Solicitudes de Fabricación (vista compartida de Inventarios GI-21 / GI-22 / GI-23) | `cm11` → `../INVENTARIOS/index.html?vista=comercial#gi21` | `js/modules/solicitudes.js` |
| CL-31 | Pantalla | Solicitudes de Materiales (vista compartida de Inventarios GI-13) | `cm12` → `../INVENTARIOS/index.html?vista=comercial#gi13` | `js/modules/solicitudes.js` |
| CL-32 | Pantalla | Existencias y movimientos de la base compartida (Existencias de las tiendas de la empresa; Movimientos y Kardex de los almacenes de su sede, todos para el usuario logístico general) | `cm06` | `js/modules/consultas.js` |
| CL-33 | Modal | Movimiento de stock (detalle) | `CM06.verMov` | `js/modules/consultas.js` |
| CL-34 | Pantalla | Clientes (listado) | `cm07` | `js/modules/clientes.js` |
| CL-35 | Ficha | Cliente (Datos, Ventas, Cotizaciones, Devoluciones) | `cm07f` | `js/modules/clientes.js` |
| CL-36 | Modal | Desactivar / reactivar cliente | `CM07F.activo` | `js/modules/clientes.js` |
| CL-37 | Modal | Nuevo cliente (alta rápida desde un documento) | `CLIQ.abrir` | `js/modules/clientes.js` |
| CL-38 | Modal | Buscar cliente | `BUS.cliente` | `js/modules/buscador.js` |
| CL-39 | Modal | Agregar artículos o servicios | `BUS.articulo` | `js/modules/buscador.js` |
| CL-40 | Pantalla | Listas de precios (cascada y simulador) | `cm08` | `js/modules/listas.js` |
| CL-41 | Modal | Nuevo o editar precio | `CM08.fila` | `js/modules/listas.js` |
| CL-42 | Modal | Quitar precio | `CM08.quitar` | `js/modules/listas.js` |
| CL-43 | Pantalla | Artículos de venta | `cm09` | `js/modules/listas.js` |
| CL-44 | Modal | Datos de venta del artículo | `CM09.editar` | `js/modules/listas.js` |
| CL-45 | Pantalla | Configuración comercial (parámetros, cajas, series, medios de pago, perfiles y permisos) | `cm10` | `js/modules/configuracion.js` |
| CL-46 | Modal | Reiniciar todo el prototipo (llama a `BD.reiniciar()` con el escenario actual y recarga; el selector «Datos» de la barra superior es `BDSelector` del núcleo, sin código CL) | `Store.reiniciar` | `js/core/store.js` |
| CL-47 | Pantalla | Recepción de mercadería (Solicitudes de Transferencia que llegan a su sede: Por recibir / Recibidas) | `cm13` | `js/modules/recepciones.js` |
| CL-48 | Modal | Recibir mercadería (cantidades que llegaron, total o incompleta; llama a `Docs.trf.recibir`, igual que GI-11) | `CM13.recibir` | `js/modules/recepciones.js` |

## Equivalencia con los códigos anteriores

| Antes | Ahora |
|---|---|
| CM-01 Cotizaciones | CL-01 (listado) y CL-02 (ficha) |
| CM-02 Ventas | CL-05 (listado), CL-07 (nueva venta) y CL-09 (ficha) |
| CM-03 Devoluciones | CL-13 (listado) y CL-15 (ficha) |
| CM-04 Caja de la tienda | CL-18 |
| CM-05 Historial de cajas | CL-28 |
| CM-06 Existencias y movimientos | CL-32 |
| CM-07 Clientes | CL-34 (listado) y CL-35 (ficha) |
| CM-08 Listas de precios | CL-40 |
| CM-09 Artículos de venta | CL-43 |
| CM-10 Configuración | CL-45 |
| CM-11 Solicitudes de Pedido | CL-30 Solicitudes de Fabricación |
| CM-12 Solicitudes de Materiales | CL-31 |
| CM-13 Órdenes de venta | Sin código: `js/modules/ordenes.js` es de otra versión y `index.html` no lo carga |

## Regla para pantallas nuevas

Se toma el siguiente número libre (CL-49, CL-50, …). No se reutiliza un código dado de baja. Toda pantalla o modal nuevo se agrega a esta tabla.
