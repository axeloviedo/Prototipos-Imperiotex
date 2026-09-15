# 06 — Devoluciones de Ventas (Productos)

> Alcance: `src/app/modules/devolucion-ventas/`. Sólo productos (no servicios).

---

## 1. Resumen funcional

Una devolución es un documento que **revierte parcial o totalmente una venta de productos**. Se usa cuando:

- El cliente devuelve productos defectuosos o en mal estado.
- El cliente solicita un cambio.
- La venta incurrió en un error de facturación que requiere reversión.

Características principales:

- La cantidad devuelta por (producto, unidad) **no puede superar** la cantidad vendida original.
- Cada línea de devolución tiene un `tipo_devolucion`: normal / mal estado / cambio.
- La devolución tiene `state_devolucion`: pendiente (editable) o finalizada.
- Soporta comprobante referencial y un voucher (`payment_file`).
- **Cuando se finaliza**, se procesa en caja para que el dinero regrese al cliente.

---

## 2. Rutas y permisos

| Ruta | Componente | Permisos |
|---|---|---|
| `/devolucion-ventas` (default) | redirige a `listado` | — |
| `/devolucion-ventas/listado` | `ListDevolucionVentaComponent` | `ver_devolucion_venta` o `crear_devolucion_venta` |
| `/devolucion-ventas/crear/:id` | `CreateDevolucionVentaComponent` | `crear_devolucion_venta` |
| `/devolucion-ventas/listado/editar/:id` | `EditDevolucionVentaComponent` | `crear_devolucion_venta` |
| `/devolucion-ventas/listado/ver/:id` | `ViewDevolucionVentaComponent` | `ver_devolucion_venta` |

---

## 3. Servicio: `DevolucionVentasService`

Archivo: `src/app/modules/devolucion-ventas/service/devolucion-ventas.service.ts`.

| Método | Endpoint | Notas |
|---|---|---|
| `configAll()` | `GET /devolucion-proformas/config` | Carga `state_devoluciones`, `tipo_devoluciones`, `external_document_types`. |
| `listDevoluciones(page, data)` | `POST /devolucion-proformas/index?page=N` | Filtros: `search`, `proforma_id`, `state_devolucion`, `start_date`, `end_date`. |
| `showDevolucion(id)` | `GET /devolucion-proformas/{id}` | Devuelve la devolución con sus líneas. |
| `showVenta(id, devolucionId?)` | `GET /devolucion-proformas/venta/{id}?devolucion_id=` | Devuelve la venta original con `sold_quantity` por línea (y opcionalmente descontando lo ya devuelto en esa devolución). |
| `createDevolucion(data)` | `POST /devolucion-proformas` | Crea la devolución (FormData). |
| `updateDevolucion(id, data)` | `POST /devolucion-proformas/{id}` | Actualiza (sólo si `state_devolucion=1`). |

---

## 4. `ListDevolucionVentaComponent`

### 4.1 Filtros

- `search` (texto libre).
- `proforma_id` (id exacto de la venta original).
- `state_devolucion` (pendiente/finalizada).
- `start_date`, `end_date`.

### 4.2 Acciones por fila

- Ver (`/devolucion-ventas/listado/ver/:id`).
- Editar (sólo si `state_devolucion = 1`) → `/devolucion-ventas/listado/editar/:id`.
- Eliminar (defecto a corregir — el backend actual no expone DELETE; debería ser lógica con `state_devolucion=3=ANULADA`).

### 4.3 Botón "Crear"

Abre `AddDataVentaComponent`:

1. Pide el código de venta original.
2. `showVenta(codigo)` → si existe, navega a `/devolucion-ventas/crear/{proformaId}`.

### 4.4 Módulo de columnas

`devoluciones_ventas`.

---

## 5. `CreateDevolucionVentaComponent`

### 5.1 Carga inicial

`showVenta(proformaId)` devuelve la venta con líneas + `sold_quantity`. Cada línea se "carga" como candidata con:

```
{
  product_id, unit_id, warehouse_id, price_unit,
  sold_quantity, max_quantity, selected_quantity, selected_description,
  selected_tipo_devolucion (default 1 = NORMAL),
  description
}
```

### 5.2 Construcción de la devolución

1. Usuario selecciona cantidades por línea (no puede superar `max_quantity`).
2. Llena campos de cabecera:
   - `state_devolucion` (default `1` = PENDIENTE).
   - `descuento` (≥ 0, ≤ total).
   - `detalle` (nota libre).
   - `external_document_type_id` (tipo de comprobante del cliente).
   - `serie_comprobant`, `nro_comprobant` → concatenados como `cod_comprobant`.
   - `payment_file` (imagen del voucher, opcional).
3. Totales recalculados con `CalculateTotalsService.fromUnits(subtotal_unit, impuesto_unit, total_unit, qty)`.

### 5.3 Validaciones

| Regla |
|---|
| Al menos 1 línea en `DETAIL_DEVOLUCION`. |
| `selected_quantity ≤ max_quantity`. |
| `warehouse_id` presente. |
| `tipo_devolucion ∈ {1, 2, 3}`. |
| `descuento ≥ 0` y `descuento ≤ total`. |
| `external_document_type_id` definido. |
| `cod_comprobant` definido (serie + número). |

### 5.4 `guardar()`

`POST /devolucion-proformas` con FormData:

```
proforma_id                = <id de venta original>
state_devolucion           = 1 | 2
external_document_type_id  = <id>
n_comprobant               = <cod_comprobant>
descuento                  = <decimal>
subtotal, igv, total       = <calculados>
detalle                    = <string>
payment_file               = <file>
DETAIL_DEVOLUCION          = JSON.stringify([{ product_id, unit_id, warehouse_id,
                                              quantity, price_unit,
                                              subtotal, impuesto, total,
                                              description, tipo_devolucion }])
```

---

## 6. `EditDevolucionVentaComponent`

Mismo formulario que `Create`, pero:

1. Carga la devolución con `showDevolucion(id)`.
2. `state_devolucion === 2` ⇒ redirige al listado con toast warning (no se puede editar finalizadas).
3. Llama `showVenta(proformaId, devolucionId)` para obtener stock con las cantidades ya devueltas en esa misma devolución **restadas** del máximo.
4. **No se puede eliminar la última línea** (longitud ≤ 1).
5. `updateDevolucion(id, FormData)` actualiza.

---

## 7. `ViewDevolucionVentaComponent`

Sólo lectura. Muestra:

- Cabecera (venta original, cliente, fechas, totales, estado).
- Detalles con `getTipoDevolucionLabel(tipo)`:
  - `1` → "NORMAL"
  - `2` → "MAL ESTADO"
  - `3` → "CAMBIO"
- Comprobante referencial.
- Voucher (imagen).

---

## 8. Procesamiento en caja

Ver [`07-caja.md`](./07-caja.md) sección "Procesamiento de devoluciones en caja".

Resumen:

1. La devolución se marca como `state_devolucion = 2` (finalizada).
2. En caja se elige `fund_account` (cuenta de fondos) de la misma moneda que la devolución.
3. Se registra un `caja_movement` con `type = 3` (EGRESO) o `type = ?` (ver `10-mejoras-y-defectos.md`) y referencia a la devolución.
4. El stock vuelve al almacén (movimiento de inventario).

---

## 9. Edge cases y reglas

1. **Cantidad máxima**: la cantidad devuelta por (producto, unidad) no puede superar la cantidad **neta** vendida, descontando devoluciones anteriores ya procesadas.
2. **Multi-moneda**: la devolución hereda la moneda de la venta original; no se permite cambiarla.
3. **Tipo CAMBIO (3)**: implica que se genera simultáneamente un nuevo movimiento de venta (no implementado en el flujo actual — defecto a corregir).
4. **Descuento**: aplicado al total de la devolución, no por línea.
5. **Voucher obligatorio**: si la devolución es con comprobante referencial, debería exigirse voucher. En el código actual es opcional (defecto menor).
6. **No hay edición post-finalización**: una vez `state_devolucion=2`, la única acción es ver o anular (anular no implementada).

---

## 10. Diagrama de secuencia (crear devolución)

```
[ListDevolucionVentaComponent] → AddDataVentaComponent → modal pide código
                                                          → showVenta(codigo)
                                                          → navegar /devolucion-ventas/crear/{id}
[CreateDevolucionVentaComponent]
  → showVenta(proformaId) → líneas con sold_quantity
  → usuario selecciona quantities, tipos, descuentos
  → validaciones
  → guardar() → POST /devolucion-proformas (FormData)
  → navegar /devolucion-ventas/listado
[Finalizar en Caja]
  → CajaDevolucionProcessCreateComponent
  → processDevolucion(data) → POST /caja/process_devolucion
  → caja_movement creado, state=2
  → stock devuelto al almacén
```

---

## 11. Puntos fuertes

- Validación explícita de cantidad máxima.
- Soporte de tres tipos de devolución.
- Vinculación directa con la venta original.
- Procesamiento posterior en caja (separación de responsabilidades).

## 12. Defectos

- **No se puede eliminar** una devolución creada por error (sólo anular manualmente).
- **No hay estado "ANULADA"** explícito.
- **Tipo CAMBIO no genera automáticamente** un nuevo movimiento de venta.
- **Multi-devolución por venta**: si la misma venta tiene dos devoluciones pendientes, el cálculo de `max_quantity` puede no considerar la primera.
- **No se registra historial** de cambios de la devolución.

---

## 13. Próximo documento

- [`07-caja.md`](./07-caja.md) — caja registradora.