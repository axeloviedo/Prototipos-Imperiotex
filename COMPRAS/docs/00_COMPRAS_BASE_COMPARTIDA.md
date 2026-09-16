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
| CO-01/02 Proveedores · CO-03 Grupos · CT-09 buscador | `BD.d.maestros.proveedores` (código `PROV-nnnn`), `gruposProveedor` (**del Excel: TEL, AVI, SRV, GEN**, decisión K4), `condicionesPago`. Con órdenes o facturas solo se desactiva. Datos inventados con distintivo «Datos a confirmar». |
| CO-06/07 Órdenes de compra | `Docs.oc`: Borrador → Pendiente de Validar → V°B° Logística + Aprobación Gerencia → Para Recibir y Pagar → Para Pagar / Para Recibir → Completada · Cancelada. Cabecera con **organización de compras** (SB/CN) y **grupo de compras** (MP1, SRV, IMP, EE1, MSC, SG1; por defecto IMP si el proveedor es extranjero, SRV si es de servicio, si no el de los artículos). Enlaces a la solicitud de materiales, a la orden de fabricación y a la solicitud de fabricación. |
| CO-07 OC de **bienes** | «Registrar ingreso» con almacén (por defecto el destino o SB-CENTRAL-MP) y cantidades pendientes → `Docs.oc.recibir` → movimiento **ING-COMPRA** (proveedor extranjero **ING-IMPORT**). Al aprobarse suma **Pedido** en el almacén destino; cada recepción lo descuenta (K8). |
| CO-07 OC de **servicio** | «Conformidad del servicio» (`Docs.oc.conformidad`), sin movimiento de stock. Si tiene orden de fabricación, la OC aprobada y su factura pasan a la pestaña Costo de la orden (contraste con el costo estándar). |
| CO-09/10 Facturas | `Docs.fac.crear` desde una OC aprobada (número del proveedor, cantidades pendientes de facturar, precio editable) y `Docs.fac.pagar`. Detracción y retención informativas según el proveedor. |

## Fuera de alcance (datos de ejemplo, con aviso visible «Datos de ejemplo · no conectado a la base»)
CO-11 Reclamos, CO-12 Notas de crédito, CO-14 Costos de destino y CO-15 Sugerido de compras.

## Funciones globales que expone Compras
`renderProv`, `fillGrupoSelects`, `renderOCS`, `renderFac`, `renderRec`, `renderNC`, `renderPanelCompras`, `renderCCD`, `renderSugerido`, `nuevaOC`, `loadOC(id)` (recibe `OC-000001`), `abrirOC(id)`, `abrirFactura(id)`, `crearFacDesdeOC()`, `elegirProvOC(cod)`, `openCT09()`, `loadProv(cod, modo)`, `eliminarProv(cod)`.

## Pendientes y propuestas
- Contador propio para códigos de proveedor nuevos (hoy: mayor código + 1).
- Validar en el núcleo que no se repita el número de factura del proveedor (hoy lo valida la pantalla).
