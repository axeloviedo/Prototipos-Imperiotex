/* COMERCIAL V9 — caja: una ABIERTA por tienda y moneda. Es de la tienda (no de quien la abre): la opera su personal.
   Cobros (pagos de las ventas, se validan), ingresos, egresos y devoluciones de dinero; cierre con conteo ciego. */
const Caja = {
  abierta(sede, mon) { return Store.d.sesiones.find(s => s.sede === sede && s.mon === mon && s.estado === 'Abierta'); },
  ultima(cajaCod) { return Store.d.sesiones.find(s => s.caja === cajaCod); },

  abrir(cajaCod, inicial, obs) {
    Store.exigir('crear_caja', 'abrir la caja');
    const c = M.caja(cajaCod);
    if (!c) throw new Error('Elija la caja');
    const u = Store.usuario();
    if (c.sede !== u.sede) throw new Error('Solo puede abrir una caja de su tienda (' + Store.sede().nom + ')');
    if (Caja.abierta(c.sede, c.mon)) throw new Error(c.nom + ' ya está abierta');
    const m = Number(inicial);
    if (inicial === '' || inicial == null || isNaN(m) || m < 0) throw new Error('El monto inicial debe ser cero o mayor');
    const s = { id: Store.sig('caj', 'CAJ-', 6), caja: c.cod, nom: c.nom, sede: c.sede, mon: c.mon, inicial: UI.r2(m), estado: 'Abierta', abre: { f: UI.ahora(), u: u.nom }, obs: obs || '', cierre: null };
    Store.d.sesiones.unshift(s);
    return s;
  },

  cobros(s) {
    const r = [];
    Store.d.ventas.forEach(v => v.pagos.forEach(p => { if (p.caja === s.id) r.push({ v, p }); }));
    return r.sort((a, b) => UI.aFecha(b.p.fecha) - UI.aFecha(a.p.fecha));
  },
  movs(s) { return Store.d.cmovs.filter(m => m.sesion === s.id); },
  porValidar(s) { return Caja.cobros(s).filter(x => x.p.estado === 'Por validar'); },

  /* resumen por medio de pago; solo el EFECTIVO se cuenta y cuadra */
  resumen(s) {
    const met = {};
    const add = (cod, k, v) => { const x = met[cod] = met[cod] || { cobros: 0, devol: 0 }; x[k] = UI.r2(x[k] + v); };
    Caja.cobros(s).forEach(x => { if (x.p.estado === 'Validado') add(x.p.met, 'cobros', x.p.monto); });
    let ing = 0, egr = 0;
    Caja.movs(s).filter(m => m.estado !== 'Anulado').forEach(m => {
      if (m.tipo === 'Ingreso') ing += m.monto;
      else if (m.tipo === 'Egreso') egr += m.monto;
      else if (m.tipo === 'Devolución') add(m.met, 'devol', m.monto);
    });
    const efe = met.EFE || { cobros: 0, devol: 0 }, pv = Caja.porValidar(s);
    return {
      met, ingresos: UI.r2(ing), egresos: UI.r2(egr),
      cobros: UI.r2(Object.keys(met).reduce((t, k) => t + met[k].cobros, 0)),
      devoluciones: UI.r2(Object.keys(met).reduce((t, k) => t + met[k].devol, 0)),
      esperado: UI.r2(s.inicial + efe.cobros + ing - egr - efe.devol),
      nPorValidar: pv.length, porValidar: UI.r2(pv.reduce((t, x) => t + x.p.monto, 0))
    };
  },

  _abierta(s) {
    if (!s) throw new Error('Caja no encontrada');
    if (s.estado !== 'Abierta') throw new Error('La caja ' + s.id + ' está cerrada');
  },
  _deSuTienda(s) {
    if (s.sede !== Store.usuario().sede) throw new Error('La caja es de ' + Store.sede(s.sede).nom + ': solo la opera el personal de esa tienda');
  },
  _datosMov(s, x, id) {
    if (['Ingreso', 'Egreso'].indexOf(x.tipo) < 0) throw new Error('Tipo de movimiento no válido');
    const cats = x.tipo === 'Ingreso' ? Store.d.cfg.catIngreso : Store.d.cfg.catEgreso;
    if (cats.indexOf(x.cat) < 0) throw new Error('Elija la categoría del ' + x.tipo.toLowerCase());
    if (String(x.desc || '').trim().length < 5) throw new Error('La descripción debe tener al menos 5 caracteres');
    const m = Number(x.monto);
    if (!(m > 0)) throw new Error('El monto debe ser mayor que cero');
    if (x.tipo === 'Egreso') {
      const previo = id ? (Store.d.cmovs.find(k => k.id === id) || {}).monto || 0 : 0;
      const hay = Caja.resumen(s).esperado + (id ? previo : 0);
      if (m > hay + 0.001) throw new Error('No hay efectivo suficiente en caja para ese egreso');
    }
    return { cat: x.cat, desc: String(x.desc).trim(), monto: UI.r2(m) };
  },
  movimiento(s, x) {
    Store.exigir('crear_caja', 'registrar ingresos o egresos');
    Caja._abierta(s); Caja._deSuTienda(s);
    const mv = Object.assign({ id: Store.sig('mc', 'MC-', 6), sesion: s.id, tipo: x.tipo, met: 'EFE', fecha: UI.ahora(), usuario: Store.usuario().nom, estado: 'Procesado' }, Caja._datosMov(s, x));
    Store.d.cmovs.unshift(mv);
    return mv;
  },
  editarMov(id, x) {
    Store.exigir('editar_caja', 'editar movimientos de caja');
    const mv = Store.d.cmovs.find(m => m.id === id);
    if (!mv) throw new Error('Movimiento no encontrado');
    const s = Store.sesion(mv.sesion);
    Caja._abierta(s); Caja._deSuTienda(s);
    if (mv.tipo === 'Devolución') throw new Error('Una devolución de dinero no se edita: anúlela y vuelva a registrarla');
    if (mv.estado === 'Anulado') throw new Error('El movimiento está anulado');
    Object.assign(mv, Caja._datosMov(s, Object.assign({ tipo: mv.tipo }, x), id), { editado: { f: UI.ahora(), u: Store.usuario().nom } });
    return mv;
  },
  /* no se borra: se anula (queda en el histórico). Anular una devolución de dinero la deja otra vez pendiente */
  anularMov(id, motivo) {
    Store.exigir('editar_caja', 'anular movimientos de caja');
    const mv = Store.d.cmovs.find(m => m.id === id);
    if (!mv) throw new Error('Movimiento no encontrado');
    const s = Store.sesion(mv.sesion);
    Caja._abierta(s); Caja._deSuTienda(s);
    if (mv.estado === 'Anulado') throw new Error('El movimiento ya está anulado');
    if (!String(motivo || '').trim()) throw new Error('Indique el motivo');
    if (mv.tipo === 'Devolución') {
      const v = Store.venta(mv.venta), re = v && v.reembolsos.find(r => r.id === mv.ree);
      if (re) { re.estado = 'Pendiente'; re.mov = null; re.caja = null; Store.hist(v, 'Devolución de dinero anulada', mv.id + ' · ' + motivo); }
    }
    mv.estado = 'Anulado';
    mv.anulado = { f: UI.ahora(), u: Store.usuario().nom, motivo };
    return mv;
  },

  reembolsosPendientes(sede, mon) {
    const r = [];
    Store.d.ventas.forEach(v => {
      if (v.mon !== mon || (sede && v.sede !== sede)) return;
      v.reembolsos.forEach(re => { if (re.estado === 'Pendiente') r.push({ v, re }); });
    });
    return r;
  },
  procesarReembolso(s, ventaId, reId, x) {
    Store.exigir('crear_caja', 'devolver dinero');
    Caja._abierta(s); Caja._deSuTienda(s);
    const v = Store.venta(ventaId), re = v && v.reembolsos.find(r => r.id === reId);
    if (!re) throw new Error('Devolución de dinero no encontrada');
    if (re.estado !== 'Pendiente') throw new Error('La devolución de dinero ya está ' + re.estado);
    if (v.mon !== s.mon) throw new Error('La venta es en ' + v.mon + ': use la caja en esa moneda');
    const m = M.metodo(x.met);
    if (!m) throw new Error('Elija cómo se devuelve el dinero');
    if (m.monedas.indexOf(s.mon) < 0) throw new Error(m.nom + ' no acepta ' + s.mon);
    if (m.bancos.length && m.bancos.indexOf(x.banco) < 0) throw new Error('Elija el banco de ' + m.nom);
    if (!m.efectivo && !String(x.nop || '').trim()) throw new Error('Ingrese el N° de operación');
    if (m.efectivo && re.monto > Caja.resumen(s).esperado + 0.001) throw new Error('No hay efectivo suficiente en caja para devolver ' + UI.m(re.monto, s.mon));
    const anul = re.origen === 'Anulación';
    const mv = { id: Store.sig('mc', 'MC-', 6), sesion: s.id, tipo: 'Devolución', cat: anul ? 'Anulación de venta' : 'Devolución de venta', desc: (anul ? 'Anulación de ' + v.id : re.origen + ' de ' + v.id) + ' · ' + v.cliente.nom, monto: re.monto, met: x.met, banco: x.banco || '', nop: x.nop || '', fecha: UI.ahora(), usuario: Store.usuario().nom, estado: 'Procesado', venta: v.id, ree: re.id };
    Store.d.cmovs.unshift(mv);
    Object.assign(re, { estado: 'Procesado', mov: mv.id, caja: s.id });
    Store.hist(v, 'Dinero devuelto al cliente', UI.m(re.monto, v.mon) + ' · ' + m.nom + ' · ' + mv.id);
    return mv;
  },

  /* C2: no se cierra con pagos por validar. Conteo ciego: el cajero declara lo contado sin ver el esperado */
  cerrar(s, contado, obs) {
    Store.exigir('editar_caja', 'cerrar la caja');
    Caja._abierta(s); Caja._deSuTienda(s);
    const pv = Caja.porValidar(s);
    if (pv.length) throw new Error('Hay ' + pv.length + ' pago(s) por validar: valídelos o recházelos antes de cerrar');
    const c = Number(contado);
    if (contado === '' || contado == null || isNaN(c) || c < 0) throw new Error('Ingrese el efectivo contado');
    const r = Caja.resumen(s);
    s.estado = 'Cerrada';
    s.cierre = { f: UI.ahora(), u: Store.usuario().nom, contado: UI.r2(c), esperado: r.esperado, dif: UI.r2(c - r.esperado), obs: obs || '', resumen: r };
    return s;
  }
};
