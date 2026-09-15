# GPV7 · Producción — diseño (simple, orientado a SAP Business One)

> Revisión 7 · 2026-09-15 · `PROTOTIPOS V9`. ERP estándar (confección, pastelería o cualquier fabricación).

## 1. Órdenes de Fabricación

**Tipo (como SAP):** **Estándar** = la lista de materiales se copió sin cambios · **Especial** = no tiene lista o se modificó a mano.

| Origen | Estado inicial | Compromiso de materia prima | Se edita |
|---|---|---|---|
| Solicitud de Fabricación | **Liberado** | Heredado de la aprobación de la SOLF (T7); el sobrante se libera | No |
| "+ Nueva OF" en Producción | **Planificado** | Al liberar (lo disponible) | Sí, mientras está Planificada: + Artículo, + Recurso, + Texto (como GI-17) |

- Cabecera: artículo, cantidad, almacén, **N° Referencia** (agrupa las órdenes para el recosteo), observación.
- Estados: Planificado → Liberado → Cerrado (o Cancelado). **Fase** = número según qué artículo usa a cuál.
- Líneas: **solo artículos inventariables y recursos**. Almacén de cada línea: el de la lista o el indicado en la orden Especial.
- **Método** de cada línea: **Manual** = se consume en la emisión · **Notificación** = se consume al registrar el recibo.
- Pestañas: **Materiales** · **Emisiones** · **Recibos** · **Costo** · **Adjuntos** · **Historial**.
- Operarios: nombre y recurso que ocupan (sin metodología de pago).

## 2. Emisión y recibo (directos, sin estados, como SAP)

| Documento | Movimiento V7 | Qué consume / entra |
|---|---|---|
| **Emisión para producción** | Salida | Líneas **Manual**: materiales con cantidad real y recursos con sus **operarios** como detalle. Las líneas Notificación se ven bloqueadas. |
| **Recibo de producción** | Ingreso (+ Salida por notificación) | Entra lo producido; se consumen las líneas **Notificación**. Costo = notificación + parte proporcional de lo emitido sin recibir. |

No se recibe más de lo pendiente. Al cerrar: se libera lo comprometido, lo emitido sin recibir se suma al costo y se anulan las solicitudes pendientes. No se cancela una orden con emisiones o recibos.

## 3. Falta de stock → Solicitud de materiales (PR-05)

1. Al emitir (o al recibir por notificación) falta stock en el almacén de la línea: se emite lo que hay.
2. Por la diferencia se crea una **Solicitud de materiales sin propósito**: Producción solo indica **qué** y **a dónde**.
3. **Logística** revisa existencias y define el propósito **por línea** (una misma solicitud puede tener ambas):
   - **Transferencia** → elige el almacén de origen; se registra una transferencia (GI-11) por almacén de origen.
   - **Compra** → número de OC; al llegar se registra el **ingreso** (GI-09) o la **conformidad** si es un servicio.
   - Estados: Pendiente → En proceso (hay líneas en compra) → Atendida | Anulada.
4. Producción hace otra emisión o registra el recibo.

> La misma regla rige la Solicitud de Materiales de Inventarios (GI-13) en GI, CO y GP: sin propósito al crear; Logística lo define por línea al aprobar y crea la OC y/o las transferencias. No existe el tipo Ajuste (regularización = ingreso o salida con motivo, sin V°B°). CO-13 Producción Tercerizada y GP-04/06/08 fueron retirados: GP (Solicitud de Pedido) y Producción son el mismo módulo, separado en dos archivos por orden de código.

## 4. Servicios de terceros y fase tercerizada

- En la lista y la orden el servicio es un **recurso** (`REC-0011` lavado, `REC-0012` acabado) con **costo estándar**.
- **Tercerizar una fase con la orden ya creada** (botón *Tercerizar*): se elige servicio, proveedor y almacén del proveedor. La orden pasa a Especial, los materiales pasan al almacén del proveedor, se quitan los recursos propios, se agrega el servicio y se envía a Logística la **Solicitud de materiales para comprar el servicio**.
- **Envío al proveedor** (pestaña Emisiones): transferencia con GRE "Traslado de bienes para transformación" desde el almacén propio; libera lo comprometido.
- La emisión saca los materiales del almacén del proveedor y el **recibo** trae lo producido a mi almacén con el costo del servicio.
- En **Costo** se vinculan **OC, factura y nota de crédito** de Compras: costo de compra = factura (o la OC si aún no hay factura) − notas de crédito; se ve la diferencia con el estándar.

## 5. Producto fallado (corte, confección, lavandería, acabado)

No existe el tipo Ajuste. Desde **Existencias** (botón *Fallado*):
1. **Salida** del artículo original y **Ingreso** del artículo `… FALLADO` al mismo costo, con motivo y observación obligatoria (documento `FALL-nnnn`). El artículo fallado se crea en el maestro (GI-04).
2. Opcional: **orden de reproceso** (Especial) que vuelve a fabricar el artículo consumiendo el fallado y **solo con mano de obra**, en el mismo N° Referencia para el recosteo.
3. Si el defecto es de un **servicio tercerizado**: además, Compras gestiona la **nota de crédito o devolución de compra** (CO-11 / CO-12) y se vincula en Costo.

## 6. Muestras

No hay órdenes ni tipo "muestra": una muestra es un **Ingreso** del artículo con su costo.

## 7. Listado

Agrupado por **N° Referencia**, en orden de **Fase**, con 👁 Ver y 📎 adjuntos de la referencia. Filtros: Estado · Ver fases (todas / solo fases con avance).

## 8. Unidades

Artículos solo en **UND, MT, KG**. Recursos en HORA, UND, DÍA, METRO o KG (unidad de consumo del recurso).

## 8.1 Recursos (PR-11) y tipos de recurso (PR-12)

El maestro de recursos pasó de Gestión de Pedido a Producción y se edita en la demo.
- **Recurso:** código (REC-nnnn, correlativo), nombre, **tipo de recurso**, responsable/operador (opcional), estado, **unidad de consumo**, **costo por unidad de consumo** y **cuenta contable de costo**. La ficha muestra en solo lectura su **uso en producción** (órdenes, consumido y costo imputado) y sus operarios.
- **Ya no existen** grupo de recurso, tipo de costo, capacidad, eficiencia, centro de costo, almacén vinculado ni "interviene en el recosteo". Ningún cálculo los usaba: el costo de la orden sale de lo consumido × costo del recurso, y PR-09 lo resume **por recurso** y **por tipo de recurso**.
- **Tipo de recurso** (TRC-nnnn): catálogo simple. No se elimina si lo usa un recurso. **RECURSO HUMANO** (método Manual, operarios, reproceso) y **SERVICIO DE TERCEROS** (compra del servicio y contraste con OC/factura) no se renombran ni eliminan.
- **Operarios:** pestaña de PR-11; cada uno ocupa un recurso de tipo RECURSO HUMANO.
- Un recurso inactivo no se ofrece al agregar líneas, tercerizar ni crear reprocesos; las órdenes que ya lo usan no cambian.

## 9. Demo

- **Ref 0156:** terminada; reposición de avíos a planta (solicitud atendida por transferencia); lavados con factura y OC.
- **Ref 0157:** en curso. Crudo 60 emitidos / 40 recibidos; **4 crudos fallados** con orden de reproceso cerrada; **2 lavados fallados** con nota de crédito; acabado negro **tercerizado** con solicitud de compra del servicio pendiente; terminado T30 emitido con **solicitud de materiales pendiente**.
- **Ref 0158:** OF Especial sin lista. Ingreso de muestra con costo. SP-0008 lista para crear órdenes.
