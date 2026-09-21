/* Pruebas de modelos y atributos (decisiones U1–U7) sin navegador: las mismas reglas que usan GI-02 y GI-26 (BD.erroresArticuloModelo).
   Uso (desde PROTOTIPOS):  node INVENTARIOS/pruebas/probar-modelos.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.resolve(__dirname, '..', '..');
const almacen = {};
const localStorage = {
  getItem: k => (k in almacen ? almacen[k] : null), setItem: (k, v) => { almacen[k] = String(v); }, removeItem: k => { delete almacen[k]; },
  key: i => Object.keys(almacen)[i], get length() { return Object.keys(almacen).length; }
};
const ARCHIVOS = ['COMPARTIDO/bd/datos/maestros-plantillas.js', 'COMPARTIDO/bd/datos/maestros-complementos.js', 'COMPARTIDO/bd/datos/maestros-logistica.js',
  'COMPARTIDO/bd/datos/maestros-comercial.js', 'COMPARTIDO/bd/datos/escenario-operacion.js', 'COMPARTIDO/bd/bd.js'];
const ctx = vm.createContext({ console, localStorage, Math, Date, JSON, window: { localStorage } });
ARCHIVOS.forEach(f => vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f }));
const ev = codigo => vm.runInContext(codigo, ctx);

let ok = 0, mal = 0;
const prueba = (nombre, fn) => {
  try { fn(); ok++; console.log('  ✓ ' + nombre); }
  catch (e) { mal++; console.log('  ✕ ' + nombre + '\n      ' + e.message); }
};
const igual = (a, b, que) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((que || 'valor') + ': se esperaba ' + JSON.stringify(b) + ' y salió ' + JSON.stringify(a)); };
const errores = (cod, attrs, mod) => ev('BD.erroresArticuloModelo(' + JSON.stringify(cod) + ',' + JSON.stringify(attrs) + ',' + JSON.stringify(mod) + ')');
const conError = (lista, parte) => { if (!lista.some(e => e.indexOf(parte) >= 0)) throw new Error('se esperaba un error con «' + parte + '» y salió ' + JSON.stringify(lista)); };
const ZUL = { Color: 'AZUL', Talla: '28', Material: 'DENIM CONFORT', Género: 'DAMA' };

console.log('\nDatos compartidos');
prueba('«Solo maestros»: todos los artículos y modelos cumplen las reglas', () => { ev("BD.reiniciar('maestros')"); igual(ev('BD.revisarModelos()'), [], 'errores'); });
prueba('«Con operación»: todos los artículos y modelos cumplen las reglas', () => { ev("BD.reiniciar('operacion')"); igual(ev('BD.d.escenario'), 'operacion', 'escenario'); igual(ev('BD.revisarModelos()'), [], 'errores'); });
prueba('por ahora solo el terminado ZULEIKA tiene modelo (U7): piezas cortadas, crudo, lavado y fallados quedan sueltos', () => {
  igual(ev("BD.d.maestros.modelos.map(m => m.cod + ':' + BD.artsDeModelo(m.cod).length)"), ['MOD-0001:4']);
  igual(ev("BD.d.maestros.articulos.filter(a => a.grupo === 'PPT' && a.modelo).length"), 0, 'productos en proceso con modelo');
});
prueba('los atributos son solo Color, Talla, Material y Género (U7: sin Acabado, Composición ni Estado)', () => {
  igual(ev("BD.d.maestros.atributos.map(a => a.nom)"), ['Color', 'Talla', 'Material', 'Género']);
  igual(ev("BD.d.maestros.articulos.filter(a => a.attrs && ['Acabado', 'Composición', 'Estado'].some(k => k in a.attrs)).length"), 0, 'artículos');
});
prueba('una base antigua sin modelos se completa al migrar', () => igual(ev("(() => { const d = { maestros: {} }; BD.migrar(d); return d.maestros.modelos; })()"), []));

console.log('\nEl valor pertenece a su atributo (siempre, con o sin modelo)');
prueba('un color bajo «Talla» se rechaza', () => conError(errores('X', { Talla: 'AZUL' }, ''), 'no pertenece al atributo «Talla»'));
prueba('un atributo que no existe se rechaza', () => conError(errores('X', { Memoria: '128GB' }, ''), 'no existe en el maestro'));
prueba('sin modelo los atributos son libres y opcionales', () => igual(errores('X', { Color: 'AZUL' }, ''), []));

console.log('\nCon modelo (opción A: la plantilla lleva todos los atributos)');
prueba('falta un atributo de la plantilla', () => { const a = Object.assign({}, ZUL, { Color: 'BLANCO' }); delete a.Género; conError(errores('NUEVO', a, 'MOD-0001'), 'Falta el valor de Género'); });
prueba('un atributo fuera de la plantilla se rechaza', () => { ev("BD.d.maestros.atributos.push({ nom: 'Tiro', vals: ['ALTO'] })"); conError(errores('NUEVO', Object.assign({}, ZUL, { Color: 'BLANCO', Tiro: 'ALTO' }), 'MOD-0001'), 'no usa Tiro'); ev('BD.d.maestros.atributos.pop()'); });
prueba('la combinación repetida se rechaza (AZUL 28 ya es PT-0001)', () => conError(errores('NUEVO', ZUL, 'MOD-0001'), 'PT-0001'));
prueba('el mismo artículo puede guardarse con su propia combinación', () => igual(errores('PT-0001', ZUL, 'MOD-0001'), []));
prueba('una combinación nueva se acepta (BLANCO 32)', () => igual(errores('NUEVO', Object.assign({}, ZUL, { Color: 'BLANCO', Talla: '32' }), 'MOD-0001'), []));
prueba('un modelo que no existe se rechaza', () => conError(errores('NUEVO', ZUL, 'MOD-9999'), 'no existe'));
prueba('el preseleccionado debe ser del modelo', () => {
  ev("BD.modelo('MOD-0001').pred = 'PPT-0001'");
  conError(ev('BD.revisarModelos()'), 'MOD-0001: el artículo preseleccionado PPT-0001 no es del modelo');
  ev("BD.modelo('MOD-0001').pred = 'PT-0001'");
});

console.log('\nOrden de presentación');
prueba('los atributos se muestran en el orden de la plantilla', () => {
  igual(ev("BD.attrsOrdenados(BD.art('PT-0001')).map(x => x[0])"), ['Color', 'Talla', 'Material', 'Género']);
});
prueba('sin modelo se respeta el orden guardado del artículo', () => igual(ev("BD.attrsOrdenados({ attrs: { Talla: '28', Color: 'AZUL' } }).map(x => x[0])"), ['Talla', 'Color']));
prueba('la clave de combinación sigue el orden de la plantilla', () => igual(ev("BD.combinacion(BD.art('PT-0004').attrs, BD.modelo('MOD-0001'))"), 'Color:NEGRO|Talla:30|Material:DENIM CONFORT|Género:DAMA'));

console.log('\nEl modelo no toca el flujo');
prueba('el nombre del artículo no cambia por tener modelo', () => igual(ev("BD.art('PT-0001').nom"), 'PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL'));
prueba('stock, listas de materiales y documentos siguen por artículo (ninguno apunta a un modelo)', () => {
  igual(ev("['stock','movs','sfs','sols','ocs','ofs','trfs'].filter(k => JSON.stringify(BD.d[k] || []).indexOf('MOD-0') >= 0)"), []);
  igual(ev("BD.d.maestros.ldms.some(l => /^MOD-/.test(l.art))"), false, 'listas de materiales con modelo');
});

console.log('\n' + ok + ' correctas, ' + mal + ' con error');
process.exit(mal ? 1 : 0);
