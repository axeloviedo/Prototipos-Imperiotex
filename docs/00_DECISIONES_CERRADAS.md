# 00 · Decisiones cerradas (PROTOTIPOS V9)

> Acuerdos tomados con el usuario para el rediseño de los prototipos (iniciado en V7, continúa en V9).
> **Fuente de verdad.** Si algo no está claro durante la implementación, recurrir aquí antes de re-preguntar.
> Fecha base: 2026-09-08.

---

## Artículos

| # | Decisión | Detalle |
|---|---|---|
| A1 | **Factor de conversión de UM: global por par de UM** | Se mantiene el maestro `Conversiones` (`de → a → factor`). NO se liga el factor al artículo. |
| A2 | **Sin tabla puente artículo↔UM** | El artículo lleva UM Inventario (base) + UM venta/compra predeterminadas. Ya está así en V7. |
| A3 | **Subcategoría: opcional** | Se mantiene el flujo actual: primero Categoría, luego Subcategoría. **NO** se autocompleta categoría desde subcategoría. **NO** se vuelve obligatoria. (Las observaciones originales de "subcat obligatoria / autocompletar" quedan descartadas.) |
| A4 | **"Tipo de Artículo" pasa a llamarse "Grupo de Artículo"** | En nuestro caso Grupo y Tipo son lo mismo, solo cambia el nombre. Renombrar en todo GI/CO/GP. |
| A5 | **La cuenta contable vive en el Grupo de Artículo** | En una pestaña extra tipo **Finanzas** (ver `04_GRUPO_ARTICULO_FINANZAS.md`). NO por artículo, NO por almacén. |
| A6 | **Simplificar tablas, solo si es viable** | El objetivo NO es borrar columnas, sino reducir dependencia de muchas tablas para consultas más rápidas. Solo donde sea viable. |

## Almacenes

| # | Decisión | Detalle |
|---|---|---|
| B1 | **Listado: solo ID, Nombre, Descripción** | (+ acciones). Se agrega el campo **Descripción** al almacén. |
| B2 | **Quitar "Clase de almacén"** (Físico/Virtual) | Usar solo la descripción. |
| B3 | **Quitar "Uso" como dropdown** | Usar solo la descripción. |
| B4 | **Mantener "Almacén en tránsito"** | ⚠ Diferimos del Excel `Tablas.xlsx`: SÍ se necesita para saber cuáles son almacenes en tránsito (ej. OF de terceros). |
| B5 | **Mantener "involucra Kardex valorizado"** | Sin cambios. |
| B6 | **Permisos por almacén: se mantiene, SOLO por ROLES** | Quitar la opción de usuario individual. Solo roles. |
| B7 | **Quitar "Restringe los grupos de artículo que admite"** | Se elimina el checkbox y su caja de la ficha de almacén. |

## Lista de Materiales (LDM)

| # | Decisión | Detalle |
|---|---|---|
| C1 | **Agregar columna `Tipo` al detalle** | Valores: Artículo / Recurso / Texto. Igual que el detalle de la Orden de Fabricación. |
| C2 | **Agregar Recursos a la LDM vía MODAL** | El detalle puede incluir recursos (mano de obra / máquina), agregados con un **modal de búsqueda igual que el de artículos** (no selector inline). |
| C3 | **SIN versionado** | Descartado: el versionado no aporta. La LDM solo maneja **Predeterminada / alternativa** (como ya estaba). |
| C4 | **LDM detalle: agregar Almacén + Método de emisión por línea** | (⚠️-2 resuelta: *agregar ambos*.) Almacén = de dónde se toma el componente; Método = Notificación (backflush) / Manual. Solo en líneas Artículo/Recurso (Texto no). |

## Grupo de Artículo

| # | Decisión | Detalle |
|---|---|---|
| D1 | **Grupo = Tipo** | Mismo concepto, distinto nombre. Usar "Grupo de Artículo". |
| D2 | **Agregar pestaña Finanzas** | Con el listado de 28 movimientos contables, cada uno vinculado a una cuenta contable y con **código numérico** propio. Ver `04_GRUPO_ARTICULO_FINANZAS.md`. |

## Orden de Fabricación (OF)

| # | Decisión | Detalle |
|---|---|---|
| E1 | **OF está bien como está en V7** | Tipo Estándar/Especial, estados, recursos consumidos: OK. |
| E2 | ~~Cada detalle del pedido = una OF~~ | *(superado: descartado en GP por F2; las OF, una por artículo de la Solicitud de Fabricación, las crea Producción — M2/H6.)* |
| E3 | **En "Detalle del pedido" se ve y se puede cambiar la LDM** | Listado para elegir/cambiar la LDM usada. Al cambiar LDM se recalculan los Requerimientos de Materia Prima. Requiere Guardar/Actualizar para mantener cambios. |
| E4 | **Stock comprometido al liberar: dejar como está** | Sin cambios por ahora (pendiente de revisión futura con JC). |
| E5 | **Detalle de la OF: se MANTIENE en dos tablas** (Materiales + Recursos) | (⚠️-1 resuelta: *mantener separadas*.) No se unifica en una sola con `Tipo`. La distinción Artículo/Recurso se conserva vía las dos tablas. |

## GP · Gestión de Pedido (planeamiento)

| # | Decisión | Detalle |
|---|---|---|
| F1 | **Alcance GP = PLANEAMIENTO** | Solicitud de Pedido, análisis de stock, Requerimientos de MP, Solicitudes de Materiales, **Recursos** y **LDM**. |
| F2 | **La ejecución de la OF vive en Producción (GPV7)** | GP no ejecuta la OF (liberar, emitir, recibir, cerrar). **E2 "una OF por línea" queda DESCARTADO en GP**. GP y Producción son el mismo módulo en dos archivos (J4): en V9 salieron de GP la GP-04, GP-06 y GP-08. |
| F3 | **Verificar stock = botón + aviso** | Botón "Verificar stock" en GP-03 que calcula la cobertura contra la LDM y muestra el resultado; **permite continuar** (no bloquea). |
| F4 | **Selector de LDM (E3) solo en GP-03, por línea** | En "Detalle del pedido", por línea. Editable según **tipo de fabricación**: **Estándar** = LDM predeterminada fija (no se cambia); **Especial** = se puede elegir otra lista. Al cambiar la LDM se recalculan los Requerimientos de MP; **Guardar/Actualizar** persiste. |
| F5 | **Recursos en la LDM de GP** | Usar el **maestro real de Recursos (GP-07)** en el modal, no el mini catálogo de GI. |
| F6 | **Réplica de GI embebido dentro de la fase GP** | Grupo→Finanzas, almacenes, LDM (Tipo/Recurso/Texto/Almacén/Método), "Esperado"→"Pedido" en las pantallas GI embebidas en GP. |
| F7 | **El artículo del detalle debe EXISTIR en el sistema** | Se elimina del buscador **GP-02b** la opción de crear artículos inexistentes ("agregar como alta pendiente") y se elimina el estado **"Alta pendiente"** (con botón "Crear") en el detalle de GP-02/GP-03. Si la combinación (color/talla) no existe, se crea primero en el maestro (GI-02, Duplicar) y luego se busca. Se quitó la línea semilla sin artículo (CELESTE talla 32) de `SP-0007`. |

## Solicitud de Materiales (GI-13)

| # | Decisión | Detalle |
|---|---|---|
| G1 | **Propósito por línea, lo define Logística al aprobar: Compra o Transferencia** | El solicitante indica solo **qué** (artículos y cantidades) y **a dónde** (almacén destino); **no hay propósito en la cabecera** ni propósito "Producción". Logística, al aprobar, define por línea **Compra** o **Transferencia** (con almacén de origen). Aprobada, *Crear ▾* genera la **Orden de Compra** con las líneas Compra y una **Transferencia GI-11** por cada almacén de origen. Revisada el 2026-09-15 (antes: dos propósitos en cabecera elegidos por el solicitante). Aplicado en GI, CO, GP y Producción. |
| G3 | **Solicitud de Materiales ≠ Solicitud de Pedido de Fabricación** | Una Solicitud de Materiales (GI-13) **no se convierte** en una Solicitud de Pedido de Fabricación (GP). Son documentos distintos; aclarado en el hint de GI-13. |
| G4 | **SP → SOL (consolidación): aprobado, pendiente de implementar** | Se hará una **única Solicitud de Materiales multi-línea por Solicitud de Pedido** (en pausa por pedido del usuario; ver `01_PENDIENTES.md`). |

## Solicitud de Pedido de Producción · almacenes, requerimientos y SOL (ver `08_ANALISIS_SP_OP.md`)

| # | Decisión | Detalle |
|---|---|---|
| H1 | **Almacén destino en la cabecera de la SP** | **Uno por SP**. A donde se mueve toda la MP, se consume y aparece el PT. Obligatorio para poder generar las OP (en Producción). |
| H2 | **Almacén origen por material** | Default = el `almacen` de la línea de LDM (C4); **seleccionable** por material. Se edita en la vista por artículo (expandible). |
| H3 | **Requerimientos guardados por (línea de producto × material)** | Dato atómico `SP_Req` dentro de `SP_Linea.requerimientos`, con `origen: LDM | Manual`. La **SOL = roll-up** (suma por material+origen); la **OP = filtro** por artículo. Resuelve la atribución del caso **Especial**. Sustituye el `SP.mp` agregado. |
| H4 | **UI Especial = línea de producto expandible** | Colapsada por defecto (vista minimalista); al expandir se ven/editan los requerimientos de ese artículo (almacén origen, cantidad, y agregar MP manual en Especial). El panel consolidado por material queda como vista/roll-up. |
| H5 | **Consolidación SOL = una sola por pedido** | Una única Solicitud de Materiales multi-línea por SP (reemplaza la generación de una SOL por material). |
| H6 | **Alcance: solo dejar la SP lista** | La generación de N OP (una por producto) y el *commit* de MP a Comprometido son del **módulo de Producción** (fuera de esta fase). *(Superado en lo de estados: en Producción las OF de una Solicitud de Fabricación nacen Liberadas y las creadas en Producción, Planificadas — J6.)* |

## I · Modelo de datos de logística en el backend (2026-09-10, ver `14_V7_VS_ESQUEMA_REAL.md`)

| # | Decisión | Detalle |
|---|---|---|
| I1 | **Movimientos: `stock_movement` unificado** | **Revisa T2.** Se mantiene la tabla única del backend (ya probada con kardex y promedio ponderado) y se le suman tipo de objeto y trazabilidad de origen (el tipo de operación SUNAT queda para la Fase 2, ver M10). Funcionalmente equivale a Entradas/Salidas separadas. |
| I2 | **Respetar fronteras entre microservicios** | Almacenes → `config_db.warehouse` (las decisiones B1–B7 se proponen a configuraciones). Proveedores → `config_db.partner` + un rol propio en logística (decisión D5); los campos de T6 se reparten entre `partner` y contabilidad. |
| I3 | **V10 y V12 en la rama `feat/modelo-datos-v7`; V11 apartada** | La V11 (cuentas por grupo) va a `docs/fase-2/`: se rehace en Fase 2 sobre la Clase de Valoración. |
| I4 | **Recursos viven en Producción** | La LDM de logística guarda solo `id_resource` como referencia lógica. |
| I5 | **Alcance actual: solo logística, sin capa contable** | Asientos, dimensiones, plan de cuentas y Clase de Valoración con cuentas → Fase 2. |
| M1 | **Todo por ARTÍCULO: no hay modelo ni plantilla** | La LDM cuelga del artículo (SKU). Se retiran `article_model` y la excepción por talla; la marca pasa al artículo. |
| M2 | **Solicitud de Pedido mixta** | Admite cualquier artículo; explota en varias Órdenes de Fabricación (una por artículo, en Producción). La Orden de Pedido de logística sigue siendo una por solicitud. |
| M3/M4 | **Resumen x Artículo** (`Tablas.xlsx`) | Tabla artículo × almacén con Actual, **Comprometido**, **Pedido**, Mín, Máx y Costo promedio. Reemplaza `article_min_stock`. Los documentos (requerimientos de la SP, líneas de OC) explican los números. Disponible = Actual − Comprometido. |
| M5–M7 | *Por defecto (recomendado)* | Rehacer V12 sin `batch_movement`; catálogo `object_type` manteniendo las FK explícitas; en la OC solo moneda/TC/importación ahora. |
| M8 | **V°B° de Logística: avisa, no bloquea** (como el V7) | Con materia prima sin pedir el V°B° se da igual; la cobertura trae el aviso para mostrarlo antes de confirmar y la auditoría guarda qué faltaba y cuánto. Solo corta que no haya LDM. Sale `LOG-GP-409-MATERIALS-NOT-COVERED`. Cierra **D3** de `07_ANALISIS_GP.md`. *(Commit `a053123`.)* |
| M9 | **Códigos de categoría y subcategoría: correlativo por empresa** | `CAT-0001`, `SUB-0001`, sin significado. Las categorías existentes se renumeran; la subcategoría gana empresa y código propio. *(V13, commit `ff3a035`.)* |
| M10 | **Tipo de operación SUNAT (Tabla 12) → Fase 2** | Va con Contabilidad (registro de inventario permanente). No se toca ahora. |
| M11 | **Validación: BD local de descarte + pruebas unitarias** | Sin Docker: cada migración se aplica sobre una BD temporal en el MySQL local (:3308) y se borra; `./mvnw clean test` en verde. Los `*IT` quedan para cuando haya Docker. |
| M12 | **Contratos: back + front juntos** | Los cambios de contrato de la V15–V19 se hacen también en `erp-imperiotex-front` (rama `feat/modelo-datos-v7`): DTOs y servicios de datos. El front aún no tiene pantallas de solicitudes. |
| M13 | **Resumen x Artículo: con lo que hay hoy** | Actual y costo los mueve el asiento; Comprometido sube al aprobar la SP (T7); Pedido sube al validar la OC. Las **liberaciones** (consumo, recepción contra OC, transferencia aprobada) quedan pendientes de GI-09 y de los eventos de Producción. El semáforo del resumen va sobre el **disponible**. |
| M14 | **Una Orden de Compra por almacén** | La SOL es una por pedido con almacén por línea (H5); al aprobarla, las líneas con propósito **Compra** generan una OC por almacén (la OC tiene un solo almacén destino) y las líneas **Transferencia**, las transferencias desde su almacén de origen (G1). No se genera otra SOL mientras haya una pendiente. |
| M15 | **OC: moneda, TC e importación; la condición de pago NO** | El tipo de cambio se congela al completarse la doble validación (en soles, 1). La condición de pago es del proveedor (`config_db.partner`/contabilidad, D5), no de la OC. |

## Modelo transversal

| # | Decisión | Detalle |
|---|---|---|
| T1 | **Stock: Actual, Comprometido y Pedido** | El antiguo "Esperado" **se renombra a "Pedido"** (Stock Pedido / OnOrder del Excel: mercadería en camino). **NO se elimina.** **Disponible = Actual − Comprometido**, calculado en línea (el Pedido es informativo, no entra al disponible). Sin romper el flujo actual. |
| T2 | ~~Motor de movimientos NO unificado~~ | *(superado por I1 en lo de dos tablas: se mantiene `stock_movement` unificado.)* Sigue valiendo: la regularización crea un ingreso o una salida (no hay tipo Ajuste, J1); la transferencia crea una salida + una entrada; se mantienen Motivo de Traslado y Objeto Base/Línea Base. |
| T3 | **Considerar tabla de Lotes** del Excel `Tablas.xlsx` | Lote + control de lote con objeto base. |
| T4 | **Cuenta contable: 1 solo nivel, por Grupo de Artículo** | Nada más por ahora (no por artículo, no por almacén). |
| T5 | **Stock indexado por CÓDIGO de artículo** | En el modelo de datos la clave es el **código** (no el nombre). Ojo: **es un prototipo**, no corre funcionalmente para producción; basta reflejar la estructura, no re-implementar el motor en memoria. |
| T6 | **Socio de Negocio: mantener separado** | No unificar Cliente/Proveedor. **Implementado en CO-02**: se agregó a Proveedores una sección "Condiciones comerciales y fiscales" con **Moneda, Condiciones de pago, Sujeto a retención, Indicador de impuestos y Teléfono móvil** (portados del "Socio de Negocio" del Excel). |
| T7 | **Momento en que el stock pasa a Comprometido** | La **MP** entra a Comprometido cuando la **Solicitud de Pedido queda Aprobada** (las **dos firmas**: V°B° Logística + Aprobación Gerencia). Aprobar solo la Solicitud de Materiales NO compromete. **Implementado** (`spComprometerMP` en `cerrarSiCompleto`): al aprobarse la SP, por cada requerimiento se hace `Comprometido += cantidad` en (almacén origen, material). Efecto (UC-09): otra solicitud que usaba ese stock verá bajar su Disponible, **pudiendo quedar en negativo**. La **Transferencia** compromete el **origen al aprobarse**. Alineado con la matriz *Stock Comprometido y Pedido* de `Tablas.xlsx`. Ver `09_STOCK_COMPROMETIDO_Y_CASOS.md`. |
| T8 | **SOL desalineada (UC-11/12): solo aviso, sin auto-sincronizar** | La SOL emitida **no** se reescribe sola. `renderPanelMP` muestra un **aviso claro** cuando la cantidad pedida en la SOL ya no coincide con el requerido actual (o si el artículo se quitó → "ya no se necesita"). Si sigue Pendiente, el usuario la regenera; si ya tiene OC, la ajusta en Logística. Lo más simple a nivel de código. |

## J · Limpieza V9 (2026-09-15, ver `15_IMPACTO_SOL_AJUSTES_FALLADOS.md`)

| # | Decisión | Detalle |
|---|---|---|
| J1 | **No existe el tipo de movimiento Ajuste** | Regularizar = **Ingreso (GI-09)** o **Salida (GI-10)** con motivo "Regularización de inventario (sobrante / faltante)" y observación. **Sin visto bueno**: solo registra quien tiene el rol. Se retiró GI-12 y la serie NA; los conceptos contables 25/26 pasan a "Regularización por sobrante / faltante de inventario". |
| J2 | **Producto fallado = salida + ingreso** | Salida del artículo e ingreso del artículo "… FALLADO" al mismo costo, con motivo "Producto fallado"; opcional una OF de reproceso (Especial, solo mano de obra, mismo N° Referencia). |
| J3 | **La tercerización vive en la OF de Producción** | Se retiró la Producción Tercerizada de Compras (CO-13) y la subcontratación desde la salida. Botón *Tercerizar* en la OF: envío al proveedor = transferencia a almacén de tránsito; retorno = recibo de producción; el servicio se compra con una **OC de servicio normal**. |
| J4 | **GP y Producción son el mismo módulo, en dos archivos** | GP = Solicitudes de Pedido (GP-01/02/03) + maestro de Recursos (GP-07, tipos y grupos). Producción (GPV7) = órdenes de fabricación, emisiones, recibos, referencias, plan y costos. Se retiraron de GP: GP-04, GP-06 y GP-08. |
| J5 | **Nombres** | **N° Referencia** (agrupa las OF para el recosteo) y **Orden de Fabricación / OF-xxxxxx**. |
| J6 | **Producción simple, como SAP B1** | Sin avances ni órdenes hijas: **Emisión** (salida, líneas Manual) y **Recibo** (ingreso, consume líneas Notificación) directos. OF de una Solicitud de Fabricación nacen **Liberadas**; las creadas en Producción, **Planificadas**. Una muestra es un **ingreso con costo** (no hay órdenes de muestra). Servicios = **recursos** con costo estándar, contrastado con OC, factura y nota de crédito. Faltantes → **Solicitud de materiales** (propósito por línea, G1). "Fase" es solo el número de secuencia de la orden dentro de su N° Referencia. Sin metodología de pago de operarios. |

---

## Descartado explícitamente

- Autocompletar Categoría desde Subcategoría.
- Hacer Subcategoría obligatoria.
- Cuenta contable por artículo o por almacén (solo por Grupo, 1 nivel).
- Unificar Cliente/Proveedor en un solo "Socio de Negocio".
- Incluir el **Pedido** (ex-Esperado) en el cálculo de disponible (es informativo).
- **Versionado de LDM** (descartado: no aporta; solo Predeterminada).
- **"Restringe grupos de artículo"** en almacén (checkbox eliminado).
- **E2 "cada detalle = una OF"** en GP (la ejecución de la OF vive en Producción · GPV7).
- Propósito de la Solicitud de Materiales en la cabecera elegido por el solicitante (G1).
- Tipo de movimiento propio para regularizar inventario y su visto bueno (J1).
- Producción tercerizada en Compras y subcontratación desde la salida (J3).
- Avances, órdenes hijas, órdenes de muestra y metodología de pago de operarios (J6).
