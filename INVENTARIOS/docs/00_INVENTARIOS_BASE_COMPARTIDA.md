# Inventarios · conexión a la base compartida

> Rama `feat/datos-compartidos` · 2026-09-16. Contrato general: `docs/16_BASE_DATOS_COMPARTIDA.md`.
> Inventarios (GI) y Compras (CO) cargan los mismos archivos; todo lo de aquí vale para ambos `index.html`.

## 1. Escenarios de datos

Selector **Datos** de la barra superior (`BDSelector`):

- **Solo maestros**: maestros completos (plantillas + complementos + `COMPARTIDO/bd/datos/maestros-logistica.js`), sin stock, movimientos ni documentos. Para probar el flujo desde cero: primero un ingreso (GI-09) o una OC recibida.
- **Con operación**: maestros más compras, órdenes, movimientos y saldos ya registrados (`escenario-operacion.js`, generado; mientras sea `null` equivale a Solo maestros).
- **↺ Reiniciar** borra todas las claves `imperiotex.` y deja los cuatro módulos en el escenario elegido.

## 2. Pantallas

| Pantalla | Lee / escribe | Notas |
|---|---|---|
| GI-00 Panel | `BD.d.stock`, `movs`, `sfs`, `sols`, `ocs`, `trfs`, `articulos.stockMin` | Valor por grupo, alertas por mínimo (almacén × artículo, L9), pendientes y últimos movimientos. Campana con los mismos avisos. |
| GI-01/02 Artículos | `maestros.articulos` | **Diseño V9 (L1)**: General (grupo no editable al crear, categoría, sub categoría, nombre, descripción, estado, inventariable/vende/compra) · Inventario (UM, control Nada/Lote/Serie con formato, «vence», códigos de barra `bcs`) · Planificación (stock mínimo único `stockMin`, L9) · Venta (precio sugerido, una UM de venta, verificar precio mínimo `verifMin` con la global de Configuración General, precio mínimo, descuento mín./máx.) · Compra (proveedor, UM de compra, grupo de compras del Grupo, último y promedio de las facturas) · Impuestos · Producción («apto», bloqueado si tiene lista de materiales) · Atributos (tabla editable). UM de venta/compra con conversión obligatoria (L5). Duplicar sin códigos de barras. GI-01 sin columna Stock. |
| GI-03/04 Almacenes | `maestros.almacenes` | Empresa, código **manual**, nombre, sede, estado, observaciones, indicadores en tránsito y Kardex valorizado, roles (`roles`, pendiente L4). Sin categoría, físico/virtual ni contenido (L3). Filtra por la empresa activa. No se desactiva con stock. |
| GI-05 Existencias | `stock` | Actual, Comprometido, **Pedido** (`stock.ped`: OC y transferencias aprobadas), Disponible = Actual − Comprometido, costo promedio, valorizado, semáforo por mínimo. CSV. |
| GI-06 Kardex | `Stock.kardex` | Una tabla por artículo × almacén; filtros de artículo, almacén, grupo y tipo de movimiento y fechas; costo promedio recalculado; almacenes sin Kardex valorizado solo cantidades. |
| GI-07/08 Movimientos | `movs` (todos los módulos) | Filtros por almacén, grupo/tipo de movimiento, módulo y fechas. Detalle con líneas (saldo después), documentos relacionados (OC, SOL, ST, GRE, OF), nota interna NI/NS/NT (`notasInternas`, `maestros.seriesInternas`) y «Crear GRE». **Solo movimientos (hechos):** desde 2026-09-18 las Solicitudes de Transferencia ya no se listan aquí (son pedidos, no movimientos) sino en GI-24; su movimiento TRF-… aparece aquí al confirmar la recepción. |
| GI-09 Ingreso | `Stock.ingreso` · `Docs.oc.recibir` | Manual (tipos ING-*) o vinculado a OC de bienes aprobada (ING-COMPRA / ING-IMPORT automático, cantidad ≤ pendiente, costo = precio OC). ING-REGULARIZ / ING-OBSERV / ING-FALLADO exigen observación. |
| GI-10 Salida | `Stock.salida` | Tipos SAL-*; opción «respetar el comprometido». SAL-REGULARIZ / SAL-FALLADO exigen observación. No existe tipo Ajuste (decisión J1). |
| GI-24 Transferencias | `BD.d.trfs` | **Listado propio** de las Solicitudes de Transferencia (menú de Inventarios y de Compras): buscar por N°, almacén o documento, filtro por estado, «+ Nueva transferencia», abre la ficha GI-11. La campana «Transferencias pendientes de recibir» lleva aquí. La tienda ve y recibe las mismas ST en Comercial CL-47 (flujo neutral). |
| GI-11 Transferencia | `Docs.trf` (`BD.d.trfs`, ST-000001) | **Dos pasos**: Guardar borrador / **Aprobar** (compromete en origen y suma Pedido en destino) → **Confirmar recepción** total o parcial (genera TRF-… con `Stock.transferencia`) → Recibida; «Cancelar pendientes» libera. El **tipo TRF-\* lo elige el usuario**; origen y destino no pueden ser el mismo almacén (L3). |
| GI-13 Solicitudes de Materiales | `Docs.sol` | Crear/guardar/enviar, aprobar definiendo propósito por línea (SRV solo Compra; Transferencia con origen que tenga disponible), rechazar, anular. «Atender ▾»: transferir por origen (crea ST aprobada) o crear OC con el proveedor y precios elegidos (`Docs.sol.crearOC` → abre CO-07). Estado por línea y documentos generados. |
| GI-14/15/16 GRE | `Docs.gre.crear` (`BD.d.gres`) | Desde un movimiento (precarga partida, llegada, motivo y líneas) o manual. Estado simulado «Aceptada SUNAT». |
| GI-17 Listas de Materiales | `maestros.ldms` | Tipo Artículo (almacén, método Manual/Notificación) / Recurso (de `maestros.recursos`) / Texto; cantidad base, predeterminada única, control de ciclos, fase calculada. |
| GI-20 Saldos por fecha | `Stock.kardex` | Saldo y costo promedio reconstruidos al cierre de la fecha; comprometido solo para hoy. |
| GI-21/22/23 Solicitudes de Fabricación | `Docs.sf` | `lineas[].cant`, `ldm`, `almDestino` código. Requerimientos con `Explosion.bruto` (todas las fases), servicios con `Explosion.servicios`, existencias de los PT, V°B° (`darVB`) y aprobación (`aprobar`, compromete), rechazo, devolución, guardar cambios, SOL del déficit (una por almacén, con `sf`). Vista comercial `?vista=comercial&usuario=…`. |
| Configuraciones | `maestros.grupos` (+ `finanzasGrupo` y `grupoCompra`, K10), `categorias`, `subcategorias`, `unidades`, `conversiones`, `atributos`, `tiposCodigoBarra`, `sedes`, `tiposMovimiento` (solo lectura), `configLogistica`, `seriesInternas`, `seriesGRE` | No se elimina un registro en uso. |
| GI-18 Rotación | `BD.d.stock` · `BD.d.movs` | Stock con Actual > 0 por almacén y artículo, valor al costo promedio, días desde el último movimiento y semáforo (N8). |

## 3. Reglas de los indicadores del almacén (L3, L4)

Todas las pantallas muestran todos los almacenes de la empresa; el usuario elige. Los indicadores no filtran listas, cambian el comportamiento:

- **En tránsito** (material en traslado o en poder del proveedor del servicio):
  - la Solicitud de Materiales que transfiere a un almacén en tránsito crea la transferencia como **TRF-FABRIC**;
  - la GRE desde/hacia tránsito propone el motivo «Traslado de bienes para transformación»;
  - en Producción, tercerizar exige un almacén en tránsito y el consumo desde él es **SAL-MAQUILA** (si no, SAL-USOPROD);
  - no se toma como almacén de origen de las listas de materiales para proponer dónde entra lo producido;
  - no permite registrar producto fallado desde ahí.
- **Kardex valorizado** desmarcado: Existencias (GI-05), Saldos por fecha (GI-20), Kardex (GI-06) y el Panel muestran solo cantidades (sin costo ni valorizado).
- **Permisos por rol** (L4, **pendiente**: aún no hay roles): con roles asignados, solo esos roles verían el almacén en los listados y podrían, según su rol, editarlo, registrar o ver movimientos; sin el rol, el almacén no aparece. Hoy se guardan y no filtran.

## 4. Tipos de movimiento por pantalla

- GI-09: ING-* (desde OC: ING-COMPRA / ING-IMPORT).
- GI-10: SAL-*.
- GI-11: TRF-INTERNO, TRF-REPTIENDA, TRF-ENTRETIENDA, TRF-LIQUID, TRF-FABRIC.
- Automáticos de otros módulos: SAL-USOPROD / ING-PROD (Producción), TRF-FABRIC (envío a servicio), SAL-VENTA / ING-DEVCLI (Comercial).

## 5. Funciones globales expuestas

`abrirSF(id)`, `abrirSOL(id)`, `abrirMov(id)`, `abrirST(id)`, `abrirGRE(id)`, `openArticleForm(cod)`, `abrirAlmacen(cod)`, `loadLDM(id)`, `verKardex(art, alm)`, `nuevoIngreso(ocId?)`, `nuevaSalida()`, `resetTRF()`, `nuevaSOL()`, `nuevaSP()`, `irOC(id)` (usa `abrirOC` de Compras), `docLink(id)`. Compatibilidad: `loadSOL`, `loadSP`, `showDetalle`.

Hash: `#gi23=SF-000001`, `#gi13=SOL-000001`, `#gi08=ING-000001`, `#gi11=ST-000001`, `#gi16=T001-000001`, `#gi02=PT-0001`, `#co07=OC-000001`.

## 6. Datos propios (`COMPARTIDO/bd/datos/maestros-logistica.js`)

`configLogistica` (sin campos de usuario, L8), `conceptosFinanzas` (28), `finanzasGrupo`, `seriesInternas`, `seriesGRE`, `transportistas`, `ubigeos`; colección `notasInternas`.

## 7. Lotes y empresa (revisión N3 / N7, 2026-09-17)

- **Lotes**: solo los artículos con control «Lote» (hoy las telas MP-0070 y MP-0071). Cada ingreso —manual (GI-09), por recepción de OC o por recibo de producción— crea `L<año>-<artículo>-<correlativo>` con su saldo por almacén. En GI-10 la salida puede elegir el lote; vacío = el más antiguo. El lote se ve en el Kardex (GI-06) y en el detalle del movimiento (GI-08). El costo sigue siendo el promedio del almacén.
- **Empresa**: todo movimiento y todo documento guarda `emp` (la del almacén; si no tiene, la empresa activa de la barra superior).
- **GI-19 Series**: el «próximo correlativo» es el real de la base (`BD.d.seq`) y se muestra cuántos documentos lleva emitidos cada serie; al cambiarlo no se permite un número ya usado.

