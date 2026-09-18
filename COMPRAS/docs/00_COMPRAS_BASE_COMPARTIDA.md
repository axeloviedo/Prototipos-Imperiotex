# Compras (CO) sobre la base compartida

> 2026-09-16 · rama `feat/datos-compartidos`. Contrato general: `docs/16_BASE_DATOS_COMPARTIDA.md`. Decisiones: `docs/00_DECISIONES_CERRADAS.md` (K1–K10).

## Dos formas de datos
- **Solo maestros**: proveedores, grupos, condiciones de pago y artículos de compra; cero órdenes, recepciones y facturas. El panel CO-00 muestra ceros.
- **Con operación**: órdenes de compra de materia prima y de servicio ya aprobadas, recibidas y facturadas por la historia de demo.
Se elige en la barra superior («Datos») y **↺ Reiniciar** deja los 4 módulos en esa forma.

## Pantallas conectadas
| Pantalla | Qué hace sobre la base |
|---|---|
| CO-00 Panel | Indicadores calculados: líneas de Compra de solicitudes de materiales sin OC, OC por validar, por recibir, por facturar, facturas impagas; montos del periodo y gráfico mensual. |
| CO-01/02 Proveedores · CO-03 Tipos de proveedor · CT-09 buscador | `BD.d.maestros.proveedores` (código `PROV-nnnn`; **grupo** Nacional / Internacional, **tipo** TEL, AVI, SRV, GEN: decisión S1, 2026-09-18), `tiposProveedor` (del Excel), `condicionesPago`. Con órdenes o facturas solo se desactiva. Datos inventados con distintivo «Datos a confirmar». |
| CO-06/07 Órdenes de compra | `Docs.oc`: Borrador → Pendiente de Validar → V°B° Logística + Aprobación Gerencia → Para Recibir y Pagar → Para Pagar / Para Recibir → Completada · Cancelada. Cabecera con **organización de compras** (SB/CN) y **grupo de compras** (MP1, SRV, IMP, EE1, MSC, SG1; por defecto IMP si el proveedor es extranjero y, si no, el que más se repite entre los artículos, que lo heredan de su Grupo de Artículo, K10). Enlaces a la solicitud de materiales, a la orden de fabricación y a la solicitud de fabricación. |
| CO-07 OC de **bienes** | «Registrar ingreso» con almacén (por defecto el destino o SB-CENTRAL-MP) y cantidades pendientes → `Docs.oc.recibir` → movimiento **ING-COMPRA** (proveedor extranjero **ING-IMPORT**). Al aprobarse suma **Pedido** en el almacén destino; cada recepción lo descuenta (K8). |
| CO-07 OC de **servicio** | «Conformidad del servicio» (`Docs.oc.conformidad`), sin movimiento de stock. Si tiene orden de fabricación, la OC aprobada y su factura pasan a la pestaña Costo de la orden (contraste con el costo estándar). |
| CO-09/10 Facturas | `Docs.fac.crear` desde una OC aprobada (número del proveedor, cantidades pendientes de facturar, precio editable) y `Docs.fac.pagar`. Detracción y retención informativas según el proveedor. |

## Postventa sobre la base (C-3, decisiones P1–P6)
| Pantalla | Qué hace sobre la base |
|---|---|
| CO-11 Reclamos | Reclamo sobre lo recibido de una OC o sobre el **faltante de una orden tercerizada** (aviso en la bandeja con botón «Reclamar»). Resolución por línea: reposición (salida + reingreso), devolución (salida + nota 07), nota de crédito o no procedente (cierra sin documentos, con motivo). Lote opcional por línea. Aviso (no bloquea) si un avío reclamado es menos del 10 % de lo recibido. Cada línea muestra los documentos que generó. |
| CO-12 Notas de crédito | Contra una factura con motivo SUNAT 07/05/09; desde un reclamo se prellena. Rebaja la factura o, si ya se pagó, queda como saldo a favor (resumen por proveedor en la bandeja). El 05 revaloriza a la baja lo que sigue en stock. |
| CO-14 Costos de destino | Comprobante sobre OC recibidas con costos 05–09 en S/. o USD, reparto por valor o cantidad; registrar revaloriza (REV-) y anular lo revierte. |
| CO-15 Sugerido | Cálculo al momento, agrupado por proveedor por defecto, con «Crear OC». |

## Funciones globales que expone Compras
`renderProv`, `fillGrupoSelects`, `renderOCS`, `renderFac`, `renderRec`, `renderNC`, `renderPanelCompras`, `renderCCD`, `renderSugerido`, `nuevaOC`, `loadOC(id)` (recibe `OC-000001`), `abrirOC(id)`, `abrirFactura(id)`, `crearFacDesdeOC()`, `elegirProvOC(cod)`, `openCT09()`, `loadProv(cod, modo)`, `eliminarProv(cod)`.

## Revisión N (2026-09-17)
- **Factura única por proveedor (N2)**: lo valida `Docs.fac.crear`, no solo la pantalla; una factura anulada libera su número.
- **Faltante del servicio (N6)**: si la orden de fabricación que originó la OC cerró con prendas que no retornaron, CO-10 muestra el aviso y pide confirmar antes de registrar la factura. No bloquea: el reclamo va por CO-11.
- **Empresa (N3)**: la OC, la factura y sus movimientos guardan `emp` (coincide con la organización de compras).

## Pendientes y propuestas
- Saldo a favor (P3): CO-10 avisa en la ficha de una factura impaga si el proveedor tiene saldo a favor y lo aplica con un botón (`Docs.nc.aplicarSaldo`); CO-12 muestra en qué factura se usó cada nota.
- El código de proveedor sigue siendo «mayor + 1»: el usuario lo dio por bueno para el prototipo (N13).
