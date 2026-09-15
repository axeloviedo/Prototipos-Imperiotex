# 11 — Guía de Réplica (Checklist de Implementación)

> Paso a paso para clonar el proceso de ventas en otro sistema. Pensado como un checklist que puedes ir tachando. Asume que vas a construir desde cero (otro lenguaje / framework / BD), no migrar código.

---

## Fase 0 — Decisiones previas

- [ ] ¿Mantenemos el modelo "proforma unificada" (con `proforma_type` y `state_proforma`)? → **Sí**, simplifica enormemente.
- [ ] ¿Persistimos precio y subtotal por línea? → **Sí**.
- [ ] ¿Versión de API `/api/v1/...` desde el inicio? → **Sí**.
- [ ] ¿Framework frontend? (Angular / React / Vue). Para esta guía se asume Angular.
- [ ] ¿Base de datos? (Postgres recomendado).
- [ ] ¿Auth provider? (JWT propio, Auth0, Keycloak, etc.).

---

## Fase 1 — Modelo de datos

Basado en `02-modelo-datos.md`:

### 1.1 Tablas de catálogo
- [ ] `client_segment`
- [ ] `client` (con `client_segment_id`, `n_document`, `full_name`, `phone`)
- [ ] `coin`
- [ ] `sucursale`
- [ ] `sucursale_deliverie`
- [ ] `warehouse`
- [ ] `product` (con `disponibilidad`, `importe_iva`, `min_discount`, `max_discount`, `price_general`)
- [ ] `service` (mismo shape sin `disponibilidad`)
- [ ] `product_batch` (lotes)
- [ ] `wallet` (precios múltiples con `unit_id`, `sucursale_id`, `client_segment_id`, `coin_id`)
- [ ] `method_payment` (con relación a `banco[]`)
- [ ] `banco`
- [ ] `term_payment` (id=2 = CONTADO)
- [ ] `document_type` (id=4 = RECIBO DE VENTA por default)
- [ ] `external_document_type`
- [ ] `income_categorie`, `expense_categorie`
- [ ] `bank_account` (cuenta de fondos en caja)
- [ ] `asesor`
- [ ] `transport` (transportistas)

### 1.2 Tablas comerciales
- [ ] `proforma` (cabecera unificada: `proforma_type`, `state_proforma`, `state_payment`, `is_gift`, etc.)
- [ ] `proforma_detail` (FK condicional `product_id` XOR `service_id`)
- [ ] `proforma_detail_batch` (sólo productos)
- [ ] `proforma_payment` (`verification`, `date_validation`, etc.)
- [ ] `proforma_deliverie` (entrega)
- [ ] `devolucion` (FK a `proforma_id`, `state_devolucion`)
- [ ] `devolucion_detail` (FK a `product_id`, `unit_id`, `warehouse_id`, `tipo_devolucion`)

### 1.3 Tablas de caja
- [ ] `caja` (config)
- [ ] `caja_sucursale` (apertura activa; índice único parcial por `(sucursale_id, coin_id)` con `state=1`)
- [ ] `caja_movement` (cualquier movimiento: type 1=venta, 2=ingreso, 3=egreso, 4=devolución)

### 1.4 Tablas de soporte
- [ ] `user`, `role`, `permission`, `role_permission`
- [ ] (Opcional) `audit_log`

### 1.5 Constraints y triggers
- [ ] `proforma_detail.product_id XOR service_id` (CHECK o trigger).
- [ ] `proforma.total = subtotal + igv`.
- [ ] `proforma.debt = total - paid_out`.
- [ ] `caja_sucursale` único activo por (sucursal, moneda).
- [ ] `devolucion_detail.quantity <= original_sold - already_returned`.

---

## Fase 2 — Backend REST

Basado en `08-contratos-api.md`:

### 2.1 Endpoints de catálogo (CRUD estándar)
- [ ] `/api/v1/sucursales`
- [ ] `/api/v1/almacenes`
- [ ] `/api/v1/metodos_pago`
- [ ] `/api/v1/segmento_clientes`
- [ ] `/api/v1/tipo_documento`
- [ ] `/api/v1/tipo_documento_externo`
- [ ] `/api/v1/condicion_pago`
- [ ] `/api/v1/categorias_productos`
- [ ] `/api/v1/categorias_servicios`
- [ ] `/api/v1/categorias_egreso`
- [ ] `/api/v1/categorias_ingreso`
- [ ] `/api/v1/proveedores`
- [ ] `/api/v1/entidades_contratantes`
- [ ] `/api/v1/unidades`
- [ ] `/api/v1/monedas`
- [ ] `/api/v1/clientes` + `/api/v1/clientes/search`
- [ ] `/api/v1/productos` + `/api/v1/productos/search`
- [ ] `/api/v1/servicios` + `/api/v1/servicios/search`
- [ ] `/api/v1/roles`, `/api/v1/usuarios`
- [ ] `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/logout`, `/api/v1/auth/refresh`

### 2.2 Ventas (productos)
- [ ] `GET /api/v1/ventas/config`
- [ ] `GET /api/v1/ventas/search-clients`
- [ ] `GET /api/v1/ventas/search-products`
- [ ] `GET /api/v1/proformas/eval-disponibilidad/{productId}`
- [ ] `POST /api/v1/ventas/index`
- [ ] `GET /api/v1/ventas/{id}`
- [ ] `GET /api/v1/ventas/cotizacion/{id}`
- [ ] `POST /api/v1/ventas` (FormData, transaccional)
- [ ] `POST /api/v1/ventas/{id}` (edición)
- [ ] `POST /api/v1/ventas/convertir/{id}`
- [ ] `DELETE /api/v1/ventas/{id}` (lógico, state=3)
- [ ] `POST /api/v1/ventas/price-sugested`
- [ ] `POST /api/v1/proforma-details`, `PUT /{id}`, `DELETE /{id}`
- [ ] `GET /api/v1/pdf/venta-productos/{id}`
- [ ] `GET /api/v1/excel/export-proforma-generales`
- [ ] `GET /api/v1/excel/export-proforma-details`

### 2.3 Ventas (servicios)
- [ ] Mismo set con prefijo `/api/v1/service-ventas` y clave `DETAIL_SERVICE_VENTA`.
- [ ] `GET /api/v1/proforma-service-details` (POST/PUT/DELETE)

### 2.4 Cotizaciones (productos y servicios)
- [ ] `/api/v1/cotizaciones/*` y `/api/v1/service-cotizaciones/*`
- [ ] `/api/v1/cotizacion-details` (POST/PUT/DELETE)
- [ ] `/api/v1/proforma-service-details` (reutilizado)
- [ ] `GET /api/v1/pdf/cotizacion/{id}` y `/api/v1/pdf/cotizacion-servicios/{id}`

### 2.5 Devoluciones
- [ ] `GET /api/v1/devolucion-proformas/config`
- [ ] `POST /api/v1/devolucion-proformas/index`
- [ ] `GET /api/v1/devolucion-proformas/{id}`
- [ ] `GET /api/v1/devolucion-proformas/venta/{id}?devolucion_id=`
- [ ] `POST /api/v1/devolucion-proformas` (transaccional)
- [ ] `POST /api/v1/devolucion-proformas/{id}` (sólo si state=1)
- [ ] `DELETE /api/v1/devolucion-proformas/{id}` (state=3)

### 2.6 Caja
- [ ] `GET /api/v1/caja/config`
- [ ] `POST /api/v1/caja/apertura_caja`
- [ ] `POST /api/v1/caja/cierre_caja`
- [ ] `POST /api/v1/caja/report_caja`
- [ ] `GET /api/v1/caja/search_proformas/{clientId}`
- [ ] `POST /api/v1/caja/created_payment`
- [ ] `POST /api/v1/caja/updated_payment/{id}`
- [ ] `POST /api/v1/caja/process_payment` (transaccional, marca verification=2 + date_validation)
- [ ] `POST /api/v1/caja/contract_process`
- [ ] `GET /api/v1/caja/ventas_pendientes_pago`
- [ ] `POST /api/v1/caja/fund-accounts/index`, `POST /api/v1/caja/fund-accounts`
- [ ] `POST /api/v1/caja/process_devolucion`, `.../confirm/{id}`, `.../anular/{id}`
- [ ] `POST /api/v1/caja/devolucion_process`
- [ ] `GET /api/v1/caja/report_caja_day/{id}`
- [ ] `GET /api/v1/excel/export-contract-processs`
- [ ] `GET /api/v1/caja/resumen_historico_caja/{id}`
- [ ] `GET /api/v1/pdf/caja-resumen/{id}`

### 2.7 Criterios de aceptación por endpoint

Para cada endpoint, antes de darlo por hecho:

- [ ] **Permisos**: aplicar `ver_*`, `crear_*`, `editar_*` server-side (no confiar en frontend).
- [ ] **Validaciones**: replicar las del frontend (`validaciones()` de cada componente).
- [ ] **Transacciones**: cabecera + detalles + pagos en una sola transacción.
- [ ] **Idempotencia**: respetar `Idempotency-Key` header si está presente.
- [ ] **Errores**: HTTP status + cuerpo `{ success, message, message_text }` (compat con frontend actual).
- [ ] **CORS**: permitir origen del frontend.
- [ ] **Rate limit**: throttling básico.
- [ ] **JWT**: validar expiración server-side.
- [ ] **Auditoría**: `created_at`, `updated_at`, `user_id` en cada tabla.

---

## Fase 3 — Servicios centrales (backend)

- [ ] **`CalculateTotalsService`** (o equivalente): `fromPrice(price, discount, qty, ivaRate)`, `fromUnits(...)`. Tests unitarios.
- [ ] **`PriceResolverService`**: cascada de wallets (4 niveles) por moneda.
- [ ] **`StockValidatorService`**: según `disponibilidad`, `product_batches.quantity - quantity_used`.
- [ ] **`StateMachineService`** (proforma, devolucion, pago, caja, movimiento).
- [ ] **`PaymentValidatorService`**: CONTADO = total, CRÉDITO ≤ total, monto > 0, etc.
- [ ] **`PdfGeneratorService`**: plantillas para cada tipo (venta producto, venta servicio, cotización, caja histórica).
- [ ] **`ExcelGeneratorService`**: exportación de listados (general + detalles).

---

## Fase 4 — Frontend

Basado en `09-arquitectura-frontend.md`:

### 4.1 Estructura
- [ ] `src/app/features/ventas/` con la plantilla estándar.
- [ ] `src/app/features/cajas/` con hub + modales.
- [ ] `src/app/shared/services/calculate-totals.service.ts` (idéntico al original).
- [ ] `src/app/shared/services/loading-overlay.service.ts`.
- [ ] `src/app/shared/services/api-response-handler.service.ts`.
- [ ] `src/app/shared/services/columns.service.ts` (persistencia local).
- [ ] `src/app/shared/services/table-sort.service.ts`.

### 4.2 Guards
- [ ] `AuthGuard`: valida token + expiración.
- [ ] `PermissionGuard`: lee `data.permissions[]`, verifica `user.permissions[]`.

### 4.3 Componentes clave (replicar)
- [ ] `CreateVentaComponent` (productos) — formulario más complejo.
- [ ] `CreateVentaComponent` (servicios).
- [ ] `CreateCotizacionComponent` (productos y servicios).
- [ ] `EditCotizacionComponent` (con edición línea a línea).
- [ ] `ConvertirVentaComponent` (productos y servicios).
- [ ] `CreateDevolucionVentaComponent` / `EditDevolucionVentaComponent`.
- [ ] `ListsCajaProcessComponent` (hub con tabs).
- [ ] `CajaAperturaComponent`, `CajaCierreComponent`.
- [ ] `CajaClientsContractsComponent` (procesar pagos).
- [ ] `CajaNewPaymentComponent`, `CajaEditPaymentComponent`.
- [ ] `CajaIngresoCreateComponent`, `CajaEgresoCreateComponent`.
- [ ] `CajaDevolucionProcessCreateComponent`.
- [ ] `CajaReportDayComponent`, `CajaHistoryComponent`, `CajaResumenHistoricoComponent`.

### 4.4 Modales reutilizables
- [ ] `SearchProductsComponent` (búsqueda con cálculo de precio por wallet).
- [ ] `SearchClientsComponent`.
- [ ] `EditProductDetailVentaComponent` (edita línea, recalcula).
- [ ] `DeleteProductDetailVentaComponent`.
- [ ] `OpenDetailVentaComponent` (read-only).
- [ ] `AddDataCotizacionComponent` (pide código y navega a convertir).
- [ ] `AddPaymentsComponent` (ver/agregar pagos de una venta).
- [ ] `SelectBatchesVentaComponent` (selección manual de lotes).

### 4.5 Servicios HTTP por feature
- [ ] `VentasService`, `ServiceVentasService`.
- [ ] `CotizacionesService` (× 2).
- [ ] `DevolucionVentasService`.
- [ ] `CajaService`, `CajaIngresoService`, `CajaEgresoService`.

---

## Fase 5 — Reglas de negocio (tests E2E)

Por cada flujo crítico, escribir al menos un test E2E:

- [ ] **Crear venta de producto CONTADO**: cliente + productos + pago exacto → estado Pagado.
- [ ] **Crear venta de producto CRÉDITO**: sin pago → estado Crédito.
- [ ] **Crear venta CRÉDITO con pago parcial**: estado Parcial.
- [ ] **Conversión de cotización a venta**: cliente acepta → nueva venta + cot. marcada como CONVERTIDA.
- [ ] **Devolución parcial**: mitad de productos vendidos → estado Pendiente, sin afectar stock aún.
- [ ] **Devolución finalizada en caja**: dinero regresa al cliente, stock vuelve al almacén.
- [ ] **Apertura y cierre de caja**: monto_inicial, ventas del día, monto_final.
- [ ] **Procesar pagos pendientes**: pagos verification=1 → verification=2 + date_validation.
- [ ] **Cambio de moneda con precio faltante**: revierte.
- [ ] **Stock insuficiente en `disponibilidad=2`**: bloquea.
- [ ] **Stock insuficiente en `disponibilidad=3`**: pregunta al servidor, luego permite con warning.
- [ ] **Validar CONTADO con pago > total**: error.
- [ ] **Validar CONTADO con pago < total**: error.
- [ ] **Editar cotización**: agregar línea, editar línea, eliminar línea (no la última).
- [ ] **PDF de venta**: contiene todos los campos requeridos.
- [ ] **Excel general y Excel detalles**: descargables con filtros aplicados.

---

## Fase 6 — UX / pulido

- [ ] Loading overlay global en cada request HTTP.
- [ ] Toastr success/error/warning consistente.
- [ ] Validaciones visuales (verde/rojo en inputs).
- [ ] Confirmaciones en acciones destructivas (eliminar, anular).
- [ ] Persistencia de columnas visibles (`ColumnsService`).
- [ ] Persistencia de filtros por usuario.
- [ ] Sidebar filtrado por permisos.
- [ ] Paginación cliente o servidor (aquí: servidor).
- [ ] Responsive (móvil básico, no prioritario).

---

## Fase 7 — Seguridad y operación

- [ ] HTTPS en producción.
- [ ] CORS estricto (origen único).
- [ ] JWT con expiración corta + refresh token.
- [ ] Rate limiting.
- [ ] Logs estructurados (request_id, user_id, endpoint).
- [ ] Backups diarios de BD.
- [ ] Monitoreo de transacciones (alertas si una venta falla a mitad).
- [ ] Política de contraseñas (en módulo `users`).
- [ ] Roles y permisos auditados.

---

## Fase 8 — Mejoras "nice-to-have"

(Después de la iteración 1 funcional.)

- [ ] Señales/WebSockets para sincronizar caja entre múltiples cajeros.
- [ ] Notificaciones por email/SMS al cliente cuando su venta cambia de estado.
- [ ] Dashboard con KPIs: ventas del día, top productos, devoluciones, etc.
- [ ] Reportes avanzados: ventas por vendedor, por sucursal, por categoría.
- [ ] Integración con SUNAT / AFIP (si aplica) para facturación electrónica.
- [ ] App móvil para vendedor en campo (re-utilizar `CreateVentaComponent`).
- [ ] Integración con pasarela de pagos online (Niubiz, Izipay, MercadoPago).

---

## 9. Estimación de esfuerzo (orden de magnitud)

| Fase | Esfuerzo relativo |
|---|---|
| Modelo de datos + migraciones | 1× |
| Backend REST (todos los endpoints) | 4–6× |
| Servicios centrales (calculate, price resolver, etc.) | 1× |
| Frontend (todos los componentes) | 6–10× |
| Tests E2E (los 16 críticos) | 2–3× |
| UX y pulido | 1–2× |
| Seguridad/operación | 1× |

> Tiempo total para un equipo de 2 devs senior: ~3–4 meses para tener un MVP equivalente al actual con las mejoras críticas de la iteración 1.

---

## 10. Riesgos a vigilar

1. **Resolución de wallets**: si se cambia la lógica de cascada, romper ventas históricas. Documentar bien.
2. **Multi-moneda**: conversión de monedas sin tabla de tipos de cambio (defecto del sistema actual). Para una réplica, considerar guardar `tipo_cambio` por venta.
3. **Stock en tiempo real**: si dos cajeros venden el mismo producto simultáneamente, puede haber sobreventa. Lock optimista + retry.
4. **PDF/Excel**: si los templates son spaghetti-code en el backend, mantenerlos es costoso. Considerar motor de plantillas.
5. **Cambio de framework**: si migras de Angular a React/Vue, los componentes son directamente portables en concepto pero no en código. El backend es 100% portable.

---

## 11. Próximos pasos

Si decides implementar, te sugiero este orden:

1. **Modelo de datos** completo (Fase 1) → validar con `02-modelo-datos.md`.
2. **Endpoints REST esenciales** (Fase 2.2–2.6) → validar con `08-contratos-api.md`.
3. **Catálogo + Auth** (Fase 2.1) → tener un login funcional.
4. **Frontend de un módulo piloto** (recomiendo `ventas/` productos) → validar UX.
5. **Resto de módulos** replicando el patrón.
6. **Tests E2E** (Fase 5).
7. **Mejoras iteración 1** (Fase 0 de `10-mejoras-y-defectos.md`).

---

¡Éxito con la réplica! Si durante la implementación encuentras dudas que este set de documentos no cubre, vuelve a `01-vision-general.md` para revisar el glosario y los puntos fuertes a conservar.