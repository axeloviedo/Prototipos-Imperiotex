/* COMERCIAL V9 — existencias por (almacén, código de artículo) con Actual / Comprometido (T1, T5)
   y movimientos V7 separados (T2): la venta es una SALIDA de GI-10 y la devolución un INGRESO de GI-09.
   Costo promedio ponderado por almacén.
   DECISIÓN CERRADA (2026-09-16): la venta pendiente de pago COMPROMETE stock (Disponible = Actual − Comprometido);
   cuando el pago confirmado (validado) cubre el total se registra la Salida, que baja el Actual y libera lo comprometido.
   Lo demás comprometido viene de otros módulos (transferencias GI-11, solicitudes). */
const Stock = {
  /* tipo de movimiento (textos de GI-09 / GI-10) -> concepto contable del Grupo de Artículo (pestaña Finanzas) */
  CONCEPTO: {
    'Salida - Venta al por menor': '21 · Costo de ventas',
    'Salida - Venta al por mayor': '21 · Costo de ventas',
    'Ingreso - Devoluciones de Clientes': '23 · Devolución de cliente / cambio de prenda'
  },

  buscar(alm, art) { return Store.d.stock.find(x => x.alm === alm && x.art === art); },
  fila(alm, art) {
    let f = Stock.buscar(alm, art);
    if (!f) { f = { alm, art, act: 0, comp: 0, costo: 0 }; Store.d.stock.push(f); }
    return f;
  },
  act(alm, art) { const f = Stock.buscar(alm, art); return f ? f.act : 0; },
  comp(alm, art) { const f = Stock.buscar(alm, art); return f ? f.comp : 0; },
  disp(alm, art) { const f = Stock.buscar(alm, art); return f ? UI.r4(f.act - f.comp) : 0; },
  costo(alm, art) { const f = Stock.buscar(alm, art); return f ? f.costo : 0; },
  totalDisp(art) { return UI.r4(Store.d.stock.filter(s => s.art === art).reduce((t, s) => t + s.act - s.comp, 0)); },

  _nuevo(tipo, det, datos) {
    const serie = { Ingreso: ['ing', 'ING-'], Salida: ['sal', 'SAL-'] }[tipo];
    const mov = Object.assign({ id: Store.sig(serie[0], serie[1], 6), tipo, det, concepto: Stock.CONCEPTO[det] || '', fecha: UI.ahora(), usuario: Store.usuario().nom, est: 'Confirmado', lineas: [], valor: 0 }, datos);
    Store.d.movs.unshift(mov);
    return mov;
  },

  /* compromete (signo +1) o libera (signo −1) cantidades en UM de inventario: lineas [{alm, art, cant}] */
  comprometer(lineas, signo) {
    const s = signo < 0 ? -1 : 1;
    lineas.filter(l => l.cant > 0).forEach(l => {
      const f = Stock.fila(l.alm, l.art);
      if (s < 0 && f.comp + 0.00005 < l.cant) throw new Error('No se puede liberar ' + UI.n(l.cant, 0) + ' de ' + l.art + ' en ' + l.alm + ': solo hay ' + UI.n(f.comp, 0) + ' comprometido');
      f.comp = UI.r4(f.comp + s * l.cant);
    });
  },

  /* {det, alm, destino, ndoc, obs, lineas:[{art, cant (UM inventario), bloquear, liberar}]}
     solo las líneas con bloquear exigen disponible; liberar = cantidad comprometida que se libera al salir */
  salida(o) {
    const lin = o.lineas.filter(l => l.cant > 0);
    const req = {};
    lin.filter(l => l.bloquear).forEach(l => { req[l.art] = UI.r4((req[l.art] || 0) + l.cant); });
    const falt = Object.keys(req).filter(art => Stock.disp(o.alm, art) + 0.00005 < req[art]);
    if (falt.length) throw new Error('Stock disponible insuficiente en ' + o.alm + ': ' + falt.map(a => a + ' (disponible ' + UI.n(Stock.disp(o.alm, a), 0) + ', se necesita ' + UI.n(req[a], 0) + ')').join(', '));
    const mov = Stock._nuevo('Salida', o.det, { alm: o.alm, od: o.alm + ' → ' + o.destino, ndoc: o.ndoc, obs: o.obs || '' });
    lin.forEach(l => {
      const f = Stock.fila(o.alm, l.art);
      f.act = UI.r4(f.act - l.cant);
      if (l.liberar > 0) f.comp = UI.r4(f.comp - l.liberar);
      const v = UI.r2(l.cant * f.costo);
      mov.valor = UI.r2(mov.valor + v);
      mov.lineas.push({ art: l.art, cant: l.cant, costo: f.costo, valor: v, alm: o.alm, signo: -1, saldo: f.act });
    });
    return mov;
  },

  /* {det, alm, origen, ndoc, obs, lineas:[{art, cant, costo}]} */
  ingreso(o) {
    const mov = Stock._nuevo('Ingreso', o.det, { alm: o.alm, od: (o.origen || 'Cliente') + ' → ' + o.alm, ndoc: o.ndoc, obs: o.obs || '' });
    o.lineas.filter(l => l.cant > 0).forEach(l => {
      const f = Stock.fila(o.alm, l.art); const c = Number(l.costo) || 0;
      f.costo = f.act > 0 ? UI.r4((f.act * f.costo + l.cant * c) / (f.act + l.cant)) : UI.r4(c);
      f.act = UI.r4(f.act + l.cant);
      const v = UI.r2(l.cant * c);
      mov.valor = UI.r2(mov.valor + v);
      mov.lineas.push({ art: l.art, cant: l.cant, costo: c, valor: v, alm: o.alm, signo: 1, saldo: f.act });
    });
    return mov;
  },

  kardex(art, alm) {
    const filas = [];
    Store.d.movs.slice().reverse().forEach(m => m.lineas.forEach(l => {
      if (l.art !== art || (alm && l.alm !== alm)) return;
      filas.push({ fecha: m.fecha, id: m.id, tipo: m.tipo, det: m.det, ndoc: m.ndoc, alm: l.alm, ent: l.signo > 0 ? l.cant : 0, sal: l.signo < 0 ? l.cant : 0, costo: l.costo, saldo: l.saldo });
    }));
    return filas;
  }
};
