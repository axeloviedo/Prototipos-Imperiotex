# 04 — Flujo de Ventas de Servicios

> Alcance: `src/app/modules/service-ventas/`. Es **el mismo flujo que ventas de productos** pero sin almacén, sin unidades de medida físicas y sin lotes. Sólo cambia el catálogo y la forma de las líneas.

---

## 1. Resumen funcional

El módulo "Ventas de servicios" gestiona ventas cuyo carrito está compuesto por **servicios** (mano de obra, mantenimientos, consultorías, etc.) en lugar de productos. Comparte el modelo "proforma" pero con `proforma_type = 2`.

**Diferencias clave con ventas de productos**:

- Sin almacén (`warehouse_id`).
- Sin unidad de medida (`unit_id`).
- Sin selección de lotes.
- Sin validación de stock (`disponibilidad` no aplica).
- Línea incluye `product_descripcion_personalized` (descripción libre que el usuario puede editar).
- Endpoint raíz cambia de `/ventas` a `/service-ventas`.

**Diferencias con cotizaciones de servicios** (`05-cotizaciones.md`):

- Aquí `state_proforma = 2` (venta); requiere tipo de documento, fecha de entrega, pagos (si CONTADO).
- Conversión desde cotización → pasa por `ConvertirVentaComponent`.

---

## 2. Rutas y permisos

| Ruta | Componente | Permisos |
|---|---|---|
| `/service-ventas/crear` | `CreateVentaComponent` | `crear_venta_servicio` |
| `/service-ventas/listado` | `ListVentaComponent` | `ver_venta_servicio` o `crear_venta_servicio` |
| `/service-ventas/listado/ver/:id` | `ViewVentaComponent` | `ver_venta_servicio` |
| `/service-ventas/convertir/:id` | `ConvertirVentaComponent` | `crear_venta_servicio` |

---

## 3. Servicio: `VentasService`

Archivo: `src/app/modules/service-ventas/service/ventas.service.ts`. Misma firma que el de ventas de productos, sólo cambian los endpoints.

### 3.1 Endpoints

| Método | Endpoint | Notas |
|---|---|---|
| `searchClients(...)` | `GET /service-ventas/search-clients?p=1&...` | |
| `searchProducts(search)` | `GET /service-ventas/search-services?p=1&search=` | Aquí `products` son servicios. |
| `configAll()` | `GET /service-ventas/config` | |
| `listProformas(page, data)` | `POST /service-ventas/index?page=N` | Filtros: `state_proforma=2`, `proforma_type=2`, `service_categorie_id`. |
| `showProforma(id)` | `GET /service-ventas/{id}` | |
| `createProforma(data)` | `POST /service-ventas` | |
| `editProforma(id, data)` | `POST /service-ventas/{id}` | |
| `showCotizacion(id)` | `GET /service-ventas/cotizacion/{id}` | |
| `convertirAVenta(id, data)` | `POST /service-ventas/convertir/{id}` | |
| `deleteProforma(id)` | `DELETE /service-ventas/{id}` | |
| `addDetailProforma(data)` | `POST /proforma-service-details` | |
| `editDetailProforma(id, data)` | `PUT /proforma-service-details/{id}` | |
| `deleteDetailProforma(id)` | `DELETE /proforma-service-details/{id}` | |
| `exportVenta(id)` | `GET /pdf/venta-servicios/{id}` | PDF en nueva pestaña. |
| `exportVentaGeneral(LINK)` | `GET /excel/export-proforma-service-generales?k=1{LINK}` | XLSX "ventas-servicio-generales-exportadas-{fecha}.xlsx". |
| `exportVentaDetails(LINK)` | `GET /excel/export-proforma-service-details?k=1{LINK}` | XLSX "ventas-servicio-detalladas-exportadas-{fecha}.xlsx". |

---

## 4. Componente principal: `CreateVentaComponent`

### 4.1 Forma de la línea

```ts
DETAIL_VENTA = [{
  service: { id, title, sku, price_general, importe_iva, min_discount, max_discount, wallets, service_categorie },
  description: string,
  product_descripcion_personalized: string,   // editable, mostrada al cliente
  quantity: number,
  discount: number,
  price_unit: number,
  subtotal: number,
  impuesto: number,
  total: number,
}]
```

> Sin `unit_id`, sin `warehouse_id`, sin `batches`.

### 4.2 Flujo paso a paso

1. **`ngOnInit()`** → `configAll()` carga monedas, segmentos, asesores, términos, sucursales entrega, métodos pago+bancos, documentos, ubigeo.
2. **Selección de cliente** (idéntica a ventas de productos).
3. **Selección de servicio**:
   - `searchProducts()` → `GET /service-ventas/search-services` (la respuesta viene en `services.data`).
   - Si un único resultado, auto-selecciona.
   - Si varios, abre `VentaSearchProductsComponent` (mismo modal de ventas, reutilizado).
4. **`selectService(service)`** → setea `PRODUCT_SELECTED` y resuelve precio:
   - `resolvePrice(wallets)` con cascada **Unit+Sucursal+Segmento > Sucursal+Segmento > Sucursal > Segmento > genérico** (no se aplica Unit porque servicios no tienen).
   - Filtrado por `coin_id`.
5. **Configurar línea**: descripción personalizada, cantidad, descuento. Sin almacén ni unidad.
6. **`addProduct()`** valida: cliente, qty>0, sin duplicados (mismo `service.id`). Llama `CalculateTotalsService.fromPrice(price, discount, qty, importe_iva)`.
7. **Cabecera y pagos**: idéntico a ventas de productos.
8. **`sumTotalDetail()`**:
   - `TOTAL_PROFORMA`, `SUBTOTAL`, `IGV` recomputados.
   - `DEBT = TOTAL_PROFORMA`.
   - Si `term_payment_id == 2` (CONTADO): `amount_payment = TOTAL` (auto).
9. **`validaciones()`** (subset más simple que ventas de productos):
   - Cliente.
   - `DETAIL_VENTA.length > 0`.
   - `document_type_id`.
   - `term_payment_id`.
   - `date_documento ≤ hoy`.
   - CONTADO ⇒ método, banco (si aplica), monto exacto, voucher.
   - Comprobante referencial (todo-o-nada).
10. **`save()`** → `POST /service-ventas` con FormData; clave del array: `DETAIL_SERVICE_VENTA` (no `DETAIL_VENTA`).
11. Navega a `/service-ventas/listado`.

### 4.3 Cambio de moneda

Idéntico a ventas de productos (`changeCoin()`, `recalcularDetail()`, `revertirMoneda()`).

### 4.4 Cambio de método de pago / sincronización con moneda

- `changeMethodPayment()` → setea método seleccionado y carga bancos del método.
- `sincronizarPagoConMoneda()` → ajusta `method_payment_id` según la moneda del documento (sólo métodos cuya `coin_id` coincide).
- `filteredMethodPayments`, `filteredBanks` — listas ya filtradas para los selects.

---

## 5. Listado: `ListVentaComponent`

Mismo patrón que ventas de productos pero:

- Filtro adicional: `service_categorie_id`, `search_service`.
- Hard-coded: `proforma_type = 2`, `state_proforma = 2`.
- Módulo de columnas: `ventas_servicios`.

---

## 6. Ver: `ViewVentaComponent`

Sólo lectura. Muestra:

- Cabecera (cliente, asesor, fechas, totales, moneda).
- Detalles (servicios con descripción personalizada).
- Pagos.
- Entrega (opcional; no siempre aplica a servicios — ej: consultoría remota).

---

## 7. Convertir: `ConvertirVentaComponent`

Carga la cotización vía `showCotizacion(id)`. Sólo se permite editar:

- `document_type`.
- `term_payment`.
- `coin`.
- `method_payment`, `banco`, `amount_payment`.
- `date_documento`.
- Comprobante referencial.

**No permite editar la entrega** (todos los campos `proforma_deliverie` están comentados en el código — un defecto a corregir; ver `10-mejoras-y-defectos.md`).

`convertir()` → `POST /service-ventas/convertir/{id}` con FormData.

---

## 8. Sub-componentes (modales)

Idénticos a ventas de productos pero aplicados a servicios:

- `VentaSearchProductsComponent` (mismo archivo/funcionalidad).
- `VentaSearchClientsComponent`.
- `EditProductDetailVentaComponent`.
- `DeleteProductDetailVentaComponent`.
- `OpenDetailVentaComponent`.
- `AddDataCotizacionComponent` — al confirmar, navega a `/service-ventas/convertir/{id}`.
- `AddPaymentsComponent` (vacío).

---

## 9. Payload (POST FormData `/service-ventas`)

Igual que ventas de productos, con estos cambios:

- `proforma_type = 2`.
- Clave del array de líneas: **`DETAIL_SERVICE_VENTA`** (no `DETAIL_VENTA`).
- Cada línea: `service_id`, `description`, `product_descripcion_personalized`, `price_unit`, `quantity`, `discount`, `importe_iva`, `is_gift`.
- **Sin** `unit_id`, `warehouse_id`, `batches`.

---

## 10. Diagrama de secuencia (similar a productos)

```
[CreateVentaComponent] → configAll → /service-ventas/config
                      → searchClients → /service-ventas/search-clients
                      → searchProducts → /service-ventas/search-services
                      → selectService → resolvePrice(wallets) (4-tier)
                      → addProduct → DETAIL_SERVICE_VENTA.push(...)
                      → validaciones
                      → save → POST /service-ventas (FormData)
                      → navigate /service-ventas/listado
```

---

## 11. Edge cases

1. **Servicios sin unidad ni almacén**: las líneas no tienen esas claves en el payload.
2. **`product_descripcion_personalized`**: campo libre; el usuario puede editar la descripción por línea (útil cuando el servicio se "adapta" al cliente).
3. **No hay stocks**: `disponibilidad` no se valida nunca para servicios.
4. **Edición de líneas en cotizaciones** (no en ventas): cada cambio va como `PUT /proforma-service-details/{id}`.
5. **Conversión**: bloquea edición de entrega (defecto a corregir).
6. **Multi-moneda**: misma lógica; `resolvePrice` no usa Unit pero sí Sucursal+Segmento+Coin.

---

## 12. Puntos fuertes

- Reutiliza el mismo modelo "proforma" con sólo un flag (`proforma_type`).
- Reutiliza los mismos modales de búsqueda.
- Permite personalizar la descripción por línea.
- Mismas validaciones financieras (CONTADO = total, CRÉDITO ≤ total).

## 13. Defectos

- **Conversión no permite editar entrega** (campos comentados).
- **No hay edición de ventas guardadas** (sólo desde cotización).
- **`add-payments` placeholder**.
- **No se valida que `service_categorie_id` pertenezca al servicio**.

---

## 14. Próximo documento

- [`05-cotizaciones.md`](./05-cotizaciones.md) — flujo de cotizaciones y conversión a venta.