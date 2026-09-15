# 05 · Revisión de consistencia (puntos vs. `Tablas.xlsx` y flujos)

> Contraste final de cada punto contra la propuesta `logistica-info/Tablas.xlsx` (SAP B1) antes de pasar a CO/GP.
> Marca: ✅ correcto/alineado · ⚖️ divergencia **intencional** (decidida) · ⚠️ **inconsistencia a resolver** (necesita confirmación).
> Fecha: 2026-09-08.

---

## A. Alineado con el Excel (✅)

| Punto | Estado | Nota de alineación |
|---|---|---|
| Grupo de Artículo + pestaña Finanzas (28 conceptos) | ✅ | Equivale a *Item Group → G/L Account Determination* de SAP B1. Los 3 conceptos del Excel (Existencia/Ingresos/Gastos) son un subconjunto de los 28. |
| Stock **Actual / Comprometido / Pedido** | ✅ | Coincide con "Resumen x Artículo" del Excel (Stock Actual, Comprometido, Pedido). |
| Movimientos: **Entradas / Salidas** | ✅ | El Excel separa "Entrada de Inventario" (Objeto 59) y "Salida de Inventario" (Objeto 60). En el backend se guardan en la tabla única `stock_movement` (I1), que funcionalmente equivale. |
| **Lotes** (lote + control de lote) | ✅ | Excel: tablas "Lote" y "Control de Lote" con objeto base. |
| LDM detalle con **Tipo (Artículo/Recurso/Texto)** | ✅ | Coincide con "Lista de Materiales Detalle → Tipo (Item/Recurso/Texto)" del Excel. |
| **Recursos** como maestro y línea de LDM/OF | ✅ | Excel: tabla "Recursos" (código, nombre, costo estándar, activo). |
| OF **Estándar / Especial** | ✅ | Excel: "Orden Fabricación → Tipo S/P" (D-Desmontar se ignora, según hoja *Notas*). |
| Sin puente artículo↔UM; factor global por par | ✅/⚖️ | Sin tabla intermedia (alineado); el factor **global por par** diverge levemente del Excel (que lo liga al artículo) — ver ⚖️-6. |

## B. Divergencias intencionales (⚖️ — decididas, documentadas)

| # | Divergencia | Excel dice | Nosotros | Por qué |
|---|---|---|---|---|
| ⚖️-1 | **Disponible** | `Disponible = Actual − Comprometido + Pedido` | `Disponible = Actual − Comprometido` (Pedido informativo) | Decisión T1. El Pedido (mercadería en camino) no se promete como disponible. |
| ⚖️-2 | **Nivel de cuentas contables** | Cuentas en "Resumen x Artículo" (por almacén) | **1 nivel, por Grupo de Artículo** | Decisión T4. Simplifica; se puede refinar después. |
| ⚖️-3 | **Almacén en tránsito** | No aparece explícito | **Se mantiene** (indicador en la ficha) | Decisión B4: se necesita (OF de terceros / maquila). |
| ⚖️-4 | **Socio de Negocio** | Cliente/Proveedor unificados | **Separados** (Proveedor propio) | Decisión T6. Se portan campos útiles al maestro de Proveedores. |
| ⚖️-6 | **Factor de conversión de UM** | Ligado al artículo | **Global por par de UM** | Decisión A1. Trade-off aceptado: el factor no varía por material. |

## C. Inconsistencias a resolver antes/durante CO-GP (⚠️)

| # | Inconsistencia | Detalle | Propuesta |
|---|---|---|---|
| ✅ ⚠️-1 | **RESUELTA — Detalle de OF** | Decisión E5: se **mantienen las dos tablas** (Materiales + Recursos). No se unifica con `Tipo`. La distinción Artículo/Recurso se conserva vía las dos tablas. | Cerrada. |
| ✅ ⚠️-2 | **RESUELTA — LDM detalle con Almacén + Método de emisión** | Decisión C4: **agregar ambos** por línea (Artículo/Recurso; Texto no). **Implementado en GI.** | Cerrada. |
| ⚠️-3 | **LDM cabecera sin "Tipo (Venta/Producción)" ni "Almacén"** | El Excel "Lista de Materiales" (cabecera) tiene `Tipo: Venta/Producción` y `Almacén`. Nuestra cabecera no. | **Sigue abierta** — confirmar si aplican (probablemente `Producción` por defecto). Bajo impacto. |
| ✅ ⚠️-4 | **RESUELTA — E3** | Selector de LDM por línea en GP-03 (decisión F4), recalcula MP. **Implementado.** | Cerrada. |
| ⚠️-5 | **Movimientos del prototipo ≠ estructura del Excel** | El prototipo GI usa `MOV/DETALLES/TRF`. El Excel usa Entrada/Salida + Detalle + **Objeto Base / Línea Base** + **Motivo de Traslado** + Dimensiones 01-05. | Es **prototipo**: se documenta la estructura objetivo (ver `02_MODELO_DATOS.md` y `06_...md`); no se reescribe el motor en memoria. |
| ⚠️-6 | **Falta mapear Motivo de Traslado ↔ Concepto contable** | El Excel tiene 2 catálogos distintos: **Motivo de Traslado** (38 códigos SUNAT, hoja aparte) y los **28 conceptos contables** (pestaña Finanzas). Un movimiento lleva un motivo, pero el asiento usa el concepto contable del grupo. Falta el puente. | **Documentar** el mapeo propuesto motivo→concepto (borrador en `06_...md`). Confirmar con Contabilidad. |

## D. Flujos revisados (sin inconsistencia lógica)

- **Ingreso ← OC (CO)**: recepción vinculada, precio de Kardex nacional/importación, tope al pendiente. Correcto; entra a **Entrada** con Objeto Base = OC.
- **Salida (venta/devolución/consumo)**: correcto; sale por **Salida** con Objeto Base al documento origen.
- **Transferencia**: Salida (origen) + Entrada (destino), Comprometido en origen y **Pedido** en destino, el lote viaja. Correcto y consistente con el renombre Esperado→Pedido.
- **Regularización** (no hay tipo Ajuste): Ingreso (sobrante) o Salida (faltante) con motivo y observación. Correcto.
- **OF liberar → compromete stock**: se mantiene tal cual (decisión E4).
- **GP: solicitud de pedido → V°B° (avisa si falta MP, no bloquea: M8/F3) → OF en Producción**: correcto; E3 implementado (⚠️-4 resuelta).

## E. Estado de las confirmaciones

- ✅ **⚠️-1** RESUELTA → mantener las dos tablas en la OF (Materiales + Recursos). Decisión E5.
- ✅ **⚠️-2** RESUELTA → LDM detalle lleva **Almacén** y **Método de emisión** por línea. Decisión C4. **Implementado.**
- ☐ **⚠️-3** Abierta (bajo impacto): ¿LDM cabecera con **Tipo (Venta/Producción)** y **Almacén**?
- ✅ **⚠️-4** RESUELTA → selector de LDM por línea en GP-03 (F4). **Implementado.**
- ☐ **⚠️-6** Mapeo Motivo de Traslado → Concepto contable → **confirmar con Contabilidad** (borrador en `06_...md`).
