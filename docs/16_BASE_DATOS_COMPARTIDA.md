# 16 · Base de datos compartida del prototipo

> Rama `feat/datos-compartidos` · 2026-09-16. Contrato para Inventarios, Compras, Producción y Comercial.
> Fuentes de datos (decisión K3): **mandan las plantillas Excel**. Del Word solo se usa la copia `ESTRUCTURA_ORGANIZATIVA_LOGISTICA_INVENTARIOS_ERP_ACTUALIZADO.docx` (corregida con los Excel y las decisiones cerradas) para organización y grupos de compras y grupos y tipos de movimiento. Decisiones de esta base: K1–K10 en `00_DECISIONES_CERRADAS.md`.
> Objetivo: probar el flujo **Producción masiva con stock suficiente** (incluida la compra del servicio tercerizado) pasando por los cuatro módulos con **los mismos datos**.

## 1. Idea general

- Hay **una sola base** en `localStorage`, clave `imperiotex.bd` (objeto `BD.d`). Todos los módulos leen y escriben ahí.
- Los **maestros** salen de las plantillas reales del usuario (`docs/INFO/PLANTILLAS ENTREGADAS POR EL USUARIO`) más complementos.
- El **stock** y los **movimientos** son únicos (`Stock`), y los **documentos que cruzan módulos** también (`Docs`).
- Dos **escenarios** de datos, elegibles desde la barra superior de cualquier módulo (`BDSelector`):
  - **Solo maestros**: maestros completos, sin stock, movimientos, órdenes ni documentos. Para empezar de cero.
  - **Con operación**: maestros más compras, solicitudes, órdenes, movimientos, saldos y ventas ya registrados (`datos/escenario-operacion.js`, generado).
- **Reiniciar** (desde cualquier módulo) borra todas las claves `imperiotex.` y deja TODOS los módulos en el escenario elegido.
- Otra pestaña que guarda dispara `BD.alCambiar(fn)`: cada módulo refresca su pantalla actual.

## 2. Archivos y orden de carga (idéntico en los cuatro `index.html`, antes de los scripts del módulo)

```
COMPARTIDO/bd/datos/maestros-plantillas.js   BD_PLANTILLAS   GENERADO por COMPARTIDO/herramientas/importar_plantillas.py (no editar)
COMPARTIDO/bd/datos/maestros-complementos.js BD_COMPLEMENTOS familia ZULEIKA, avíos que faltan, almacén PP, recursos, operarios, LDM, proveedores de servicios
COMPARTIDO/bd/datos/maestros-logistica.js    BD_LOGISTICA    datos propios de Inventarios/Compras (dueño: Logística)
COMPARTIDO/bd/datos/maestros-comercial.js    BD_COMERCIAL    datos propios de Comercial (dueño: Comercial)
COMPARTIDO/bd/datos/escenario-operacion.js   BD_ESCENARIO_OPERACION  GENERADO (null = aún no existe)
COMPARTIDO/bd/bd.js          BD          carga/guardado/escenarios/reinicio, correlativos, lecturas de maestros y documentos
COMPARTIDO/bd/stock.js       Stock       stock y movimientos
COMPARTIDO/bd/explosion.js   Explosion   cálculos sobre listas de materiales
COMPARTIDO/bd/documentos.js  Docs        SF, SOL, OC, factura, GRE
COMPARTIDO/bd/selector.js    BDSelector  «Datos: Solo maestros | Con operación · ↺ Reiniciar»
```

Cada módulo, al arrancar: `BD.iniciar('USER05 · Producción')` (fija el usuario que firma), `BDSelector.montar(topbar)` y `BD.alCambiar(() => refrescar())`.

## 3. Estructura de `BD.d`

```
{ version, escenario: 'maestros'|'operacion', creado, seq: {serie: siguiente},
  maestros: {...}, stock: [], movs: [], sfs: [], sols: [], ocs: [], facturas: [], trfs: [], gres: [], ofs: [], config: {nombreRef},
  ...colecciones propias de un área (declaradas en BD_LOGISTICA / BD_COMERCIAL) }
```

Archivos de área (`BD_LOGISTICA`, `BD_COMERCIAL`): `{ maestros: {clave: lista|objeto}, colecciones: {clave: valor inicial} }`.
Las listas de `maestros` se **agregan** (sin repetir `cod`) a las comunes; las `colecciones` se crean en `BD.d` si no existen.
Nombres de colecciones reservados para Comercial: `clientes, listas, cots, ventas, devs, sesiones, cmovs, comercial`.

### 3.1 Maestros (`BD.d.maestros`)

| Clave | Registro | Origen |
|---|---|---|
| `empresas` | `{cod:'SB01', nom:'IMPERIOTEX', marca, abrev:'SB'}` | plantilla almacenes |
| `sedes` | `{cod:'G', nom:'Gamarra', dir, contenido}` | plantilla almacenes |
| `almacenes` | `{emp:'SB', cod:'SB-CENTRAL', nom, cat:'Común'\|'Transición'\|'Tienda'\|'Tienda Liquidación', sede, fisico, contenido, estado, kardexValorizado, transito, obs, origen}` | plantilla + `SB-ZARATE-PP` / `CN-ZARATE-PP` (almacén de producto en proceso, K5) |
| `unidades` | `{cod:'UND', nom}` | plantilla + HORA, DÍA |
| `conversiones` | `{de:'DOC', a:'UND', factor:12}` | complemento |
| `grupos` | `{cod:'MP'\|'SRV'\|'PPT'\|'PT'\|'MERC', nom, prefijo, asignacion, inv}` | complemento |
| `categorias` / `subcategorias` | `{cod, nom, cv, grupo}` / `{cat, nom}` | plantillas + PANTALON |
| `clasesValoracion` | `{cod:'CV-01', nom}` | plantilla |
| `atributos` | `{nom:'Color', vals:[...]}` | plantilla + valores |
| `tiposCodigoBarra` | `'GTIN / EAN'` … | plantilla |
| `articulos` | ver 3.2 | 101 MP + 17 SRV de plantilla; 6 avíos MP-0102..0107 y 16 ZULEIKA de complemento |
| `ldms` | `{id:'LDM-0001', art, nom, desc, base, pred, items:[{tipo:'Artículo', cod, cant, alm, metodo:'Manual'\|'Notificación'} \| {tipo:'Recurso', cod, cant, metodo?} \| {tipo:'Texto', txt}]}` | complemento |
| `tiposRecurso` | `{cod:'TRC-0001', nom:'RECURSO HUMANO', clase:'humano'\|'servicio'?}` | complemento |
| `recursos` | `{cod, nom, tipo, activo, u, costo (estándar), cuenta (mayor), prov?}` — un servicio de terceros usa **el mismo código del artículo SRV** | complemento |
| `operarios` | `{cod:'OPE-001', nom, rec, activo}` | complemento |
| `proveedores` | `{cod:'PROV-0001', tipoDoc, doc, nom, comercial, grupo, tipo, estado, email, dir, ubigeo, tel, cel, mon, cond, dias, retencion, detraccion, servicio?, alm?, diasEst?, origen, aConfirmar?}` | 4 de plantilla + 17 de servicios (complemento) |
| `gruposProveedor` | `{cod:'TEL'\|'AVI'\|'SRV'\|'GEN', nom, desc}` — el `grupo` del proveedor es este código | plantilla proveedores (Excel) |
| `condicionesPago` | `{nom:'Crédito 30 días', dias}` | plantilla proveedores |
| `organizacionesCompra` | `{cod:'SB'\|'CN', centro, nom}` | estructura organizativa |
| `gruposCompra` | `{cod:'MP1'\|'SRV'\|'IMP'\|'EE1'\|'MSC'\|'SG1', nom}` — cada artículo de compra lleva `grupoCompra` | estructura organizativa |
| `gruposMovimiento` | `{cod:'ING'\|'SAL'\|'TRF', nom, desc}` — sin Ajustes (J1) | Word actualizado |
| `tiposMovimiento` | `{cod:'ING-COMPRA', grupo:'ING', nom, desc}` — 21 tipos (K6) | Word actualizado |

Todo lo inventado lleva `aConfirmar: true` (p. ej. RUC/DNI de proveedores de servicios, costos estándar, precios de referencia).

### 3.2 Artículo

```
{ cod, nom, desc, grupo:'MP'|'SRV'|'PPT'|'PT'|'MERC', cat, subcat, u (UM inventario), ctrl:'Nada'|'Lote'|'Serie', cv,
  inv (maneja stock), compra, venta, produccion, igv:'Gravado'|'Exonerado'|'Inafecto', estado:'Activo'|'Inactivo',
  alm? (almacén por defecto: donde entra lo producido), costo (costo inicial de referencia), precioCompra?, uCompra?, provDef?,
  attrs? {Color, Talla, Acabado, Material, Género},
  precioVenta?, precioMin?, uVenta? [..], dctoMin?, dctoMax?, stockCtrl? 'Bloquear'|'Avisar'|'No verificar',   ← pestaña Venta
  origen:'plantilla'|'complemento'|..., aConfirmar? }
```

**Familia ZULEIKA** (2 colores × 2 tallas):

| Etapa | Códigos | Almacén por defecto | Lista |
|---|---|---|---|
| Piezas cortadas | PPT-0001 azul 28 · 0002 azul 30 · 0003 negro 28 · 0004 negro 30 | SB-ZARATE-PP | LDM-0013..0016: tela MP-0070 (azul) / MP-0071 (negro) 1,40 / 1,46 MT (Manual, SB-ZARATE-MP) + patronista, operario y máquina de corte |
| Crudo | PPT-0005..0008 | SB-ZARATE-PP | LDM-0009..0012: piezas (Manual, SB-ZARATE-PP) + 2 hilos 0,05, cierre YKK, tallita (Notificación, SB-ZARATE-MP) + costurera y máquina |
| Lavado (tercerizado) | PPT-0009..0012 | SB-ZARATE-PP | LDM-0005..0008: crudo (Manual, **SB-TRANSITO**) + servicio **SRV-0001** Lavandería Landeo (Notificación) |
| Producto final | PT-0001 azul 28 · 0002 azul 30 · 0003 negro 28 · 0004 negro 30 | SB-CENTRAL | LDM-0001..0004: lavado (Manual, SB-ZARATE-PP) + botón, 6 remaches, parche, etiqueta, hang tag, bolsa (Notificación) + operario de acabado. LDM-0017: alternativa PT-0001 sin parche |

### 3.3 Stock y movimientos

- `stock`: `{alm, art, act, comp, ped, costo}` — Actual, Comprometido y Pedido (T1). Disponible = `act − comp` (el Pedido es informativo). Costo promedio ponderado por almacén. `Stock.pedido(alm, art, cant, signo)`, `Stock.ped(alm, art)`.
- `movs`: `{id:'ING-000001'|'SAL-…'|'TRF-…', tipo:'Ingreso'|'Salida'|'Transferencia', det, concepto, fecha, usuario, modulo, est, alm, destino?, od, ndoc, doc, obs, valor, lineas:[{art, cant, costo, valor, alm, signo:+1|-1, saldo}]}`.
- Cada movimiento lleva `tipoMov` (código de `tiposMovimiento`), `grupoMov` y `tipoMovNom`. Se pasa en `o.tipoMov`; si falta se usa ING-INICIAL / SAL-USOPROD / TRF-INTERNO. **No existe el grupo Ajuste (J1)**: regularizar es ING-REGULARIZ o SAL-REGULARIZ con motivo y observación; producto fallado es SAL-FALLADO + ING-FALLADO (J2).
- Tipos por paso: compra recibida **ING-COMPRA** (extranjero **ING-IMPORT**) · recepción no conforme **ING-OBSERV** · emisión a producción **SAL-USOPROD** · consumo de material en poder del proveedor **SAL-MAQUILA** · recibo de producción **ING-PROD** · envío al servicio tercerizado **TRF-FABRIC** · abastecimiento o traslado entre sedes **TRF-INTERNO** · reposición a tienda **TRF-REPTIENDA** · entre tiendas **TRF-ENTRETIENDA** · a liquidación **TRF-LIQUID** · venta **SAL-VENTA** · devolución de cliente **ING-DEVCLI** · devolución a proveedor **SAL-DEVPROV** · reposición del proveedor **ING-CAMBIO** · cancelación de servicio **ING-CANCEL** · carga inicial **ING-INICIAL**.
- **Solo `Stock` modifica** `stock` y `movs`: `Stock.ingreso`, `Stock.salida`, `Stock.transferencia` devuelven `{ok, mov}` o `{ok:false, error}`. `Stock.comprometer/liberar/comprometerLineas`, `Stock.kardex(art, alm)`, `Stock.saldoA(art, alm, fecha)`, `Stock.disp/act/comp/costo/totalDisp`. `Stock` **no guarda**: el que llama ejecuta `BD.guardar()`.

### 3.4 Documentos (`Docs`, siempre guardan)

**Solicitud de Fabricación** `sfs`: `{id:'SF-000001', fecha, mes, solic, almDestino, fechaReq, est, vb, ger, obs, lineas:[{art, cant, ldm}], ofs:[], ref, comprometido:[{alm, art, cant}], hist}`
Estados: Borrador → Pendiente Aprobar → Aprobada (V°B° Logística + Gerencia; compromete la materia prima bruta) → Convertida en Orden (Producción crea las órdenes) → Fabricada · Rechazada.
`Docs.sf.crear/guardar/enviar/darVB/aprobar/rechazar/devolver/convertir(id, ofs, ref)/fabricada(id)`.

**Solicitud de Materiales** `sols`: `{id:'SOL-000001', fecha, area, solicita, destino, fechaReq, obs, of, ref, sf, estado, lineas:[{art, cant, prop:''|'Transferencia'|'Compra', origen, doc, estado:'Pendiente'|'En transferencia'|'Transferido'|'En compra'|'Recibido', recibido}], nota, hist}`
Estados: Borrador → Pendiente → Aprobada (Logística define el propósito por línea) → En proceso → Atendida · Rechazada · Anulada.
`Docs.sol.crear(d, enviar)/guardar/enviar/aprobar(id, [{prop, origen}])/rechazar/anular/transferir(id, origen)` (crea una Solicitud de Transferencia aprobada) `/crearOC(id, {prov, precios})`.
Una línea puede ser un **servicio** (SRV-xxxx): solo se compra.

**Orden de Compra** `ocs`: `{id:'OC-000001', est, tipo:'Bienes'|'Servicio', fecha, prov, cond, mon, tc, ref, obs, sol, of, sf, almDestino, valLog, valGer, items:[{art, cant, pu, igv, recq, facq}], recepciones:[{tipo:'Ingreso'|'Conformidad', fecha, mov?, alm?, lineas}], facturas:[ids], hist}`
Estados: Borrador → Pendiente de Validar → Para Recibir y Pagar (V°B° + aprobación) → Para Pagar | Para Recibir → Completada · Cancelada.
`Docs.oc.crear/guardar/enviar/validar/aprobar/cancelar/recibir(id, {alm, lineas})` (bienes: Ingreso) `/conformidad(id, {lineas, conforme})` (servicio: sin stock) `/avance/totales`.
Si la OC tiene `of` y es de servicio: al aprobarse se agrega `{tipo:'OC'}` a `of.compras`; al facturarse `{tipo:'Factura'}` (pestaña Costo de la orden, contraste con el estándar).

**Factura** `facturas`: `{id:'FC-000001', oc, prov, ndoc, fecha, cond, mon, tc, est:'Impagado'|'Pagado', items:[{art, cant, pu, igv}], obs, hist}` · `Docs.fac.crear({oc, ndoc, lineas?})/pagar(id)`.

**Solicitud de Transferencia** `trfs` (T2/T7, K7): `{id:'ST-000001', fecha, origen, destino, tipoMov, estado:'Borrador'|'Aprobada'|'Parcial'|'Recibida'|'Cancelada', obs, sol, of, movs:[], lineas:[{art, cant, recibido}], hist}`
Paso 1 `Docs.trf.aprobar(id)`: exige disponible en origen, **compromete en origen y suma Pedido en destino**. Paso 2 `Docs.trf.recibir(id, lineas?)`: confirma la recepción (parcial o total) con un movimiento TRF que libera comprometido y Pedido. `Docs.trf.cancelar(id)` libera lo pendiente. `Docs.trf.directa(d)` crea, aprueba y recibe en seguida (solo envío al almacén de tránsito virtual y traslados automáticos). `Docs.sol.transferir` crea una ST aprobada: la línea queda «En transferencia» y pasa a «Transferido» al recibirse. `Docs.oc` suma Pedido al aprobar una OC de bienes y lo descuenta al recibir.

**Guía de remisión** `gres`: `{id:'T001-000001', fecha, motivo, origen, destino, prov, transportista, mov, of, estado, lineas, hist}` · `Docs.gre.crear(d)`.

**Orden de fabricación** `ofs`: modelo de Producción (sin cambios de forma): `{id:'OF-000001', art, ldm, cant, prod, alm, ref, origen, sf, estado, tipofab, mats, recs, emisiones, recibos, compras, envios, tercero, adj, hist, costo, absorbido, …}`. Solo Producción la modifica; los demás la leen (y `Docs.oc` agrega `compras`).

Correlativos compartidos (`BD.sig`): `sf, sol, oc, fac, gre, ing, sal, trf, of, ref` y los que agregue cada área con su propio nombre de serie.

## 4. Quién hace qué en el flujo «Producción masiva con stock suficiente»

| # | Paso | Módulo · pantalla | Documento / servicio |
|---|---|---|---|
| 0 | (Solo maestros) Comprar la materia prima: OC de bienes → aprobar (Pedido) → recibir en SB-CENTRAL-MP → Solicitud de Transferencia a SB-ZARATE-MP (aprobar y confirmar recepción) → factura | Compras CO-07 · Inventarios GI-09 / GI-11 · Compras CO-10 | `Docs.oc.*`, `Docs.trf.*`, `Docs.fac.crear` |
| 1 | Crear la Solicitud de Fabricación (PT-0001..0004 × cantidades) y enviarla | Comercial CL-30 o Inventarios GI-22 | `Docs.sf.crear/enviar` |
| 2 | V°B° Logística y aprobación Gerencia → compromete materia prima | Inventarios GI-23 | `Docs.sf.darVB/aprobar` |
| 3 | Crear las órdenes por fase (piezas → crudo → lavado → final), Liberadas, un N° Referencia | Producción PR-03 | `Prod.generarDesdeSF` + `Docs.sf.convertir` |
| 4 | Piezas cortadas y crudo: emisión (Manual + operarios) y recibo (consume Notificación, ingresa a SB-ZARATE-PP) | Producción PR-02 | `Stock.salida/ingreso` |
| 5 | Lavado: Producción pide el servicio → Solicitud de Materiales con la línea SRV-0001 × cantidad, destino SB-TRANSITO | Producción PR-02 / PR-05 | `Docs.sol.crear(…, true)` |
| 6 | Logística aprueba la línea como Compra y crea la OC de servicio (Lavandería Landeo, PROV-0005) | Inventarios GI-13 | `Docs.sol.aprobar`, `Docs.sol.crearOC` |
| 7 | Compras envía, valida y aprueba la OC de servicio → aparece en la pestaña Costo de la orden | Compras CO-07 | `Docs.oc.enviar/validar/aprobar` |
| 8 | Envío al proveedor: transferencia TRF-FABRIC SB-ZARATE-PP → SB-TRANSITO (en el mismo momento, tránsito virtual) con GRE «Traslado de bienes para transformación» | Producción PR-02 (se ve en Inventarios GI-07 / GI-11 / GI-14) | `Docs.trf.directa`, `Docs.gre.crear` |
| 9 | Retorno: emisión del crudo en tránsito y recibo del lavado (consume el servicio) → SB-ZARATE-PP | Producción PR-02 | `Stock.salida/ingreso` |
| 10 | Conformidad del servicio y factura del proveedor → contraste en Costo de la orden | Compras CO-07 / CO-10 | `Docs.oc.conformidad`, `Docs.fac.crear` |
| 11 | Producto final: emisión del lavado y recibo (acabados) → SB-CENTRAL; cerrar órdenes; la SF queda Fabricada | Producción PR-02 / PR-09 | `Prod.cerrar`, `Docs.sf.fabricada` |
| 12 | Ver existencias, kardex, movimientos y guías con todo lo anterior; reponer PT a tienda en dos pasos (TRF-REPTIENDA) y vender | Inventarios GI-05/06/07/14 · GI-11 · Comercial | `Docs.trf.*`, `Stock.*` |

## 5. Alcance por módulo

**Conectadas a la base** (deben leer y escribir `BD`):
- Inventarios: GI-00, GI-01/02 artículos, GI-03/04 almacenes, GI-05 existencias, GI-06 kardex, GI-07/08 movimientos, GI-09 ingreso, GI-10 salida, GI-11 transferencia, GI-13 solicitudes de materiales, GI-14/15/16 GRE, GI-17 listas de materiales, GI-20 saldos, GI-21/22/23 solicitudes de fabricación, maestros de configuración (grupos, categorías, UM, conversiones, atributos, sedes).
- Compras: CO-00, CO-01/02 proveedores, CO-06/07 órdenes de compra (bienes y servicio, recepción/conformidad), CO-09/10 facturas.
- Producción: todas (PR-01 … PR-12).
- Comercial: todas; el stock y los artículos de venta salen de la base.

**Fuera de este alcance** (siguen con sus datos de ejemplo, marcadas «Datos de ejemplo · no conectado a la base»): GI-18 rotación, GI-19 series, CO-11 reclamos, CO-12 notas de crédito, CO-14 costos de destino, CO-15 sugerido.

## 6. Reglas

1. Ningún módulo guarda copias propias de maestros, stock o documentos compartidos. Los arrays globales antiguos (p. ej. `ARTICULOS`, `STOCK`, `OCS`, `M.ARTICULOS`) se **derivan de `BD`** o se reemplazan.
2. `COMPARTIDO/bd/*` es el contrato: si falta algo, se implementa en el módulo y se propone para el núcleo; no se cambia el núcleo sin coordinar.
3. Los scripts `core`/`datos` no tocan el DOM al cargarse (el generador de escenarios los ejecuta en node).
4. Lo que en una pantalla es solo simulación de otro módulo se marca «⚙ Simular …» y no se desarrolla ahí.
5. Textos en español con tildes. Fechas `dd/mm/aaaa hh:mm`.
