# 08 · Análisis — Solicitud de Pedido → Solicitud de Materiales → Orden de Fabricación (almacenes, estados y Especial)

> Análisis previo (SIN cambios en el prototipo). Cruza: petición del usuario (2026-09-09),
> `Tablas.xlsx` (hoja *Stock Comprometido y Pedido* y *Notas*), estado actual del código GP y decisiones previas.
> Objetivo: dejar el modelo de datos de la Solicitud de Pedido **listo para explotar en N Órdenes de Fabricación**,
> resolviendo la atribución de materia prima por artículo (incluido el caso **Especial**).

---

## 1. Lo que pide el usuario (resumen)

1. **Almacenes en la Solicitud de Pedido de Producción (SP):**
   - **Almacén destino** (en la **cabecera**): a donde se mueve **toda** la MP, donde se **consume** y donde aparece el **producto terminado**.
   - **Almacén origen** (por material, en la lista de **Requerimientos**): de dónde se saca cada MP. **Por defecto** el que trae opcionalmente la LDM (ya existe, campo `almacen` de la línea de LDM), pero **seleccionable** por material desde la SP.
2. **Una Orden de Fabricación (OP) por producto**: cada OP jala **solo** la MP que necesita **ese** artículo (aunque en la SOL todo se sume), con los almacenes definidos en la SP. ⇒ el modelo de la SP debe estar preparado para **replicar N OP**.
3. **Estados / concepto** (referenciados en `Tablas.xlsx`, no literales): la fase **"Planificado"** vive en la **SP/SOL**; la **OP nace "Liberada"**. Al **aprobar la SOL**, la MP pasa a **Comprometido** (la OP liberada compromete componentes). Usamos **nuestros propios nombres de estado**.
4. **Estándar / Especial + método de emisión** (nota del Excel: *método = consumo Manual o Notificación; Notificación = backflush por regla de tres*). El método va **por artículo/material** (OK). **Problema:** en **Especial** se agrega MP extra; si la SOL suma todo, **¿cómo se sabe qué MP pertenece a qué artículo y cuánta fue manual?**

## 2. Estado actual del código (verificado)

- `SP.lineas = [{art, nom, color, talla, qty, tipofab, ldmId}]` (tipofab/ldmId ya agregados por E3).
- **`SP.mp` se reconstruye en cada render agregando por material** (`renderPanelMP`: `agr[cod]` suma sobre todas las líneas) → **pierde la atribución por artículo**. Es deuda técnica ya anotada.
- `generarOPdesdeSP()` crea **1 sola OPF** con `lineas = SP.lineas` (todas), estado "Planificado". **No** hay split por producto, **no** hay almacén origen/destino.
- La LDM (GI-17f) ya tiene por línea: `tipo`, `almacen` (origen), `metodo_emision` (Notificación/Manual) — decisión C4. **Ésta es la base del default de origen y método.**

## 3. El problema central y su solución

**Causa raíz:** hoy los requerimientos se guardan **solo como agregado por material** (`SP.mp`). Un agregado **no** se puede volver a separar por artículo, y menos si hubo adiciones manuales (Especial).

**Solución (principio):** el **requerimiento es el dato atómico y siempre pertenece a UN artículo**. La **SOL es un roll-up** (para comprar/transferir) y la **OP es un filtro** (por artículo). **Nunca** se guarda solo el roll-up.

```
Fuente de verdad = requerimientos POR (línea de producto × material)
        │
        ├── roll-up  →  SOL (consolidada por material + almacén origen)   [compras / transferencias]
        └── filtro   →  OP por producto (solo los requerimientos de ese artículo)
```

Con esto:
- **"¿Qué MP pertenece a qué artículo?"** → cada requerimiento lleva su `sp_linea` (artículo).
- **"¿Cuánta fue manual?"** → cada requerimiento lleva `origen` (`LDM` | `Manual`) y su `cantidad`.
- La SOL sigue mostrando **todo sumado** (es una vista), pero por debajo la atribución no se pierde.

## 4. Modelo de datos propuesto

### 4.1 Solicitud de Pedido de Producción (cabecera)
```
SP {
  id, fecha, mes, solicitante, estado, obs,
  almacen_destino,        // NUEVO · cabecera: destino común de la MP, consumo y PT
  lineas: [ SP_Linea ]
}
```

### 4.2 Línea de producto (una por artículo terminado)
```
SP_Linea {
  art, nom, color, talla, qty,
  tipo_fabricacion,       // Estándar | Especial   (ya existe: E3)
  ldm_id,                 // lista efectiva (Estándar=predeterminada; Especial=base elegida)
  requerimientos: [ SP_Req ]   // NUEVO · MP/recursos explotados de ESTE artículo
}
```

### 4.3 Requerimiento (dato atómico — la clave de todo)
```
SP_Req {
  tipo,                 // Artículo | Recurso | Texto  (homogéneo con LDM/OF)
  material_cod, nom, u,
  consumo_unitario,     // de la LDM (Manual puede ir 0 y usar cantidad directa)
  cantidad_requerida,   // consumo_unitario × qty_linea  (o cantidad manual)
  almacen_origen,       // default de la LDM; SELECCIONABLE por fila
  metodo_emision,       // Notificación (backflush, regla de tres) | Manual
  origen                // "LDM" | "Manual"   ← atribución del caso Especial
}
```

### 4.4 Derivados
- **SOL (Solicitud de Materiales)** = `⋃ lineas.requerimientos` con déficit, **agrupado por (material_cod, almacen_origen)**, sumando `cantidad_requerida` → **una SOL multi-línea** (consolidación SP→SOL ya aprobada), **sin propósito**: Logística lo define **por línea** al aprobarla (**Transferencia** si hay stock en otro almacén, **Compra** si no — G1).
- **OP por producto** = por cada `SP_Linea` con `qty>0` → una OP con **solo `SP_Linea.requerimientos`**, `almacen_origen` por material y `almacen_destino` de la cabecera.

### 4.5 Reglas de recálculo (Estándar vs Especial)
- **Estándar**: los `requerimientos` con `origen="LDM"` se **regeneran** al cambiar `qty` o `ldm_id`. No editables (salvo `almacen_origen`).
- **Especial**: se pueden **agregar** filas `origen="Manual"` y **editar cantidades**. Al recalcular, se **regeneran solo las filas LDM** y se **conservan las Manual**. Así nunca se pierde lo personalizado ni su artículo.

## 5. Almacenes — flujo

```
Por material:  almacen_origen  ──(Solicitud de Materiales · Transferencia)──►  almacen_destino (cabecera)
almacen_destino: se consume la MP (salida a producción) y aparece el PT (entrada de producción)
```
- `almacen_origen` default = el `almacen` de la línea de LDM (C4); editable en la lista de Requerimientos.
- `almacen_destino` = uno por SP (cabecera). *(A confirmar si podría variar por producto.)*
- El propósito de cada línea de la SOL lo define **Logística al aprobar** (G1): **Compra** si `almacen_origen` no tiene stock; **Transferencia** (con almacén de origen) si lo tiene.

## 6. Estados y stock (mapa con `Tablas.xlsx` → nuestros estados)

| Concepto Excel (referencia) | Nuestro modelo | Efecto en stock (hoja *Stock Comprometido y Pedido*) |
|---|---|---|
| OP **Planificado** | vive en **SP / SOL** (planeamiento) | — (aún no compromete) |
| OP **Liberado** | **OP creada** (una por producto) al aprobar | **Componentes → Comprometido** (+) · **PT → Pedido** (+) |
| **Emisión para producción** | consumo en `almacen_destino` | Componentes: Actual (−) y Comprometido (−) |
| **Recibo de producción** | ingreso de PT en `almacen_destino` | PT: Actual (+) y Pedido (−) |
| **Cierre / Cancelación** | cierre de OP | libera Comprometido/Pedido no consumido |

- **Nuestros nombres de estado** (propuestos, a confirmar): OP → **Liberada → Cerrada / Cancelada** (sin "Planificada", porque esa fase es la SP/SOL).
- **Al aprobar la SOL** ⇒ se crean las OP **Liberadas** ⇒ la MP queda **Comprometida**. Coincide con la petición.
- *(Superado: la MP se compromete al aprobar la **SP** (T7). En Producción (GPV7) las OF de una Solicitud de Fabricación nacen **Liberadas** y las creadas en Producción nacen **Planificadas**; estados Planificado → Liberado → Cerrado / Cancelado.)*
- Coherente con la decisión T1: *Disponible = Actual − Comprometido*; el **Pedido** (PT en camino) es informativo.

## 7. Impacto en UI (GP-03)

- **Cabecera**: nuevo campo **Almacén destino** (obligatorio para generar OP).
- **Requerimientos de Materia Prima**: hoy es un agregado read-only. Pasa a:
  - Mostrar/permitir **elegir `almacen_origen` por material** (default LDM).
  - Para **Especial**, permitir **editar/añadir MP por artículo** (propuesta: fila de producto **expandible** que muestra sus requerimientos, o un editor "Requerimientos por artículo"). El agregado por material queda como **vista consolidada** (= la SOL).
- **Generar**: en vez de 1 OPF, **N OP (una por producto)**, cada una con sus requerimientos y almacenes. *(Ojo: la creación/*commit* de la OP es del módulo de Producción; ver §9.)*

## 8. La respuesta directa al caso "Especial"

> *"Si agrego más MP por artículo, ¿cómo sé cuál pertenece a qué artículo y cuánta fue manual?"*

Porque la MP **no se guarda sumada**: se guarda como `SP_Req` **dentro de la línea del artículo** (`SP_Linea.requerimientos`), con `origen="Manual"` y su `cantidad_requerida`. La suma por material (la SOL) es una **vista derivada**. Al crear la OP de ese artículo, se toman **sus** requerimientos (LDM + Manual), nunca la suma global. **Atribución 100% preservada.**

## 9. Límite de alcance (a confirmar)

Por decisión previa **F2**, *fabricación/producción es otro módulo*. Este análisis prepara el **modelo de la SP/SOL** (planeamiento, nuestro) para que la OP sea explotable. **A confirmar** si en esta fase:
- (a) solo dejamos la **SP lista** (almacén destino + origen por material + requerimientos por artículo + SOL consolidada), o
- (b) además implementamos en el prototipo la **generación de N OP + commit** (aunque el módulo de producción sea otro).

## 10b. Decisiones (resueltas) e implementación (2026-09-09)

**Decisiones (H1-H6 en `00_DECISIONES_CERRADAS.md`):** almacén destino uno por SP (cabecera); almacén origen por material (default LDM, seleccionable); requerimientos por (línea × material) con `origen LDM|Manual`; UI Especial = **línea expandible** (minimalista); **una sola SOL por pedido**; alcance = **solo dejar la SP lista** (generación de OP + commit = módulo de Producción).

**Implementado en `Prototipo_GP.html`:**
- **Cabecera**: campo **Almacén destino** en GP-02 (nueva, obligatorio) y GP-03 (editable en Borrador/Pendiente). `SP.almDestino`.
- **Requerimientos por artículo**: `SP_Linea.reqs = [{tipo,cod,nom,u,cons,cant,almOrigen,emision,origen}]`. Helpers `spEnsureReqs`/`spRebuildReqs` (regenera filas LDM, conserva Manual). Se reconstruye al cambiar cantidad, tipo de fabricación o LDM.
- **UI expandible**: en el detalle de GP-03, cada línea con LDM muestra "▸ Materiales (n)"; al expandir, sub-tabla con material, cantidad, **almacén origen** (select), método (select) y origen. En **Especial**: cantidad editable en filas Manual, **"+ Agregar material (manual)"** (modal `m-spmpreq`) y quitar Manual.
- **Panel MP consolidado**: `renderPanelMP` ahora agrega desde los `reqs` por (material + almacén origen); botón único **"Generar Solicitud de Materiales (n)"**.
- **SOL**: `generarSOLdesdeSP()` crea **una sola** Solicitud de Materiales multi-línea con todo el déficit (reemplaza `generarSolicitudMP` por material).
- **Verificación**: `node --check` OK; prueba de lógica en node (atribución por artículo, recálculo por cantidad, Manual atribuido, roll-up SOL por material+origen, filtro OP por producto). **Sin verificación visual**: GP (~580 KB) supera el tope del navegador integrado.

**Pendiente (módulo Producción, fuera de alcance):** generar N OP (una por producto) desde la SP y el *commit* de MP a Comprometido.

## 10. Dudas para el usuario (RESUELTAS — ver §10b)

- **Q1** `almacen_destino`: ¿uno por SP (cabecera) o podría variar por producto?
- **Q2** Edición **Especial**: ¿línea de producto **expandible** con sus requerimientos, o vista aparte "Requerimientos por artículo"?
- **Q3** Nombres de estado de la OP (propongo **Liberada / Cerrada / Cancelada**, sin "Planificada"). ¿OK?
- **Q4** Alcance §9: ¿(a) solo SP lista, o (b) también generar N OP + commit en el prototipo?
- **Q5** SOL: al consolidar, ¿una SOL por SP (todo junto) o **una SOL por almacén origen** (para separar transferencias de distintos orígenes)?
