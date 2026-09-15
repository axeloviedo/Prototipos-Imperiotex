# 15 · Impacto: Solicitud de Materiales sin propósito, sin tipo Ajuste, fallados y tercerizado

> 2026-09-15 · `PROTOTIPOS V9`. Análisis previo y **decisiones cerradas** (ver `00_DECISIONES_CERRADAS.md`: G1, J1–J5). Aplicado en Producción (GPV7) y en GI / CO / GP (limpieza V9).
> Las pantallas de GI (GI-06, 07, 09, 10, 11, 13) están **copiadas dentro de los tres HTML** (GI, CO y GP): cada cambio se repite 3 veces. GI-12 se retiró.

## 1. Estado de cada punto

| Punto | Estado |
|---|---|
| Recostear varias OF (vínculo) | Ya hecho: **N° Referencia** |
| Adjuntos en diseño / tizado | Ya hecho: pestaña Adjuntos y 📎 por referencia |
| Mostrar OF sin abrumar | Ya hecho: agrupado por referencia, en orden de Fase (número de secuencia) |
| N° Referencia | Ya hecho: se genera al crear las OF de la SOLF aprobada |
| Devolución de corte / confección / acabado (fallado) | **Aplicado en GPV7** |
| Devolución de servicio tercerizado + nota de crédito | **Aplicado en GPV7** (la NC ya existe en CO-12) |
| Tercerizar con la OF ya creada | **Aplicado en GPV7** · retirada la Producción Tercerizada de Compras y la subcontratación (§5) |
| Solicitud de Materiales: propósito por línea lo define Logística | **Decidido · aplicado en GPV7, GI, CO y GP** |
| No hay tipo Ajuste | **Decidido · aplicado en GPV7, GI, CO y GP** |

## 2. Solicitud de Materiales sin propósito al crear (decidido: por línea)

**Antes (GI-13 / GI-13F):** `prop` en cabecera (Compras / Transferencias), obligatorio al enviar, lo elige el solicitante y se bloquea; Logística solo aprueba o rechaza.

**Decidido (2026-09-15): propósito por línea.**
- GI-13F: sin campo Propósito; el solicitante indica solo artículos, cantidades y almacén destino.
- Aprobación (`aprobarSOL`): Logística ve existencias en otros almacenes y **elige el propósito de cada línea** (Compra o Transferencia); si es Transferencia, elige el origen.
- *Crear ▾*: una **Orden de Compra** con las líneas Compra y una **Transferencia GI-11** por cada almacén de origen.
- Bandeja GI-13: sin filtro de propósito; la columna muestra el resumen por línea ("Lo define Logística" hasta la aprobación).
- **GP-03** `generarSOLdesdeSP`: crea la SOL sin propósito. `solTieneOC` / `spBloqueoVB` aceptan OC **o** transferencia.
- **CO-15** `sugGenerarSOL` (sugerido de compra): crea la SOL como cualquier otra; Logística marca Compra al aprobar.

| Impacto | Detalle |
|---|---|
| GI | Medio: GI-13 / GI-13F, `enviarSOL`, `aprobarSOL`, `crearMenuSOL`, `crearTRFdesdeSOL`, `crearOCdesdeSOL` |
| CO | Bajo: la misma copia de GI-13; la OC nace en Borrador desde las líneas Compra |
| GP | Medio: GP-03 (generación y bloqueo del V°B°) |
| Docs | G1 y M14 reescritas en `00_DECISIONES_CERRADAS.md`; actualizado `10_FLUJO_END_TO_END.md` |
| Backend | el propósito pasa de `material_request` a la línea, vacío hasta la aprobación (migración pendiente) |

## 3. No existe el tipo de movimiento Ajuste (decidido)

**Antes (retirado en V9):** GI-12 "Movimiento: Ajuste" era un tipo propio.
- Documento `AJU-`, serie `NA`, motivos Stock de Apertura / Reconciliación.
- Aprobación de Gerencia (GI-12a/b, CT-05).
- Botón "+ Ajuste" y filtro en GI-07.
- Datos demo AJU-000045/46/47 en GI-06 y GI-07; contexto `aju` en el buscador CT-03.
- Solo `aprobarAJU` escribe stock.

**Cambio aplicado:**
- Quitar GI-12 (pantalla, modales, funciones `AJU*`, serie NA), el botón y el filtro de GI-07, el contexto del buscador y los datos demo AJU.
- Agregar a **GI-09 Ingreso** el motivo "Regularización de inventario (sobrante)" y a **GI-10 Salida** "Regularización de inventario (faltante)", con observación y sustento obligatorios.
- "Stock de apertura" pasa a Ingreso con motivo "Carga inicial de stock" (concepto 27, ya existe).
- Agregar motivo "Producto fallado" a GI-09 y GI-10 (el flujo del punto 4).

| Impacto | Detalle |
|---|---|
| GI | Alto en cantidad de código, bajo en lógica: GI-12 no alimenta Kardex ni saldos (son datos fijos) |
| CO / GP | Mismo borrado en su copia de GI; **ninguna pantalla CO-xx ni GP-xx depende del Ajuste** (en GP solo textos) |
| Costos | Sin cambio: el sobrante entra con costo (ingreso) y el faltante sale al costo promedio (salida) |
| Contabilidad | Conceptos 25 / 26 renombrados "Regularización por sobrante / faltante de inventario" y cuelgan del motivo de regularización (mismas cuentas) |
| Aprobación | **Decidido: sin visto bueno.** Solo registra la regularización (ingreso o salida) quien tiene el rol |
| Docs / backend | Consistente con I1: la regularización es un ingreso o una salida del movimiento unificado. Revisar si el enum de movimientos del backend tiene AJUSTE |

## 4. Producto fallado y devoluciones

- **Flujo** (en GPV7): salida del artículo → ingreso del artículo `… FALLADO` al mismo costo → orden de reproceso Especial solo con mano de obra (mismo N° Referencia).
- **GI:** el artículo fallado se crea en GI-04 (sin cambio) y se agrega el motivo en GI-09 / GI-10.
- **Servicio tercerizado:** mismo flujo más **nota de crédito o devolución de compra**. Ya existe en CO-11 (reclamo con cantidad fallada) → CO-12 (NC aplicable a la factura).
- **Bug detectado en CO-11** (corregido en V9): `crearDevolucionRec` usaba "Devoluciones a Proveedores", que no existía en GI-10; ahora GI-10 tiene "Devoluciones a proveedores" con destino "Proveedor".

## 5. Producción tercerizada (decidido)

- **GPV7:** botón *Tercerizar* en la OF → **envío al proveedor** (transferencia al almacén de tránsito) → emisión desde ese almacén → **recibo de producción** en mi almacén. El servicio se compra con una **OC de servicio normal**; OC, factura y NC se vinculan en Costo.
- **Compras:** se retiró la Producción Tercerizada de CO (pantallas y datos) y la subcontratación desde la salida de GI-10.
- **GP:** se retiraron GP-04, GP-06 y GP-08; la orden de fabricación y su tercerización viven solo en Producción.
