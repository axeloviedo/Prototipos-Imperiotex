# Prototipos IMPERIOTEX

Prototipos funcionales de pantallas del ERP. Cada módulo es una carpeta con su `index.html`.

| Módulo | Entrada | Contenido |
|---|---|---|
| Inventarios (GI) | `INVENTARIOS/index.html` | Artículos, almacenes, existencias, Kardex, movimientos, **Solicitudes de Fabricación**, solicitudes de materiales, GRE, listas de materiales y configuraciones |
| Compras (CO) | `COMPRAS/index.html` | Proveedores, órdenes de compra, facturas, costos de destino, sugerido, reclamos y notas de crédito |
| Producción | `PRODUCCION/index.html` | Órdenes de fabricación, **Recursos y Tipos de recurso**, costos |
| Comercial (CM) | `COMERCIAL/index.html` | Cotización, orden de venta, venta, caja y devoluciones |

## Cómo abrirlos

Sirve esta carpeta con un servidor local y entra a `http://localhost:8000`:

```bash
python -m http.server 8000
```

## Base de datos compartida

- Los cuatro módulos leen y escriben **una sola base** en `localStorage` (clave `imperiotex.bd`, objeto `BD.d`): maestros, stock, movimientos, SF, SOL, transferencias (ST), OC, facturas, GRE y órdenes de fabricación. Contrato completo en `docs/16_BASE_DATOS_COMPARTIDA.md`.
- Núcleo en `COMPARTIDO/bd/`: `BD` (carga, guardado, lecturas), `Stock` (stock y movimientos), `Explosion` (listas de materiales), `Docs` (documentos) y `BDSelector`. Solo `Stock`/`Docs` modifican stock y documentos.
- Selector **Datos** de la barra superior: **Solo maestros** (empezar de cero) o **Con operación**; **↺ Reiniciar** deja TODOS los módulos en el escenario elegido.
- Otra pestaña que guarda dispara `BD.alCambiar`: la pantalla actual se repinta (salvo formularios con cambios sin guardar).
- Detalle de lo conectado en Inventarios: `INVENTARIOS/docs/00_INVENTARIOS_BASE_COMPARTIDA.md`.

## Estructura de Inventarios y Compras

```
COMPARTIDO/
  css/base.css         estilos comunes
  js/vistas.js         inserta el HTML de cada archivo de vistas/
  js/nucleo.js         abre la base (BD.iniciar), modales, avisos, formato (Fmt), empresa, menú y go(pantalla) con RENDER[pantalla]
  js/arranque.js       selector de datos, listas iniciales de Compras, campana, BD.alCambiar y #hash (p. ej. #gi23=SF-000001, #co07=OC-000001)
  bd/                  base compartida (ver arriba); bd/datos/maestros-logistica.js = datos propios de Inventarios y Compras
INVENTARIOS/
  index.html           menú del módulo y orden de carga de los scripts
  js/rutas.js          miga de pan (BC) y menú resaltado (NAVMAP) de cada pantalla
  js/modulos/<tema>.js lógica de la pantalla
  vistas/<tema>.js     HTML de la pantalla y sus modales
COMPRAS/               misma estructura
```

Cada tema tiene dos archivos con el mismo nombre: `vistas/articulos.js` (HTML de GI-01/GI-02) y `js/modulos/articulos.js` (su lógica).

Inventarios y Compras cargan **los mismos archivos**. Cada `index.html` solo cambia el menú y la pantalla de inicio. Por eso desde Inventarios se puede crear una Orden de Compra, y desde Compras se ven los maestros de inventario, sin copiar código. Un cambio en `INVENTARIOS/vistas/articulos.js` se ve en los dos módulos.

### Agregar una pantalla

1. Crea el HTML en `vistas/<tema>.js` con `Vistas.pantallas(String.raw\`<section class="screen" id="scr-xx01">…</section>\`)`. Los modales van en `Vistas.modales(...)`. No uses comillas invertidas (`` ` ``) ni `${` dentro del HTML.
2. Pon la lógica en `js/modulos/<tema>.js` con funciones globales, leyendo y escribiendo solo `BD`/`Stock`/`Docs` (sin arrays propios). Registra `RENDER.<pantalla>=función` para que se pinte al entrar y al cambiar la base.
3. Registra la miga y el ítem del menú en `js/rutas.js`.
4. Agrega los dos `<script>` en el `index.html` de **Inventarios y Compras**, en el mismo orden en ambos. Los datos van antes que los módulos que los usan.
5. Si la pantalla va en el menú: `<div class="nav-item" data-go="xx01">…</div>`.

Producción y Comercial tienen su propia estructura (`js/core`, `js/data`, `js/modules`) y no comparten código con Inventarios y Compras.

## Documentación de la base compartida

- `docs/16_BASE_DATOS_COMPARTIDA.md`: contrato de la base (maestros, stock, documentos, quién hace qué).
- `docs/17_GUIA_PRODUCCION_MASIVA.md`: guía paso a paso para probar la producción masiva con los dos escenarios de datos.
- `docs/00_DECISIONES_CERRADAS.md` sección K y los documentos de cada módulo: `INVENTARIOS/docs`, `COMPRAS/docs`, `PRODUCCION/docs`, `COMERCIAL/docs`.
- Herramientas: `COMPARTIDO/herramientas/importar_plantillas.py` (maestros desde los Excel), `actualizar_estructura_word.py` (Word actualizado desde los Excel) y `generar-escenario.js` (escenario «Con operación»).
