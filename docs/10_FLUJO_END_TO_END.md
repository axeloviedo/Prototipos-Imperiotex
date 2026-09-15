# 10 · Flujo end-to-end y verificación de coherencia

> Recorrido completo demanda → abastecimiento → cobertura, cruzando GP · GI · CO, con verificación de
> coherencia tras todos los cambios V7. Fecha: 2026-09-09.

---

## 1. El flujo completo (demanda → fabricación lista)

```
[GP-02/03] Solicitud de Pedido (PT color×talla) + Almacén destino (cabecera)
     │  explota LDM por artículo (Estándar=predeterminada · Especial=elegible/+MP manual)
     ▼
[GP-03] Requerimientos de MP por (artículo × material), con Almacén origen (default LDM)
     │  panel consolidado (roll-up por material+origen) → cobertura = Actual − Comprometido
     │  déficit → [Generar Solicitud de Materiales] (UNA sola, multi-línea, sin propósito)
     ▼
[GI-13] Solicitud de Materiales · Logística define el propósito por línea y aprueba → Crear ▾
     ├─ líneas Compra        → [CO-07] Orden de Compra
     └─ líneas Transferencia → [GI-11] Transferencia, una por almacén de origen (mover MP a destino)
     ▼
[CO-07] Orden de Compra · doble validación (Logística + Gerencia) → TC congelado
     │  Crear ▾ → Ingreso
     ▼
[GI-09] Ingreso vinculado a la OC → sube Stock Actual en el almacén
     ▼
[GP-03] el material queda cubierto (o su SOL ya tiene OC o transferencia) → V°B° Logística + Aprobación Gerencia
     ▼
[GP-03] Solicitud APROBADA → la MP entra a COMPROMETIDO (T7)
     ▼
[Producción · GPV7] Órdenes de Fabricación por artículo (nacen Liberadas) → emisión → recibo de producción → PT
```

## 2. Handoffs — qué pasa y qué dato viaja

| # | Handoff | Función clave | Dato que viaja |
|---|---|---|---|
| 1 | SP → Requerimientos | `spRebuildReqs` / `renderPanelMP` | LDM efectiva × cantidad → reqs por artículo (LDM+Manual), almacén origen, método |
| 2 | Requerimientos → SOL | `generarSOLdesdeSP` | Déficit consolidado (por material+origen) → **una** SOL, sin propósito, `origenSP` |
| 3 | SOL → OC / Transferencia | GI-13 `aprobarSOL` → `crearMenuSOL` / `crearOCdesdeSOL` / `crearTRFdesdeSOL` | Logística define el propósito por línea → líneas Compra → OC · líneas Transferencia → GI-11 por almacén de origen |
| 4 | OC → validación | `validarLogOC` + `aprobarOC` → `completarValidacionOC` | Dos firmas → estado por avance + **TC congelado** |
| 5 | OC → Ingreso | `crearIngresoDesdeOC` | Ítems con pendiente → GI-09 precargado, `OC.solKey` como base |
| 6 | Ingreso → Stock | confirmación GI-09 | Sube Stock Actual (en el prototipo: confirmación demostrativa) |
| 7 | SP aprobada → Comprometido | `spComprometerMP` (`cerrarSiCompleto`) | `Comprometido += cant` por (almacén origen, material) |

## 3. Verificación (2026-09-09)

**Tramo CO (navegador, CO 472 KB sí abre) — probado sin errores:**
- OC `oc232` (nace de SOL-000029) → `validarLogOC` + `aprobarOC` → estado **"Para Recibir y Pagar"**, `valLog=valGer=true`, **TC congelado 3.75**.
- `crearIngresoDesdeOC()` → navega a **GI-09** con el ítem precargado (MP-0013 TELA DENIM NEGRO). Sin errores de consola.
- La confirmación del ingreso es demostrativa (toast "stock y Kardex actualizados"), consistente con la naturaleza del prototipo.

**Tramo GP (por lógica en node — GP ~580 KB no abre):**
- `spRebuildReqs` genera reqs por artículo (LDM+Manual); `renderPanelMP` consolida por material+origen; `generarSOLdesdeSP` crea **una** SOL; `spComprometerMP` sube el Comprometido al aprobar la SP (baja el disponible de otra SP → puede quedar negativo). Todo verificado.

## 4. Coherencia — checklist (resultado)

| Punto | Resultado |
|---|---|
| Nombres: "Grupo de Artículo" (no "Tipo") en GI/CO/GP | ✅ |
| "Stock Pedido" (no "Esperado") en GI/CO/GP | ✅ |
| LDM con Tipo/Almacén/Método en GI/CO/GP | ✅ |
| Solicitud de Materiales con propósito por línea (Compra/Transferencia) definido por Logística | ✅ |
| Requerimientos por artículo (atribución Especial) | ✅ |
| Comprometido al aprobar la SP (T7) + aviso de SOL desalineada (T8) | ✅ |
| Doble validación de OC + TC congelado | ✅ |
| Ingreso vinculado a OC (solKey) precarga ítems | ✅ |
| Proveedores con campos del Socio de Negocio (T6) | ✅ |
| Sin errores de consola en los tramos ejecutables (GI y CO) | ✅ |

## 5. Puntos a tener presentes (no son bugs, son decisiones/límites)

1. **Déficit → SOL sin propósito.** La SOL que genera GP-03 por el déficit no fija propósito: Logística decide por línea **Compra** (no hay stock) o **Transferencia** (hay stock en otro almacén) al aprobarla (G1).
2. **Confirmación de ingreso demostrativa.** En el prototipo, confirmar el ingreso muestra un toast; la mutación real de stock y el asiento (concepto contable del grupo) son del motor real / módulo de Producción-Contabilidad.
3. **Comprometido entre documentos.** El Comprometido se materializa al **aprobar la SP** (T7). Dos SP que compiten por el mismo material lo reflejan al aprobarse (la segunda puede quedar en negativo) — es la señal esperada, no un error.
4. **Prototipos independientes.** GI/CO/GP son archivos autocontenidos; lo registrado en uno no viaja a otro. Los recorridos cruzados usan copias funcionales embebidas (por eso hubo que replicar los cambios de GI en CO y GP).
5. **Producción (GPV7):** las Órdenes de Fabricación por artículo, la emisión y el recibo de PT ya se prototipan allí. Siguen fuera de alcance los movimientos con Motivo de Traslado + concepto contable (modelo documentado en `02`/`06`/`09`, Fase 2).

## 6. Conclusión
El flujo end-to-end es **coherente**: los nombres, estados, propósitos, almacenes y el compromiso de stock encajan a través de GP · GI · CO. No se detectaron incoherencias bloqueantes. Los puntos de §5 son decisiones/alcance ya acordados, no defectos.
