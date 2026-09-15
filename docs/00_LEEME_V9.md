# PROTOTIPOS V9

> Creada el 2026-09-14 como copia de `PROTOTIPOS V7` con todo lo avanzado hasta la fecha.

## Contenido

| Qué | Archivo |
|---|---|
| Inicio de los prototipos | `index.html` |
| Gestión de Inventarios (GI) | `Prototipo_GI.html` |
| Compras (CO) | `Prototipo_CO.html` |
| Gestión de Pedido (GP) | `Prototipo_GP.html` |
| Producción (multi-archivo) | `GPV7/index.html` — diseño en `GPV7/00_DISENO_SOLUCION.md` |
| Comercial (multi-archivo) | `COMERCIAL/index.html` — diseño en `COMERCIAL/12-prototipo-diseno.md`, modelo en `13-modelo-datos-v9.md`, contratos en `14-contratos-funcionales.md` |
| Documentación | `00_DECISIONES_CERRADAS.md` … `15_IMPACTO_SOL_AJUSTES_FALLADOS.md` |

## Producción (último estado · 2026-09-15)

- Órdenes de una Solicitud de Fabricación nacen **Liberadas** (materia prima comprometida desde la aprobación); las creadas en Producción nacen **Planificadas** y comprometen al liberar.
- **Estándar** = lista de materiales sin cambios · **Especial** = sin lista o lista modificada. Sin concepto de muestra: una muestra es un ingreso con costo.
- **Emisión** (salida, líneas Manual, recursos con operarios) y **Recibo** (ingreso, consume líneas Notificación), directos como SAP.
- Si falta stock en el almacén de la línea: **Solicitud de materiales** sin propósito; Logística define por línea Transferencia o Compra (PR-05), luego otra emisión.
- Servicios de terceros = **recursos** con costo estándar, contrastados con OC, factura y nota de crédito. Botón *Tercerizar* en la OF: envío al proveedor = transferencia a almacén de tránsito; retorno = recibo de producción; el servicio se compra con una OC de servicio normal.
- Sin avances, órdenes hijas ni órdenes de muestra. **Fase** es solo el número de secuencia de la orden dentro de su N° Referencia.
- GP y Producción son el mismo módulo en dos archivos: GP-04, GP-06 y GP-08 salieron de GP; en Compras se retiró la Producción Tercerizada (CO-13) y la subcontratación.
- **Producto fallado:** salida + ingreso del artículo "FALLADO" (sin tipo Ajuste) y orden de reproceso solo con mano de obra.
- Análisis de impacto para GI / CO / GP: `15_IMPACTO_SOL_AJUSTES_FALLADOS.md`.
- Para abrir Producción con sus scripts conviene servir la carpeta con un servidor local y entrar a `/GPV7/index.html`.

## Comercial (2026-09-15)

- Flujo SAP B1 en **cuatro documentos**, que se pasan con «Copiar a»:
  - **Cotización** (CM-01): no mueve stock.
  - **Orden de venta** (CM-13): compromete stock y se atiende por partes.
  - **Venta** (CM-02): es la boleta, factura o nota de venta. Nace Pendiente de pago y, cuando el cobro completa el total, queda Pagada y sale el stock (Salida GI-10).
  - **Cobro** en caja.

  La devolución sale de una venta Pagada (Ingreso GI-09). En tienda se hace venta directa sin orden. Solo contado.
- Un solo documento para productos y servicios (el servicio es un artículo no inventariable). Listas de precios en cascada (tienda + tipo de cliente → tienda → tipo → general → precio sugerido de GI-02), descuento en rango, precio mínimo y multimoneda con reversión.
- Cobros contra la **caja de la tienda** (una abierta por tienda y moneda). Registrar el cobro ya es cobrado, sin validación. Cierre con conteo ciego.
- La documentación `COMERCIAL/01`–`11` es el lineamiento funcional de un sistema existente. Las decisiones K1–K17 están en `COMERCIAL/12-prototipo-diseno.md`.
- Igual que Producción, conviene servir la carpeta con un servidor local y entrar a `/COMERCIAL/index.html`.
- **Solicitudes compartidas (2026-09-15):** la Solicitud de Pedido (GP-01) es la misma pantalla para Logística y Comercial (CM-11): ambos crean, editan, envían y aprueban. Comercial también crea Solicitudes de Materiales (CM-12 = GI-13). Los datos se guardan en `localStorage` (`imperiotex.v9.solicitudes`); Producción solo ve las aprobadas (PR-03). En el listado GP-01 ya no está la columna «Artículos solicitados».

## Gestión de Pedido · menú y Recursos (2026-09-15)

- El menú de GP queda con **Solicitudes de Pedido**, **Órdenes de Fabricación (Producción)** y el grupo **Recursos** (Recursos y Tipos de Recurso). Se retiraron del menú **Maestros de Inventario** y **Configuraciones**; sus pantallas siguen existiendo solo para los flujos que las abren (por ejemplo, Transferencia u Orden de Compra desde una Solicitud de Materiales).
- Ya no se trabaja con **Grupos de Recurso**.
- El recurso (GP-07) guarda: código, nombre, tipo, responsable, estado, unidad de consumo, costo por unidad y cuenta contable. Se quitaron grupo, tipo de costo, capacidad, eficiencia, centro de costo, almacén vinculado e «Interviene en el recosteo».

## No incluido

Los respaldos `GPV7_bk` y `GPV7_bk1` se quedaron en `PROTOTIPOS V7`.
