# 09 · Stock Comprometido — momento de compromiso + casos de uso para detectar problemas

> Complementa `08_ANALISIS_SP_OP.md`. Fija **cuándo** el stock pasa a Comprometido (decisión T7) y propone
> casos de uso/flujos para encontrar incoherencias antes de avanzar. Fecha: 2026-09-09.

---

## Parte A · ¿Cuándo el stock pasa a "Comprometido"? (decisión T7)

Base: matriz *Stock Comprometido y Pedido* de `Tablas.xlsx` + decisiones E4/H3/H6.
Regla global del modelo: **Disponible = Actual − Comprometido** (el **Pedido** es informativo, decisión T1).

### Momentos en que se INCREMENTA el Comprometido (+)
| Evento | Qué se compromete | Nota |
|---|---|---|
| **Solicitud de Pedido Aprobada (dos firmas)** | **Componentes (MP)**: `Comprometido += requerido` | **Éste es el momento clave (decisión T7).** Ocurre cuando la SP recibe V°B° Logística + Aprobación Gerencia. **Implementado** en `spComprometerMP` (`cerrarSiCompleto`). |
| **Transferencia aprobada** | Almacén **origen**: `Comprometido += cantidad` | Ya implementado en GI (`aprobarTRF`). El **destino** suma a **Pedido**. |
| *(Ventas — otro módulo)* Pedido de cliente | **PT**: `Comprometido += cantidad` | Referencia del Excel; fuera de logística. |

### Momentos en que se LIBERA el Comprometido (−)
| Evento | Efecto |
|---|---|
| **Recepción de transferencia** / cancelación de pendientes | origen: `Actual −` y `Comprometido −`; destino: `Actual +` y `Pedido −` |
| **Emisión para producción** (consumo real) | MP: `Actual −` y `Comprometido −` |
| **Recibo de producción** (ingreso de PT) | PT: `Actual +` y `Pedido −` |
| **Cierre / cancelación de la OP** | libera el `Comprometido` de MP no consumida y el `Pedido` de PT |

### La decisión, en una frase
> **La materia prima entra en Comprometido cuando la Solicitud de Pedido queda Aprobada (las dos firmas: V°B° Logística + Gerencia).** Aprobar solo la Solicitud de Materiales NO compromete. La **Transferencia** compromete el origen **al aprobarse**.

> Implementado en GP (`spComprometerMP`): al aprobarse la SP, cada requerimiento suma a `Comprometido` en (almacén origen, material). Generar/liberar la Orden de Fabricación y ejecutar el consumo real siguen siendo del **módulo de Producción** (H6).

---

## Parte B · Casos de uso para detectar problemas

> Formato: **objetivo · pasos · esperado · qué problema detecta**. Recorrer de corrido (sin recargar).

### Flujos base (deberían funcionar)
**UC-01 · Pedido estándar con stock suficiente**
- Pasos: GP-02 nueva SP, almacén destino, 1 artículo Estándar, cantidad baja; enviar; GP-03.
- Esperado: panel MP en verde ("Materia prima cubierta"); V°B° disponible.
- Detecta: cálculo MP con LDM predeterminada + lectura de disponible (Actual−Comprometido).

**UC-02 · Pedido con déficit → una sola SOL**
- Pasos: SP con cantidad alta que supere el stock; en GP-03, botón "Generar Solicitud de Materiales (n)".
- Esperado: **una** SOL multi-línea (sin propósito: Logística lo define por línea al aprobar) con todos los materiales en déficit; los materiales pasan a estado "Pendiente".
- Detecta: consolidación SP→SOL (H5); que NO se generen varias SOL.

### Especial / atribución (el punto crítico)
**UC-03 · Especial: agregar MP manual a un artículo**
- Pasos: en el detalle, poner una línea en **Especial**; expandir "▸ Materiales"; "+ Agregar material (manual)"; asignar cantidad.
- Esperado: la fila queda con `origen = Manual` bajo **ese** artículo; el panel consolidado la suma; la (futura) OP de ese artículo la incluye y las demás **no**.
- Detecta: **atribución por artículo** (la pregunta del usuario). Riesgo: que el manual se "reparta" o se pierda.

**UC-04 · Dos artículos comparten un material**
- Pasos: dos líneas (p. ej. T28 y T30) que usan la misma tela.
- Esperado: el panel consolidado muestra **una** fila (material+almacén) con la suma; cada línea conserva su parte.
- Detecta: roll-up correcto + split por OP. Riesgo: doble conteo o pérdida de origen.

**UC-05 · Cambiar la LDM de una línea Especial**
- Pasos: línea Especial, cambiar la Lista de materiales por una alternativa.
- Esperado: se **recalculan** los requerimientos (filas LDM), se **conservan** las Manual; el déficit cambia.
- Detecta: `spRebuildReqs` regenera LDM y preserva Manual.

### Almacenes
**UC-06 · Mismo material desde dos almacenes origen distintos**
- Pasos: en dos líneas, para el mismo material, elegir **almacén origen** distinto en la vista expandible.
- Esperado: el panel consolidado muestra **dos filas** (una por material+origen); disponibilidad calculada por almacén.
- Detecta: agrupación por (material, almacén origen). Riesgo: que se sumen orígenes distintos como uno solo.

**UC-07 · Cambiar el almacén destino**
- Pasos: cambiar Almacén destino en la cabecera; generar SOL.
- Esperado: la observación de la SOL refleja el destino; (futuras) OP consumen y reciben PT en ese destino.
- Detecta: que el destino viaje al documento derivado.

**UC-08 · Almacén origen sin stock**
- Pasos: elegir un almacén origen que no tenga el material.
- Esperado: déficit total → esa línea entra a la SOL.
- Detecta: lectura de disponible por almacén; que un origen vacío no "invente" stock.

### Stock / Comprometido
**UC-09 · Dos pedidos comprometen el mismo material** ⚠
- Pasos: crear dos SP que necesiten el mismo material del mismo almacén.
- Esperado: el Comprometido debería **acumular** ambos; el Disponible bajar para el segundo.
- Detecta: **riesgo de doble uso del mismo stock** si el compromiso no acumula entre documentos. (Resuelto por T7: `spComprometerMP` compromete al aprobar cada SP.)

**UC-10 · Transferencia: compromete y libera**
- Pasos: GI-11 aprobar una transferencia; ver Existencias; recepcionar.
- Esperado: al aprobar, origen `Comprometido +` y destino `Pedido +`; al recepcionar, `Actual` se mueve y se liberan Comprometido/Pedido.
- Detecta: coherencia de la máquina de estados de transferencia con T7.

### Robustez / bordes (donde suelen aparecer los problemas)
**UC-11 · Cambiar cantidades DESPUÉS de generar la SOL** ⚠
- Pasos: generar la SOL; luego cambiar la cantidad de un artículo.
- Esperado: la SOL ya emitida **no** se recalcula sola; `renderPanelMP` avisa que quedó desalineada (decisión T8).
- Detecta: que el aviso de desalineación aparezca respecto al nuevo requerimiento.

**UC-12 · Quitar un artículo del detalle tras generar la SOL** ⚠
- Pasos: generar SOL; quitar una línea de producto.
- Esperado: sus materiales podrían quedar "huérfanos" en la SOL ya emitida.
- Detecta: **gap** de sincronización SP↔SOL tras edición.

**UC-13 · Artículo sin LDM**
- Pasos: artículo apto para producción pero sin lista.
- Esperado: aviso "sin lista de materiales"; no entra al cálculo.
- Detecta: manejo de `sinLDM`.

**UC-14 · Solicitud de Materiales con propósito por línea**
- Pasos: crear una Solicitud de Materiales manual (solo artículos, cantidades y almacén destino); al aprobar, Logística marca una línea **Compra** y otra **Transferencia** con almacén de origen.
- Esperado: no se aprueba sin propósito en cada línea; *Crear ▾* ofrece la Orden de Compra (líneas Compra) y una Transferencia GI-11 por almacén de origen.
- Detecta: decisión G1 (propósito por línea) coherente end-to-end.

**UC-15 · Transferencia origen = destino**
- Pasos: intentar una transferencia con el mismo almacén en origen y destino.
- Esperado: bloqueo (regla R2).
- Detecta: validación de la transferencia.

---

## Parte C · Problemas/gaps que estos casos ya anticipan

1. ✅ **RESUELTO — Desalineación SOL tras editar la SP** (UC-11, UC-12): decisión **T8**. `renderPanelMP` muestra un **aviso claro** cuando la cantidad pedida en la SOL ya no coincide con el requerido actual, o si el artículo se quitó ("ya no se necesita"). No se auto-sincroniza (lo más simple).
2. ✅ **RESUELTO — Compromiso entre documentos** (UC-09): decisión **T7**. La MP entra a Comprometido al **aprobarse la SP (dos firmas)** (`spComprometerMP`). Así, otra solicitud que usaba ese stock ve bajar su Disponible, **pudiendo quedar en negativo** — que es justo la señal de que dos pedidos competían por el mismo material.
3. **Origen vs destino** (UC-06, UC-07): la coherencia de mover MP de varios orígenes a un único destino debe verificarse cuando se implemente el movimiento real (Producción).
4. **Método de emisión** (Notificación/Manual): hoy es informativo en la SP; su efecto real (backflush por regla de tres vs consumo manual) ocurre en la emisión para producción (otro módulo).
