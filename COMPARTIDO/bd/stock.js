/* COMPARTIDO · Stock único por (almacén, código de artículo): Actual / Comprometido, costo promedio ponderado por almacén.
   Movimientos separados (Ingresos, Salidas y Transferencias) con numeración compartida ING- / SAL- / TRF-.
   Disponible = Actual − Comprometido. Lo usan los cuatro módulos: nadie modifica BD.d.stock ni BD.d.movs por fuera de aquí.
   No guarda: quien llama debe ejecutar BD.guardar() al terminar la operación (Docs.* ya lo hace).
   Cada movimiento lleva su TIPO DE MOVIMIENTO de la estructura organizativa (o.tipoMov: ING-COMPRA, SAL-USOPROD, TRF-FABRIC…,
   maestro BD.d.maestros.tiposMovimiento) y su grupo (ING, SAL, TRF).
   Decisión cerrada J1: NO existe el tipo Ajuste; regularizar = Ingreso (ING-REGULARIZ) o Salida (SAL-REGULARIZ) con motivo y observación.
   Decisión cerrada T1: Stock Actual, Comprometido y Pedido (mercadería en camino, informativo). Disponible = Actual − Comprometido.
   Decisión cerrada T2/T7: la transferencia es en dos pasos (Docs.trf): aprobar compromete en origen y suma Pedido en destino; recibir mueve. */
const Stock = {
  /* concepto contable por tipo de movimiento (pestaña Finanzas del Grupo de Artículo); se puede pasar o.concepto */
  CONCEPTO: {
    'Salida - Venta al por menor': '21 · Costo de ventas',
    'Salida - Venta al por mayor': '21 · Costo de ventas',
    'Ingreso - Devoluciones de Clientes': '23 · Devolución de cliente / cambio de prenda',
    'Ingreso - Compra': 'E01 · Cuenta de existencias',
    'Salida - Emisión para producción': 'P01 · Consumo de materia prima a la orden',
    'Ingreso - Recibo de producción': 'P04 · Ingreso de producto en proceso'
  },

  /* ---------- Lotes (decisión I-7) ----------
     Solo los artículos con control «Lote». Cada INGRESO crea un lote con código automático L<año>-<artículo>-<correlativo>.
     El lote guarda su saldo por almacén; al salir o transferir se puede elegir el lote y, si no, sale el más antiguo.
     El costo sigue siendo el promedio del almacén (decisión de valorización): el lote es trazabilidad, no costo. */
  conLote(art) { return (BD.art(art) || {}).ctrl === 'Lote'; },
  lotes(art, alm) {
    return (BD.d.lotes || []).filter(l => l.art === art && (!alm || (l.saldos[alm] || 0) > 0.00005));
  },
  lote(id) { return (BD.d.lotes || []).find(l => l.id === id); },
  saldoLote(id, alm) { const l = Stock.lote(id); return l ? BD.r4(l.saldos[alm] || 0) : 0; },
  _nuevoLote(art, alm, cant, o, l) {
    const anio = BD.hoy().slice(6, 10);
    const id = l && l.lote ? String(l.lote).trim() : 'L' + anio + '-' + art + '-' + BD.sig('lote_' + anio + '_' + art, '', 4);
    const existente = Stock.lote(id);
    const x = existente || { id, art, emp: BD.empresaDe(alm), fecha: o.fecha || BD.ahora(), vence: (l && l.vence) || '', origen: o.ndoc || o.doc || '', saldos: {} };
    x.saldos[alm] = BD.r4((x.saldos[alm] || 0) + cant);
    if (!existente) (BD.d.lotes = BD.d.lotes || []).push(x);
    return x;
  },
  /* descuenta de los lotes del almacén: el elegido o, si no, el más antiguo primero. Devuelve [{lote, cant}] */
  _sacarLote(art, alm, cant, elegido) {
    const out = [];
    let falta = BD.r4(cant);
    const lista = (elegido ? [Stock.lote(elegido)].filter(Boolean) : Stock.lotes(art, alm).sort((a, b) => Stock._n(a.fecha) - Stock._n(b.fecha)));
    lista.forEach(l => {
      if (falta <= 0.00005) return;
      const hay = BD.r4(l.saldos[alm] || 0); if (hay <= 0) return;
      const c = Math.min(hay, falta);
      l.saldos[alm] = BD.r4(hay - c); falta = BD.r4(falta - c);
      out.push({ lote: l.id, cant: c });
    });
    return out;
  },
  buscar(alm, art) { return BD.d.stock.find(x => x.alm === alm && x.art === art); },
  fila(alm, art) {
    let f = Stock.buscar(alm, art);
    if (!f) { const a = BD.art(art); f = { alm, art, act: 0, comp: 0, ped: 0, costo: a ? (a.costo || 0) : 0 }; BD.d.stock.push(f); }
    return f;
  },
  act(alm, art) { const f = Stock.buscar(alm, art); return f ? f.act : 0; },
  comp(alm, art) { const f = Stock.buscar(alm, art); return f ? f.comp : 0; },
  ped(alm, art) { const f = Stock.buscar(alm, art); return f ? (f.ped || 0) : 0; },
  disp(alm, art) { const f = Stock.buscar(alm, art); return f ? BD.r4(f.act - f.comp) : 0; },
  costo(alm, art) { const f = Stock.buscar(alm, art); return f ? f.costo : ((BD.art(art) || {}).costo || 0); },
  totalAct(art) { return BD.r4(BD.d.stock.filter(s => s.art === art).reduce((t, s) => t + s.act, 0)); },
  totalDisp(art) { return BD.r4(BD.d.stock.filter(s => s.art === art).reduce((t, s) => t + s.act - s.comp, 0)); },
  deAlmacen(alm) { return BD.d.stock.filter(s => s.alm === alm && (s.act || s.comp)); },

  comprometer(alm, art, cant) { if (!(cant > 0)) return; const f = Stock.fila(alm, art); f.comp = BD.r4(f.comp + cant); },
  liberar(alm, art, cant) { if (!(cant > 0)) return; const f = Stock.fila(alm, art); f.comp = BD.r4(Math.max(0, f.comp - cant)); },
  /* Pedido (T1): signo +1 suma mercadería en camino al almacén, −1 la descuenta (nunca queda negativo) */
  pedido(alm, art, cant, signo) { if (!(cant > 0) || !alm) return; const f = Stock.fila(alm, art); f.ped = BD.r4(Math.max(0, (f.ped || 0) + (signo < 0 ? -1 : 1) * cant)); },
  /* compromete (signo +1) o libera (signo −1) varias líneas [{alm, art, cant}]; liberar más de lo comprometido es error */
  comprometerLineas(lineas, signo) {
    const s = signo < 0 ? -1 : 1;
    lineas.filter(l => l.cant > 0).forEach(l => {
      const f = Stock.fila(l.alm, l.art);
      if (s < 0 && f.comp + 0.00005 < l.cant) BD.error('No se puede liberar ' + l.cant + ' de ' + l.art + ' en ' + l.alm + ': solo hay ' + f.comp + ' comprometido');
      f.comp = BD.r4(f.comp + s * l.cant);
    });
  },

  /* tipo de movimiento por defecto cuando el llamador no lo indica */
  TIPO_DEF: { Ingreso: 'ING-INICIAL', Salida: 'SAL-USOPROD', Transferencia: 'TRF-INTERNO' },
  _tipoMov(tipo, o) {
    const cod = o.tipoMov || Stock.TIPO_DEF[tipo], t = BD.tipoMov(cod);
    if (o.tipoMov && (BD.d.maestros.tiposMovimiento || []).length && !t) BD.error('Tipo de movimiento no válido: ' + o.tipoMov);
    const grupo = cod.split('-')[0];
    const esperado = { Ingreso: ['ING'], Salida: ['SAL'], Transferencia: ['TRF'] }[tipo];
    if (!esperado.includes(grupo)) BD.error('El tipo ' + cod + ' no corresponde a un movimiento de ' + tipo.toLowerCase());
    return { cod, grupo, nom: t ? t.nom : '' };
  },
  _nuevo(tipo, o) {
    const serie = { Ingreso: ['ing', 'ING-'], Salida: ['sal', 'SAL-'], Transferencia: ['trf', 'TRF-'] }[tipo];
    const tm = Stock._tipoMov(tipo, o);
    const mov = {
      tipoMov: tm.cod, grupoMov: tm.grupo, tipoMovNom: tm.nom,
      id: BD.sig(serie[0], serie[1], 6), emp: BD.empresaDe(o.alm), tipo, det: o.det, concepto: o.concepto || Stock.CONCEPTO[o.det] || '', fecha: o.fecha || BD.ahora(), usuario: o.usuario || BD.usuario,
      modulo: o.modulo || '', est: tipo === 'Transferencia' ? 'Completada' : 'Confirmado', alm: o.alm, od: o.od, ndoc: o.ndoc || '', doc: o.doc || '', obs: o.obs || '', lineas: [], valor: 0
    };
    BD.d.movs.unshift(mov);
    return mov;
  },
  inventariable(art) { const a = BD.art(art); return !!a && a.inv !== false; },
  /* líneas inventariables que no alcanzan: por Actual (o por Disponible si porDisponible) */
  faltantes(alm, lineas, porDisponible) {
    const req = {};
    lineas.forEach(l => { if (!Stock.inventariable(l.art)) return; req[l.art] = BD.r4((req[l.art] || 0) + Number(l.cant)); });
    return Object.keys(req).map(art => ({ art, hay: porDisponible ? Stock.disp(alm, art) : Stock.act(alm, art), req: req[art] }))
      .filter(x => x.hay + 0.00005 < x.req).map(x => ({ art: x.art, falta: BD.r4(x.req - x.hay), hay: x.hay }));
  },
  textoFaltantes(alm, falt) { return 'Stock insuficiente en ' + alm + ': ' + falt.map(x => BD.nomArt(x.art) + ' (hay ' + x.hay + ', faltan ' + x.falta + ')').join(', '); },

  /* Salida. o = {det, alm, destino, ndoc, doc, obs, modulo, concepto,
     lineas:[{art, cant, liberar (comprometido que se libera), bloquear (exige disponible)}]}
     Devuelve {ok:true, mov, valor} o {ok:false, error}. */
  salida(o) {
    const lin = o.lineas.filter(l => Number(l.cant) > 0 && Stock.inventariable(l.art));
    if (!BD.alm(o.alm)) return { ok: false, error: 'Almacén no válido: ' + o.alm };
    const bloq = lin.filter(l => l.bloquear), resto = lin.filter(l => !l.bloquear);
    const falt = Stock.faltantes(o.alm, bloq, true).concat(Stock.faltantes(o.alm, resto, false));
    if (falt.length) return { ok: false, error: Stock.textoFaltantes(o.alm, falt) };
    const mov = Stock._nuevo('Salida', Object.assign({}, o, { od: o.alm + ' → ' + (o.destino || '') }));
    lin.forEach(l => {
      const f = Stock.fila(o.alm, l.art), cant = BD.r4(l.cant), lib = Number(l.liberar != null ? l.liberar : l.liberaComp) || 0;
      f.act = BD.r4(f.act - cant);
      if (lib > 0) f.comp = BD.r4(Math.max(0, f.comp - lib));
      const v = BD.r2(cant * f.costo);
      mov.valor = BD.r2(mov.valor + v);
      const linea = { art: l.art, cant, costo: f.costo, valor: v, alm: o.alm, signo: -1, saldo: f.act };
      if (Stock.conLote(l.art)) { const usados = Stock._sacarLote(l.art, o.alm, cant, l.lote); if (usados.length) linea.lote = usados.map(u => u.lote).join(', '); }
      mov.lineas.push(linea);
    });
    return { ok: true, mov, valor: mov.valor };
  },
  /* Ingreso. o = {det, alm, origen, ndoc, doc, obs, modulo, concepto, lineas:[{art, cant, costo}]} */
  ingreso(o) {
    if (!BD.alm(o.alm)) return { ok: false, error: 'Almacén no válido: ' + o.alm };
    const mov = Stock._nuevo('Ingreso', Object.assign({}, o, { od: (o.origen || '') + ' → ' + o.alm }));
    o.lineas.filter(l => Number(l.cant) > 0 && Stock.inventariable(l.art)).forEach(l => {
      const f = Stock.fila(o.alm, l.art), cant = BD.r4(l.cant), c = Number(l.costo) || 0;
      f.costo = f.act > 0 ? BD.r4((f.act * f.costo + cant * c) / (f.act + cant)) : BD.r4(c);
      f.act = BD.r4(f.act + cant);
      const v = BD.r2(cant * c);
      mov.valor = BD.r2(mov.valor + v);
      const linea = { art: l.art, cant, costo: c, valor: v, alm: o.alm, signo: 1, saldo: f.act };
      if (Stock.conLote(l.art)) linea.lote = Stock._nuevoLote(l.art, o.alm, cant, o, l).id;
      mov.lineas.push(linea);
    });
    return { ok: true, mov };
  },
  /* Transferencia en un paso: sale del origen y entra al destino al mismo costo.
     Normalmente la llama Docs.trf.recibir (paso 2 de la transferencia).
     o = {det, tipoMov, origen, destino, ndoc, doc, obs, modulo, lineas:[{art, cant, liberar (comprometido en origen), pedido (Pedido en destino)}]} */
  transferencia(o) {
    const lin = o.lineas.filter(l => Number(l.cant) > 0 && Stock.inventariable(l.art));
    if (!BD.alm(o.origen) || !BD.alm(o.destino)) return { ok: false, error: 'Almacén de origen o destino no válido' };
    if (o.origen === o.destino) return { ok: false, error: 'El origen y el destino no pueden ser el mismo almacén' };
    const falt = Stock.faltantes(o.origen, lin);
    if (falt.length) return { ok: false, error: Stock.textoFaltantes(o.origen, falt) };
    const mov = Stock._nuevo('Transferencia', Object.assign({}, o, { alm: o.origen, od: o.origen + ' → ' + o.destino }));
    mov.destino = o.destino;
    lin.forEach(l => {
      const cant = BD.r4(l.cant), fo = Stock.fila(o.origen, l.art), c = fo.costo;
      fo.act = BD.r4(fo.act - cant);
      if (Number(l.liberar) > 0) fo.comp = BD.r4(Math.max(0, fo.comp - Number(l.liberar)));
      const usados = Stock.conLote(l.art) ? Stock._sacarLote(l.art, o.origen, cant, l.lote) : [];
      const etiqueta = usados.length ? usados.map(u => u.lote).join(', ') : '';
      usados.forEach(u => { const x = Stock.lote(u.lote); x.saldos[o.destino] = BD.r4((x.saldos[o.destino] || 0) + u.cant); });
      mov.lineas.push(Object.assign({ art: l.art, cant, costo: c, valor: BD.r2(cant * c), alm: o.origen, signo: -1, saldo: fo.act }, etiqueta ? { lote: etiqueta } : {}));
      const fd = Stock.fila(o.destino, l.art);
      if (Number(l.pedido) > 0) fd.ped = BD.r4(Math.max(0, (fd.ped || 0) - Number(l.pedido)));
      fd.costo = fd.act > 0 ? BD.r4((fd.act * fd.costo + cant * c) / (fd.act + cant)) : c;
      fd.act = BD.r4(fd.act + cant);
      mov.lineas.push(Object.assign({ art: l.art, cant, costo: c, valor: BD.r2(cant * c), alm: o.destino, signo: 1, saldo: fd.act }, etiqueta ? { lote: etiqueta } : {}));
      mov.valor = BD.r2(mov.valor + cant * c);
    });
    return { ok: true, mov };
  },
  /* diferencia de costo al cerrar una orden: se reparte en el costo promedio de lo que hay */
  revalorizar(alm, art, monto) { const f = Stock.fila(alm, art); if (f.act > 0) f.costo = BD.r4(f.costo + monto / f.act); },

  kardex(art, alm) {
    const filas = [];
    BD.d.movs.slice().reverse().forEach(m => m.lineas.forEach(l => {
      if (l.art !== art || (alm && l.alm !== alm)) return;
      filas.push({ fecha: m.fecha, id: m.id, tipo: m.tipo, det: m.det, ndoc: m.ndoc, alm: l.alm, lote: l.lote || '', ent: l.signo > 0 ? l.cant : 0, sal: l.signo < 0 ? l.cant : 0, costo: l.costo, valor: l.valor, saldo: l.saldo });
    }));
    return filas;
  },
  /* saldo de un artículo en un almacén a una fecha (dd/mm/aaaa): último saldo de kardex hasta ese día */
  saldoA(art, alm, fecha) {
    const lim = Stock._n(fecha) + 1;
    let s = 0;
    Stock.kardex(art, alm).forEach(k => { if (Stock._n(k.fecha) < lim) s = k.saldo; });
    return s;
  },
  _n(f) { const p = String(f || '').split(' ')[0].split('/'); return p.length === 3 ? Number(p[2] + p[1] + p[0]) : 0; }
};
