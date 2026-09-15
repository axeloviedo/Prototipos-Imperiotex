# 03 · Mejoras de flujo (PROTOTIPOS V9)

> Cómo cambian los flujos con las decisiones cerradas. Complementa `02_MODELO_DATOS.md`.

## 1. Stock disponible en línea (T1)

- Se manejan **Stock Actual**, **Stock Comprometido** y **Stock Pedido** por (almacén, código de artículo).
- El antiguo **"Esperado" se renombró a "Pedido"** (Stock Pedido / OnOrder del Excel: mercadería en camino — transferencias en tránsito + OC pendientes de ingreso).
- **Disponible = Actual − Comprometido**, calculado al vuelo (Existencias, Kardex, GP-03, OF). **El Pedido es informativo y NO entra en el disponible.**
- No se rompe el flujo actual de transferencias (siguen registrando Comprometido en origen y Pedido en destino).

## 2. Movimientos: Entradas y Salidas (T2, revisada por I1)

- Toda afectación de stock nace de una **Entrada** o una **Salida**; en el backend ambas van en la tabla única `stock_movement` (I1).
- Cada línea guarda **Motivo de Traslado** (catálogo SUNAT) y **Objeto Base / ID Interno Base / Línea Base** para trazar de dónde viene (OC, OF, reclamo, solicitud…).
- **Regularización** (no hay tipo propio): Ingreso con motivo "Regularización de inventario (sobrante)" o Salida con "(faltante)", con observación y sin visto bueno.
- **Transferencia**: genera una Salida en el almacén origen y una Entrada en el destino (con el mismo lote si aplica).
- El **concepto contable** (código 01–28 del grupo del artículo) determina la cuenta del asiento.

## 3. Lotes (T3)

- Los movimientos con control de lote registran el lote afectado en `control_lote` con su objeto base.
- El lote **viaja** en transferencias (mismo `nro_lote` en origen y destino).

## 4. LDM: Tipo, Recursos y versionado simple (C1/C2/C3)

### Detalle homogéneo con OF
- El detalle de LDM gana la columna **Tipo**: `Artículo` | `Recurso` | `Texto`.
  - `Artículo`: componente material (código de artículo) — se agrega con el modal de búsqueda de artículos.
  - `Recurso`: mano de obra / máquina — se agrega con un **modal de búsqueda de recursos** (`m-ldm-rec`), igual que los artículos.
  - `Texto`: línea informativa (instrucción, nota), sin consumo de stock — input libre.
- Esto lo alinea con el **detalle de la Orden de Fabricación**, que ya usa el mismo indicador.

### Sin versionado (decisión C3)
- El versionado se **descartó** (no aporta). La LDM solo maneja **Predeterminada / alternativa**: un artículo puede tener varias listas y una sola es la predeterminada (la que GP-03 usa por defecto).

## 5. Orden de Fabricación (E3)

> **E2** ("cada detalle = una OF") se descartó en GP (F2): las OF, una por artículo de la Solicitud de Fabricación, las crea Producción (GPV7).

### Elegir/cambiar la LDM en el detalle del pedido (E3)
- En la sección **"Detalle del pedido"** cada línea muestra **qué LDM está usando** (listado desplegable de las LDM vigentes del artículo).
- Si el usuario **cambia la LDM**, se **recalculan los Requerimientos de Materia Prima** de esa línea.
- El cambio requiere **Guardar / Actualizar** para persistir (no se aplica silenciosamente).

### Comprometido al liberar (E4)
- Se mantiene el comportamiento actual de V7: el stock se **compromete al Liberar** la OF.
- *(Precisado después por T7 y Producción: la MP de una Solicitud de Pedido se compromete al aprobarla; sus OF nacen Liberadas con ese compromiso. Solo las OF creadas en Producción nacen Planificadas y comprometen al liberar.)*

## 6. Proveedores vs. Socio de Negocio (T6)
- Se mantiene el maestro de **Proveedores** separado del de Clientes.
- Revisar el "Socio de Negocio" del Excel y **portar al maestro de Proveedores** los campos útiles que falten (condiciones de pago, sujeto a retención, indicador de impuestos, moneda, contacto).

---

## Impacto por archivo (recordatorio)
Los prototipos **CO** y **GP** embeben pantallas de **GI**. Todo cambio en artículos, almacenes o LDM
debe replicarse en los tres archivos para mantener coherencia en los recorridos de demo.
