# 07 · Análisis de GP (Gestión de Pedido / Producción)

> Análisis previo a implementar, cruzando: **notas originales** (observaciones de OF), **`Tablas.xlsx`**,
> **`01_PENDIENTES.md`** y los **cambios ya hechos en GI**. No se ha tocado GP todavía.
> Fecha: 2026-09-08.
>
> **Superado en parte (V9, 2026-09-15):** GP-04 (Órdenes de Fabricación), GP-06 (Consumo) y GP-08 (Plan) se retiraron de GP. Las órdenes de fabricación, emisiones y recibos viven en **Producción (GPV7)**, sin órdenes hijas ni avances. GP queda con GP-01/02/03 y el maestro de Recursos (GP-07). Lo que sigue es el análisis histórico.

---

## 1. Estructura real de `Prototipo_GP.html`

**Pantallas propias de GP:**
- `gp01` Solicitudes de Pedido (lista) · `gp02` Nueva Solicitud · `gp03` **Revisión de la Solicitud (núcleo)**.
- `gp04` Órdenes de Fabricación (bandeja) · `gp04f` **Ficha de la OF**. *(retiradas en V9)*
- `gp06` Consumo de Materiales *(retirada en V9)* · `gp07`/`gp07f` **Recursos** (maestro real: tipo/grupo/costo) · `gp08` Plan de Producción *(retirada en V9)*.
- `mtrec` Tipos de Recurso · `mgrec` Grupos de Recurso.

**Pantallas embebidas (copias que heredan los cambios de GI/CO):**
- Todo **GI**: `gi01`…`gi20` (sin `gi12` desde V9), `mtipos`, `mcat`, `msub`, `mum`, `mconv`, `matr`, `mbc`, `msede`.
- Las pantallas de **CO** que usa el flujo (`co01`…`co12`).

> ⇒ Replicar GI en GP = re-aplicar aquí: Grupo→Finanzas, almacenes simplificados, LDM (Tipo/Recurso/Texto/Almacén/Método), y "Esperado"→"Pedido". Igual que CO (que también embebe GI).

## 2. Estado actual del flujo GP (verificado en código)

- **SP (Solicitud de Pedido)**: cabecera + detalle por artículo terminado (código, color, talla, cantidad). Estados: Borrador → Pendiente Aprobar → Aprobada → Convertida en Orden (o Rechazada).
- **GP-03 (revisión)**: paneles de Alertas de Stock, Rotación, **Requerimientos de Materia Prima** y Solicitudes de Materiales.
  - El cálculo de MP (`renderPanelMP`) usa **siempre la lista predeterminada** de cada artículo (`ldmDe` → `LDM_OPTS[cod][0]`). El hint dice literalmente *"No se elige lista: siempre es la predeterminada"*.
  - **`LDM_OPTS`** ya tiene **listas alternativas** por artículo (p. ej. `PT-0001` = LDM-0001 predeterminada + LDM-0004 alternativa). ⇒ E3 es viable con lo que ya existe.
  - El **V°B° hoy NO bloquea**: `preVB`/`spBloqueoVB` solo **avisan** si falta cobertura ("puede dar el V°B° igualmente"). Cambió respecto del V6 (que sí bloqueaba).
- **Generación de OF (`generarOPdesdeSP`)**: 1 SP → **1 OPF** que luego **explota en órdenes hijas por nivel** (CASCADA: Acabado → Lavado → Crudo). No es "una OF por línea de artículo". *(Superado en V9: GP-04, la explosión y las órdenes hijas se retiraron; Producción crea una OF por artículo.)*
- **OF (gp04f)**: tipo **Estándar/Especial** ✅, estados Planificado/Liberado/Cerrado, **stock comprometido al Liberar** ✅. Detalle en **dos tablas**: "Materiales de la orden" + "Recursos consumidos" (decisión E5: se mantienen).

## 3. Contraste con `Tablas.xlsx`

| Excel | En GP | Estado |
|---|---|---|
| Orden Fabricación (ID, Código Producto, Estado P/R/L/C, Tipo S/P, Cant. planificada, fechas, Cliente, Objeto 202) | OPF con estado/tipo/fechas | ✅ (falta `cliente` y `tipo_objeto` explícitos; menor) |
| Orden Fabricación Detalle (Tipo Item/Recurso/Texto, Nº artículo, Cant. base, Cant. requerida, Almacén, Método emisión) | Dos tablas (Materiales + Recursos) | ⚖️ decisión E5 (no unificar) |
| Stock Comprometido / Pedido | Comprometido ✅; "Esperado"→"Pedido" pendiente de replicar en gi05 embebido | ◐ |
| Motivo de Traslado (38 SUNAT) | No usado en los movimientos de GP | doc (⚠️-6) |

## 4. Contraste con las notas originales (Orden de Fabricación)

| Nota original | Estado en GP |
|---|---|
| Estándar → toma LdM y no cambia | ✅ (Estándar congela la lista) |
| Especial → artículos/recursos personalizados (opción a jalar LdM) | ✅ (Especial editable) |
| Solicitud de fabricación contiene varios detalles | ✅ (la SP tiene varias líneas) |
| **Cada detalle se convierte en una OF** | ⚠️ **HOY NO**: 1 SP → 1 OPF (con explosión por nivel), no 1 OF por línea → **D1** *(superado: Producción crea una OF por artículo)* |
| **Botón Verificar Stock** (valida stock según LdM, recién pasa a OF) | ⚠️ **NO existe**; hoy el V°B° solo avisa → **D3** |
| **Modificar detalle especificando la LdM a usar** (E3) | ⚠️ **NO**: el cálculo usa siempre la predeterminada → **D2** |
| Stock comprometido al liberar la OF | ✅ (se mantiene, decisión E4) |
| Movimientos por tipo (1 ingreso, 1 salida) + campos (id, tipo op, id op, línea op) | doc (modelo Entradas/Salidas, T2; en el backend tabla única, I1) — el proto no lo implementa |

## 5. Cambios a realizar en GP (propuesta)

### 5.a Réplica de GI (en pantallas embebidas)
1. Renombrar "Tipos de Artículo"→"Grupos de Artículo" (nav + `mtipos` + ficha `scr-grupo` + Finanzas 28 conceptos).
2. Almacenes: listado ID/Nombre/Descripción, quitar Clase/Uso/Restringe, permisos por rol, Kardex positivo, mantener tránsito.
3. LDM (gi17/gi17f): Tipo (Artículo/Recurso/Texto), Recurso por modal, Almacén + Método de emisión por línea, sin versionado.
4. "Esperado"→"Pedido" en gi05/gi06/gi20 embebidos.

### 5.b GP-propio (según dudas resueltas)
5. **E3**: selector de LdM por línea en el "Detalle del pedido" (GP-03) → recalcula Requerimientos de MP → Guardar/Actualizar. *(Depende de D2.)*
6. **E2**: ¿una OF por línea de detalle? *(Depende de D1.)*
7. **Verificar Stock**: botón + validación previa a generar la OF. *(Depende de D3.)*

### 5.c Recomendaciones (no bloqueantes)
- **Recursos**: al replicar la LDM en GP, usar el **maestro real `RECURSOS` (GP-07)** en el modal, no el mini `RECURSOS_LDM` de GI. *(D4.)*
- **Doble fuente de BOM en GP**: coexisten `LDMS` (GI-17, visual) y `LDM_OPTS` (cálculo de MP en GP-03). Para E3, el selector opera sobre `LDM_OPTS`. En el prototipo se documenta esta duplicación; unificar es deseable pero mayor esfuerzo. *(D6.)*

## 5.d Estado de implementación (2026-09-08)

**Hecho (GP-propio, planeamiento):**
- **E3** — Selector de LDM por línea en GP-03 "Detalle del pedido": columnas **Tipo fabricación** (Estándar/Especial) y **Lista de materiales**. Estándar = predeterminada (selector deshabilitado); Especial = elegible entre `LDM_OPTS[cod]`. Al cambiar tipo/lista/cantidad se recalcula el panel de MP (`ldmDeLinea` reemplaza a `ldmDe` en `renderPanelMP`). Nuevos helpers: `ldmOptsDe`, `ldmDeLinea`, `spSetTipoFab`, `spSetLdm`.
- **Verificar stock** — botón en GP-03 (`verificarStock()`): recalcula cobertura vs LDM y muestra aviso; permite continuar (no bloquea).
- **Pedido** — "Esperado"→"Pedido" en las pantallas GI embebidas de GP.
- **Verificación**: `node --check` OK sobre todo el JS; lógica de `ldmDeLinea` + agregación de MP probada en node (Estándar→predeterminada, Especial→lista elegida cambian la MP). **No hay verificación visual**: GP (570 KB) supera el tope ~500 KB del navegador integrado.

**Decisiones aplicadas:** F1/F2 (alcance planeamiento; E2 y ejecución de OF fuera), F3 (verificar = aviso), F4 (selector solo en GP-03, gating Estándar/Especial).

**Pendiente:** F6 (réplica de Grupo→Finanzas, almacenes y LDM de GI en las pantallas embebidas de GP) + F5 (LDM usa RECURSOS GP-07). Recomendado hacerlo en un pase conjunto con CO (ambos embeben GI).

## 6. Dudas para el usuario (RESUELTAS — ver `00_DECISIONES_CERRADAS.md` §GP)

- **D1** ¿"Cada detalle = una OF" literal (1 línea → 1 OF), o se mantiene 1 OPF + explosión por nivel? *(superado: Producción crea una OF por artículo, sin explosión en órdenes hijas)*
- **D2/E3** ¿Selector de LdM en GP-03 (SP) por línea? ¿También en la ficha de la OF, o solo en GP-03?
- **D3** ¿Botón "Verificar stock" con **bloqueo duro** antes de generar la OF, o mantener el aviso suave actual del V°B°?
- **D4** ¿La LDM en GP usa el maestro real de Recursos (GP-07)?
- **D5** ¿Replico ahora en GP toda la parte embebida de GI, o primero lo GP-propio y la réplica en un segundo pase (coordinando con CO, que también embebe GI)?
- **D6** ¿Unificar `LDMS` y `LDM_OPTS`, o dejar la duplicación documentada (prototipo)?
