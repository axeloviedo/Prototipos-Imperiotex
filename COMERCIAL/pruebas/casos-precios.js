/* Listas de precios y ofertas (12-prototipo-diseno.md §12, LP1–LP5). Corre dentro de probar-comercial.js. */
const R = (art, um, sede, tipo, mon, fecha) => Precios.resolver(art, um, sede, tipo, mon, fecha);
const P = (...a) => { const r = R(...a); return r ? r.precio : null; };
const dia = f => { BD.reloj = f + ' 10:00'; UI.reloj = f + ' 10:00'; };

prueba('lista general en soles y en dólares', () => {
  igual(P('PT-0001', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026'), 119.90, 'general S/');
  igual(R('PT-0001', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026').origen, 'Precios generales S/', 'origen');
  igual(P('PT-0001', 'UND', 'TDA-01', 'MINORISTA', 'USD', '15/08/2026'), 32.00, 'general US$');
});
prueba('segmento de cliente: Mayorista y Exportación', () => {
  igual(P('PT-0001', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '15/08/2026'), 89.00, 'mayorista');
  igual(P('PT-0001', 'UND', 'MAY-01', 'EXPORTACIÓN', 'USD', '15/08/2026'), 24.50, 'exportación');
});
prueba('tienda: la lista de la tienda manda sobre la del segmento; tienda y segmento sobre todo', () => {
  igual(P('PT-0001', 'UND', 'TDA-02', 'MINORISTA', 'PEN', '15/08/2026'), 115.00, 'Damero');
  igual(P('PT-0001', 'UND', 'TDA-02', 'MAYORISTA', 'PEN', '15/08/2026'), 115.00, 'Damero mayorista');
  igual(P('PT-0004', 'UND', 'TDA-01', 'MAYORISTA', 'PEN', '15/08/2026'), 90.00, 'Tienda #1 mayorista');
  igual(P('PT-0004', 'UND', 'TDA-02', 'MAYORISTA', 'PEN', '15/08/2026'), 92.00, 'Damero no tiene PT-0004: mayorista');
});
prueba('unidad: precio propio por docena, o el de la unidad × conversión', () => {
  igual(P('PT-0001', 'DOC', 'MAY-01', 'MAYORISTA', 'PEN', '15/08/2026'), 1020.00, 'docena mayorista');
  igual(P('PT-0001', 'DOC', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026'), 1438.80, 'docena general = 119.90 × 12');
});
prueba('sin precio en la moneda: no se convierte; sin lista: precio sugerido solo en soles', () => {
  igual(R('PT-0004', 'UND', 'TDA-01', 'MINORISTA', 'USD', '15/08/2026'), null, 'PT-0004 en US$');
});
prueba('oferta vigente con % para un segmento', () => {
  const r = R('PT-0003', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/09/2026');
  igual(r.precio, 99.92, 'Primavera −20 %'); igual(r.oferta.cod, 'LP-08', 'oferta'); igual(r.precioLista, 124.90, 'precio de lista');
  igual(P('PT-0003', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '15/09/2026'), 92.00, 'no es para mayoristas');
  igual(P('PT-0003', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '01/10/2026'), 124.90, 'ya venció');
});
prueba('oferta programada por grupo y con precio fijo; el % va sobre la lista de cada cliente', () => {
  igual(P('PT-0002', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '10/12/2026'), 101.92, 'grupo PT −15 %');
  igual(P('PT-0002', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '10/12/2026'), 79.00, 'mayorista −15 % = 75.65, ajustado al mínimo 79');
  igual(P('PT-0001', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '10/12/2026'), 99.90, 'precio fijo de la oferta');
  igual(P('PT-0002', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '30/11/2026'), 119.90, 'todavía no empieza');
});
prueba('lista inactiva no se usa', () => {
  const L = Precios.lista('LP-05'); L.activa = false;
  try { igual(P('PT-0001', 'UND', 'TDA-02', 'MINORISTA', 'PEN', '15/08/2026'), 119.90, 'sin Damero'); } finally { L.activa = true; }
});

prueba('mantenimiento: nueva oferta, agregar artículos y grupo, precio o %', () => {
  const L = Listas.guardar({ nom: 'Prueba Cyber', mon: 'PEN', sede: 'YA', tipo: '', oferta: true, desde: '01/11/2026', hasta: '03/11/2026', activa: true });
  igual(Precios.esOferta(L), true, 'es oferta');
  igual(Listas.agregarArts(L.cod, ['PT-0003', 'PT-0004'], { pct: 30 }), 2, 'agregados');
  igual(P('PT-0004', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '02/11/2026'), 87.43, '124.90 − 30 %');
  const i = L.filas.findIndex(f => f.art === 'PT-0004');
  Listas.fila(L.cod, i, 'um', 'UND'); falla(() => Listas.fila(L.cod, i, 'precio', 80), 'precio mínimo'); Listas.fila(L.cod, i, 'precio', 85);
  igual([L.filas[i].precio, L.filas[i].pct], [85, undefined], 'el precio borra el %');
  igual(P('PT-0004', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '02/11/2026'), 85, 'precio fijo');
  igual(P('PT-0004', 'UND', 'TDA-02', 'MINORISTA', 'PEN', '02/11/2026'), 124.90, 'solo en la sede Galería Ya');
  falla(() => Listas.agregarGrupo(L.cod, 'PT', 0), '% de descuento');
  Listas.agregarGrupo(L.cod, 'PT', 5);
  igual(P('PT-0002', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '02/11/2026'), 113.91, 'grupo −5 %');
  falla(() => Listas.agregarArts(L.cod, ['PT-0003'], { pct: 30 }), 'No hay artículos nuevos');
  Listas.cancelar(L.cod, 'Prueba terminada');
});
prueba('validaciones y permiso', () => {
  falla(() => Listas.guardar({ nom: 'Mayorista', mon: 'PEN' }), 'Ya existe');
  falla(() => Listas.guardar({ nom: 'Oferta sin fecha', mon: 'PEN', oferta: true }), 'fecha de inicio');
  falla(() => Listas.guardar({ nom: 'Fechas al revés', mon: 'PEN', oferta: true, desde: '10/11/2026', hasta: '01/11/2026' }), 'anterior');
  const u = Store.usuario().cod;
  Store.fijarUsuario('USER10', false);
  try { if (!Store.puede('editar_precios')) falla(() => Listas.guardar({ nom: 'Sin permiso', mon: 'PEN' }), 'permiso'); } finally { Store.fijarUsuario(u, false); }
});

prueba('documento: toma la oferta, no suma descuento manual y el precio a mano la quita', () => {
  dia('15/09/2026');
  try {
    const d = Cot.borrador('TDA-01');
    Doc.cambiarCliente(d, 'CLI-000001');
    const l = Doc.agregar(d, 'PT-0003');
    igual([l.precio, l.lista, l.oferta && l.oferta.cod, l.precioLista], [99.92, 'LP-08', 'LP-08', 124.90], 'línea con oferta');
    falla(() => Doc.cambiar(d, 0, 'dcto', 5), 'no se suma');
    Doc.cambiar(d, 0, 'precio', 110);
    igual([l.origen, l.oferta, l.precioRef.precio, l.precioRef.oferta], ['Precio modificado a mano', undefined, 99.92, 'LP-08'], 'a mano, con la referencia');
    Doc.cambiarCliente(d, 'CLI-000003');
    igual(l.precio, 110, 'cambiar cliente no toca lo escrito a mano');
    const l2 = Doc.agregar(d, 'PT-0001');
    igual([l2.precio, l2.lista], [89.00, 'LP-03'], 'mayorista en Tienda #1 para PT-0001');
  } finally { BD.reloj = null; UI.reloj = null; }
});
prueba('la venta queda en la base compartida con la oferta aplicada', () => {
  dia('15/09/2026');
  try {
    const u = Store.usuario().cod;
    Store.fijarUsuario('USER12', false);
    try { Caja.abrir('CJ-TDA01-PEN', 100); } catch (e) { if (e.message.indexOf('ya está abierta') < 0) throw e; }
    if (Stock.disp('SB-TIENDA01', 'PT-0003') < 1) throw new Error('la historia no dejó PT-0003 en Tienda #1');
    const v = Demo.venta({ sede: 'TDA-01', cli: 'CLI-000001', comp: 'BV', lineas: [['PT-0003', 1]], pagos: [{ met: 'EFE', monto: 'resto' }] });
    const g = BD.d.ventas.find(x => x.id === v.id);
    igual([g.lineas[0].precio, g.lineas[0].lista, g.lineas[0].oferta.nom, g.total], [99.92, 'LP-08', 'Primavera', 99.92], 'venta guardada');
    Store.fijarUsuario(u, false);
  } finally { BD.reloj = null; UI.reloj = null; }
});

prueba('una base guardada con las listas de otra versión (sin filas) se repara al abrir', () => {
  const antes = BD.copia(BD.d.listasPrecio);
  BD.d.listasPrecio = [{ cod: 'LP-01', nom: 'Lista Minorista', base: '', factor: 1, redondeo: 'NINGUNO', activa: true }];
  BD.d.precios = [{ lista: 'LP-01', art: 'PT-0001', p: { PEN: 119.9 } }];
  try {
    Store.completarBase();
    igual([BD.d.listasPrecio.every(l => Array.isArray(l.filas)), BD.d.precios], [true, undefined], 'reparada');
    igual(P('PT-0001', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '15/08/2026'), 89.00, 'precio con las listas iniciales');
  } finally { BD.d.listasPrecio = antes; }
});

prueba('la lista es por sede: el documento lleva su tienda a la sede; no se acepta una tienda como sede', () => {
  igual([Precios.lista('LP-05').sede, Precios.lista('LP-06').sede], ['DAM', 'YA'], 'sedes de los datos de ejemplo');
  igual(P('PT-0001', 'UND', 'DAM', 'MINORISTA', 'PEN', '15/08/2026'), 115.00, 'sede Damero directo');
  igual(P('PT-0001', 'UND', 'TDA-02', 'MINORISTA', 'PEN', '15/08/2026'), 115.00, 'tienda #2 → sede Damero');
  falla(() => Listas.guardar({ nom: 'Con tienda', mon: 'PEN', sede: 'TDA-01' }), 'Sede no válida');
  const L = Precios.lista('LP-05'); L.sede = 'TDA-02';
  Store.completarBase();
  igual(L.sede, 'DAM', 'una base guardada con la tienda pasa a la sede');
});

prueba('un artículo no entra ni queda con precio 0 y descuento 0', () => {
  const L = Listas.guardar({ nom: 'Prueba sin valor', mon: 'PEN', sede: 'PAR' });
  falla(() => Listas.agregarArts(L.cod, ['PT-0001'], {}), 'precio fijo o el % de descuento');
  falla(() => Listas.agregarArts(L.cod, ['PT-0001'], { precio: 0 }), 'mayor que cero');
  falla(() => Listas.agregarArts(L.cod, ['PT-0001'], { precio: 100, pct: 10 }), 'no los dos');
  igual(Listas.agregarArts(L.cod, ['PT-0001'], { precio: 100 }), 1, 'con precio sí');
  falla(() => Listas.fila(L.cod, 0, 'precio', 0), 'no se guarda con 0');
  falla(() => Listas.fila(L.cod, 0, 'pct', ''), 'no se guarda con 0');
  igual(L.filas[0].precio, 100, 'sigue con su precio');
  Listas.cancelar(L.cod, 'Prueba terminada');
});
prueba('la lista no se borra: se cancela con motivo y queda quién, cuándo y por qué', () => {
  const L = Listas.guardar({ nom: 'Prueba cancelar', mon: 'PEN', sede: 'YA' });
  Listas.agregarArts(L.cod, ['PT-0003'], { precio: 90 });
  igual(P('PT-0003', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026'), 90, 'aplica antes de cancelar');
  falla(() => Listas.cancelar(L.cod, ''), 'motivo');
  Listas.cancelar(L.cod, 'Precio equivocado');
  igual([L.cancelada.u, L.cancelada.motivo, Precios.estado(L), !!Precios.lista(L.cod)], [Store.usuario().nom, 'Precio equivocado', 'Cancelada', true], 'evidencia');
  igual(P('PT-0003', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026'), 124.90, 'ya no aplica');
  falla(() => Listas.agregarArts(L.cod, ['PT-0004'], { precio: 90 }), 'cancelada');
  falla(() => Listas.guardar({ nom: 'Prueba cancelar', mon: 'PEN', activa: true }, L.cod), 'cancelada');
  igual(L.hist.map(h => h.a), ['Lista creada', 'Artículos agregados', 'Cancelada'], 'historial');
  igual(typeof Listas.quitar, 'undefined', 'no existe borrar');
});

prueba('caso 1 · una oferta no empeora el precio: mayorista en Navidad sigue con 89', () => {
  const r = R('PT-0001', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '10/12/2026');
  igual([r.precio, r.oferta, r.origen], [89.00, null, 'Mayorista'], 'mayorista');
  igual(r.ofertas.map(o => o.nom + ' ' + o.precio), ['Navidad 99.9'], 'la oferta se encontró pero no conviene');
  igual(P('PT-0001', 'DOC', 'MAY-01', 'MAYORISTA', 'PEN', '10/12/2026'), 1020.00, 'docena mayorista');
  igual(P('PT-0001', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '10/12/2026'), 99.90, 'minorista sí la aprovecha');
});
prueba('caso 2 · sin ambigüedad: dos listas del mismo nivel no pueden tener el mismo artículo o grupo', () => {
  const L = Listas.guardar({ nom: 'General B', mon: 'PEN' });
  falla(() => Listas.agregarArts(L.cod, ['PT-0003'], { precio: 100 }), 'Conflicto de precios');
  falla(() => Listas.agregarGrupo(L.cod, 'PT', 10), 'Conflicto de precios');
  const S = Listas.guardar({ nom: 'Solo Paraíso', mon: 'PEN', sede: 'PAR' });
  Listas.agregarArts(S.cod, ['PT-0003'], { precio: 100 });
  falla(() => Listas.guardar({ nom: 'Solo Paraíso', mon: 'PEN', sede: '' }, S.cod), 'Conflicto de precios');
  Listas.guardar({ nom: 'Otra oferta', mon: 'PEN', oferta: true, desde: '01/08/2026' });
  Listas.cancelar(L.cod, 'Prueba terminada'); Listas.cancelar(S.cod, 'Prueba terminada');
  Listas.cancelar(Precios.listas().find(x => x.nom === 'Otra oferta').cod, 'Prueba terminada');
});
prueba('caso 3 · entre ofertas gana el mejor precio, no la más específica', () => {
  const A = Listas.guardar({ nom: 'Of sede', mon: 'PEN', sede: 'YA', oferta: true, desde: '01/08/2026', hasta: '31/08/2026' }); Listas.agregarArts(A.cod, ['PT-0004'], { pct: 5 });
  const B = Listas.guardar({ nom: 'Of general', mon: 'PEN', oferta: true, desde: '01/08/2026', hasta: '31/08/2026' }); Listas.agregarArts(B.cod, ['PT-0004'], { pct: 20 });
  const r = R('PT-0004', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026');
  igual([r.precio, r.oferta.nom, r.ofertas.length], [99.92, 'Of general', 2], 'gana −20 %');
  Listas.cancelar(A.cod, 'Prueba terminada'); Listas.cancelar(B.cod, 'Prueba terminada');
});
prueba('precio obligatorio: la oferta aplica aunque sea más cara, pero nunca debajo del mínimo', () => {
  const F = Listas.guardar({ nom: 'Precio único', mon: 'PEN', oferta: true, forzado: true, desde: '01/08/2026', hasta: '31/08/2026' });
  Listas.agregarArts(F.cod, ['PT-0003'], { precio: 130 });
  igual(R('PT-0003', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '15/08/2026').origen, 'Oferta Precio único (precio obligatorio)', 'aplica al mayorista');
  igual(P('PT-0003', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '15/08/2026'), 130, 'más cara que 92');
  Listas.fila(F.cod, 0, 'pct', 50);
  const r = R('PT-0003', 'UND', 'MAY-01', 'MAYORISTA', 'PEN', '15/08/2026');
  igual([r.precio, r.ajusteMin], [82.00, true], '92 − 50 % = 46 → mínimo 82');
  Listas.cancelar(F.cod, 'Prueba terminada');
});
prueba('precio mínimo: se aplica siempre; con mínimo 0 ningún precio queda en 0', () => {
  igual(Precios.minimo('PT-0001', 'DOC', 'PEN'), 948.00, 'mínimo de la docena = 79 × 12');
  const r = R('PT-0002', 'DOC', 'MAY-01', 'MAYORISTA', 'PEN', '10/12/2026');
  igual([r.precio, r.ajusteMin], [948.00, true], 'docena mayorista −15 % = 867 → 948');
  const L = Listas.guardar({ nom: 'Casi gratis', mon: 'PEN', oferta: true, desde: '01/08/2026', hasta: '31/08/2026' });
  Listas.agregarArts(L.cod, ['SERV-VTA-0002'], { pct: 99.99 });
  igual(Store.art('SERV-VTA-0002').precioMin, 0, 'sin mínimo');
  igual(P('SERV-VTA-0002', 'UND', 'TDA-01', 'MINORISTA', 'PEN', '15/08/2026'), 10.00, 'la oferta daría 0.00: no cuenta');
  falla(() => Listas.agregarArts(L.cod, ['SERV-VTA-0001'], { precio: 0 }), 'mayor que cero');
  Listas.cancelar(L.cod, 'Prueba terminada');
});
prueba('la línea guarda la evidencia del cálculo', () => {
  dia('10/12/2026');
  try {
    const d = Cot.borrador('MAY-01'); Doc.cambiarCliente(d, 'CLI-000002');
    const l = Doc.agregar(d, 'PT-0002');
    igual([l.precio, l.calculo.base.precio, l.calculo.base.origen, l.calculo.ofertas.map(o => o.nom), l.calculo.ajusteMin, l.calculo.minimo], [79, 89, 'Mayorista', ['Navidad'], true, 79], 'evidencia');
  } finally { BD.reloj = null; UI.reloj = null; }
});

prueba('el precio es referencial: el vendedor lo cambia y queda la referencia; la moneda no lo pisa', () => {
  dia('15/08/2026');
  try {
    const d = Ventas.borrador('TDA-01'); Doc.cambiarCliente(d, 'CLI-000001');
    const l = Doc.agregar(d, 'PT-0001');
    igual(l.precio, 119.90, 'propone la lista');
    Doc.cambiar(d, 0, 'precio', 135);
    igual([l.precio, l.origen, l.precioRef.precio, l.precioRef.origen], [135, 'Precio modificado a mano', 119.90, 'Precios generales S/'], 'más caro que la lista');
    Doc.cambiar(d, 0, 'precio', 100);
    igual(l.precioRef.precio, 119.90, 'la referencia es la del motor, no la del cambio anterior');
    igual(Doc.revisarLinea(d, l, 'venta').e.filter(x => x.indexOf('mínimo') >= 0).length, 0, '100 está sobre el mínimo 79');
    Doc.cambiar(d, 0, 'precio', 70);
    igual(Doc.revisarLinea(d, l, 'venta').e.some(x => x.indexOf('precio mínimo') >= 0), true, 'debajo del mínimo: lo controla «Verificar el precio mínimo» (hoy activo en toda la empresa)');
    Doc.cambiar(d, 0, 'precio', 100);
    Doc.cambiarMoneda(d, 'USD');
    igual([l.origen, l.precio], ['Precio modificado a mano', UI.r2(100 / Store.cfg().tc)], 'el precio a mano se convierte, no se pisa');
  } finally { BD.reloj = null; UI.reloj = null; }
});

prueba('el vendedor nunca vende debajo del precio mínimo, aunque se apague «Verificar el precio mínimo»', () => {
  const cfg = BD.d.maestros.configLogistica, antes = cfg.precioMinGlobal, a = Store.art('PT-0001'), vf = a.verifMin;
  cfg.precioMinGlobal = false; a.verifMin = false;
  dia('15/08/2026');
  try {
    const d = Ventas.borrador('TDA-01'); Doc.cambiarCliente(d, 'CLI-000001');
    const l = Doc.agregar(d, 'PT-0001');
    Doc.cambiar(d, 0, 'precio', 70);
    igual(Doc.revisarLinea(d, l, 'venta').e.some(x => x.indexOf('precio mínimo') >= 0), true, 'precio a mano 70 < 79');
    Doc.cambiar(d, 0, 'precio', 90); Doc.cambiar(d, 0, 'dcto', 12);
    igual(Doc.revisarLinea(d, l, 'venta').e.some(x => x.indexOf('precio mínimo') >= 0), true, 'neto 78 con descuento manual < 79');
    Doc.cambiar(d, 0, 'dcto', 11);
    igual(Doc.revisarLinea(d, l, 'venta').e.some(x => x.indexOf('precio mínimo') >= 0), false, 'neto 79 sí');
  } finally { cfg.precioMinGlobal = antes; a.verifMin = vf; BD.reloj = null; UI.reloj = null; }
});
