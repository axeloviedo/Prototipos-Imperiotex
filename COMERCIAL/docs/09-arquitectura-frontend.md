# 09 — Arquitectura del Frontend (Angular)

> Referencia para replicar la arquitectura Angular del ERP. Si vas a usar otro framework (React, Vue, Svelte), este documento te sirve como mapa de responsabilidades y patrones a imitar.

---

## 1. Stack

| Aspecto | Valor |
|---|---|
| Framework | Angular (template Metronic 8.2.1) |
| Estilos | SCSS + Metronic + Bootstrap-style |
| Notificaciones | `ngx-toastr` |
| Modales | `ng-bootstrap` (`NgbModal`) |
| HTTP | `HttpClient` + `HttpHeaders` (Bearer token) |
| Routing | `RouterModule.forChild(routes)` por feature |
| State | Componentes + servicios con `BehaviorSubject`. No hay NgRx. |
| Persistencia local | `localStorage` (token, user, columnas visibles) |
| Build | Angular CLI (`ng build`) |
| Versión app | `v8.1.8` (Metronic) |

---

## 2. Estructura de carpetas

```
src/app/
├── _metronic/           ← template (layout, kt components, partials, sass)
├── _fake/               ← mocks opcionales
├── auth/                ← login, AuthService, AuthGuard, PermissionGuard
├── config/              ← URL_SERVICIOS, SIDEBAR (permisos)
├── guards/              ← permission.guard.ts (también en auth/)
├── modules/             ← features del negocio
│   ├── ventas/          ← ventas de productos
│   ├── service-ventas/  ← ventas de servicios
│   ├── cotizaciones/    ← cotizaciones de productos
│   ├── service-cotizaciones/
│   ├── devolucion-ventas/
│   ├── cajas/
│   ├── clientes/        ← CRUD cliente
│   ├── products/        ← CRUD producto
│   ├── services/        ← CRUD servicio
│   ├── kardex/
│   ├── purchase/
│   ├── orden-compra-...
│   ├── ...
├── pages/               ← páginas auxiliares (dashboard, role, user)
└── shared/              ← utilidades
    ├── components/      ← loading-overlay, columns, etc.
    ├── directives/
    ├── pipes/
    ├── services/        ← CalculateTotals, ColumnsService, OrdenTabla
    └── styles/
```

---

## 3. Patrón por feature (módulo)

Cada feature sigue esta plantilla:

```
modules/<feature>/
├── <feature>.module.ts                ← declara components
├── <feature>-routing.module.ts        ← rutas con PermissionGuard
├── <feature>.component.ts/html/scss    ← wrapper vacío (sólo <router-outlet>)
├── service/<feature>.service.ts       ← servicio HTTP único
├── list-<feature>/                    ← listado + filtros + paginación
├── create-<feature>/                  ← creación
├── edit-<feature>/                    ← edición (si aplica)
├── view-<feature>/                    ← vista detalle
├── delete-<feature>/                  ← modal confirmación
├── convertir-<feature>/               ← conversión (cotización → venta)
└── componets/                         ← modales reutilizables
    ├── search-clients/
    ├── search-products/
    ├── edit-product-detail-<feature>/
    ├── delete-product-detail-<feature>/
    ├── open-detail-<feature>/
    ├── add-data-cotizacion/           ← en ventas y service-ventas
    ├── add-payments/                  ← placeholder
    └── select-batches-<feature>/      ← sólo ventas (productos)
```

> **Nota**: la carpeta `componets` está mal escrita (sin la `n`). Se mantiene por compatibilidad con imports.

---

## 4. Servicios compartidos (`src/app/shared/services/`)

### 4.1 `LoadingOverlayService`

Overlay global que muestra/oculta un spinner con mensaje personalizable.

```ts
class LoadingOverlayService {
  show(message: string): void;
  hide(): void;
  isLoading$: Observable<boolean>;
  message$: Observable<string>;
}
```

Usado por **todos** los servicios HTTP del feature.

### 4.2 `CalculateTotalsService`

```ts
class CalculateTotalsService {
  fromPrice(price, discount, quantity, ivaRate): {
    precioNeto, subtotal, impuesto, total
  };
  fromUnits(subtotalUnit, impuestoUnit, totalUnit, quantity): {
    subtotal, impuesto, total
  };
  replaceLineInAggregate(...): void;  // recalcula con cambio de línea
}
```

**Centraliza los cálculos financieros**. Cualquier cambio de cálculo se hace aquí, no en los componentes.

### 4.3 `ColumnsService`

```ts
class ColumnsService {
  getColumns(module: string): string[];
  saveColumns(module: string, columns: string[]): void;
}
```

Persiste la visibilidad de columnas por usuario/módulo en `localStorage`.

### 4.4 `OrdenTablaService` (TableSortService)

Ordenamiento **cliente-side** de tablas (string/number/date). No backend sort.

```ts
ordenarDatos(datos, columna, tipo, asc): any[];
alternarEstadoOrden(columna): void;
esOrdenable(columna): boolean;
```

### 4.5 `ApiResponseHandlerService`

```ts
handleResponseMessage(resp): boolean
  // true si el caller debe abortar
```

Inspecciona `resp.message` y emite toast:
- `>= 500` → `toast.error`.
- `400–499` → `toast.warning`.

### 4.6 `PageInfoService`

Actualiza el título del documento (`document.title`) según la ruta.

---

## 5. Guards

### 5.1 `AuthGuard` (`src/app/modules/auth/services/auth.service.ts`)

- Verifica `user && token` en `localStorage`.
- Si falta, llama `logout()` y redirige a `/auth/login`.
- **JWT expiration check está comentado** (defecto a corregir).

### 5.2 `PermissionGuard` (`src/app/guards/permission.guard.ts`)

- Lee `data: { permissions: [...] }` de la ruta.
- Llama `PermissionService.hasAnyPermission(perms)`.
- Super-Admin (`role_name === 'Super-Admin'`) bypassa siempre.
- Si no tiene permiso, redirige a `/no-access` o `/permission`.

### 5.3 `PermissionService`

```ts
hasAnyPermission(perms: string[]): boolean
hasAllPermissions(perms: string[]): boolean
isSuperAdmin(): boolean
```

Los permisos se leen de `user.permissions[]` (decodificado del JWT).

---

## 6. Configuración

### 6.1 `src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  URL_SERVICIOS: 'http://localhost:8000/api',
  URL_BACKEND: 'http://localhost:8000/',
  URL_FRONTED: 'http://localhost:4200',
  URL_CHATBOT_N8N: 'https://...',
  ...
}
```

Re-exportado vía `src/app/config/config.ts → URL_SERVICIOS`. Todos los servicios importan `URL_SERVICIOS` de ahí.

### 6.2 Sidebar y permisos (`src/app/config/config.ts`)

Array `SIDEBAR` con la forma:

```ts
{
  seccion: 'Comercial',
  name: 'Ventas',
  permisos: [
    { name: 'Ver', permiso: 'ver_venta' },
    { name: 'Crear', permiso: 'crear_venta' },
    { name: 'Asignar Vendedor', permiso: 'asignar_vendedor_venta_producto' },
  ]
}
```

El sidebar lee este array para mostrar/ocultar entradas según los permisos del usuario.

---

## 7. Servicios de feature (patrón)

Cada feature tiene **un único servicio** que centraliza las llamadas HTTP. Ejemplo (`VentasService`):

```ts
@Injectable({ providedIn: 'root' })
export class VentasService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    public authservice: AuthService,
    private loadingOverlay: LoadingOverlayService,
  ) { ... }

  // Búsqueda
  searchClients(n_document, full_name, phone) { ... }
  searchProducts(search) { ... }

  // Catálogo
  configAll() { ... }

  // CRUD de cabecera
  listProformas(page, data) { ... }
  showProforma(id) { ... }
  createProforma(data) { ... }
  editProforma(id, data) { ... }
  deleteProforma(id) { ... }

  // Cotización
  showCotizacion(id) { ... }
  convertirAVenta(id, data) { ... }

  // Detalles
  addDetailProforma(data) { ... }
  editDetailProforma(id, data) { ... }
  deleteDetailProforma(id) { ... }

  // Precio
  evalDisponibilidad(productId, unitId, qty) { ... }
  getPriceSugested(data) { ... }

  // Export
  exportVenta(id) { ... }
  exportVentaGeneral(LINK) { ... }
  exportVentaDetails(LINK) { ... }
}
```

**Patrones**:

1. **Todas las llamadas** envuelven `this.loadingOverlay.show('...')` antes y `hide()` después.
2. **Todas llevan** `Authorization: Bearer <token>` en headers.
3. **Todas** usan `URL_SERVICIOS` como prefijo.
4. **Errores** se manejan en el subscriber con `toastr.error(...)` (no en el servicio).

---

## 8. Componentes de feature (patrón)

### 8.1 Listado

```ts
@Component({...})
export class ListVentaComponent implements OnInit {
  // Filtros
  search, client_segment_id, asesor_id, ...

  // Paginación
  currentPage = 1;
  totalPages = 0;
  total = 0;
  PROFORMAS: Proforma[] = [];

  constructor(private ventas: VentasService, ...) {}

  ngOnInit() {
    this.configAll();
    this.listProformas();
  }

  listProformas(page = 1) {
    this.ventas.listProformas(page, this.buildFilters())
      .subscribe(resp => {
        if (this.apiHandler.handleResponseMessage(resp)) return;
        this.PROFORMAS = resp.data;
        this.total = resp.total;
        // paginación
      });
  }

  buildFilters() { return { /* ... */ }; }
  resetlistProformas() { this.PROFORMAS = []; this.currentPage = 1; this.listProformas(); }

  // Acciones
  proformaPdf(proforma) { this.ventas.exportVenta(proforma.id); }
  importarCotizacion() { /* modal */ }
  openProforma(proforma) { /* modal */ }
  exportProformas() { /* arma LINK con filtros, exportVentaGeneral */ }
  exportProformasDetails() { /* análogo */ }
  openColumnSelector() { /* ColumnsService */ }
}
```

### 8.2 Crear

```ts
@Component({...})
export class CreateVentaComponent implements OnInit {
  // Estado del carrito
  CLIENT_SELECTED, PRODUCT_SELECTED, DETAIL_VENTA = [];

  // Totales
  TOTAL_PROFORMA, SUBTOTAL_PROFORMA, TOTAL_IMPUESTO_PROFORMA, DEBT_PROFORMA;

  // Catálogos
  asesores, coins, method_payments, bancos, term_payments, document_types, ...;

  // Acciones
  searchClients() {}
  searchProducts() {}
  resolvePrice(wallets, unitId) {}
  addProduct() {}
  editProduct(detail, index) {}
  deleteProduct(detail, index) {}
  changeCoin() {}
  changeUnitProduct($event) {}
  changeRegion() {}
  changeProvincia() {}
  validaciones(): boolean {}
  save() {}
}
```

### 8.3 Wrapper component (`VentasComponent`)

```html
<!-- ventas.component.html -->
<router-outlet></router-outlet>
```

Sirve sólo para alojar el `<router-outlet>` del módulo.

---

## 9. Modales (`NgbModal`)

Cada modal es un componente standalone que:

```ts
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({...})
export class EditProductDetailVentaComponent {
  @Input() detail: any;
  @Input() index: number;
  @Output() ProductDetailD = new EventEmitter();

  constructor(public activeModal: NgbActiveModal) {}

  save() {
    this.ProductDetailD.emit({ detail: this.detail, index: this.index });
    this.activeModal.close();
  }

  cancel() {
    this.activeModal.dismiss();
  }
}
```

Y se abre con:

```ts
const modalRef = this.modalService.open(EditProductDetailVentaComponent, { size: 'lg' });
modalRef.componentInstance.detail = item;
modalRef.componentInstance.ProductDetailD.subscribe((data) => {
  this.DETAIL_VENTA[data.index] = data.detail;
  this.sumTotalDetail();
});
```

---

## 10. Formularios y validaciones

- Se usa Angular **Reactive Forms** (`FormBuilder`, `FormGroup`, `Validators`) en algunos componentes, pero la mayoría (incluido `CreateVentaComponent`) usan **template-driven** con validaciones manuales en `validaciones()`.
- **Defecto**: la inconsistencia entre formularios reactivos y template-driven hace que el código sea más difícil de testear.
- **Mejora sugerida**: estandarizar a Reactive Forms en toda la app.

---

## 11. Sidebar y permisos

`src/app/_metronic/layout/components/sidebar/sidebar.component.ts` lee `SIDEBAR` y filtra según `user.permissions`. La estructura `permisos: [{ name, permiso }]` permite:

- Mostrar el módulo si tiene alguno de los permisos.
- Mostrar/ocultar sub-acciones según permiso específico.

---

## 12. Manejo de errores global

`ApiResponseHandlerService.handleResponseMessage(resp)` centraliza los toasts. Cada subscriber lo llama:

```ts
this.ventas.listProformas(...).subscribe({
  next: (resp) => {
    if (this.apiHandler.handleResponseMessage(resp)) return;  // aborta si hubo error/warning
    this.PROFORMAS = resp.data;
  },
  error: (err) => {
    this.apiHandler.handleResponseMessage({ message: 500 });
  }
});
```

---

## 13. Generación de PDF y Excel (side-effects)

```ts
exportVenta(id) {
  this.loadingOverlay.show('Exportando venta pdf...');
  this.http.get(`${URL_SERVICIOS}/pdf/venta-productos/${id}`, {
    headers, responseType: 'blob'
  }).pipe(finalize(() => { this.isLoadingSubject.next(false); this.loadingOverlay.hide(); }))
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
}

exportVentaGeneral(LINK) {
  // ...descarga XLSX con document.createElement('a')
}
```

---

## 14. Pipes y directivas

- `number` pipe para moneda (`'1.2-2'`).
- `date` pipe para fechas.
- Directivas: validación visual, autofocus, etc.

---

## 15. Puntos fuertes

- **Patrón consistente** entre módulos: cualquier feature nueva sigue el mismo esqueleto.
- **Servicios centralizados**: un módulo = un service.
- **`CalculateTotalsService` centraliza el dinero**.
- **Modales reutilizables**: `search-products`, `search-clients`.
- **Permisos granulares** vía `PermissionGuard` y `data.permissions[]`.
- **Loading overlay** global.

## 16. Defectos / mejoras

- **Falta Reactive Forms** consistente.
- **Estado en componentes**, no centralizado: dos pestañas abiertas de "crear venta" no se sincronizan.
- **No hay NgRx ni signals**: a medida que crezca, conviene centralizar.
- **Catálogos duplicados** entre módulos (cada `service-ventas` tiene su propio `search-products`, etc.).
- **`add-payments` placeholder**.
- **JWT expiration check comentado**.
- **No hay tests unitarios** en estos módulos (verificar si hay alguno).

---

## 17. Próximo documento

- [`10-mejoras-y-defectos.md`](./10-mejoras-y-defectos.md) — qué arreglar y qué conservar.