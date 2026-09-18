/* Pruebas de las reglas de Comercial sin navegador (mismas reglas que usan las pantallas).
   Uso (desde PROTOTIPOS):  node COMERCIAL/pruebas/probar-comercial.js
   Parte de «Solo maestros» + la historia de la demo comercial, con el reloj fijo para que no dependa de la fecha real. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.resolve(__dirname, '..', '..');
const almacen = {};
const localStorage = {
  getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); }, removeItem: k => { delete almacen[k]; },
  key: i => Object.keys(almacen)[i], get length() { return Object.keys(almacen).length; }
};
const ARCHIVOS = ['COMPARTIDO/bd/datos/maestros-plantillas.js', 'COMPARTIDO/bd/datos/maestros-complementos.js', 'COMPARTIDO/bd/datos/maestros-logistica.js',
  'COMPARTIDO/bd/datos/maestros-comercial.js', 'COMPARTIDO/bd/bd.js', 'COMPARTIDO/bd/stock.js', 'COMPARTIDO/bd/explosion.js', 'COMPARTIDO/bd/documentos.js', 'COMPARTIDO/bd/compras.js',
  'COMERCIAL/js/core/ui.js', 'COMERCIAL/js/data/maestros.js', 'COMERCIAL/js/core/store.js', 'COMERCIAL/js/core/precios.js', 
  'COMERCIAL/js/core/ventas.js', 'COMERCIAL/js/core/caja.js', 'COMERCIAL/js/core/config.js', 'COMERCIAL/js/data/demo.js'];
const nodo = () => ({ style: {}, classList: { add() { }, remove() { }, toggle() { } }, appendChild() { }, addEventListener() { }, innerHTML: '', value: '' });
const ctx = vm.createContext({
  console, localStorage, setTimeout, clearTimeout, Math, Date, JSON,
  window: { addEventListener() { }, location: { hash: '', search: '', href: '' }, localStorage },
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: nodo, addEventListener() { }, body: nodo() },
  location: { hash: '', search: '', href: '' }, history: { replaceState() { } }, navigator: { userAgent: 'node' }
});
ARCHIVOS.forEach(f => vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f }));
const ev = codigo => vm.runInContext(codigo, ctx);

let ok = 0, mal = 0;
ctx.prueba = (nombre, fn) => {
  try { fn(); ok++; console.log('  ✓ ' + nombre); }
  catch (e) { mal++; console.log('  ✕ ' + nombre + '\n      ' + e.message); }
};
ctx.igual = (a, b, que) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((que || 'valor') + ': se esperaba ' + JSON.stringify(b) + ' y salió ' + JSON.stringify(a)); };
ctx.falla = (fn, parte) => { try { fn(); } catch (e) { if (parte && e.message.indexOf(parte) < 0) throw new Error('falló con otro motivo: ' + e.message); return; } throw new Error('debía fallar' + (parte ? ' con «' + parte + '»' : '')); };

ev("BD.reiniciar('maestros'); Store.iniciar(); Demo.historia(); Store.fijarUsuario('USER12', false);");
fs.readdirSync(__dirname).filter(f => /^casos-.*\.js$/.test(f)).sort().forEach(f => {
  console.log('\n' + f);
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx, { filename: f });
});
console.log('\n' + ok + ' correctas, ' + mal + ' con error');
process.exit(mal ? 1 : 0);
