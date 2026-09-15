/* PRODUCCION · Producción — stock por (almacén, código de artículo) con Actual / Comprometido (T1, T5)
   y movimientos V7 separados (T2): Ingresos, Salidas y Transferencias. Costo promedio ponderado por almacén. */
const Stock = {
  buscar(alm, art) { return Store.d.stock.find(x => x.alm === alm && x.art === art); },
  fila(alm, art) {
    let f = Stock.buscar(alm, art);
    if (!f) { const a = M.art(art); f = { alm, art, act: 0, comp: 0, costo: a ? a.costo : 0 }; Store.d.stock.push(f); }
    return f;
  },
  act(alm, art) { const f = Stock.buscar(alm, art); return f ? f.act : 0; },
  disp(alm, art) { const f = Stock.buscar(alm, art); return f ? UI.r4(f.act - f.comp) : 0; },
  costo(alm, art) { const f = Stock.buscar(alm, art); return f ? f.costo : ((M.art(art) || {}).costo || 0); },
  comprometer(alm, art, cant) { if (!(cant > 0)) return; const f = Stock.fila(alm, art); f.comp = UI.r4(f.comp + cant); },
  liberar(alm, art, cant) { if (!(cant > 0)) return; const f = Stock.fila(alm, art); f.comp = UI.r4(Math.max(0, f.comp - cant)); },

  _nuevo(tipo, det, datos) {
    const serie = { Ingreso: ['ing', 'ING-'], Salida: ['sal', 'SAL-'], Transferencia: ['trf', 'TRF-'] }[tipo];
    const mov = Object.assign({ id: Store.sig(serie[0], serie[1], 6), tipo, det, fecha: UI.ahora(), usuario: Store.d.usuario, est: tipo === 'Transferencia' ? 'Completada' : 'Confirmado', lineas: [], valor: 0 }, datos);
    Store.d.movs.unshift(mov);
    return mov;
  },
  /* líneas inventariables que no alcanzan en el almacén */
  faltantes(alm, lineas) {
    const req = {};
    lineas.forEach(l => { const a = M.art(l.art); if (a && a.inv === false) return; req[l.art] = UI.r4((req[l.art] || 0) + l.cant); });
    return Object.keys(req).filter(art => Stock.act(alm, art) + 0.00005 < req[art]).map(art => ({ art, falta: UI.r4(req[art] - Stock.act(alm, art)) }));
  },
  textoFaltantes(alm, falt) { return 'Stock insuficiente en ' + alm + ': ' + falt.map(x => M.nomArt(x.art) + ' (faltan ' + UI.n(x.falta) + ')').join(', '); },

  /* {det, alm, destino, ndoc, obs, lineas:[{art, cant, liberaComp}]} */
  salida(o) {
    const lin = o.lineas.filter(l => l.cant > 0 && (M.art(l.art) || {}).inv !== false);
    const falt = Stock.faltantes(o.alm, lin);
    if (falt.length) return { ok: false, error: Stock.textoFaltantes(o.alm, falt) };
    const mov = Stock._nuevo('Salida', o.det, { alm: o.alm, od: o.alm + ' → ' + o.destino, ndoc: o.ndoc, obs: o.obs || '' });
    lin.forEach(l => {
      const f = Stock.fila(o.alm, l.art);
      f.act = UI.r4(f.act - l.cant);
      if (l.liberaComp > 0) f.comp = UI.r4(Math.max(0, f.comp - l.liberaComp));
      const v = UI.r2(l.cant * f.costo);
      mov.valor = UI.r2(mov.valor + v);
      mov.lineas.push({ art: l.art, cant: l.cant, costo: f.costo, valor: v, alm: o.alm, signo: -1, saldo: f.act });
    });
    return { ok: true, mov, valor: mov.valor };
  },
  /* {det, alm, origen, ndoc, obs, lineas:[{art, cant, costo}]} */
  ingreso(o) {
    const mov = Stock._nuevo('Ingreso', o.det, { alm: o.alm, od: (o.origen || 'Producción') + ' → ' + o.alm, ndoc: o.ndoc, obs: o.obs || '' });
    o.lineas.filter(l => l.cant > 0).forEach(l => {
      const f = Stock.fila(o.alm, l.art); const c = Number(l.costo) || 0;
      f.costo = f.act > 0 ? UI.r4((f.act * f.costo + l.cant * c) / (f.act + l.cant)) : UI.r4(c);
      f.act = UI.r4(f.act + l.cant);
      const v = UI.r2(l.cant * c);
      mov.valor = UI.r2(mov.valor + v);
      mov.lineas.push({ art: l.art, cant: l.cant, costo: c, valor: v, alm: o.alm, signo: 1, saldo: f.act });
    });
    return { ok: true, mov };
  },
  /* Transferencia completada en un paso: salida del origen + entrada al destino al mismo costo (T2) */
  transferencia(o) {
    const lin = o.lineas.filter(l => l.cant > 0);
    const falt = Stock.faltantes(o.origen, lin);
    if (falt.length) return { ok: false, error: Stock.textoFaltantes(o.origen, falt) };
    const mov = Stock._nuevo('Transferencia', o.det, { alm: o.origen, od: o.origen + ' → ' + o.destino, ndoc: o.ndoc, obs: o.obs || '' });
    lin.forEach(l => {
      const fo = Stock.fila(o.origen, l.art); const c = fo.costo;
      fo.act = UI.r4(fo.act - l.cant);
      mov.lineas.push({ art: l.art, cant: l.cant, costo: c, valor: UI.r2(l.cant * c), alm: o.origen, signo: -1, saldo: fo.act });
      const fd = Stock.fila(o.destino, l.art);
      fd.costo = fd.act > 0 ? UI.r4((fd.act * fd.costo + l.cant * c) / (fd.act + l.cant)) : c;
      fd.act = UI.r4(fd.act + l.cant);
      mov.lineas.push({ art: l.art, cant: l.cant, costo: c, valor: UI.r2(l.cant * c), alm: o.destino, signo: 1, saldo: fd.act });
      mov.valor = UI.r2(mov.valor + l.cant * c);
    });
    return { ok: true, mov };
  },
  /* diferencia de costo al cerrar una OF: se reparte en el costo promedio de lo que hay */
  revalorizar(alm, art, monto) { const f = Stock.fila(alm, art); if (f.act > 0) f.costo = UI.r4(f.costo + monto / f.act); },

  kardex(art, alm) {
    const filas = [];
    Store.d.movs.slice().reverse().forEach(m => m.lineas.forEach(l => {
      if (l.art !== art || (alm && l.alm !== alm)) return;
      filas.push({ fecha: m.fecha, id: m.id, tipo: m.tipo, det: m.det, ndoc: m.ndoc, alm: l.alm, ent: l.signo > 0 ? l.cant : 0, sal: l.signo < 0 ? l.cant : 0, costo: l.costo, saldo: l.saldo });
    }));
    return filas;
  }
};
