/* PRODUCCION · Producción — servicios de la Orden de Fabricación (como SAP Business One, con operarios).
   - Estándar: usa la lista de materiales sin cambios. Especial: la lista se modificó a mano o la orden no tiene lista.
   - Las órdenes de una Solicitud de Fabricación nacen Liberadas (su materia prima se comprometió al aprobar la solicitud).
   - Las órdenes creadas en Producción nacen Planificadas, se pueden editar y comprometen su materia prima al liberarse.
   - Emisión para producción (Salida): consume las líneas Manual; los recursos llevan el detalle de sus operarios. Se registra directo.
   - Recibo de producción (Ingreso): entra lo producido y se consumen las líneas Notificación. Se registra directo.
   - Se consume del almacén de la línea; si falta stock se emite lo que hay y se envía una Solicitud de materiales: Logística decide por línea si transfiere o compra.
   - Solo artículos inventariables y recursos. Un servicio de terceros es un recurso con costo estándar que se contrasta con la OC, la factura y la nota de crédito.
   - Fase tercerizada: la orden se vincula a la compra del servicio; los materiales se envían al almacén del proveedor y lo producido vuelve al almacén propio.
   - Producto fallado: salida del artículo + ingreso del artículo "FALLADO" al mismo costo; el reproceso es una orden Especial solo con mano de obra. */
const Prod = {
  _hist(of, a, d) { of.hist.push({ f: UI.ahora(), a, d: d || '', u: Store.d.usuario }); },
  nombreRef() { return Store.d.cfg.nombreRef || 'N° Referencia'; },
  /* almacén donde entra lo producido: el del artículo o, si no tiene, el de su lista de materiales */
  almRecibo(art) { const a = M.art(art); return (a && a.alm) || Explosion.almDe(art) || (M.ALMACENES[0] || {}).cod; },
  /* el nombre de la referencia es solo la etiqueta del campo (un texto por empresa): se edita desde PR-04 */
  renombrarRef(nom) { nom = String(nom || '').trim(); if (!nom) throw new Error('Indique el nombre'); Store.d.cfg.nombreRef = nom; return nom; },
  nuevaRef() { return Store.sig('ref', '', 4); },
  operario(cod) { return Store.d.operarios.find(o => o.cod === cod); },
  abierta(of) { return of.estado === 'Planificado' || of.estado === 'Liberado'; },
  editable(of) { return of.origen !== 'Solicitud' && of.estado === 'Planificado'; },
  /* almacén donde está comprometida la línea (en una fase tercerizada, el propio hasta que se envía) */
  almComp(m) { return m.almPropio || m.alm; },
  pendiente(of) { return UI.r4(Math.max(0, of.cant - of.prod)); },
  tieneMovimientos(of) { return of.emisiones.length > 0 || of.recibos.length > 0; },
  esServicio(cod) { return (M.rec(cod) || {}).tipo === 'SERVICIO DE TERCEROS'; },
  costoTotal(of) { return UI.r2(of.costo.mat + of.costo.rec + of.costo.serv); },
  /* costo emitido que todavía no pasó a lo recibido */
  enProceso(of) { return UI.r2(Math.max(0, Prod.costoTotal(of) - of.absorbido)); },
  costoUnit(of) { return of.prod > 0 ? UI.r2(of.absorbido / of.prod) : 0; },
  ordenesDe(art, ref) { return Store.d.ofs.filter(o => o.art === art && o.estado !== 'Cancelado' && (!ref || o.ref === ref)); },
  /* disponible de un artículo: stock disponible + lo que falta producir en órdenes abiertas − lo que otras órdenes abiertas aún deben consumir */
  proyectado(art) {
    let v = Store.d.stock.filter(s => s.art === art).reduce((a, s) => a + s.act - s.comp, 0);
    Store.d.ofs.forEach(o => {
      if (!Prod.abierta(o)) return;
      if (o.art === art) v += Prod.pendiente(o);
      o.mats.forEach(m => { if (m.cod === art) v -= Math.max(0, m.plan - m.consumido); });
    });
    return UI.r4(v);
  },
  /* costo que agrega la orden: materia prima (no fabricada) + recursos y servicios */
  costoAgregado(of) { return UI.r2(of.mats.filter(m => !m.fab).reduce((a, m) => a + (m.valor || 0), 0) + of.recs.reduce((a, r) => a + r.costoReal, 0)); },
  adjuntosRef(ref) { return Store.d.ofs.filter(o => o.ref === ref).flatMap(o => o.adj.map(a => Object.assign({ of: o.id, art: o.art }, a))); },

  /* ---------- creación ---------- */
  crearOF(o) {
    const L = o.ldm ? M.ldm(o.ldm) : null;
    if (o.ldm && (!L || L.art !== o.art)) throw new Error('El artículo no tiene esa lista de materiales');
    if (!M.art(o.art)) throw new Error('Elija el artículo');
    const cant = UI.r4(o.cant);
    const of = {
      id: Store.sig('of', 'OF-', 6), ref: o.ref, art: o.art, ldm: L ? L.id : '', tipofab: L ? 'Estándar' : 'Especial',
      cant, prod: 0, alm: o.alm || Prod.almRecibo(o.art), origen: o.origen || 'Manual', sf: o.sf || '',
      estado: 'Planificado', fecha: UI.ahora(), fechaLib: '', fechaCierre: '', fechaFin: o.fechaFin || '', obs: o.obs || '',
      mats: L ? Explosion.materiales(L.id, cant) : [], recs: L ? Explosion.recursos(L.id, cant) : [], textos: L ? Explosion.textos(L.id) : [],
      emisiones: [], recibos: [], compras: [], envios: [], tercero: null, adj: [], hist: [], costo: { mat: 0, rec: 0, serv: 0 }, absorbido: 0
    };
    Store.d.ofs.unshift(of);
    Prod._hist(of, 'Orden creada', of.tipofab + ' · ' + (of.sf ? 'desde ' + of.sf : 'en Producción') + ' · ' + Prod.nombreRef() + ' ' + of.ref);
    return of;
  },
  _crearSugeridas(sugeridas, nec, base) {
    return Object.keys(sugeridas || {}).filter(art => (Number(sugeridas[art]) || 0) > 0).map(art => {
      const n = nec.find(x => x.art === art);
      return Prod.crearOF(Object.assign({}, base, { art, ldm: n ? n.ldm : M.ldmPred(art).id, cant: Number(sugeridas[art]), alm: n ? n.alm : Prod.almRecibo(art) }));
    });
  },
  /* orden creada en Producción (nace Planificada); la lista es opcional; sugeridas = {artículo fabricable: cantidad} */
  crearManual(o) {
    if (!o.art) throw new Error('Elija el artículo');
    if (!(o.cant > 0)) throw new Error('Indique la cantidad a fabricar');
    const ref = String(o.ref || '').trim() || Prod.nuevaRef();
    const nec = o.ldm && o.sugeridas ? Explosion.necesidades([{ art: o.art, cant: o.cant, ldm: o.ldm }]) : [];
    const base = { ref, origen: 'Manual', fechaFin: o.fechaFin, obs: o.obs };
    return [Prod.crearOF(Object.assign({}, base, { art: o.art, ldm: o.ldm, cant: o.cant, alm: o.alm }))].concat(o.ldm ? Prod._crearSugeridas(o.sugeridas, nec, base) : []);
  },

  /* ---------- Solicitud de Fabricación (aprobada en Inventarios GI-21): sus órdenes nacen Liberadas ---------- */
  aprobarSF(sf) {
    sf.comprometido = Explosion.bruto(sf.lineas.map(l => ({ art: l.art, cant: l.cant, ldm: l.ldm })));
    sf.comprometido.forEach(r => Stock.comprometer(r.alm, r.art, r.cant));
  },
  generarDesdeSF(sfId, sugeridas) {
    const sf = Store.sf(sfId);
    if (!sf) throw new Error('Solicitud no encontrada');
    if (sf.ofs && sf.ofs.length) throw new Error('La solicitud ya generó sus órdenes (' + Prod.nombreRef() + ' ' + sf.ref + ')');
    const nec = Explosion.necesidades(sf.lineas.map(l => ({ art: l.art, cant: l.cant, ldm: l.ldm })));
    let sug = sugeridas;
    if (!sug) { sug = {}; nec.forEach(n => { sug[n.art] = n.sugerido; }); }
    const ref = Prod.nuevaRef();
    const base = { ref, origen: 'Solicitud', sf: sf.id, fechaFin: sf.fechaReq || '' };
    const creadas = sf.lineas.map(l => Prod.crearOF(Object.assign({}, base, { art: l.art, ldm: l.ldm, cant: l.cant, alm: sf.almDestino }))).concat(Prod._crearSugeridas(sug, nec, base));
    const plan = {};
    creadas.forEach(of => of.mats.forEach(m => { if (!m.fab) { const k = m.alm + '|' + m.cod; plan[k] = UI.r4((plan[k] || 0) + m.plan); } }));
    (sf.comprometido || []).forEach(r => {
      const k = r.alm + '|' + r.art, usado = Math.min(r.cant, plan[k] || 0);
      if (r.cant - usado > 0.0001) Stock.liberar(r.alm, r.art, UI.r4(r.cant - usado));
      let resto = usado;
      creadas.forEach(of => of.mats.forEach(m => {
        if (!m.fab && m.alm === r.alm && m.cod === r.art && resto > 0) { const c = Math.min(resto, m.plan); m.comp = UI.r4(c); resto = UI.r4(resto - c); }
      }));
    });
    creadas.forEach(of => { of.estado = 'Liberado'; of.fechaLib = UI.ahora(); Prod._hist(of, 'Orden liberada', 'Nace liberada desde ' + sf.id); });
    sf.ofs = creadas.map(o => o.id); sf.ref = ref; sf.est = 'En fabricación';
    return creadas;
  },

  /* ---------- ciclo de vida ---------- */
  liberar(of) {
    if (of.estado !== 'Planificado') throw new Error('Solo se libera una orden Planificada');
    if (!of.mats.length && !of.recs.length) throw new Error('Agregue al menos un material o recurso antes de liberar');
    if (of.origen !== 'Solicitud') {
      of.mats.forEach(m => {
        if (m.fab) return;
        const falta = UI.r4(m.plan - m.consumido - m.comp); if (falta <= 0) return;
        const c = UI.r4(Math.min(falta, Math.max(0, Stock.disp(Prod.almComp(m), m.cod))));
        if (c > 0) { Stock.comprometer(Prod.almComp(m), m.cod, c); m.comp = UI.r4(m.comp + c); }
      });
    }
    of.estado = 'Liberado'; of.fechaLib = UI.ahora();
    Prod._hist(of, 'Orden liberada', '');
  },
  _anularPendientes(of) {
    Prod.solicitudesDe(of).filter(s => s.estado === 'Pendiente').forEach(s => { s.estado = 'Anulada'; s.fAt = UI.ahora(); Prod._hist(of, 'Solicitud de transferencia anulada', s.id); });
  },
  cancelar(of) {
    if (!Prod.abierta(of)) throw new Error('La orden ya está ' + of.estado);
    if (Prod.tieneMovimientos(of)) throw new Error('La orden tiene emisiones o recibos: ciérrela en lugar de cancelarla');
    of.mats.forEach(m => { if (m.comp > 0) { Stock.liberar(Prod.almComp(m), m.cod, m.comp); m.comp = 0; } });
    Prod._anularPendientes(of);
    of.estado = 'Cancelado';
    Prod._hist(of, 'Orden cancelada', '');
  },
  cerrar(of) {
    if (of.estado !== 'Liberado') throw new Error('Solo se cierra una orden Liberada');
    of.mats.forEach(m => { if (m.comp > 0) { Stock.liberar(Prod.almComp(m), m.cod, m.comp); m.comp = 0; } });
    Prod._anularPendientes(of);
    const resto = Prod.enProceso(of);
    if (resto > 0.004 && of.prod > 0) {
      Stock.revalorizar(of.alm, of.art, resto); of.absorbido = UI.r2(of.absorbido + resto);
      Prod._hist(of, 'Diferencia de costo al cerrar', UI.s(resto) + ' emitido y no recibido se suma al costo de ' + of.art);
    }
    of.estado = 'Cerrado'; of.fechaCierre = UI.ahora();
    Prod._hist(of, 'Orden cerrada', 'Recibido ' + UI.n(of.prod, 0) + ' de ' + UI.n(of.cant, 0));
    if (of.sf) {
      const sf = Store.sf(of.sf);
      if (sf && sf.ofs.every(id => { const o = Store.of(id); return !o || !Prod.abierta(o); })) sf.est = 'Fabricada';
    }
  },

  /* ---------- líneas de la orden (como GI-17): solo artículos inventariables y recursos ---------- */
  _recalc(of) { of.mats.forEach(m => { m.plan = UI.r4(m.cons * of.cant); }); of.recs.forEach(r => { r.plan = UI.r4(r.cons * of.cant); }); },
  /* al modificar la lista a mano la orden pasa a Especial */
  _edit(of) { if (!Prod.editable(of)) throw new Error('Solo se editan las órdenes creadas en Producción mientras están Planificadas'); of.tipofab = 'Especial'; },
  agregarLinea(of, t) {
    Prod._edit(of);
    if (t.tipo === 'Texto') of.textos.push('');
    else if (t.tipo === 'Recurso') {
      const R = M.rec(t.cod); if (!R) throw new Error('Elija el recurso');
      of.recs.push({ cod: R.cod, cons: 1, plan: 0, u: R.u, metodo: R.tipo === 'RECURSO HUMANO' ? 'Manual' : 'Notificación', real: 0, costoReal: 0 });
    } else {
      const a = M.art(t.cod); if (!a) throw new Error('Elija el artículo');
      if (a.inv === false) throw new Error('Solo artículos inventariables: un servicio se agrega como recurso');
      of.mats.push({ cod: a.cod, cons: 1, plan: 0, u: a.u, alm: Prod.almRecibo(a.cod), metodo: Explosion.fabricable(a.cod) ? 'Manual' : 'Notificación', fab: Explosion.fabricable(a.cod), consumido: 0, comp: 0, valor: 0 });
    }
    Prod._recalc(of);
  },
  cambiarLinea(of, tipo, i, campo, valor) {
    Prod._edit(of);
    if (tipo === 'Texto') { of.textos[i] = valor; return; }
    const l = tipo === 'Recurso' ? of.recs[i] : of.mats[i];
    if (campo === 'cons') { const v = parseFloat(valor); if (!(v >= 0)) throw new Error('Cantidad no válida'); l.cons = UI.r4(v); }
    if (campo === 'alm') l.alm = valor;
    if (campo === 'metodo') l.metodo = valor === 'Notificación' ? 'Notificación' : 'Manual';
    Prod._recalc(of);
  },
  quitarLinea(of, tipo, i) {
    Prod._edit(of);
    if (tipo === 'Texto') of.textos.splice(i, 1);
    else if (tipo === 'Recurso') of.recs.splice(i, 1);
    else of.mats.splice(i, 1);
  },
  cambiarLDM(of, ldmId) {
    Prod._edit(of);
    const L = ldmId ? M.ldm(ldmId) : null;
    if (ldmId && (!L || L.art !== of.art)) throw new Error('Esa lista no es de este artículo');
    of.ldm = L ? L.id : ''; of.tipofab = L ? 'Estándar' : 'Especial';
    of.mats = L ? Explosion.materiales(L.id, of.cant) : []; of.recs = L ? Explosion.recursos(L.id, of.cant) : []; of.textos = L ? Explosion.textos(L.id) : [];
    Prod._hist(of, 'Lista de materiales', L ? 'Copiada ' + L.id : 'Sin lista');
  },
  cambiarCantidad(of, cant) {
    if (of.estado !== 'Planificado') throw new Error('La cantidad solo se cambia antes de liberar');
    cant = UI.r4(cant); if (!(cant > 0)) throw new Error('La cantidad debe ser mayor a 0');
    const ant = of.cant; of.cant = cant; Prod._recalc(of);
    of.mats.forEach(m => { if (m.comp > m.plan) { Stock.liberar(Prod.almComp(m), m.cod, UI.r4(m.comp - m.plan)); m.comp = m.plan; } });
    Prod._hist(of, 'Cantidad planificada', UI.n(ant, 0) + ' → ' + UI.n(cant, 0));
  },

  /* ---------- solicitudes de materiales: Producción pide qué y a dónde; Logística define el propósito POR LÍNEA ---------- */
  solicitudesDe(of) { return Store.d.sols.filter(s => s.of === of.id); },
  nomItem(cod) { const R = M.rec(cod); return R ? R.nom : M.nomArt(cod); },
  uItem(cod) { const R = M.rec(cod); return R ? R.u : M.u(cod); },
  /* almacenes (no de tránsito) con stock del artículo, distintos del destino */
  origenes(art, destino) {
    return M.ALMACENES.filter(a => !a.transito && a.cod !== destino && Stock.act(a.cod, art) > 0)
      .map(a => ({ cod: a.cod, act: Stock.act(a.cod, art) })).sort((a, b) => b.act - a.act);
  },
  /* cantidad ya pedida (línea pendiente o en compra) de un artículo hacia un almacén para la orden */
  pedido(of, art, alm) {
    return UI.r4(Prod.solicitudesDe(of).filter(s => s.estado !== 'Anulada' && s.destino === alm)
      .reduce((a, s) => a + s.lineas.filter(l => l.art === art && (l.estado === 'Pendiente' || l.estado === 'En compra')).reduce((z, l) => z + l.cant, 0), 0));
  },
  resumenSol(sol) {
    const c = {}; sol.lineas.forEach(l => { if (l.prop) c[l.prop] = (c[l.prop] || 0) + 1; });
    return Object.keys(c).map(p => c[p] + ' ' + p).join(' · ') || 'sin propósito';
  },
  /* items: [{art, cant, destino}] → una solicitud por almacén destino; las líneas nacen sin propósito */
  solicitarFaltantes(of, items, motivo) {
    if (!Prod.abierta(of)) throw new Error('La orden no está abierta');
    const grupos = {};
    items.forEach(x => {
      if (!(x.cant > 0)) throw new Error('Cantidad a solicitar no válida');
      const k = x.destino || '-';
      (grupos[k] = grupos[k] || { destino: x.destino || '', lineas: [] }).lineas.push({ art: x.art, cant: UI.r4(x.cant), prop: '', origen: '', doc: '', estado: 'Pendiente' });
    });
    return Object.values(grupos).map(g => {
      const sol = { id: Store.sig('sol', 'SOL-', 6), fecha: UI.ahora(), of: of.id, ref: of.ref, destino: g.destino, lineas: g.lineas, motivo: motivo || 'Falta stock para producir',
        estado: 'Pendiente', ing: '', fAt: '', solicita: Store.d.usuario };
      Store.d.sols.unshift(sol);
      Prod._hist(of, 'Solicitud de materiales ' + sol.id, (g.destino ? 'hacia ' + g.destino + ' · ' : '') + g.lineas.map(l => Prod.nomItem(l.art) + ' ' + UI.n(l.cant)).join(', '));
      return sol;
    });
  },
  /* Producción crea una solicitud a mano en PR-05: d = {of (opcional), destino, motivo, lineas: [{art, cant}]} */
  crearSolicitud(d) {
    const of = d.of ? Store.of(d.of) : null;
    if (d.of && !of) throw new Error('No existe la orden ' + d.of);
    if (!d.destino || !M.alm(d.destino)) throw new Error('Elija el almacén destino');
    const items = (d.lineas || []).filter(l => l.art);
    if (!items.length) throw new Error('Agregue al menos un artículo');
    items.forEach(l => { if (!(parseFloat(l.cant) > 0)) throw new Error('Cantidad no válida en ' + Prod.nomItem(l.art)); });
    const motivo = String(d.motivo || '').trim() || 'Solicitud de Producción';
    if (of) return Prod.solicitarFaltantes(of, items.map(l => ({ art: l.art, cant: parseFloat(l.cant), destino: d.destino })), motivo)[0];
    const sol = { id: Store.sig('sol', 'SOL-', 6), fecha: UI.ahora(), of: '', ref: '', destino: d.destino, motivo, estado: 'Pendiente', ing: '', fAt: '', solicita: Store.d.usuario,
      lineas: items.map(l => ({ art: l.art, cant: UI.r4(parseFloat(l.cant)), prop: '', origen: '', doc: '', estado: 'Pendiente' })) };
    Store.d.sols.unshift(sol);
    return sol;
  },
  /* Logística decide cada línea: d = {lineas: [{prop: 'Transferencia' | 'Compra', origen}], oc}; d.prop / d.origen aplican a todas */
  atenderSolicitud(id, d) {
    const sol = Store.d.sols.find(s => s.id === id);
    if (!sol || sol.estado !== 'Pendiente') throw new Error('Solo se atiende una solicitud Pendiente');
    d = d || {};
    const dec = sol.lineas.map((l, i) => { const x = (d.lineas || [])[i] || {}; return { l, prop: x.prop || d.prop || '', origen: x.origen || d.origen || '' }; });
    dec.forEach((x, i) => {
      const n = 'Línea ' + (i + 1) + ' (' + Prod.nomItem(x.l.art) + '): ';
      if (x.prop !== 'Transferencia' && x.prop !== 'Compra') throw new Error(n + 'elija el propósito');
      if (x.prop !== 'Transferencia') return;
      if (M.rec(x.l.art)) throw new Error(n + 'un servicio no se transfiere, se compra');
      if (!x.origen || !M.alm(x.origen)) throw new Error(n + 'elija el almacén de origen');
      if (x.origen === sol.destino) throw new Error(n + 'el origen no puede ser el almacén destino');
    });
    const oc = String(d.oc || '').trim();
    if (dec.some(x => x.prop === 'Compra') && !oc) throw new Error('Indique el número de la OC de las líneas de Compra');
    const rutas = {};
    dec.filter(x => x.prop === 'Transferencia').forEach(x => (rutas[x.origen] = rutas[x.origen] || []).push(x));
    Object.keys(rutas).forEach(o => {
      const f = Stock.faltantes(o, rutas[o].map(x => ({ art: x.l.art, cant: x.l.cant })));
      if (f.length) throw new Error('No se puede transferir. ' + Stock.textoFaltantes(o, f));
    });
    const of = Store.of(sol.of);
    Object.keys(rutas).forEach(o => {
      const r = Stock.transferencia({ det: 'Transferencia - Atención de ' + sol.id, origen: o, destino: sol.destino, ndoc: sol.of, lineas: rutas[o].map(x => ({ art: x.l.art, cant: x.l.cant })), obs: 'Logística (GI-11)' });
      if (!r.ok) throw new Error(r.error);
      rutas[o].forEach(x => Object.assign(x.l, { prop: 'Transferencia', origen: o, doc: r.mov.id, estado: 'Transferido' }));
    });
    dec.filter(x => x.prop === 'Compra').forEach(x => {
      Object.assign(x.l, { prop: 'Compra', origen: '', doc: oc, estado: 'En compra' });
      if (of && Prod.esServicio(x.l.art)) {
        const R = M.rec(x.l.art) || {};
        of.compras.push({ tipo: 'OC', doc: oc, rec: x.l.art, prov: R.prov || '', cant: x.l.cant, importe: UI.r2(x.l.cant * (R.costo || 0)), f: UI.ahora(), u: Store.d.usuario });
      }
    });
    sol.estado = sol.lineas.every(l => l.estado === 'Transferido') ? 'Atendida' : 'En proceso';
    sol.fAt = UI.ahora();
    if (of) Prod._hist(of, 'Solicitud atendida por Logística', sol.id + ' · ' + Prod.resumenSol(sol));
    return sol;
  },
  /* llegada de lo comprado: artículos → ingreso al almacén destino (GI-09); servicios → conformidad, sin stock */
  recibirCompra(id) {
    const sol = Store.d.sols.find(s => s.id === id), lineas = sol ? sol.lineas.filter(l => l.estado === 'En compra') : [];
    if (!lineas.length) throw new Error('La solicitud no tiene líneas en compra');
    const arts = lineas.filter(l => !M.rec(l.art));
    if (arts.length) {
      const r = Stock.ingreso({ det: 'Ingreso - Compra ' + arts[0].doc, alm: sol.destino, origen: arts[0].doc, ndoc: sol.of, lineas: arts.map(l => ({ art: l.art, cant: l.cant, costo: Stock.costo(sol.destino, l.art) })), obs: 'Atiende ' + sol.id + ' (GI-09)' });
      sol.ing = r.mov.id;
    }
    lineas.forEach(l => { l.estado = 'Recibido'; });
    Object.assign(sol, { estado: 'Atendida', fAt: UI.ahora() });
    const of = Store.of(sol.of);
    if (of) Prod._hist(of, arts.length ? 'Compra recibida' : 'Conformidad del servicio', sol.id + ' · ' + lineas[0].doc + (sol.ing ? ' · ' + sol.ing : ''));
    return sol;
  },
  anularSolicitud(id) {
    const sol = Store.d.sols.find(s => s.id === id);
    if (!sol || sol.estado !== 'Pendiente') throw new Error('Solo se anula una solicitud Pendiente');
    sol.estado = 'Anulada'; sol.fAt = UI.ahora();
    const of = Store.of(sol.of); if (of) Prod._hist(of, 'Solicitud de materiales anulada', sol.id);
  },

  /* ---------- fase tercerizada: la orden se vincula a la compra del servicio; los materiales van al almacén del proveedor ---------- */
  lineasTercero(of) { return of.mats.filter(m => (M.alm(m.alm) || {}).transito); },
  tercerizar(of, d) {
    if (!Prod.abierta(of)) throw new Error('La orden no está abierta');
    if (of.tercero) throw new Error('La orden ya está tercerizada');
    if (Prod.tieneMovimientos(of)) throw new Error('La orden ya tiene emisiones o recibos');
    const P = M.prov(d.prov), A = M.alm(d.alm), R = M.rec(d.rec);
    if (!R || !Prod.esServicio(R.cod)) throw new Error('Elija el servicio');
    if (!P) throw new Error('Elija el proveedor');
    if (!A || !A.transito) throw new Error('Elija el almacén del proveedor');
    of.mats.forEach(m => { if (!(M.alm(m.alm) || {}).transito) { m.almPropio = m.alm; m.alm = A.cod; } });
    const quitados = of.recs.filter(r => !Prod.esServicio(r.cod)).map(r => r.cod);
    of.recs = of.recs.filter(r => Prod.esServicio(r.cod));
    if (!of.recs.some(r => r.cod === R.cod)) of.recs.push({ cod: R.cod, cons: 1, plan: of.cant, u: R.u, metodo: 'Notificación', real: 0, costoReal: 0 });
    of.tercero = { prov: P.cod, alm: A.cod, rec: R.cod, f: UI.ahora() };
    of.tipofab = 'Especial';
    Prod._hist(of, 'Fase tercerizada', P.nom + ' · ' + R.nom + ' · materiales hacia ' + A.cod + (quitados.length ? ' · se quitan ' + quitados.join(', ') : ''));
    const sols = d.solicitar === false ? [] : Prod.solicitarFaltantes(of, [{ art: R.cod, cant: of.cant, destino: '' }], 'Compra de servicio: ' + R.nom + ' (' + P.nom + ')');
    return { sols };
  },
  /* envío al proveedor: transferencia de lo que la fase consume en el almacén del proveedor (GRE: traslado para transformación) */
  enviarProveedor(of, d) {
    if (of.estado !== 'Liberado') throw new Error('Libere la orden antes de enviar');
    const cant = UI.r4(d.cant);
    if (!(cant > 0)) throw new Error('Indique la cantidad a enviar');
    const lineas = Prod.lineasTercero(of);
    if (!lineas.length) throw new Error('La orden no tiene materiales en un almacén de proveedor');
    const rutas = {};
    lineas.forEach(m => { const origen = m.almPropio || Prod.almRecibo(m.cod), k = origen + '|' + m.alm; (rutas[k] = rutas[k] || { origen, destino: m.alm, items: [] }).items.push({ m, cant: UI.r4(m.cons * cant) }); });
    Object.values(rutas).forEach(g => {
      const f = Stock.faltantes(g.origen, g.items.map(x => ({ art: x.m.cod, cant: x.cant })));
      if (f.length) throw new Error('No se puede enviar. ' + Stock.textoFaltantes(g.origen, f));
    });
    of.envios = of.envios || [];
    const env = { n: of.envios.length + 1, f: d.fecha || UI.ahora(), cant, guia: 'GRE T001-' + String(Store.d.seq.gre++).padStart(6, '0'), movs: [] };
    Object.values(rutas).forEach(g => {
      const r = Stock.transferencia({ det: 'Transferencia - Envío a servicio de terceros (' + env.guia + ')', origen: g.origen, destino: g.destino, ndoc: of.id, lineas: g.items.map(x => ({ art: x.m.cod, cant: x.cant })), obs: 'Traslado de bienes para transformación' });
      if (!r.ok) throw new Error(r.error);
      env.movs.push(r.mov.id);
      g.items.forEach(x => { if (x.m.almPropio && x.m.comp > 0) { const l = Math.min(x.m.comp, x.cant); Stock.liberar(x.m.almPropio, x.m.cod, l); x.m.comp = UI.r4(x.m.comp - l); } });
    });
    of.envios.push(env);
    Prod._hist(of, 'Envío al proveedor ' + env.n, UI.n(cant, 0) + ' ' + M.u(of.art) + ' · ' + env.movs.join(', '));
    return env;
  },

  /* ---------- consumo ---------- */
  /* items: [{i, m, cant}] con stock suficiente → salidas por almacén; devuelve las líneas valorizadas */
  _consumir(of, items, det, obs, movs) {
    const porAlm = {};
    items.forEach(x => (porAlm[x.m.alm] = porAlm[x.m.alm] || []).push(x));
    const lineas = [];
    Object.keys(porAlm).forEach(alm => {
      const lin = porAlm[alm].map(x => ({ art: x.m.cod, cant: x.cant, liberaComp: x.m.almPropio ? 0 : Math.min(x.m.comp, x.cant) }));
      const r = Stock.salida({ det, alm, destino: of.id, ndoc: of.id, lineas: lin, obs });
      if (!r.ok) throw new Error(r.error);
      movs.push(r.mov.id);
      porAlm[alm].forEach((x, k) => {
        const valor = r.mov.lineas[k].valor;
        x.m.comp = UI.r4(x.m.comp - lin[k].liberaComp); x.m.consumido = UI.r4(x.m.consumido + x.cant); x.m.valor = UI.r2((x.m.valor || 0) + valor);
        of.costo.mat = UI.r2(of.costo.mat + valor);
        lineas.push({ i: x.i, cod: x.m.cod, u: x.m.u, alm, cant: x.cant, valor });
      });
    });
    return lineas;
  },
  /* items: [{i, r, cant, operarios}] → horas o unidades valorizadas con el costo estándar del recurso */
  _consumirRec(of, items) {
    return items.map(x => {
      const R = M.rec(x.r.cod) || {}, valor = UI.r2(x.cant * (R.costo || 0));
      x.r.real = UI.r4(x.r.real + x.cant); x.r.costoReal = UI.r2(x.r.costoReal + valor);
      if (Prod.esServicio(x.r.cod)) of.costo.serv = UI.r2(of.costo.serv + valor); else of.costo.rec = UI.r2(of.costo.rec + valor);
      return { i: x.i, cod: x.r.cod, u: x.r.u, cant: x.cant, valor, operarios: x.operarios || [] };
    });
  },
  /* d: {fecha, obs, mats:{i: cant}, recs:{i: {cant, operarios:[{ope, horas}]}}}; lo que falta se pide con una Solicitud de materiales */
  emitir(of, d) {
    if (of.estado !== 'Liberado') throw new Error('Libere la orden antes de emitir');
    const mats = [], recs = [], faltan = [];
    Object.keys(d.mats || {}).forEach(k => {
      const v = d.mats[k], i = Number(k), m = of.mats[i];
      if (!m || v == null || v === '') return;
      const cant = UI.r4(v);
      if (!(parseFloat(v) >= 0)) throw new Error('Cantidad no válida en ' + M.nomArt(m.cod));
      if (!cant) return;
      if (m.metodo === 'Notificación') throw new Error(M.nomArt(m.cod) + ' es de método Notificación: se consume al registrar el recibo');
      const sale = UI.r4(Math.min(cant, Math.max(0, Stock.act(m.alm, m.cod)))), falta = UI.r4(cant - sale);
      if (falta > 0) faltan.push({ art: m.cod, cant: falta, destino: m.alm });
      if (sale > 0) mats.push({ i, m, cant: sale });
    });
    Object.keys(d.recs || {}).forEach(k => {
      const x = d.recs[k] || {}, i = Number(k), r = of.recs[i];
      if (!r) return;
      const R = M.rec(r.cod) || {};
      const operarios = (x.operarios || []).filter(o => o.ope).map(o => ({ ope: o.ope, horas: UI.r4(o.horas) }));
      if (operarios.some(o => !(o.horas > 0))) throw new Error('Indique las horas de cada operario de ' + (R.nom || r.cod));
      if (operarios.some(o => (Prod.operario(o.ope) || {}).rec !== r.cod)) throw new Error('Los operarios de ' + (R.nom || r.cod) + ' deben ocupar ese recurso');
      const cant = operarios.length ? UI.r4(operarios.reduce((s, o) => s + o.horas, 0)) : UI.r4(x.cant);
      if (!operarios.length && x.cant !== '' && x.cant != null && !(parseFloat(x.cant) >= 0)) throw new Error('Cantidad no válida en ' + (R.nom || r.cod));
      if (!cant) return;
      if (r.metodo === 'Notificación') throw new Error((R.nom || r.cod) + ' es de método Notificación: se registra con el recibo');
      recs.push({ i, r, cant, operarios });
    });
    if (!mats.length && !recs.length && !faltan.length) throw new Error('Indique al menos una cantidad a emitir');
    let em = null;
    if (mats.length || recs.length) {
      em = { n: of.emisiones.length + 1, f: d.fecha || UI.ahora(), obs: d.obs || '', lineas: [], recursos: [], movs: [], sols: [], valor: 0 };
      em.lineas = Prod._consumir(of, mats, 'Salida - Emisión para producción', 'Emisión ' + em.n, em.movs);
      em.recursos = Prod._consumirRec(of, recs);
      em.valor = UI.r2(em.lineas.concat(em.recursos).reduce((a, x) => a + x.valor, 0));
      of.emisiones.push(em);
      Prod._hist(of, 'Emisión ' + em.n, (em.movs.join(', ') || 'solo recursos') + ' · ' + UI.s(em.valor));
    }
    const sols = faltan.length ? Prod.solicitarFaltantes(of, faltan, 'Falta stock para emitir') : [];
    if (em) em.sols = sols.map(s => s.id);
    return { em, sols };
  },
  /* líneas Notificación que no alcanzan para recibir "cant" (agrupadas por almacén y artículo) */
  faltantesNotificacion(of, cant) {
    const req = {};
    of.mats.forEach(m => { if (m.metodo !== 'Notificación') return; const k = m.alm + '|' + m.cod; req[k] = UI.r4((req[k] || 0) + m.cons * cant); });
    return Object.keys(req).map(k => { const p = k.split('|'), act = Stock.act(p[0], p[1]); return { alm: p[0], cod: p[1], req: req[k], act, falta: UI.r4(req[k] - Math.max(0, act)) }; })
      .filter(x => x.falta > 0.00005);
  },
  estimarRecibo(of, cant) {
    const pend = Prod.pendiente(of);
    const back = UI.r2(of.mats.filter(m => m.metodo === 'Notificación').reduce((a, m) => a + m.cons * cant * Stock.costo(m.alm, m.cod), 0) +
      of.recs.filter(r => r.metodo === 'Notificación').reduce((a, r) => a + r.cons * cant * ((M.rec(r.cod) || {}).costo || 0), 0));
    const wip = UI.r2(pend > 0 ? Prod.enProceso(of) * (cant >= pend - 0.0001 ? 1 : cant / pend) : 0);
    return { back, wip, total: UI.r2(back + wip) };
  },
  /* d: {fecha, cant, obs} → consume lo Notificación, entra lo producido con el costo del consumo + la parte de lo emitido */
  recibir(of, d) {
    if (of.estado !== 'Liberado') throw new Error('Libere la orden antes de recibir');
    const cant = UI.r4(d.cant);
    if (!(cant > 0)) throw new Error('Indique la cantidad producida');
    const pend = Prod.pendiente(of);
    if (cant > pend + 0.0001) throw new Error('Quedan por recibir ' + UI.n(pend, 0) + ' ' + M.u(of.art) + ': no se pueden recibir ' + UI.n(cant, 0));
    const falt = Prod.faltantesNotificacion(of, cant);
    if (falt.length) throw new Error('Falta stock para el consumo por notificación: ' + falt.map(f => M.nomArt(f.cod) + ' en ' + f.alm + ' (faltan ' + UI.n(f.falta) + ')').join('; ') + '. Solicite una transferencia');
    const rc = { n: of.recibos.length + 1, f: d.fecha || UI.ahora(), cant, obs: d.obs || '', lineas: [], recursos: [], movs: [], costo: 0, cu: 0 };
    const wip = Prod.enProceso(of), factor = cant >= pend - 0.0001 ? 1 : cant / pend;
    rc.lineas = Prod._consumir(of, of.mats.map((m, i) => ({ i, m, cant: UI.r4(m.cons * cant) })).filter(x => x.m.metodo === 'Notificación' && x.cant > 0),
      'Salida - Emisión para producción (notificación)', 'Recibo ' + rc.n, rc.movs);
    rc.recursos = Prod._consumirRec(of, of.recs.map((r, i) => ({ i, r, cant: UI.r4(r.cons * cant) })).filter(x => x.r.metodo === 'Notificación' && x.cant > 0));
    const back = rc.lineas.concat(rc.recursos).reduce((a, x) => a + x.valor, 0);
    rc.costo = UI.r2(back + wip * factor);
    const ing = Stock.ingreso({ det: 'Ingreso - Recibo de producción', alm: of.alm, origen: of.id, ndoc: of.id, lineas: [{ art: of.art, cant, costo: UI.r4(rc.costo / cant) }], obs: 'Recibo ' + rc.n });
    rc.movs.push(ing.mov.id);
    rc.cu = UI.r2(rc.costo / cant);
    of.absorbido = UI.r2(of.absorbido + rc.costo); of.prod = UI.r4(of.prod + cant);
    of.recibos.push(rc);
    Prod._hist(of, 'Recibo ' + rc.n, UI.n(cant, 0) + ' ' + M.u(of.art) + ' · ' + rc.movs.join(', '));
    return rc;
  },

  /* ---------- costo ---------- */
  costoDetalle(of) {
    const mats = {}, recs = {};
    of.emisiones.concat(of.recibos).forEach(doc => {
      doc.lineas.forEach(c => { const x = mats[c.cod] = mats[c.cod] || { cod: c.cod, u: c.u, cant: 0, valor: 0 }; x.cant = UI.r4(x.cant + c.cant); x.valor = UI.r2(x.valor + c.valor); });
      doc.recursos.forEach(r => { const x = recs[r.cod] = recs[r.cod] || { cod: r.cod, u: r.u, cant: 0, valor: 0 }; x.cant = UI.r4(x.cant + r.cant); x.valor = UI.r2(x.valor + r.valor); });
    });
    return { mats: Object.values(mats), recs: Object.values(recs) };
  },
  /* servicios de terceros: costo estándar cargado a la orden vs compra (factura, o la OC si aún no hay factura, menos notas de crédito) */
  TIPOS_COMPRA: ['OC', 'Factura', 'Nota de crédito'],
  contrasteServicios(of) {
    return [...new Set(of.recs.filter(r => Prod.esServicio(r.cod)).map(r => r.cod))].map(cod => {
      const ls = of.recs.filter(r => r.cod === cod), docs = of.compras.filter(c => c.rec === cod);
      const suma = t => docs.filter(c => c.tipo === t).reduce((a, c) => a + c.importe, 0);
      const estandar = UI.r2(ls.reduce((a, r) => a + r.costoReal, 0));
      const real = UI.r2((docs.some(c => c.tipo === 'Factura') ? suma('Factura') : suma('OC')) - suma('Nota de crédito'));
      return { cod, cant: UI.r4(ls.reduce((a, r) => a + r.real, 0)), estandar, docs, real, dif: docs.length ? UI.r2(real - estandar) : null };
    });
  },
  registrarCompra(of, c) {
    const doc = String(c.doc || '').trim(), importe = UI.r2(c.importe), tipo = Prod.TIPOS_COMPRA.indexOf(c.tipo) >= 0 ? c.tipo : 'OC';
    if (!Prod.esServicio(c.rec) || !of.recs.some(r => r.cod === c.rec)) throw new Error('Elija un servicio de la orden');
    if (!doc) throw new Error('Indique el número del documento');
    if (!(importe > 0)) throw new Error('Indique el importe');
    const R = M.rec(c.rec) || {};
    of.compras.push({ tipo, doc, rec: c.rec, prov: R.prov || '', cant: UI.r4(c.cant), importe, f: UI.ahora(), u: Store.d.usuario });
    Prod._hist(of, tipo + ' ' + doc, (R.nom || c.rec) + ' · ' + UI.s(importe));
  },

  /* ---------- producto fallado (no hay tipo Ajuste): salida del artículo + ingreso del artículo "FALLADO" al mismo costo ---------- */
  MOTIVOS_FALLA: ['Defecto de corte', 'Defecto de confección', 'Defecto de lavandería (servicio de terceros)', 'Defecto de acabado', 'Otro'],
  falladoDe(art) { const a = M.art(art); return a ? M.ARTICULOS.find(x => x.nom === a.nom + ' FALLADO') || null : null; },
  reclasificarFallado(d) {
    const A = M.art(d.art), F = M.art(d.fallado), cant = UI.r4(d.cant), obs = String(d.obs || '').trim();
    if (!A || !F || A.cod === F.cod) throw new Error('Elija el artículo fallado (distinto del original)');
    if (!(cant > 0)) throw new Error('Indique la cantidad fallada');
    if (!d.motivo) throw new Error('Indique el motivo del defecto');
    if (!obs) throw new Error('Justifique el movimiento en la observación');
    if (Stock.act(d.alm, A.cod) + 0.00005 < cant) throw new Error('Solo hay ' + UI.n(Stock.act(d.alm, A.cod)) + ' de ' + A.nom + ' en ' + d.alm);
    Store.d.seq.fall = Store.d.seq.fall || 1;
    const doc = 'FALL-' + String(Store.d.seq.fall++).padStart(4, '0'), costo = Stock.costo(d.alm, A.cod), just = d.motivo + ' · ' + obs;
    const s = Stock.salida({ det: 'Salida - Producto fallado', alm: d.alm, destino: F.cod, ndoc: doc, lineas: [{ art: A.cod, cant, liberaComp: 0 }], obs: just });
    if (!s.ok) throw new Error(s.error);
    const i = Stock.ingreso({ det: 'Ingreso - Producto fallado', alm: d.alm, origen: A.cod, ndoc: doc, lineas: [{ art: F.cod, cant, costo }], obs: just });
    return { doc, salida: s.mov.id, ingreso: i.mov.id, costo };
  },
  /* orden Especial que vuelve a fabricar el artículo: consume el fallado y solo lleva mano de obra */
  crearReproceso(d) {
    const R = M.rec(d.rec), cant = UI.r4(d.cant), horas = UI.r4(d.horas);
    if (!R || R.tipo !== 'RECURSO HUMANO') throw new Error('Elija la mano de obra del reproceso');
    if (!(horas > 0)) throw new Error('Indique las horas por unidad del reproceso');
    if (!M.art(d.fallado)) throw new Error('Elija el artículo fallado');
    const of = Prod.crearManual({ art: d.art, cant, alm: d.alm, ref: d.ref, obs: 'Reproceso de ' + M.nomArt(d.fallado) })[0];
    Prod.agregarLinea(of, { tipo: 'Artículo', cod: d.fallado });
    Prod.cambiarLinea(of, 'Artículo', 0, 'alm', d.alm); Prod.cambiarLinea(of, 'Artículo', 0, 'metodo', 'Manual');
    Prod.agregarLinea(of, { tipo: 'Recurso', cod: R.cod }); Prod.cambiarLinea(of, 'Recurso', 0, 'cons', horas); Prod.cambiarLinea(of, 'Recurso', 0, 'metodo', 'Manual');
    Prod._hist(of, 'Orden de reproceso', 'Consume ' + M.nomArt(d.fallado) + ' · solo mano de obra (' + R.nom + ')');
    return of;
  },
  /* documentos que generó la orden (salidas, ingresos y transferencias con la orden como documento) */
  movimientosOF(of) { return Store.d.movs.filter(m => m.ndoc === of.id).slice().reverse(); },

  adjuntar(of, nombre, desc) {
    if (!nombre) throw new Error('Elija el archivo');
    of.adj.push({ nombre, desc: desc || '', f: UI.ahora(), u: Store.d.usuario });
    Prod._hist(of, 'Adjunto', nombre);
  }
};
