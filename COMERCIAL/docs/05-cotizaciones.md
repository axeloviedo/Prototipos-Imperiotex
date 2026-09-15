# 05 — Cotizaciones (Productos y Servicios)

> Alcance: `src/app/modules/cotizaciones/` (productos) + `src/app/modules/service-cotizaciones/` (servicios). Una cotización es una "pre-venta": tiene la misma estructura que una venta pero con `state_proforma = 1` y menos campos obligatorios.

---

## 1. Resumen funcional

Una cotización es un documento equivalente a una venta, pero **sin comprometer stock ni exigir pago**. Sirve para enviar al cliente un presupuesto. Cuando el cliente acepta, se "convierte" a venta.

El modelo es idéntico al de venta, sólo cambian los valores por defecto y las validaciones. Por eso el frontend **reutiliza los mismos componentes** (modal de productos, modal de clientes, edit/delete line) con pequeñas variaciones.

### Cotización de productos vs cotización de servicios

| Aspecto | Cotización productos | cotizaciones servicio |
|---|---|---|
| Ruta | `/cotizaciones/crear` | `/service-cotizaciones/crear` |
| Endpoint raíz | `/cotizaciones` | `/service-cotizaciones` |
| Detalle raíz | `/cotizacion-details` | `/proforma-service-details` |
| Líneas | Producto + unidad + almacén + opcional lotes | Servicio + descripción personalizada |
| Stock | Validación según `disponibilidad` (igual que venta) | Sin validación |
| Default `term_payment_id` | `'2'` (CONTADO) | `'2'` |
| Default `coin_id` | `'1'` (PEN) | `'1'` |
| Conversión a venta | `/ventas/convertir/{id}` | `/service-ventas/convertir/{id}` |

---

## 2. Rutas y permisos

### 2.1 Productos (`cotizaciones`)
| Ruta | Permisos |
|---|---|
| `/cotizaciones/crear` | `crear_cotizacion` |
| `/cotizaciones/listado` | `ver_cotizacion` o `editar_cotizacion` o `eliminar_cotizacion` |
| `/cotizaciones/listado/edicion/:id` | `editar_cotizacion` |

### 2.2 Servicios (`service-cotizaciones`)
| Ruta | Permisos |
|---|---|
| `/service-cotizaciones/crear` | `crear_cotizacion_servicio` |
| `/service-cotizaciones/listado` | `ver_cotizacion_servicio` o `editar_cotizacion_servicio` o `eliminar_cotizacion_servicio` |
| `/service-cotizaciones/listado/edicion/:id` | `editar_cotizacion_servicio` |

> **Detalle**: la ruta de edición está en `/listado/edicion/:id`, no en `/editar/:id` (convención diferente al de ventas).

---

## 3. Servicio de cotizaciones de productos: `CotizacionesService`

Archivo: `src/app/modules/cotizaciones/service/cotizaciones.service.ts`.

| Método | Endpoint |
|---|---|
| `searchClients(...)` | `GET /cotizaciones/search-clients?p=1&...` |
| `searchProducts(search)` | `GET /cotizaciones/search-products?p=1&search=` |
| `configAll()` | `GET /cotizaciones/config` |
| `listProformas(page, data)` | `POST /cotizaciones/index?page=N` |
| `showProforma(id)` | `GET /cotizaciones/{id}` |
| `evalDisponibilidad(...)` | `GET /cotizaciones/eval-disponibilidad/{id}?unit_id=&quantity=` |
| `createProforma(data)` | `POST /cotizaciones` |
| `editProforma(id, data)` | `POST /cotizaciones/{id}` |
| `deleteProforma(id)` | `DELETE /cotizaciones/{id}` |
| `addDetailProforma(data)` | `POST /cotizacion-details` |
| `editDetailProforma(id, data)` | `PUT /cotizacion-details/{id}` |
| `deleteDetailProforma(id)` | `DELETE /cotizacion-details/{id}` |
| `exportCotizacion(id)` | `GET /pdf/cotizacion/{id}` |
| `exportCotizacionGeneral(LINK)` | `GET /excel/export-proforma-generales?k=1{LINK}` (XLSX "proforma-generales-exportadas-{fecha}.xlsx") |
| `exportCotizacionDetails(LINK)` | `GET /excel/export-proforma-details?k=1{LINK}` (XLSX "cotizacion-detalles-exportadas-{fecha}.xlsx") |

## 4. Servicio de cotizaciones de servicios

Mismo patrón, sufijos `service-`:

- `/service-cotizaciones/...`
- `/proforma-service-details` (igual que ventas de servicios)
- `GET /pdf/cotizacion-servicios/{id}` para PDF

---

## 5. Componente `CreateCotizacionComponent`

### 5.1 Diferencias con `CreateVentaComponent` (productos)

- **Sin `document_type`** (no se emite comprobante en cotización).
- **Sin `date_entrega` obligatoria** (es un presupuesto).
- **Sin pago** (no se exige método, ni banco, ni monto).
- **Sin voucher**.
- **Sin `external_document_type`** referencial (sí en edición de venta convertida).
- Carrito idéntico al de venta de productos (con `unit_id`, `warehouse_id`, opcional `batches`).
- Validación de stock según `product.disponibilidad` igual que venta.

### 5.2 Flujo

1. `configAll()` carga monedas, segmentos, asesores, términos, sucursales entrega, ubigeo.
2. Búsqueda de cliente.
3. Búsqueda de producto con validación de stock (si `disponibilidad=2` ⇒ bloquea; `3` ⇒ consulta `eval-disponibilidad`).
4. Resolución de precio (`resolvePrice` misma cascada de 4 niveles).
5. Agregar a carrito con `addProduct()`.
6. `validaciones()`:
   - Cliente seleccionado.
   - `DETAIL_COTIZACION.length > 0`.
   - `term_payment_id`.
   - `coin_id`.
7. `save()` → `POST /cotizaciones` con FormData (sin campos de pago/entrega).
8. Navega a `/cotizaciones/listado`.

### 5.3 Payload (POST FormData `/cotizaciones`)

```
proforma_type     = 1
state_proforma    = 1  (cotización)
client_id         = <id>
asesor_id         = <id> | ''
term_payment_id   = 2  (default CONTADO, pero no se cobra)
coin_id           = 1  (default PEN)
sucursale_id      = <id>
description       = ...
is_gift           = 1 | 2
DETAIL_COTIZACION = JSON.stringify([...])
```

---

## 6. Componente `ListCotizacionComponent`

Mismo patrón que `ListVentaComponent`:

- Hard-coded `state_proforma: '1'` (sólo cotizaciones, no ventas).
- Hard-coded `proforma_type = 1` (productos).
- Filtros: `search`, `client_segment_id`, `asesor_id`, `product_categorie_id`, `search_client`, `search_product`, `start_date`, `end_date`, `coin_id`.
- Acciones: ver, PDF (`exportCotizacion`), Excel general, Excel detalles, eliminar (modal `DeleteCotizacionComponent`), **importar/editar** (`/cotizaciones/listado/edicion/:id`).
- Módulo de columnas: `cotizaciones_productos`.

---

## 7. Componente `EditCotizacionComponent`

> Diferencia importante con ventas: **las líneas se editan una a una contra el backend**.

### 7.1 Flujo

1. `showProforma(id)` carga cabecera y detalles.
2. `editProforma(id, FormData)` actualiza **sólo la cabecera** (no líneas).
3. Para agregar/editar/eliminar líneas:
   - `addDetailProforma(data)` → `POST /cotizacion-details`
   - `editDetailProforma(id, data)` → `PUT /cotizacion-details/{id}`
   - `deleteDetailProforma(id)` → `DELETE /cotizacion-details/{id}`
4. El backend responde con `resp.detail` (línea creada/editada), `resp.new_total`, `resp.new_subt`, `resp.new_impuesto`, `resp.new_debt` — el frontend los usa para refrescar totales.
5. Restricción: **no se puede eliminar la última línea** (bloqueado cuando `DETAIL_COTIZACION.length <= 1`).

### 7.2 Validaciones

- Cliente seleccionado.
- `term_payment_id`.
- `coin_id`.
- (Al menos 1 línea, garantizado por la restricción anterior.)

---

## 8. Sub-componentes

Idénticos a los de ventas pero aplicados a cotizaciones:

- `SearchProductsComponent` (catálogo de productos).
- `SearchClientsComponent` (catálogo de clientes).
- `EditProductDetailCotizacionComponent` (edita línea, llama API si la cotización ya existe).
- `DeleteProductDetailCotizacionComponent` (elimina línea vía API).
- `OpenDetailCotizacionComponent` (read-only).
- `AddDataCotizacionComponent` (**vacío / placeholder** — la conversión se hace desde la lista de ventas con `AddDataCotizacionComponent` del módulo de ventas).

---

## 9. Conversión de cotización a venta

### 9.1 Desde la lista de ventas

1. Usuario hace clic en "Importar cotización" (`AddDataCotizacionComponent`).
2. Modal pide código de cotización.
3. `showCotizacion(id)` carga datos.
4. Navega a `/ventas/convertir/{id}` o `/service-ventas/convertir/{id}`.
5. `ConvertirVentaComponent` permite editar tipo de documento, término, moneda, pagos, entrega y comprobante referencial.
6. `convertir()` → `POST /ventas/convertir/{id}` (o `/service-ventas/convertir/{id}`).
7. Backend responde con la nueva venta + posibles `stock_warnings[]`.
8. Navega al listado correspondiente.

### 9.2 Backend: ¿qué debe hacer?

1. Validar que la cotización existe y `state_proforma == 1`.
2. Crear nueva cabecera con `state_proforma = 2` y los nuevos valores.
3. Copiar todas las líneas.
4. Crear pagos si CONTADO.
5. **Aceptar transaccionalmente**: si falla cualquier paso, revertir.
6. Devolver `stock_warnings[]` (productos con stock insuficiente al momento de la conversión).
7. Marcar la cotización original como `state_proforma = 'CONVERTIDA'` (campo extra; defecto a corregir — ver `10-mejoras-y-defectos.md`).

---

## 10. Flujo end-to-end (cotización → venta)

```
[Cotización]
  │
  │  state_proforma=1, sin pago, sin entrega
  │  cliente, productos, precios
  │
  ▼ [Conversión]
[ConvertirVentaComponent]
  │  tipo_doc, term_payment, coin, pagos, entrega, comprobante
  │
  ▼ POST /ventas/convertir/{id}
[Venta]
  state_proforma=2
  si CONTADO: pagos[]
  estado_pago: Crédito/Parcial/Pagado
  │
  ▼ [Caja — opcional]
[Pagos procesados]
  verification=2, date_validation set
```

---

## 11. Puntos fuertes

- Reutilización casi total de componentes con ventas.
- Edición línea-por-línea en cotizaciones: evita perder cambios por fallos de red.
- Conversión explícita (no se transforma automáticamente al confirmar un cliente).
- Soporte de PDF y Excel.

## 12. Defectos

- **No hay estado "CONVERTIDA"** para una cotización: hoy se vuelve venta, pero la cotización original sigue `state_proforma=1` (a menos que el backend la marque).
- **`AddDataCotizacionComponent` (en cotizaciones) es placeholder**.
- **`description` opcional**: si está vacía, el PDF sale sin glosa.
- **No se distingue cotización vencida** (sin fecha de validez).
- **No se puede clonar** una cotización para crear una nueva rápidamente.
- **No hay workflow de aprobación** (cotización > cierto monto requiere supervisor).

---

## 13. Próximo documento

- [`06-devoluciones.md`](./06-devoluciones.md) — devoluciones de ventas de productos.