/* Genera COMPARTIDO/bd/datos/escenario-operacion.js (escenario «Con operación»).
   1) parte del escenario «Solo maestros»; 2) ejecuta la historia de Producción (compras de materia prima, abastecimiento a planta,
   solicitudes de fabricación, órdenes, lavado tercerizado con OC de servicio, guías); 3) ejecuta la historia de Comercial
   (reposición a tiendas, cotizaciones, ventas, devoluciones, cajas); 4) valida y guarda la base resultante.
   Uso (desde PROTOTIPOS):  node COMPARTIDO/herramientas/generar-escenario.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.resolve(__dirname, '..', '..');
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');

const almacen = {};
const localStorage = {
  getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); }, removeItem: k => { delete almacen[k]; },
  key: i => Object.keys(almacen)[i], get length() { return Object.keys(almacen).length; }, clear: () => Object.keys(almacen).forEach(k => delete almacen[k])
};
const NUCLEO = ['COMPARTIDO/bd/datos/maestros-plantillas.js', 'COMPARTIDO/bd/datos/maestros-complementos.js', 'COMPARTIDO/bd/datos/maestros-logistica.js',
  'COMPARTIDO/bd/datos/maestros-comercial.js', 'COMPARTIDO/bd/bd.js', 'COMPARTIDO/bd/stock.js', 'COMPARTIDO/bd/explosion.js', 'COMPARTIDO/bd/documentos.js', 'COMPARTIDO/bd/compras.js'];

function contexto(archivos) {
  const nodo = () => ({ style: {}, classList: { add() { }, remove() { }, toggle() { }, contains: () => false }, appendChild() { }, addEventListener() { }, setAttribute() { }, querySelector: () => null, querySelectorAll: () => [], innerHTML: '', value: '' });
  const ctx = vm.createContext({
    console, localStorage, setTimeout, clearTimeout, Math, Date, JSON,
    window: { addEventListener() { }, location: { hash: '', search: '', href: '' }, scrollTo() { } },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: nodo, addEventListener() { }, body: nodo() },
    location: { hash: '', search: '', href: '' }, history: { replaceState() { } }, navigator: { userAgent: 'node' }
  });
  ctx.window.localStorage = localStorage;
  archivos.forEach(f => vm.runInContext(leer(f), ctx, { filename: f }));
  return ctx;
}
const ev = (ctx, codigo) => vm.runInContext(codigo, ctx);

/* 1 y 2: Producción */
const prod = contexto(NUCLEO.concat(['PRODUCCION/js/core/ui.js', 'PRODUCCION/js/data/maestros.js', 'PRODUCCION/js/core/produccion.js', 'PRODUCCION/js/data/demo.js']));
ev(prod, "BD.reiniciar('maestros'); BD.usuario = 'USER05 · Producción'; Demo.historia(); BD.reloj = null; if (typeof UI !== 'undefined') UI.reloj = null; BD.guardar();");
console.log('Producción:', ev(prod, "JSON.stringify({sfs: BD.d.sfs.map(s => s.id + ' ' + s.est), ofs: BD.d.ofs.length, ocs: BD.d.ocs.map(o => o.id + ' ' + o.est), movs: BD.d.movs.length})"));

/* 3: Comercial sobre la misma base guardada */
const com = contexto(NUCLEO.concat(['COMERCIAL/js/core/ui.js', 'COMERCIAL/js/data/maestros.js', 'COMERCIAL/js/core/store.js', 'COMERCIAL/js/core/precios.js', 'COMERCIAL/js/core/ventas.js', 'COMERCIAL/js/core/caja.js', 'COMERCIAL/js/core/config.js', 'COMERCIAL/js/data/demo.js']));
ev(com, "BD.iniciar('Comercial'); if (typeof Store !== 'undefined' && Store.completarBase) Store.completarBase(); Demo.historia(); BD.reloj = null; if (typeof UI !== 'undefined') UI.reloj = null; BD.guardar();");
console.log('Comercial:', ev(com, "JSON.stringify({ventas: (BD.d.ventas || []).length, cots: (BD.d.cots || []).length, trfs: BD.d.trfs.map(t => t.id + ' ' + t.estado), movs: BD.d.movs.length})"));

/* 3b: Logística deja todo listo para probar «Producción masiva con stock suficiente»:
   compra de TODA la materia prima para 400 pantalones más (100 por variante) + 10 %, recibida en Central MP, facturada y
   abastecida a Zárate en dos pasos; y una Solicitud de Fabricación de Comercial pendiente de aprobar por esas 400 unidades. */
const log = contexto(NUCLEO);
ev(log, `
BD.iniciar('USER00 · Logística');
const lineas = ['PT-0001', 'PT-0002', 'PT-0003', 'PT-0004'].map(art => ({ art, cant: 100 }));
const req = Explosion.bruto(lineas);
const porProv = {};
req.forEach(r => { const a = BD.art(r.art); const p = a.provDef || 'PROV-0002'; (porProv[p] = porProv[p] || []).push({ art: r.art, cant: Math.ceil(r.cant * 1.1), pu: a.precioCompra || a.costo || 1 }); });
BD.reloj = '01/08/2026 09:00';
const ocs = Object.keys(porProv).map(prov => {
  const o = Docs.oc.crear({ prov, almDestino: 'SB-CENTRAL-MP', obs: 'Materia prima para la campaña de setiembre (400 pantalones Zuleika)', items: porProv[prov] });
  Docs.oc.enviar(o.id); Docs.oc.validar(o.id); Docs.oc.aprobar(o.id); return o;
});
BD.reloj = '03/08/2026 10:00';
ocs.forEach((o, i) => { Docs.oc.recibir(o.id, {}); Docs.fac.crear({ oc: o.id, ndoc: (o.prov === 'PROV-0001' ? 'F001-' : 'F002-') + String(1200 + i) }); });
BD.reloj = '03/08/2026 15:00';
const st = Docs.trf.crear({ origen: 'SB-CENTRAL-MP', destino: 'SB-ZARATE-MP', tipoMov: 'TRF-INTERNO', obs: 'Abastecimiento a planta para la campaña de setiembre',
  lineas: req.map(r => ({ art: r.art, cant: Stock.act('SB-CENTRAL-MP', r.art) })) });
Docs.trf.aprobar(st.id);
Docs.gre.crear({ motivo: 'Traslado entre establecimientos de la misma empresa', origen: 'SB-CENTRAL-MP', destino: 'SB-ZARATE-MP', lineas: st.lineas, obs: st.id });
BD.reloj = '04/08/2026 08:30';
Docs.trf.recibir(st.id);
BD.reloj = '04/08/2026 11:00';
BD.usuario = 'Comercial 01';
const sf = Docs.sf.crear({ solic: 'Comercial 01', mes: 'Set 2026', almDestino: 'SB-CENTRAL', fechaReq: '30/08/2026', obs: 'Campaña de setiembre: 100 por talla y color', lineas });
Docs.sf.enviar(sf.id);
BD.reloj = null; BD.guardar();
`);
console.log('Logística:', ev(log, "JSON.stringify({sf: BD.d.sfs[0].id + ' ' + BD.d.sfs[0].est, tela: Stock.disp('SB-ZARATE-MP','MP-0070'), faltan: Explosion.bruto(['PT-0001','PT-0002','PT-0003','PT-0004'].map(art => ({art, cant:100}))).filter(r => Stock.disp(r.alm, r.art) < r.cant).map(r => r.art)})"));

/* 3c: postventa de Compras (C-3): reclamos con reposición y devolución, el faltante de la lavandería con su nota de crédito
   y un flete como costo de destino. Todo con los documentos reales de la base. */
const cmp = contexto(NUCLEO);
ev(cmp, `
BD.iniciar('USER03 · Compras');
const avios = BD.d.ocs.find(o => o.items.some(i => i.art === 'MP-0102') && o.items.some(i => i.art === 'MP-0003') && o.recepciones.length);
const factAvios = BD.d.facturas.find(f => f.oc === avios.id);
/* reclamo 1: 5 botones oxidados → reposición */
BD.reloj = '05/08/2026 09:00';
const r1 = Docs.rec.crear({ oc: avios.id, obs: 'Al abrir la caja de botones', lineas: [{ art: 'MP-0102', cant: 5, motivo: 'Producto oxidado o deteriorado' }] });
BD.reloj = '05/08/2026 11:00'; Docs.rec.resolver(r1.id, 0, { resol: 'Reposición' });
BD.reloj = '08/08/2026 10:00'; Docs.rec.reponer(r1.id, 0, {});
/* reclamo 2: 10 cierres con defecto → devolución y nota de crédito 07 */
BD.reloj = '05/08/2026 09:30';
const r2 = Docs.rec.crear({ oc: avios.id, obs: 'Cierres que no corren', lineas: [{ art: 'MP-0003', cant: 10, motivo: 'Producto con defecto de fábrica' }] });
BD.reloj = '05/08/2026 11:30'; Docs.rec.resolver(r2.id, 0, { resol: 'Devolución' });
BD.reloj = '07/08/2026 16:00';
Docs.nc.crear({ fac: factAvios.id, ndoc: 'NC01-000045', motivo: '07', rec: r2.id, recLinea: 0, obs: 'Devolución de cierres ' + r2.id,
  lineas: [{ art: 'MP-0003', cant: 10, pu: factAvios.items.find(i => i.art === 'MP-0003').pu }] });
/* reclamo 3: faltante de la lavandería (orden de lavado negro talla 28) → factura del servicio y nota de crédito 09 */
const of = BD.d.ofs.find(o => o.faltante && o.faltante.estado === 'Abierto');
if (of) {
  const ocSrv = BD.d.ocs.find(o => o.of === of.id && o.est !== 'Cancelada');
  BD.reloj = '25/07/2026 10:00';
  if (ocSrv.est === 'Para Recibir y Pagar' || ocSrv.est === 'Para Recibir') Docs.oc.conformidad(ocSrv.id, { lineas: [{ art: ocSrv.items[0].art, cant: of.prod }], obs: 'Retornaron ' + of.prod + ' de ' + of.cant });
  BD.reloj = '26/07/2026 10:00';
  const fs = Docs.fac.crear({ oc: ocSrv.id, ndoc: 'F002-000380' });
  BD.reloj = '27/07/2026 09:00';
  const r3 = Docs.rec.crear({ of: of.id, obs: 'Prendas que no retornaron de la lavandería', lineas: [{ art: ocSrv.items[0].art, cant: of.faltante.cant, motivo: 'Prendas que no retornaron del servicio' }] });
  Docs.rec.resolver(r3.id, 0, { resol: 'Nota de crédito' });
  BD.reloj = '29/07/2026 15:00';
  Docs.nc.crear({ fac: fs.id, ndoc: 'NC02-000012', motivo: '09', rec: r3.id, recLinea: 0, obs: 'Faltante de ' + of.id,
    lineas: [{ art: ocSrv.items[0].art, cant: of.faltante.cant, pu: fs.items[0].pu }] });
}
/* flete de la tela comprada para setiembre como costo de destino */
const ocTela = BD.d.ocs.filter(o => o.items.some(i => i.art === 'MP-0070') && o.recepciones.length).slice(-1)[0];
BD.reloj = '06/08/2026 10:00';
const c = Docs.ccd.crear({ ocs: [ocTela.id], base: 'Valor', obs: 'Transporte de la tela a Central MP', costos: [{ tipo: '05', prov: 'PROV-0001', ndoc: 'F001-000950', mon: 'S/.', monto: 250 }] });
Docs.ccd.registrar(c.id);
BD.reloj = null; BD.guardar();
`);
console.log('Compras:', ev(cmp, "JSON.stringify({recs: BD.d.recs.map(r => r.id + ' ' + r.estado), ncs: BD.d.ncs.map(n => n.id + ' ' + n.motivo + ' ' + n.total), ccds: BD.d.ccds.map(c => c.id + ' ' + c.estado + ' ' + c.movs.join(',')), faltante: (BD.d.ofs.find(o => o.faltante) || {}).faltante})"));

/* 4: validación y guardado */
const d = JSON.parse(almacen['imperiotex.bd']);
const errores = [];
d.stock.forEach(s => { ['act', 'comp', 'ped'].forEach(k => { if ((s[k] || 0) < -0.0001) errores.push('Negativo ' + k + ' ' + s.alm + ' ' + s.art + ' = ' + s[k]); }); });
if (d.version !== ev(com, 'BD.VERSION')) errores.push('Versión distinta');
if (errores.length) { console.error(errores.join('\n')); process.exit(1); }
d.escenario = 'operacion';
const salida = path.join(RAIZ, 'COMPARTIDO/bd/datos/escenario-operacion.js');
fs.writeFileSync(salida, '/* COMPARTIDO · escenario «Con operación»: estado completo de la base con compras, solicitudes, órdenes de fabricación, movimientos, saldos y ventas.\n' +
  '   ARCHIVO GENERADO por COMPARTIDO/herramientas/generar-escenario.js (no editar a mano). Generado el ' + new Date().toISOString().slice(0, 10) + '. */\n' +
  'const BD_ESCENARIO_OPERACION = ' + JSON.stringify(d) + ';\n', 'utf8');
const r = { sfs: d.sfs.length, sols: d.sols.length, ocs: d.ocs.length, facturas: d.facturas.length, trfs: d.trfs.length, gres: d.gres.length, ofs: d.ofs.length, movs: d.movs.length, stock: d.stock.length, ventas: (d.ventas || []).length, KB: Math.round(fs.statSync(salida).size / 1024) };
console.log('Escenario generado:', JSON.stringify(r));
