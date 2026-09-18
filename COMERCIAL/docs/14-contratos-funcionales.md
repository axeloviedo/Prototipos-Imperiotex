# 14 · Contratos funcionales (V9)

> 2026-09-15 (tercera versión: cuatro documentos SAP B1). Describe qué operaciones debe ofrecer Comercial para comportarse igual que el sistema documentado en `08-contratos-api.md`, **sin copiar sus rutas**.
> La columna *Ruta sugerida* sigue ARNÉS §4:
> - Base `/api/v1`, recursos en inglés y en plural, acción derivada del verbo.
> - Errores `{code, message, details[]}` con prefijo `COM-<HTTP>-<CAUSA>`; 404 para lo que es de otra empresa.
> - Paginación `page`/`size`/`sort`, fechas ISO-8601 y JSON `camelCase`.
>
> Es una propuesta para cuando se construya. El prototipo la implementa en `js/core/`.

---

## 0. Qué cambia respecto de `08-contratos-api.md`

| Sistema documentado | V9 |
|---|---|
| Proforma única con `state_proforma` | Cuatro recursos: `quotes`, `sales-orders`, `sales`, `sale-payments` |
| Un endpoint por tipo (`/ventas`, `/service-ventas`…) | Producto o servicio lo decide el artículo de cada línea |
| Estado en el cuerpo (`message` numérico) | Código HTTP real + `code` tipificado |
| `POST /index` con filtros en el cuerpo | `GET` con query params |
| `DELETE` físico de ventas | Acciones explícitas: `cancel`, `close`, `void` |
| `/caja/process_payment` valida pagos | No hay validación: registrar el cobro ya es cobrado |
| Crédito con vencimiento | Solo contado |

---

## 1. Clientes · `CUSTOMERS`

| Operación | Ruta sugerida | Permiso | Entrada | Reglas y efectos | Errores |
|---|---|---|---|---|---|
| Buscar | `GET /customers?q=&type=&status=&active=` | ver_cliente | filtros | Estado comercial calculado | 401, 403 |
| Ver | `GET /customers/{code}` | ver_cliente | — | Resumen de cotizaciones, órdenes, ventas y saldo | 404 |
| Crear (también alta rápida) | `POST /customers` | crear_cliente | documentType, documentNumber, name, customerType, phone, email, address, ubigeo, notes | DNI 8 / RUC 11 / CE 8–12; único por empresa | 400, 409 DUPLICATE |
| Editar | `PUT /customers/{code}` | editar_cliente | ídem | | 404, 409 |
| Activar / desactivar | `PATCH /customers/{code}/active` | editar_cliente | active | Baja lógica | 404 |

## 2. Precios · `PRICES`

| Operación | Ruta sugerida | Permiso | Reglas | Errores |
|---|---|---|---|---|
| Listar listas y ofertas | `GET /price-lists?type=&currency=` | ver_venta | — | — |
| Crear / editar lista u oferta | `POST /price-lists` · `PUT /price-lists/{code}` | editar_precios | Nombre único; moneda; sede y segmento opcionales; oferta con fecha desde ≤ hasta | 400, 409 DUPLICATE |
| Agregar artículos o grupo | `POST /price-lists/{code}/rows` | editar_precios | Obligatorio precio > 0 **o** % entre 0 y 100 (nunca 0 y 0, ni los dos); grupo solo con %; única (artículo, UM) o (grupo); lista no cancelada | 400, 409 DUPLICATE, 409 CANCELLED |
| Cambiar / retirar fila | `PUT` · `DELETE /price-lists/{code}/rows/{id}` | editar_precios | Sin dejar la fila en 0; el retiro queda en el historial con usuario y valor anterior; los documentos creados no cambian | 400, 404, 409 CANCELLED |
| **Cancelar** lista u oferta (no se borra) | `POST /price-lists/{code}/cancel` `{reason}` | editar_precios | Motivo obligatorio; guarda usuario (del token) y fecha; deja de aplicarse; no se reactiva | 400, 404, 409 CANCELLED |
| Historial | `GET /price-lists/{code}/history` | ver_venta | Acción, detalle, usuario, fecha | 404 |
| **Resolver precio** | `GET /prices/resolve?article=&unit=&site=&customerType=&currency=` | ver_venta | Motor en fases (§12.1 del diseño): base → ofertas → mejor precio (salvo precio obligatorio) → piso del precio mínimo; `&date=` opcional. Devuelve `{price, source, list, offer, listPrice, trace: {base, offers[], winner, minimum, adjustedToMinimum}}` | 404 NO-PRICE |
| Datos de venta del artículo | `PUT /sale-articles/{code}` | editar_precios | precioMínimo ≤ sugerido; dctoMín ≤ dctoMáx ≤ 100 | 400, 422 |
| Disponibilidad | `GET /stock/availability?article=&warehouse=&quantity=` | ver_existencias | `{onHand, committed, available, control}` desde logística | 503 |

## 3. Cotizaciones · `QUOTES` (no mueve stock)

| Operación | Ruta sugerida | Permiso | Entrada | Reglas y efectos | Errores |
|---|---|---|---|---|---|
| Listar | `GET /quotes?q=&status=&site=&createdFrom=&createdTo=` | ver_cotizacion | filtros | `expired` calculado | — |
| Ver | `GET /quotes/{id}` | ver_cotizacion | — | Con historial y relaciones | 404 |
| Crear | `POST /quotes` | crear_cotizacion | customerCode, currency, validUntil, sellerCode, notes, lines[{article, unit, warehouse, quantity, price, unitDiscount, description}] | Estado **Abierta**. Cliente activo; ≥ 1 línea; descuento en rango; precio mínimo. La falta de stock va en `warnings[]` | 400, 404 CUSTOMER, 422 PRICE-BELOW-MIN / DISCOUNT-RANGE |
| Editar cabecera | `PATCH /quotes/{id}` | editar_cotizacion | customer, currency, validUntil, seller, notes | Solo Abierta. Cambiar moneda o cliente vuelve a resolver precios; si falta uno no cambia | 409 NOT-EDITABLE, 422 NO-PRICE |
| Líneas | `POST /quotes/{id}/lines` · `PUT …/lines/{n}` · `DELETE …/lines/{n}` | editar_cotizacion | línea | Una a una; no se quita la última | 409 LAST-LINE, 422 |
| Clonar | `POST /quotes/{id}/clone` | crear_cotizacion | — | Nueva Abierta con validez desde hoy | 404 |
| Cancelar | `POST /quotes/{id}/cancel` | eliminar_cotizacion | reason | Solo Abierta | 409 |
| PDF / Excel | `GET /quotes/{id}/pdf` · `GET /quotes/export` | ver_cotizacion | — | — | — |

## 4. Órdenes de venta · `SALES-ORDERS` (compromete stock)

| Operación | Ruta sugerida | Permiso | Entrada | Reglas y efectos | Errores |
|---|---|---|---|---|---|
| Listar | `GET /sales-orders?q=&status=&site=&createdFrom=&createdTo=` | ver_venta | filtros | `progress` % atendido | — |
| Ver | `GET /sales-orders/{id}` | ver_venta | — | Líneas con ordered / delivered / pending / committed, ventas, historial | 404 |
| Borrador desde cotización | `GET /sales-orders/draft?quoteId=` | crear_venta | — | Cotización Abierta y no vencida | 409 QUOTE-NOT-OPEN / QUOTE-EXPIRED |
| **Crear** | `POST /sales-orders` (`Idempotency-Key`) | crear_venta | quoteId?, customerCode, currency, sellerCode, notes, delivery{place, date, address, ubigeo, agency, receiver{name, document, phone}}, lines[…] | Validaciones de precio y stock (*Bloquear* contra Disponible). En una transacción: número, estado **Abierta**, **compromiso** por línea; la cotización pasa a **Cerrada** con el número de la orden | 400, 409, 422 STOCK / DELIVERY |
| Cerrar | `POST /sales-orders/{id}/close` | crear_venta | — | Abierta con alguna venta; libera lo pendiente | 409 NO-SALES |
| Cancelar | `POST /sales-orders/{id}/cancel` | anular_venta | reason | Abierta sin ventas; libera todo | 409 HAS-SALES |
| PDF / Excel | `GET /sales-orders/{id}/pdf` · `/export` | ver_venta | — | — | — |

## 5. Ventas · `SALES` (la venta es el comprobante)

| Operación | Ruta sugerida | Permiso | Entrada | Reglas y efectos | Errores |
|---|---|---|---|---|---|
| Listar | `GET /sales?q=&site=&status=&voucherType=&createdFrom=&createdTo=` | ver_venta | filtros | Cobrado y saldo calculados | — |
| Ver | `GET /sales/{id}` | ver_venta | — | Líneas, cobros, devoluciones, dinero por devolver, movimientos de stock, historial | 404 |
| Borrador desde orden | `GET /sales/draft?salesOrderId=` | crear_venta | — | Orden Abierta; líneas = pendiente (máximo por línea) | 409 ORDER-NOT-OPEN |
| **Registrar** | `POST /sales` (`Idempotency-Key`) | crear_venta | salesOrderId?, voucherType (NV/BV/FA), customerCode y currency (solo directa), sellerCode, notes, lines[… , salesOrderLine?], payments[{method, bank, operation, amount}] | FA ⇒ RUC. Desde orden: cantidad ≤ pendiente. Directa: stock contra Disponible. Σ cobros ≤ total; con cobros exige caja abierta. En una transacción: número `serie-correlativo`, estado **Pendiente de pago**; el compromiso **pasa** de la orden (sube `delivered`, cierra la orden si no queda pendiente) o se crea (directa); cobros **Cobrado**; si cubren el total → **Pagada** y salida de stock | 400, 404, 409 CASH-CLOSED / ORDER-NOT-OPEN, 422 STOCK / PAYMENTS-EXCEED-TOTAL / RUC-REQUIRED / EXCEEDS-PENDING |
| **Cobrar** | `POST /sales/{id}/payments` | crear_venta o crear_caja | method, bank, operation, amount | Venta Pendiente de pago; monto ≤ saldo; caja de la tienda abierta en la moneda. Si completa el total: revisa stock Actual, **Salida** por almacén (libera compromiso, guarda costo) y venta **Pagada** (`paid: true`) | 409 NOT-PENDING / CASH-CLOSED, 422 AMOUNT / STOCK |
| Anular cobro | `POST /sale-payments/{id}/void` | editar_caja | reason | Venta aún Pendiente de pago; caja del cobro abierta | 409 |
| Anular venta | `POST /sales/{id}/void` | anular_venta | reason | Sin devoluciones. Pendiente de pago: libera compromiso. Pagada: dentro del plazo, Entrada de stock. Si venía de orden, sus cantidades vuelven a pendientes (reabre y re-compromete). Lo cobrado → devolución de dinero Pendiente | 409 HAS-RETURNS / VOID-PERIOD-EXPIRED |
| PDF / Excel | `GET /sales/{id}/pdf` · `/export` | ver_venta | — | — | — |

## 6. Devoluciones · `RETURNS`

| Operación | Ruta sugerida | Permiso | Entrada | Reglas y efectos | Errores |
|---|---|---|---|---|---|
| Listar / ver | `GET /returns?…` · `GET /returns/{id}` | ver_devolucion_venta | — | — | 404 |
| Líneas devolvibles | `GET /sales/{id}/returnable-lines` | ver_devolucion_venta | — | `{line, sold, returned, max, price}`; solo productos | 404 |
| **Registrar** *(2026-09-18)* | `POST /returns` | crear_devolucion_venta | saleId, lines[{line, quantity}], creditNote{type, number}, reason | Nota de crédito por ítem sobre una venta con salida de stock, hasta 12 meses; cantidad ≤ máximo. Efecto inmediato: Entrada de stock al almacén de la venta al costo de salida y **crédito del cliente** por lo pagado de lo devuelto. La venta no se anula ni cambia sus cobros | 409 SALE-NOT-DELIVERED / CREDIT-NOTE-PERIOD-EXPIRED, 422 QUANTITY-EXCEEDS |
| **Devolver en caja** *(2026-09-18)* | `POST /returns/{id}/cash-refund` | crear_caja | amount, method, bank, operation | ≤ lo que queda de la nota y del crédito del cliente; caja abierta de la tienda. Transacción: Uso del crédito + movimiento de caja tipo Devolución | 409 CASH-CLOSED, 422 AMOUNT-EXCEEDS |

### 6.1 Crédito del cliente · `CUSTOMER-CREDIT` *(2026-09-18)*

| Operación | Ruta sugerida | Permiso | Reglas |
|---|---|---|---|
| Crédito y movimientos | `GET /customers/{id}/credit?currency=` | ver_cliente | Por moneda (Σ abonos − Σ usos) y movimientos con origen; no vence |
| Pagar con nota de crédito | `POST /sales/{id}/payments` con `method=NC` (también al registrar la venta) | crear_venta | Monto ≤ crédito y ≤ deuda; sin caja; Validado al instante (puede disparar la salida de stock) |
| Anular venta pagada con nota | `POST /sales/{id}/void` | anular_venta | Solo por error, dentro de 7 días. Lo pagado con nota vuelve como Abono; el resto, devolución de dinero en caja |

## 7. Caja · `CASH`

| Operación | Ruta sugerida | Permiso | Entrada | Reglas y efectos | Errores |
|---|---|---|---|---|---|
| Caja actual de mi tienda | `GET /cash-sessions/current?currency=` | ver_caja | — | 204 si no hay; resumen por medio (el esperado solo con configurar_comercial) | — |
| Abrir | `POST /cash-sessions` | crear_caja | currency, openingAmount ≥ 0, notes | Tienda del token; una Abierta por tienda y moneda | 409 ALREADY-OPEN |
| Por cobrar | `GET /cash-sessions/{id}/receivables` | ver_caja | q | Ventas Pendientes de pago de la tienda y moneda | — |
| Cobros de la sesión | `GET /cash-sessions/{id}/payments` | ver_caja | — | — | 404 |
| Ingreso / egreso | `POST /cash-sessions/{id}/movements` | crear_caja | type, category, description (≥ 5), amount | Caja Abierta | 409, 422 |
| Editar / anular movimiento | `PUT /cash-movements/{id}` · `POST /cash-movements/{id}/void` | editar_caja | … / reason | Caja Abierta; anular una devolución la deja Pendiente | 409 |
| Dinero por devolver | `GET /cash-sessions/{id}/refunds` | ver_caja | — | De la tienda y moneda | — |
| Devolver dinero | `POST /refunds/{id}/pay` | crear_caja | method, bank, operation | Misma moneda que la venta; movimiento tipo Devolución; estado **Devuelto** | 409, 422 |
| **Cerrar** | `PUT /cash-sessions/{id}/close` | editar_caja | countedCash, notes | Conteo ciego; guarda esperado, diferencia y resumen congelado | 409 |
| Historial / PDF / Excel | `GET /cash-sessions?site=&currency=&status=` · `/{id}/pdf` · `/export` | ver_caja | — | — | — |

## 8. Configuración · `SETTINGS`

| Operación | Ruta sugerida | Permiso | Reglas |
|---|---|---|---|
| Leer catálogos | `GET /commercial-settings` | ver_venta | Tiendas, cajas, series, medios de pago, bancos, comprobantes, lugares de entrega, agencias, tipos de cliente, categorías de caja, parámetros |
| Guardar parámetros | `PUT /commercial-settings/parameters` | configurar_comercial | IGV 0–30, TC > 0, validez 1–90, plazo de anulación 0–30, almacén de mal estado existente |
| Categorías de caja | `POST` / `DELETE /commercial-settings/cash-categories` | configurar_comercial | No vacía; única por tipo; queda al menos una |

---

## 9. Integración con logística (costuras)

| Costura | Contrato (`X-Api-Key`) |
|---|---|
| Artículos de venta y disponibilidad | `/internal/articles?sellable=true`, `/internal/stock/availability` |
| Compromiso de orden y venta | `/internal/stock-commitments` (comprometer / liberar / transferir) con `baseObject=SALES_ORDER|SALE`, `baseId`, líneas `{article, warehouse, quantity}` |
| Salida al quedar pagada | `/internal/stock-movements/issues` con `baseObject=SALE`, líneas `{article, warehouse, quantity, releaseCommitted}` → devuelve costo por línea |
| Entrada por devolución o anulación | `/internal/stock-movements/receipts` con `baseObject=RETURN|SALE_VOID` y costo de salida |
| Evento de venta pagada (futuro) | Topic `commercial.sale.paid` (requiere aprobación, ARNÉS §12.3) |

> ARNÉS §6.1: la venta **escribe y confirma**, llama a logística **fuera** de la transacción y **deshace** si la salida falla (o usa outbox). En el prototipo todo ocurre en memoria.
