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
| GI-00 Panel | `BD.d.stock`, `movs`, `sfs`, `sols`, `ocs`, `trfs`, `maestros.minimos` | Valor por grupo, alertas por mínimo, pendientes y últimos movimientos. Campana con los mismos avisos. |
| GI-01/02 Artículos | `maestros.articulos` | Maestro completo: grupo, categoría, sub categoría, UM, control, CV, flags inventario/compra/venta/producción, IGV, estado, atributos, almacén por defecto, costo, grupo de compras, proveedor y precio de compra, pestaña Venta (precios, descuentos, UM de venta, control de stock), códigos de barra (`bcs`), mínimos por almacén (`maestros.minimos`), LDM y existencias. Duplicar y desactivar. |
| GI-03/04 Almacenes | `maestros.almacenes` | Empresa, código, categoría, sede, físico/virtual, contenido, estado, Kardex valorizado, tránsito, observaciones, roles (`roles`). Filtra por la empresa activa. No se desactiva con stock. |
| GI-05 Existencias | `stock` | Actual, Comprometido, **Pedido** (`stock.ped`: OC y transferencias aprobadas), Disponible = Actual − Comprometido, costo promedio, valorizado, semáforo por mínimo. CSV. |
| GI-06 Kardex | `Stock.kardex` | Una tabla por artículo × almacén; filtros de artículo, almacén, grupo y tipo de movimiento y fechas; costo promedio recalculado; almacenes sin Kardex valorizado solo cantidades. |
| GI-07/08 Movimientos | `movs` (todos los módulos) | Filtros por almacén, grupo/tipo de movimiento, módulo y fechas. Detalle con líneas (saldo después), documentos relacionados (OC, SOL, ST, GRE, OF), nota interna NI/NS/NT (`notasInternas`, `maestros.seriesInternas`) y «Crear GRE». GI-07 lista también las Solicitudes de Transferencia. |
| GI-09 Ingreso | `Stock.ingreso` · `Docs.oc.recibir` | Manual (tipos ING-*) o vinculado a OC de bienes aprobada (ING-COMPRA / ING-IMPORT automático, cantidad ≤ pendiente, costo = precio OC). ING-REGULARIZ / ING-OBSERV / ING-FALLADO exigen observación. |
| GI-10 Salida | `Stock.salida` | Tipos SAL-*; opción «respetar el comprometido». SAL-REGULARIZ / SAL-FALLADO exigen observación. No existe tipo Ajuste (decisión J1). |
| GI-11 Transferencia | `Docs.trf` (`BD.d.trfs`, ST-000001) | **Dos pasos**: Guardar borrador / **Aprobar** (compromete en origen y suma Pedido en destino) → **Confirmar recepción** total o parcial (genera TRF-… con `Stock.transferencia`) → Recibida; «Cancelar pendientes» libera. Tipo TRF-* sugerido por los almacenes (tienda, liquidación, tránsito). |
| GI-13 Solicitudes de Materiales | `Docs.sol` | Crear/guardar/enviar, aprobar definiendo propósito por línea (SRV solo Compra; Transferencia con origen que tenga disponible), rechazar, anular. «Atender ▾»: transferir por origen (crea ST aprobada) o crear OC con el proveedor y precios elegidos (`Docs.sol.crearOC` → abre CO-07). Estado por línea y documentos generados. |
| GI-14/15/16 GRE | `Docs.gre.crear` (`BD.d.gres`) | Desde un movimiento (precarga partida, llegada, motivo y líneas) o manual. Estado simulado «Aceptada SUNAT». |
| GI-17 Listas de Materiales | `maestros.ldms` | Tipo Artículo (almacén, método Manual/Notificación) / Recurso (de `maestros.recursos`) / Texto; cantidad base, predeterminada única, control de ciclos, fase calculada. |
| GI-20 Saldos por fecha | `Stock.kardex` | Saldo y costo promedio reconstruidos al cierre de la fecha; comprometido solo para hoy. |
| GI-21/22/23 Solicitudes de Fabricación | `Docs.sf` | `lineas[].cant`, `ldm`, `almDestino` código. Requerimientos con `Explosion.bruto` (todas las fases), servicios con `Explosion.servicios`, existencias de los PT, V°B° (`darVB`) y aprobación (`aprobar`, compromete), rechazo, devolución, guardar cambios, SOL del déficit (una por almacén, con `sf`). Vista comercial `?vista=comercial&usuario=…`. |
| Configuraciones | `maestros.grupos` (+ `finanzasGrupo`), `categorias`, `subcategorias`, `unidades`, `conversiones`, `atributos`, `tiposCodigoBarra`, `sedes`, `tiposMovimiento` (solo lectura), `configLogistica`, `seriesInternas`, `seriesGRE` | No se elimina un registro en uso. |
| GI-18 Rotación | — | **Datos de ejemplo · no conectado a la base.** |

## 3. Tipos de movimiento por pantalla

- GI-09: ING-* (desde OC: ING-COMPRA / ING-IMPORT).
- GI-10: SAL-*.
- GI-11: TRF-INTERNO, TRF-REPTIENDA, TRF-ENTRETIENDA, TRF-LIQUID, TRF-FABRIC.
- Automáticos de otros módulos: SAL-USOPROD / ING-PROD (Producción), TRF-FABRIC (envío a servicio), SAL-VENTA / ING-DEVCLI (Comercial).

## 4. Funciones globales expuestas

`abrirSF(id)`, `abrirSOL(id)`, `abrirMov(id)`, `abrirST(id)`, `abrirGRE(id)`, `openArticleForm(cod)`, `abrirAlmacen(cod)`, `loadLDM(id)`, `verKardex(art, alm)`, `nuevoIngreso(ocId?)`, `nuevaSalida()`, `resetTRF()`, `nuevaSOL()`, `nuevaSP()`, `irOC(id)` (usa `abrirOC` de Compras), `docLink(id)`. Compatibilidad: `loadSOL`, `loadSP`, `showDetalle`.

Hash: `#gi23=SF-000001`, `#gi13=SOL-000001`, `#gi08=ING-000001`, `#gi11=ST-000001`, `#gi16=T001-000001`, `#gi02=PT-0001`, `#co07=OC-000001`.

## 5. Datos propios (`COMPARTIDO/bd/datos/maestros-logistica.js`)

`configLogistica`, `conceptosFinanzas` (28), `finanzasGrupo`, `seriesInternas`, `seriesGRE`, `minimos`, `transportistas`, `ubigeos`; colección `notasInternas`.
