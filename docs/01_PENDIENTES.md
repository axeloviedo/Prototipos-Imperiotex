# 01 · Pendientes de implementación (PROTOTIPOS V9)

> Checklist vivo. Estado: ☐ pendiente · ◐ en curso · ☑ hecho.
> Orden sugerido de trabajo: **GI → CO → GP** (los prototipos CO y GP embeben pantallas de GI,
> así que los cambios de GI deben replicarse en ellos).

## GI · Gestión de Inventarios

### Artículos
- ☑ **A4** Renombrar "Tipo de Artículo" → "Grupo de Artículo" (maestro, nav, labels, hints).
- ☑ **A5/D2** Ficha de Grupo con pestañas **General + Finanzas** (28 conceptos, ver `04_...md`). La cuenta única previa se migró al concepto 01.
- ☑ **A5** Hint de GI-02 actualizado (cuenta contable se configura en la pestaña Finanzas del Grupo).
- ☑ **A3** Categoría/Subcategoría queda como está (subcat opcional, categoría primero). Sin autocompletado ni obligatoriedad. *(Sin cambios de código.)*
- ☑ **A1/A2** Factor de conversión global por par de UM y sin puente artículo↔UM. *(Ya en V7.)*

### Almacenes
- ☑ **B1** Listado GI-03: solo ID, Nombre, Descripción (+ acciones). Filtros simplificados (Buscar + Estado).
- ☑ **B1** Campo **Descripción** agregado al almacén (form GI-04).
- ☑ **B2** "Clase de almacén" (Físico/Virtual) eliminada del form y del listado.
- ☑ **B3** "Uso" (dropdown) eliminado; se usa solo descripción.
- ☑ **B4** Checklist "Almacén en tránsito" mantenido.
- ☑ **B5** "Involucra Kardex valorizado" mantenido (relabelado en positivo).
- ☑ **B6** Permisos por almacén: solo **roles**.
- ☑ **B7** Quitado el checkbox "Restringe los grupos de artículo que admite" (+ funciones huérfanas).

### Lista de Materiales (LDM · GI-17f)
- ☑ **C1** Columna `Tipo` (Artículo/Recurso/Texto) agregada al detalle.
- ☑ **C2** Recursos y Texto: Recurso se agrega con **modal de búsqueda** (`m-ldm-rec`, catálogo `RECURSOS_LDM`), igual que artículos.
- ☑ **C3** Versionado **descartado**: se quitó por completo. La LDM solo maneja Predeterminada / alternativa.
- ☑ **C4** Detalle con **Almacén** y **Método de emisión** (Notificación/Manual) por línea (Artículo/Recurso). *(⚠️-2 resuelta.)*

### Modelo / motor
- ☑ **T1** "Esperado" renombrado a **"Pedido"** en Existencias/Kardex/CSV/toasts (GI). Disponible = Actual − Comprometido (Pedido informativo). Sin romper el flujo.
- ◐ **T5** Estructura por **código** documentada en `02_MODELO_DATOS.md`. *(Prototipo: no se reescribe el motor en memoria — hoy `STOCK` sigue indexado por nombre; solo se documenta la clave real.)*
- ◐ **I1/T3** Movimientos (Entradas / Salidas sobre la tabla única `stock_movement`; I1 supera las dos tablas de T2) + Lotes: **documentado** en `02_MODELO_DATOS.md`. *(Prototipo: estructura, no motor real.)*

## CO · Compras (2026-09-09) — verificado en navegador (CO 472 KB sí abre), sin errores
- ☑ **T6** Proveedores (CO-02) con sección "Condiciones comerciales y fiscales": Moneda, Condiciones de pago, Sujeto a retención, Indicador de impuestos, Teléfono móvil.
- ☑ **Réplica de GI en CO**: Grupo→Finanzas (ficha `scr-grupo` + 28 conceptos), almacenes (B1–B7), LDM (gi17/gi17f Tipo/Recurso-modal/Almacén/Método), "Esperado"→"Pedido". `node --check` OK.
- ☑ Solicitud de Materiales con propósito por línea definido por Logística (G1, limpieza V9).
- ☑ Retirada la Producción Tercerizada (CO-13) y la subcontratación: la tercerización vive en la OF de Producción con OC de servicio normal (J3).
- ☐ *(futuro)* Movimientos de compra (ingreso) apuntan al movimiento unificado + concepto contable del grupo (modelo I1/T7; ejecución fuera de alcance).

## GP · Gestión de Pedido (planeamiento — decisión F1/F2)
- ☑ Recursos (GP-07), Estándar/Especial y comprometido. *(Ya en V7; las OF pasaron a Producción.)*
- ⛔ **E2 DESCARTADO en GP** — las OF y su ejecución viven en **Producción (GPV7)**. GP-04, GP-06 y GP-08 se retiraron de GP (limpieza V9).
- ☑ **E3** Selector de LDM por línea en GP-03 (Estándar=predeterminada fija; Especial=elegible), recalcula MP. *(Verificado lógica en node; no visual — GP supera el tope del navegador.)*
- ☑ **F3** Botón **"Verificar stock"** en GP-03 (calcula cobertura vs LDM y avisa; no bloquea).
- ☑ **Pedido** — "Esperado"→"Pedido" replicado en GP (gi05 embebido, transferencia, CSV, toast).
- ☑ **⚠️-1** OF **mantiene** dos tablas (Materiales + Recursos). *(Decisión E5.)*
- ☑ **F6** Replicado en GP el GI embebido: Grupo→Finanzas (ficha `scr-grupo` + 28 conceptos), almacenes (B1–B7), LDM (gi17/gi17f con Tipo/Recurso-modal/Almacén/Método), "Pedido". *(node --check OK; sin verificación visual — GP 570KB supera el tope del navegador integrado.)*
- ☑ **F5** El modal de Recurso de la LDM en GP usa el maestro real **RECURSOS (GP-07)**.
- ☑ **F7** El artículo del detalle debe **existir**: eliminada la opción "crear/alta pendiente" del buscador **GP-02b** y el estado **"Alta pendiente"** (+ botón Crear) en GP-02/GP-03; quitada la línea semilla sin artículo (CELESTE t.32 en SP-0007). `node --check` OK.

> **GP: fase completa** (planeamiento GP-propio + réplica de GI). Verificación: sintaxis (`node --check`) + lógica (node) + fidelidad de port (código idéntico al de GI ya probado visualmente). Falta verlo en pantalla en un navegador sin el tope de tamaño.

## Solicitud de Materiales · propósitos
- ☑ **G1** Sin propósito en la cabecera: Logística define **Compra** o **Transferencia** por línea al aprobar; *Crear ▾* genera la OC (líneas Compra) y una transferencia GI-11 por almacén de origen — aplicado en GI, CO y GP (limpieza V9).
- ☑ **G3** Aclarado que Solicitud de Materiales ≠ Solicitud de Pedido de Fabricación.

## SP · almacenes, requerimientos por artículo y SOL (H1-H6, doc `08_ANALISIS_SP_OP.md`) — 2026-09-09
- ☑ **H1** Almacén destino en cabecera (GP-02 obligatorio + GP-03 editable).
- ☑ **H2** Almacén origen por material (default LDM, seleccionable en la vista expandible).
- ☑ **H3** Requerimientos por (línea × material) con `origen LDM|Manual` (`SP_Linea.reqs`); resuelve atribución Especial.
- ☑ **H4** UI Especial = línea expandible "▸ Materiales (n)" (minimalista) + modal `m-spmpreq` para agregar MP manual.
- ☑ **H5** Una sola SOL por pedido (`generarSOLdesdeSP`, multi-línea) — reemplaza `generarSolicitudMP` por material.
- ☑ **H6** Las OF (una por artículo) se crean en **Producción (GPV7)**: las de una Solicitud de Fabricación nacen Liberadas con la MP ya comprometida (T7).
- Verificación: `node --check` OK + prueba de lógica en node. **Sin verificación visual** (GP ~580 KB supera el tope del navegador integrado).

## Confirmaciones (de `05_REVISION_CONSISTENCIA.md`)
- ☑ **⚠️-1** Resuelta → OF con dos tablas separadas (E5).
- ☑ **⚠️-2** Resuelta → LDM detalle con Almacén + Método de emisión (C4, implementado).
- ☐ **⚠️-3** ¿LDM cabecera con **Tipo (Venta/Producción)** y **Almacén**? *(bajo impacto)*
- ☐ **⚠️-6** Mapeo Motivo de Traslado → Concepto contable (Contabilidad).

## Transversal / limpieza
- ☐ Coherencia de nombres "Grupo de Artículo" en los 3 archivos.
- ☐ Coherencia del detalle Tipo (Artículo/Recurso/Texto) entre LDM y OF.
- ☐ Actualizar los `.md` de documentación funcional (GI/CO/GP en `logistica-info`) al cerrar cada bloque.

## Pendientes heredados de la simulación de Producción
> De la simulación del 2026-09-14 (archivo retirado). Prefijo **SIM-** para no confundir con los códigos de `00_DECISIONES_CERRADAS.md`.
- ☐ **SIM-I1** GP calcula requerimientos con `LDM_OPTS` (lista plana) y GI-17 / Producción con listas por artículo: unificar en GI-17 con la misma explosión.
- ☐ **SIM-F1** Producción: almacén de recibo fijo (`SB-ALM-PT` / `SB-ALM-PPT`) → almacén predeterminado del artículo o configuración por grupo.
- ☐ **SIM-F3** Producción: cantidades con paso 1 y unidades de merma fijas → decimales según la unidad de medida (maestro de UM de GI).
- ☐ **SIM-F4** GP `artTerminados()` solo acepta el grupo "PRODUCTOS TERMINADOS" → filtrar por "se fabrica" (tiene lista de materiales).
- ☐ **SIM-H2** Lote y vencimiento en producción: el recibo pide lote (y vencimiento si el artículo lo controla) y la emisión elige lote.
- ☐ **SIM-H3** Lote mínimo / múltiplo de fabricación en el artículo o la lista; la sugerencia redondea.
- ☐ **SIM-H6** Estado de la lista de materiales (Borrador / Aprobada); solo listas Aprobadas en órdenes Estándar, sin versionado.
- ☐ **SIM-H8** Envío consolidado de varias OF a un mismo proveedor (una GRE con líneas de varias OF).
- ☐ **SIM-H9** Multiempresa en producción: OF, OC de servicio y GRE llevan empresa.
- ☐ **SIM-I3** Compras no debe aprobar la factura de un servicio con incidencia de faltante abierta.
