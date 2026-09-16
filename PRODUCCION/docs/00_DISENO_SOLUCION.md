# GPV7 · Producción — diseño (simple, orientado a SAP Business One)

> Revisión 8 · 2026-09-16 · `PROTOTIPOS` rama `feat/datos-compartidos`. ERP estándar (confección, pastelería o cualquier fabricación).

## 0. Datos compartidos (revisión 8)

- Producción trabaja **100 % sobre la base compartida** `BD.d` (`COMPARTIDO/bd`, contrato en `docs/16_BASE_DATOS_COMPARTIDA.md`): maestros, stock, movimientos, solicitudes de fabricación (`sfs`), solicitudes de materiales (`sols`), OC (`ocs`), facturas, GRE y órdenes de fabricación (`ofs`). Ya no hay clave propia ni `Store`: `BD.iniciar('USER05 · Producción')`, `BD.guardar()`, `BD.sig`.
- `M` (maestros) solo **lee** `BD.d.maestros`; se editan aquí **recursos, tipos de recurso y operarios** (PR-11/PR-12). Las listas de materiales se editan en Inventarios (GI-17).
- `Stock`, `Explosion` y `Docs` son los compartidos. Producción agrega a `Explosion` `necesidades` y `refs` (dependen de sus órdenes).
- Barra superior: selector compartido **Datos: Solo maestros | Con operación · ↺ Reiniciar** (reinicia los cuatro módulos). Si otro módulo guarda en otra pestaña, la pantalla se refresca.
- Familia de trabajo **ZULEIKA**: piezas PPT-0001..0004 → crudo PPT-0005..0008 → lavado tercerizado PPT-0009..0012 (crudo en SB-TRANSITO + servicio SRV-0001) → terminado PT-0001..0004 en SB-CENTRAL. Materia prima en SB-ZARATE-MP, en proceso en SB-ZARATE-PP.
- **Tipos de movimiento**: emisión SAL-USOPROD (SAL-MAQUILA si consume material en tránsito, en poder del proveedor) · recibo ING-PROD · envío al proveedor TRF-FABRIC · producto fallado AJU-FALTANTE + AJU-SOBRANTE.

## 1. Órdenes de Fabricación

**Tipo (como SAP):** **Estándar** = la lista de materiales se copió sin cambios · **Especial** = no tiene lista o se modificó a mano.

| Origen | Estado inicial | Compromiso de materia prima | Se edita |
|---|---|---|---|
| Solicitud de Fabricación | **Liberado** | La SF libera lo que comprometió al aprobarse (`Docs.sf.convertir`) y cada orden compromete lo suyo (lo que le falta consumir, hasta lo disponible) | No |
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
   - **Compra** → Logística crea la OC; al llegar se registra el **ingreso** (GI-09) o la **conformidad** si es un servicio.
   - Estados: Borrador → Pendiente → Aprobada → En proceso → Atendida · Rechazada · Anulada.
4. Producción hace otra emisión o registra el recibo.

**Quién hace qué en PR-05 (revisión 8).**
- **Producción crea** solicitudes de materiales (`Docs.sol.crear(…, true)`, área Producción): a mano con **+ Nueva solicitud** (PR-05a), desde la orden cuando falta stock o con **Pedir servicio**. Puede **anular** una Borrador o Pendiente y consulta el avance.
- **Logística atiende de verdad** en Inventarios (GI-13): aprueba con el propósito por línea, transfiere o crea la OC. PR-05 ya **no tiene simulación**: muestra el estado real de cada línea (Pendiente · Transferido con su TRF · En compra con su OC y estado · Recibido) y el enlace **Ver en Inventarios (GI-13)**.

> La misma regla rige la Solicitud de Materiales de Inventarios (GI-13) en GI, CO y GP: sin propósito al crear; Logística lo define por línea al aprobar y crea la OC y/o las transferencias. No existe el tipo Ajuste (regularización = ingreso o salida con motivo, sin V°B°). CO-13 Producción Tercerizada y GP-04/06/08 fueron retirados: Las Solicitudes de Fabricación (antes Solicitudes de Pedido de GP) viven en Inventarios (GI-21/22/23) y Producción solo lee las aprobadas en PR-03.

## 4. Servicios de terceros y fase tercerizada (compra real del servicio)

- En la lista y la orden el servicio es un **recurso** con **costo estándar** y **proveedor habitual**, con el mismo código del artículo de servicio (p. ej. `SRV-0001` Lavandería Landeo, `PROV-0005`). El lavado de Zuleika ya viene tercerizado por su lista: crudo en `SB-TRANSITO` + `SRV-0001`.
- Recorrido: (1) **Pedir servicio** (PR-02) crea una Solicitud de materiales con la línea del servicio por la cantidad de la orden, destino el almacén de tránsito (no se duplica si ya hay una) → (2) Logística la aprueba como Compra y crea la **OC de servicio** (GI-13) → (3) Compras la aprueba (CO-07): la OC aparece en **Costo** → (4) **Enviar al proveedor**: transferencia TRF-FABRIC al tránsito + **GRE** «Traslado de bienes para transformación» con el proveedor del servicio → (5) **retorno**: emisión del material en tránsito + recibo (consume el servicio al estándar) → (6) Compras da **conformidad** y registra la **factura**: aparece en Costo.
- **Costo**: contraste **estándar vs OC vs factura** (costo de compra = factura, o la OC si aún no hay factura, − notas de crédito). OC y factura llegan solas desde Compras (`of.compras`); solo la **nota de crédito** se vincula a mano.
- **Tercerizar / Cambiar servicio** (orden sin envíos, emisiones ni recibos): si la orden no lleva servicio, sus materiales pasan al tránsito, se quitan los recursos propios y se agrega el servicio; si ya lo lleva, se cambia el servicio y/o el proveedor (se anula la solicitud del servicio si aún está pendiente; si Logística ya la atendió, no se cambia). Opcionalmente pide el servicio.

## 5. Producto fallado (corte, confección, lavandería, acabado)

No existe el tipo Ajuste. Desde **Existencias** (botón *Fallado*):
1. **Ajuste por faltante** (AJU-FALTANTE) del artículo original y **ajuste por sobrante** (AJU-SOBRANTE) del artículo `… FALLADO` al mismo costo, con motivo y observación obligatoria (documento `FALL-nnnn`). El artículo fallado se crea en el maestro (GI-02).
2. Opcional: **orden de reproceso** (Especial) que vuelve a fabricar el artículo consumiendo el fallado y **solo con mano de obra**, en el mismo N° Referencia para el recosteo.
3. Si el defecto es de un **servicio tercerizado**: además, Compras gestiona la **nota de crédito o devolución de compra** (CO-11 / CO-12) y se vincula en Costo.

## 6. Muestras

No hay órdenes ni tipo "muestra": una muestra es un **Ingreso** del artículo con su costo.

## 7. Listado

Agrupado por **N° Referencia**, en orden de **Fase**, con 👁 Ver y 📎 adjuntos de la referencia. Filtros: Estado · Ver fases (todas / solo fases con avance).

## 8. Unidades

Artículos solo en **UND, MT, KG**. La unidad de consumo del recurso se elige del **maestro de Unidades de Medida** de Inventarios (incluye HORA y DÍA).

## 8.1 Recursos (PR-11) y tipos de recurso (PR-12)

El maestro de recursos pasó de Gestión de Pedido a Producción y se edita en la demo.
- **Recurso:** código (REC-nnnn, correlativo), nombre, **tipo de recurso**, estado, **unidad de consumo** (del maestro de unidades), **Costo Estándar** (por unidad de consumo) y **Cuenta Mayor** (campo numérico). Se quitó *Responsable / operador* (2026-09-16). La ficha muestra en solo lectura su **uso en producción** (órdenes, consumido y costo imputado) y sus operarios.
- **Ya no existen** grupo de recurso, tipo de costo, capacidad, eficiencia, centro de costo, almacén vinculado ni "interviene en el recosteo". Ningún cálculo los usaba: el costo de la orden sale de lo consumido × costo del recurso, y PR-09 lo resume **por recurso** y **por tipo de recurso**.
- **Tipo de recurso** (TRC-nnnn): catálogo simple. No se elimina si lo usa un recurso. **RECURSO HUMANO** (método Manual, operarios, reproceso) y **SERVICIO DE TERCEROS** (compra del servicio y contraste con OC/factura) no se renombran ni eliminan.
- **Operarios:** pestaña de PR-11: código, nombre y **recurso que ocupa**, que puede ser **cualquiera de los recursos creados** (no solo RECURSO HUMANO). No tienen sede: no hay relación con sedes.
- Un recurso inactivo no se ofrece al agregar líneas, tercerizar ni crear reprocesos; las órdenes que ya lo usan no cambian.

## 8.2 Sin pantalla de configuración (revisión 2026-09-16)

- Se retiró **PR-13 Configuración**. El «almacén donde entra lo producido por defecto» no es una configuración: sale del **almacén del artículo** (GI-02) o, si no tiene, del de su lista de materiales.
- El **nombre de la referencia** (N° Referencia, Lote, Campaña…) sí es editable, pero es **solo una etiqueta de texto por empresa**: se cambia con **✎ Nombre del campo** en PR-04 Referencias. En el desarrollo basta un parámetro de texto; no requiere un módulo ni una pantalla de configuración.

## 8.3 Solicitudes de Fabricación compartidas

- Se crean en Comercial (CL-30) o Inventarios (GI-22) y se aprueban en Inventarios (GI-23) con V°B° de Logística y Gerencia, que compromete la materia prima bruta. Se numeran **SF-000001**.
- **PR-03** muestra las **Aprobadas, Convertidas en Orden y Fabricadas** (`BD.d.sfs`). Crear órdenes → `Docs.sf.convertir` (la SF pasa a «Convertida en Orden» y libera su compromiso; las órdenes comprometen lo suyo). Al cerrarse todas sus órdenes → `Docs.sf.fabricada` («Fabricada»).

## 9. Demo (`Demo.historia()`)

- Los datos ya no se crean al abrir Producción: vienen del escenario elegido. `Demo.historia()` parte de «Solo maestros» y registra, solo con `Docs.*`, `Stock.*` y `Prod.*` y fechas de julio 2026 (`BD.reloj`), la operación con la que se genera `escenario-operacion.js`. No toca el DOM.
- **Compra de materia prima**: dos OC de bienes (PROV-0001 telas, PROV-0002 avíos) → V°B° → aprobación → ingreso en SB-CENTRAL-MP → factura; transferencia con GRE a SB-ZARATE-MP.
- **SF-000001** (PT-0001 × 40, PT-0002 × 30): **Fabricada**. Piezas, crudo, lavado tercerizado completo (SOL → OC de servicio → envío con GRE → retorno → conformidad → factura, una con S/ 3,00 de diferencia) y terminado en SB-CENTRAL.
- **SF-000002** (PT-0003 × 30, PT-0004 × 24): **en curso**. Crudo T30 con 16 de 24 recibidos; lavado T28 enviado a la lavandería con OC aprobada; lavado T30 con el servicio pedido (SOL pendiente en Logística).
- **SF-000003** (PT-0001..0004 × 20): **aprobada sin órdenes**, con su materia prima comprometida.
