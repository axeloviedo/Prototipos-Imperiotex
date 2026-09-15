# 07 — Caja (Apertura, Cierre, Pagos, Ingresos, Egresos, Devoluciones)

> Alcance: `src/app/modules/cajas/`. La caja es el **módulo transaccional** del sistema: todo lo que mueve dinero pasa por aquí.

---

## 1. Resumen funcional

"Caja" es el módulo que:

- **Apertura y cierre** de cajas por sucursal y moneda.
- **Lista ventas pendientes de pago** para que el cajero las cobre.
- **Procesa pagos** de ventas pendientes: genera `caja_movement` por cada pago, marca `verification=2` y `date_validation`.
- **Gestiona ingresos manuales** (categoría + descripción + monto).
- **Gestiona egresos manuales**.
- **Procesa devoluciones finalizadas** (genera movimiento de egreso al cliente).
- **Reporta** caja diaria, histórica y descarga PDFs/Excel.

Una sola caja abierta por `(sucursal, moneda)`. Sin caja abierta, no se puede cobrar ni registrar movimientos.

---

## 2. Rutas y permisos

Sólo hay una ruta principal:

| Ruta | Componente | Permisos |
|---|---|---|
| `/cajas/gestion` | `ListsCajaProcessComponent` | `ver_caja` o `crear_caja` o `editar_caja` |

> El permiso `valid_payments` aparece en la sidebar pero **no se usa como guard** en este módulo (queda como hint para un flujo futuro de "validación manual de pagos").

Todo el resto (apertura, cierre, pagos, ingresos, egresos, reportes) son **modales** que se abren desde `ListsCajaProcessComponent`.

---

## 3. Servicios

### 3.1 `CajaService` (`service/caja.service.ts`)

| Método | Endpoint | Notas |
|---|---|---|
| `configCaja(sucursale_id, coin_id='1')` | `GET /caja/config?sucursale_id=&coin_id=` | Configuración de la caja activa + dropdowns. |
| `aperturaCaja(data)` | `POST /caja/apertura_caja` | Abre caja. |
| `cierreCaja(data)` | `POST /caja/cierre_caja` | Cierra caja. |
| `reportCaja(page, data)` | `POST /caja/report_caja?page=N` | Reporte histórico. |
| `searchClients(...)` | `GET /proforma/search-clients?p=1&...` | (Reutiliza endpoint de ventas). |
| `searchProformas(client_id, n_proforma, state_payment, coin_id)` | `GET /caja/search_proformas/{client_id}?p=1&...` | Busca ventas de un cliente para cobrar. |
| `updatePayment(data, paymentId)` | `POST /caja/updated_payment/{id}` | Edita un pago. |
| `createPayment(data)` | `POST /caja/created_payment` | Crea un pago nuevo contra una venta. |
| `processPayment(data)` | `POST /caja/process_payment` | Procesa todos los pagos pendientes de una venta (verification=1). |
| `listContractProcess(data)` | `POST /caja/contract_process` | Pagos ya procesados. |
| `ventasPendientesPago(n_proforma, search_client, coin_id)` | `GET /caja/ventas_pendientes_pago?p=1&...` | Ventas con deuda > 0. |
| `listFundAccounts(data)` | `POST /caja/fund-accounts/index` | Lista cuentas de fondos (bank_account). |
| `createFundAccount(data)` | `POST /caja/fund-accounts` | Crea una cuenta de fondos. |
| `listDevolucionesVentasFinalizadas(page, data)` | `POST /devolucion-proformas/index?page=N` | Devoluciones finalizadas (state=2). |
| `listDevolucionesComprasFinalizadas(page, data)` | `POST /devolucion-purchases/index?page=N` | Idem compras. |
| `processDevolucion(data)` | `POST /caja/process_devolucion` | Procesa una devolución venta. |
| `processCompraDevolucion(data)` | `POST /caja/process_compra_devolucion` | Procesa una devolución compra. |
| `confirmDevolucionProcess(movimientoId)` | `POST /caja/confirm_devolucion_process/{id}` | Confirma. |
| `anularDevolucionProcess(movimientoId)` | `POST /caja/anular_devolucion_process/{id}` | Anula. |
| `confirmCompraDevolucionProcess(movimientoId)` | `POST /caja/confirm_compra_devolucion_process/{id}` | Idem compras. |
| `anularCompraDevolucionProcess(movimientoId)` | `POST /caja/anular_compra_devolucion_process/{id}` | Idem compras. |
| `listDevolucionProcess(data)` | `POST /caja/devolucion_process` | Movimientos de devoluciones ventas. |
| `listCompraDevolucionProcess(data)` | `POST /caja/compra_devolucion_process` | Idem compras. |
| `showDevolucionVenta(id)` | `GET /devolucion-proformas/{id}` | Trae devolución venta. |
| `showDevolucionCompra(id)` | `GET /devolucion-purchases/{id}` | Trae devolución compra. |
| `reportCajaDay(cajaSucursaleId)` | `GET /caja/report_caja_day/{id}` | Resumen del día. |
| `exportCaja(LINK)` | `GET /excel/export-contract-processs?k=1{LINK}` | Excel "caja-exportada-{fecha}.xlsx". |
| `resumenHistoricoCaja(cajaSucursaleId)` | `GET /caja/resumen_historico_caja/{id}` | Datos para PDF histórico. |
| `exportResumenHistoricoPdf(cajaSucursaleId)` | `GET /pdf/caja-resumen/{id}` | **Devuelve Observable<Blob>** del PDF. |

### 3.2 `CajaIngresoService`

```
POST   /caja/ingresos              crear
GET    /caja/ingresos?page=&caja_sucursale_id=   listar
PUT    /caja/ingresos/{id}         editar
DELETE /caja/ingresos/{id}         eliminar
```

### 3.3 `CajaEgresoService`

Idéntico patrón con `/caja/egresos`.

---

## 4. Componente principal: `ListsCajaProcessComponent`

Archivo: `src/app/modules/cajas/lists-caja-process/lists-caja-process.component.ts`. Es el único routed component. Maneja **5 tabs** (sub-vistas) por `type_option_selected`:

| type_option | Tab | Datos |
|---|---|---|
| `1` | Pagos procesados | `listContractProcess` |
| `2` | Ingresos | `listIngresos` |
| `3` | Egresos | `listEgresos` |
| `6` | Ventas pendientes de pago | `ventasPendientesPago` |

### 4.1 Estado global

```
caja                   Caja
caja_sucursale         CajaSucursale activa (con sucursale, user, amount_initial)
created_at_apertura    Date
PROFORMAS              Sale[] filtradas
ingresos               Ingreso[]
egresos                Egreso[]
VENTAS_PENDIENTES      Sale[]
cajas_disponibles[]    por sucursal
coin_id_selected       moneda actual
```

### 4.2 Cambio de moneda

`onChangeCoin()` recarga todo: la caja es por moneda, así que cambiar de moneda implica potencialmente abrir otra caja.

### 4.3 Modales que abre

| Acción | Componente modal |
|---|---|
| Abrir caja | `CajaAperturaComponent` |
| Cerrar caja | `CajaCierreComponent` |
| Reporte diario | `CajaReportDayComponent` |
| Histórico | `CajaHistoryComponent` |
| Procesar pagos pendientes | `CajaClientsContractsComponent` → `CajaNewPaymentComponent` / `CajaEditPaymentComponent` |
| Crear ingreso | `CajaIngresoCreateComponent` |
| Editar ingreso | `CajaIngresoEditComponent` |
| Eliminar ingreso | `CajaIngresoDeleteComponent` |
| Crear egreso | `CajaEgresoCreateComponent` |
| Editar egreso | `CajaEgresoEditComponent` |
| Eliminar egreso | `CajaEgresoDeleteComponent` |
| Procesar devolución | `CajaDevolucionProcessCreateComponent` |
| Ver detalles de pagos | `ShowDetailsPaymentsComponent` |
| Ver detalles de devolución | `ShowDetailsDevolucionProcessComponent` |

### 4.4 Helpers de UI

- `getPagosSinProcesar(proforma)` → `pagos.filter(p => p.verification == 2 && !p.date_validation)` (pagos marcados pero sin validar).
- `getPagosSinValidar(proforma)` → resto de pagos sin `date_validation`.

> **Nota**: la nomenclatura es confusa (defecto a corregir). "Sin procesar" debería llamarse "sin validar" y viceversa.

---

## 5. Apertura: `CajaAperturaComponent`

Modal que pide:

- `caja.id` (configuración de caja; normalmente preseleccionada).
- `amount_initial` (monto inicial en efectivo con que se abre).

POST `/caja/apertura_caja` con FormData. Respuesta: `caja_sucursale` activa. Toast success → emite `caja_apertura` → recarga.

---

## 6. Cierre: `CajaCierreComponent`

Modal que pide:

- `caja_sucursale.id`.
- `amount_pass` (efectivo contado en caja fuerte).
- `amount_finish` (lo que el sistema calcula como saldo esperado).

POST `/caja/cierre_caja`. Respuesta: cierre exitoso, totales finales.

---

## 7. Reporte diario: `CajaReportDayComponent`

`GET /caja/report_caja_day/{id}` devuelve `method_payment_total_amount[]`:

```
[ { method_payment_id, name, amount_total_process } ]
```

Suma total general = `efectivo_finish` (método EFECTIVO) + sum del resto.

La moneda se muestra desde `caja.coin.code` o `'PEN'` fallback.

---

## 8. Procesamiento de pagos pendientes: `CajaClientsContractsComponent`

Modal principal de "cobrar".

### 8.1 Flujo

1. `searchClients()` → seleccionar cliente.
2. `searchProformas(client_id, ...)` → lista ventas del cliente con `state_payment != Pagado`.
3. Click en una venta → ver detalle + lista de `pagos` editables.
4. Acciones:
   - `editPay(PAGO)` → `CajaEditPaymentComponent` (edita campos del pago).
   - `addPayment()` → `CajaNewPaymentComponent` (agrega un nuevo pago).
   - `processPayment()` → `POST /caja/process_payment`: procesa **todos** los pagos pendientes (verification=1) en una sola transacción; marca verification=2 + date_validation; crea `caja_movement` por cada pago.

### 8.2 Validaciones de un pago

| Regla |
|---|
| `method_payment_id` obligatorio. |
| `amount > 0`. |
| Si método ≠ EFECTIVO (id != 1): `n_transaccion` obligatorio. |
| Si método tiene bancos: `banco_id` obligatorio. |
| `date_payment ≤ hoy`. |
| Voucher (`payment_file`) obligatorio si método ≠ EFECTIVO (defecto a corregir: debería validar siempre). |

### 8.3 `getEstadoPagoLabel(proforma)`

- `state_payment == 3` → "Pagado"
- `state_payment == 2` → "Parcial"
- otros → "Crédito"

---

## 9. Ingresos y Egresos

### 9.1 Campos comunes

- `amount > 0`.
- `description` ≥ 5 caracteres.
- `income_categorie_id` o `expense_categorie_id` obligatorio.
- `transaction_date ≤ hoy`.

### 9.2 Acciones

- Crear (FormData).
- Editar (PUT).
- Eliminar (DELETE).

> Los ingresos/egresos **no** están sujetos a proceso de "validación"; quedan directamente como `caja_movement` tipo 2 (ingreso) o 3 (egreso).

---

## 10. Procesamiento de devoluciones

### 10.1 `CajaDevolucionProcessCreateComponent`

Acepta `scope = 'ventas' | 'compras'`. Para ventas:

- `devolucion_id`.
- `fund_account_id` (filtrado por la moneda de la devolución).
- `method_payment_id`, `banco_id` (de los bancos del método).
- `amount`.
- `state = 2` (procesado).
- `description` (auto: "Devolucion de venta #ID").

Llama `processDevolucion(data)` → `POST /caja/process_devolucion`.

### 10.2 Confirmar / Anular

- `confirmDevolucionProcess(movimientoId)` → `POST /caja/confirm_devolucion_process/{id}`.
- `anularDevolucionProcess(movimientoId)` → `POST /caja/anular_devolucion_process/{id}`.

### 10.3 Resultado

- Crea `caja_movement` con `type = 3` (Egreso, dinero sale de la caja al cliente) **o `type = 4` (Devolución)** — depende de cómo lo modele el backend (defecto: actual modelo no distingue tipo "devolución", lo trata como egreso).
- Devuelve stock al almacén (movimiento de inventario inverso).

---

## 11. Cuentas de fondos (`fund_account`)

Permite registrar cuentas bancarias / cajas fuertes para asociar movimientos.

- `listFundAccounts` → listado.
- `createFundAccount` → crear.

Cada cuenta tiene `coin_id`, lo que obliga a que el `method_payment` y `banco` coincidan con esa moneda.

---

## 12. Histórico y reportes

### 12.1 `CajaHistoryComponent`

Filtros:

- `sucursale_id`, `start_date`, `end_date`.
- `type_option`: `1`=cajas_sucursales, `2`=proformas, `3`=ingresos, `4`=egresos.
- `coin_id`, `n_proforma`, `search_client`, `client_segment_id`, `method_payment_id`.

Llama `reportCaja(page, data)` y muestra según `type_option`.

Exporta Excel: `exportCaja(LINK)`.

### 12.2 `CajaResumenHistoricoComponent`

- `resumenHistoricoCaja(cajaSucursaleId)` → devuelve `caja_sucursale`, `resumen_totales`, `movimientos[]`.
- `descargarPdf()` → `exportResumenHistoricoPdf(id)` → abre PDF en nueva pestaña.
- `getTipoOperacion(tipo)`: `1=VENTA`, `2=INGRESO`, `3=EGRESO`.

---

## 13. Edge cases

1. **Cerrar una caja con pagos pendientes**: el sistema no bloquea. Defecto a corregir: validar que no haya pagos sin procesar.
2. **Multi-usuario en la misma caja**: actualmente no hay lock. Riesgo de doble cierre.
3. **Cambio de moneda con caja abierta**: el dropdown de monedas se actualiza, pero si la caja destino no existe, pide apertura.
4. **Voucher no obligatorio**: defecto.
5. **Devolución en moneda diferente a la caja abierta**: se rechaza por `fund_account` filtrado por moneda.
6. **Sin conexión**: todos los endpoints asumen red. Sin offline-first.

---

## 14. Máquina de estados resumida

```
CAJA:
  no existe → apertura (POST /caja/apertura_caja) → ABIERTA (state=1) → cierre (state=2)

PAGO (proforma_payment):
  creado (verification=1) → process_payment (verification=2, date_validation) → VALIDADO

DEVOLUCIÓN:
  creada (state=1) → finalizada manual → caja.process_devolucion → state=2

MOVIMIENTO DE CAJA:
  creado (state=1) → confirm → state=2
```

---

## 15. Puntos fuertes

- Una sola caja activa por (sucursal, moneda): evita confusión de efectivo.
- Procesa pagos en bloque (`process_payment`) por venta.
- Histórico completo descargable como PDF/Excel.
- Validación cruzada moneda-cuenta-método.

## 16. Defectos

- Nomenclatura confusa: `getPagosSinProcesar` vs `getPagosSinValidar`.
- No hay validación de "caja con pagos pendientes" antes de cerrar.
- No hay lock multi-usuario.
- No hay estado `ANULADA` para devoluciones en caja.
- `type` en `caja_movement` no distingue devoluciones de egresos manuales.
- Permiso `valid_payments` declarado pero no usado.

---

## 17. Próximo documento

- [`08-contratos-api.md`](./08-contratos-api.md) — contratos REST detallados.