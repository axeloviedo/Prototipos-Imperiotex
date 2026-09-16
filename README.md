# Prototipos IMPERIOTEX

Prototipos funcionales de pantallas del ERP. Cada módulo es una carpeta con su `index.html`.

| Módulo | Entrada | Contenido |
|---|---|---|
| Inventarios (GI) | `INVENTARIOS/index.html` | Artículos, almacenes, existencias, Kardex, movimientos, **Solicitudes de Pedido**, solicitudes de materiales, GRE, listas de materiales y configuraciones |
| Compras (CO) | `COMPRAS/index.html` | Proveedores, órdenes de compra, facturas, costos de destino, sugerido, reclamos y notas de crédito |
| Producción | `PRODUCCION/index.html` | Órdenes de fabricación, **Recursos y Tipos de recurso**, costos |
| Comercial (CM) | `COMERCIAL/index.html` | Cotización, orden de venta, venta, caja y devoluciones |

## Cómo abrirlos

Sirve esta carpeta con un servidor local y entra a `http://localhost:8000`:

```bash
python -m http.server 8000
```

## Estructura de Inventarios y Compras

```
COMPARTIDO/
  css/base.css         estilos comunes
  js/vistas.js         inserta el HTML de cada archivo de vistas/
  js/nucleo.js         modales, avisos, empresa, menú y go(pantalla)
  js/arranque.js       pinta las listas iniciales y abre la pantalla de inicio o la del #hash
INVENTARIOS/
  index.html           menú del módulo y orden de carga de los scripts
  js/rutas.js          miga de pan (BC) y menú resaltado (NAVMAP) de cada pantalla
  js/datos/            datos de ejemplo
  js/modulos/<tema>.js lógica de la pantalla
  vistas/<tema>.js     HTML de la pantalla y sus modales
COMPRAS/               misma estructura
```

Cada tema tiene dos archivos con el mismo nombre: `vistas/articulos.js` (HTML de GI-01/GI-02) y `js/modulos/articulos.js` (su lógica).

Inventarios y Compras cargan **los mismos archivos**. Cada `index.html` solo cambia el menú y la pantalla de inicio. Por eso desde Inventarios se puede crear una Orden de Compra, y desde Compras se ven los maestros de inventario, sin copiar código. Un cambio en `INVENTARIOS/vistas/articulos.js` se ve en los dos módulos.

### Agregar una pantalla

1. Crea el HTML en `vistas/<tema>.js` con `Vistas.pantallas(String.raw\`<section class="screen" id="scr-xx01">…</section>\`)`. Los modales van en `Vistas.modales(...)`. No uses comillas invertidas (`` ` ``) ni `${` dentro del HTML.
2. Pon la lógica en `js/modulos/<tema>.js` con funciones globales, igual que las demás.
3. Registra la miga y el ítem del menú en `js/rutas.js`.
4. Agrega los dos `<script>` en el `index.html` de **Inventarios y Compras**, en el mismo orden en ambos. Los datos van antes que los módulos que los usan.
5. Si la pantalla va en el menú: `<div class="nav-item" data-go="xx01">…</div>`.

Producción y Comercial tienen su propia estructura (`js/core`, `js/data`, `js/modules`) y no comparten código con Inventarios y Compras.
