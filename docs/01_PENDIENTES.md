# 01 · Pendientes

> Revisado el 2026-09-17 con el usuario sobre **todos** los `.md` del repo. Las respuestas quedaron como decisiones **N1–N13** en `00_DECISIONES_CERRADAS.md`.
> Sustituye al checklist de V9 (GI → CO → GP): GP ya no existe y los cambios de V7/V9 están cerrados.
> Estado: ☐ pendiente · ◐ en curso · ☑ hecho en la rama `feat/pendientes-prototipo`.

## Aplicado en esta revisión

- ☑ **N1** Cantidades con 4 decimales guardados y 2 visibles (los tres formateadores: Inventarios/Compras, Producción y Comercial).
- ☑ **N2** Número de factura único por proveedor, validado en `Docs.fac.crear`.
- ☑ **N3** Empresa (`emp`) en todos los documentos, movimientos y órdenes; `BD.empresa` y `BD.empresaDe(almacén)`.
- ☑ **N4** Venta al crédito con entrega opcional («Entregar ahora» al registrar y botón «Entregar» en la ficha).
- ☑ **N5** Envío consolidado de varias órdenes en una sola guía por ruta (`Prod.enviarConsolidado`).
- ☑ **N6** Faltante del servicio tercerizado al cerrar la orden + aviso al facturar.
- ☑ **N7** Lotes por ingreso en artículos con control «Lote», con elección opcional al salir.
- ☑ **N8** GI-18 Rotación y GI-19 Series sobre la base compartida.
- ◐ **N9** CO-11 Reclamos, CO-12 Notas de crédito, CO-14 Costos de destino y CO-15 Sugerido: conectar a la base compartida.

## Prototipo · pendiente

- ☐ **N9** Las cuatro pantallas de Compras de arriba. Cada una necesita su documento en la base y su efecto (reclamo → devolución o reposición; nota de crédito → factura y stock; costos de destino → costo promedio; sugerido → stock, consumo y pedidos).
- ☐ El faltante de una orden tercerizada (N6) se cierra desde el reclamo (CO-11) cuando CO-11 esté conectado.
- ☐ Documentar el **proceso del servicio tercerizado** (N13): artículo SRV, recurso con su costo, proveedor del grupo SRV, almacén en tránsito y alta de un servicio nuevo.

## Mejoras futuras (N12, acordadas pero no ahora)

- ☐ **L4** Permisos por almacén por rol: hoy los roles se guardan y no filtran.
- ☐ Filtro de terminados de la Solicitud de Fabricación por «se fabrica» (tiene lista), no por grupo PT.
- ☐ Lote mínimo o múltiplo de fabricación en el artículo o la lista, si en planta se trabaja por tendidos.
- ☐ Lote y vencimiento pedidos a mano en el recibo y la emisión de producción (hoy el lote es automático por ingreso y sale el más antiguo).
- ☐ Producción: cantidades con decimales según la unidad de medida (hoy 4 decimales para todo, N1).

## Fuera del prototipo, para el desarrollo real

- ☐ Emisión electrónica SUNAT (boleta, factura, nota de crédito fiscal, resumen diario, baja).
- ☐ Crédito y cuentas por cobrar con vencimiento.
- ☐ Envíos con seguimiento, liquidaciones y dashboards de Comercial.
- ☐ Multiempresa real, idempotencia y seguridad de la API.
- ☐ Evento `commercial.sale.paid` y el contrato de `production.stock.*` (faltan empresa, almacén, identidad del ítem y fecha).
- ☐ Ingresos de compra apuntando al movimiento unificado con el concepto contable del grupo.
- ☐ Compras no debe aprobar la factura de un servicio con un faltante abierto: hoy **avisa** (N6); bloquear es decisión del desarrollo.

## Contabilidad · Fase 2 (detalle en `12_CAPA_CONTABLE_Y_DEFINICIONES.md`)

- ☐ Plan de cuentas real y cuentas de los 28 conceptos por Grupo de Artículo.
- ☐ Mapeo motivo de traslado → concepto contable (⚠️-6) y qué motivos sustentan la GRE.
- ☐ Dimensiones: cuáles se usan (CECO, CEBE), sus catálogos y qué documento lleva cuál.
- ☐ Reglas de valorización: prorrateo de importación, tipo de cambio congelado, costo por almacén o global.
- ☐ Asientos contables, bancos y contactos; cuenta asociada del proveedor y centro de costo del almacén.
- ☐ Detracción y retención: reglas y códigos SUNAT (hoy solo informativos).
- ☐ Tipo de operación SUNAT (Tabla 12) y tipo de objeto por documento, con sus series y correlativos.
- ☐ Empresas: ¿solo SB01 y CN01? ¿comparten plan de cuentas?

## Backend real (detalle en `14_V7_VS_ESQUEMA_REAL.md`)

- ☐ ADR-0006 (el maestro de producto vive en `logistica_db`) sigue en *Propuesto*.
- ☐ Liberaciones del comprometido (consumo, recepción contra OC, transferencia aprobada) — M13.
- ☐ Revisar las brechas del documento 14 contra las migraciones V12–V20 ya hechas: está fechado el 2026-09-10.
- ☐ Esquemas por módulo, FK lógicas entre esquemas e identidad del artículo alineada con el backend.
