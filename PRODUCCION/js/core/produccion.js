/* PRODUCCION · Producción — servicios de la Orden de Fabricación (como SAP Business One, con operarios), sobre la BASE COMPARTIDA.
   Todo se lee y escribe en BD.d (ofs, sfs, sols, stock, movs, gres); el stock solo lo mueve Stock y los documentos compartidos Docs.
   No guarda: quien llama ejecuta BD.guardar() (App.accion lo hace); los Docs.* guardan por su cuenta.
   - Estándar: usa la lista de materiales sin cambios. Especial: la lista se modificó a mano o la orden no tiene lista.
   - Las órdenes de una Solicitud de Fabricación nacen Liberadas: Docs.sf.convertir libera lo que comprometió la solicitud y cada orden compromete lo suyo.
   - Las órdenes creadas en Producción nacen Planificadas, se pueden editar y comprometen su materia prima al liberarse.
   - Emisión para producción (Salida): consume las líneas Manual; los recursos llevan el detalle de sus operarios.
   - Recibo de producción (Ingreso): entra lo producido y se consumen las líneas Notificación.
   - Si falta stock se emite lo que hay y se crea una Solicitud de materiales (Docs.sol): Logística la atiende en Inventarios (GI-13).
   - Servicio de terceros: recurso con costo estándar (mismo código que el artículo SRV). Se pide con una Solicitud de materiales,
     Logística crea la OC de servicio, Compras la aprueba y factura (Docs.oc / Docs.fac agregan of.compras) y aquí se contrasta.
   - Envío al proveedor (J3, T2/T7): Solicitud de Transferencia directa (Docs.trf.directa: crea, aprueba y recibe; el tránsito es virtual)
     al almacén de tránsito + GRE «Traslado de bienes para transformación» (Docs.gre) enlazada al movimiento.
   - Tipos de movimiento (BD.d.maestros.tiposMovimiento): emisión SAL-USOPROD (SAL-MAQUILA si se consume en un almacén de tránsito,
     es decir material en poder del proveedor) · recibo ING-PROD · envío al proveedor TRF-FABRIC · producto fallado SAL-FALLADO + ING-FALLADO.
   - Producto fallado (J1: no existe el tipo Ajuste; J2): salida del artículo + ingreso del artículo "FALLADO" al mismo costo;
     el reproceso es una orden Especial solo con mano de obra. */
const Prod = {
  MODULO: 'Producción',
  _hist(of, a, d) { of.hist.push({ f: UI.ahora(), a, d: d || '', u: BD.usuario }); },
  nombreRef() { return (BD.d.config || {}).nombreRef || 'N° Referencia'; },
  /* almacén propuesto donde entra lo producido: el que usan las listas de materiales para tomarlo. Sin propuesta queda vacío
     y el usuario debe elegirlo (decisión L1: el artículo no tiene almacén por defecto y nunca se asume SB-CENTRAL) */
  almRecibo(art) { return Explosion.almDe(art) || ''; },
  /* almacén (no de tránsito) donde el artículo tiene más stock: origen del envío al proveedor del servicio */
  almStock(art) { const s = BD.d.stock.filter(x => x.art === art && x.act > 0 && !(M.alm(x.alm) || {}).transito).sort((a, b) => b.act - a.act)[0]; return s ? s.alm : ''; },
  /* el nombre de la referencia es solo la etiqueta del campo (un texto por empresa): se edita desde PR-04 */
  renombrarRef(nom) { nom = String(nom || '').trim(); if (!nom) throw new Error('Indique el nombre'); (BD.d.config = BD.d.config || {}).nombreRef = nom; return nom; },
  nuevaRef() { return BD.sig('ref', '', 4); },
  operario(cod) { return BD.operario(cod); },
  abierta(of) { return of.estado === 'Planificado' || of.estado === 'Liberado'; },
  editable(of) { return of.origen !== 'Solicitud' && of.estado === 'Planificado'; },
  /* almacén donde está comprometida la línea (en una fase tercerizada a mano, el propio hasta que se envía) */
  almComp(m) { return m.almPropio || m.alm; },
  /* lo que ESTA orden puede consumir de la línea (Q3): el Disponible del almacén (nadie más lo reservó) + lo que la propia orden ya comprometió ahí.
     En una fase tercerizada a mano el compromiso está en el almacén propio, no en el de tránsito donde se consume. */
  dispPara(m) { return UI.r4(Math.max(0, Stock.disp(m.alm, m.cod)) + (m.almPropio ? 0 : m.comp)); },
  /* lo que a la línea le falta reservar y aún no se pidió a Logística: planificado − consumido − comprometido − pedido (en camino) */
  faltaPedir(of, m) { return UI.r4(Math.max(0, m.plan - m.consumido - m.comp - Prod.pedido(of, m.cod, m.alm))); },
  pendiente(of) { return UI.r4(Math.max(0, of.cant - of.prod)); },
  tieneMovimientos(of) { return of.emisiones.length > 0 || of.recibos.length > 0; },
  esServicio(cod) { return BD.esServicio(cod); },
  costoTotal(of) { return UI.r2(of.costo.mat + of.costo.rec + of.costo.serv); },
  /* costo emitido que todavía no pasó a lo recibido */
  enProceso(of) { return UI.r2(Math.max(0, Prod.costoTotal(of) - of.absorbido)); },
  costoUnit(of) { return of.prod > 0 ? UI.r2(of.absorbido / of.prod) : 0; },
  ordenesDe(art, ref) { return BD.d.ofs.filter(o => o.art === art && o.estado !== 'Cancelado' && (!ref || o.ref === ref)); },
  /* disponible de un artículo: stock disponible + lo que falta producir en órdenes abiertas − lo que otras órdenes abiertas aún deben consumir */
  proyectado(art) {
    let v = Stock.totalDisp(art);
    BD.d.ofs.forEach(o => {
      if (!Prod.abierta(o)) return;
      if (o.art === art) v += Prod.pendiente(o);
      o.mats.forEach(m => { if (m.cod === art) v -= Math.max(0, m.plan - m.consumido); });
    });
    return UI.r4(v);
  },
  /* costo que agrega la orden: materia prima (no fabricada) + recursos y servicios */
  costoAgregado(of) { return UI.r2(of.mats.filter(m => !m.fab).reduce((a, m) => a + (m.valor || 0), 0) + of.recs.reduce((a, r) => a + r.costoReal, 0)); },
  adjuntosRef(ref) { return BD.d.ofs.filter(o => o.ref === ref).flatMap(o => o.adj.map(a => Object.assign({ of: o.id, art: o.art }, a))); },

  /* ---------- creación ---------- */
  crearOF(o) {
    const L = o.ldm ? M.ldm(o.ldm) : null;
    if (o.ldm && (!L || L.art !== o.art)) throw new Error('El artículo no tiene esa lista de materiales');
    if (!M.art(o.art)) throw new Error('Elija el artículo');
    const cant = UI.r4(o.cant);
    const alm = o.alm || Prod.almRecibo(o.art);
    if (!alm) throw new Error('Elija el almacén donde entra lo producido de ' + M.nomArt(o.art));
    if (!M.alm(alm)) throw new Error('Almacén no válido: ' + alm);
    const of = {
      id: BD.sig('of', 'OF-', 6), emp: BD.empresaDe(alm), ref: o.ref, art: o.art, ldm: L ? L.id : '', tipofab: L ? 'Estándar' : 'Especial',
      cant, prod: 0, alm, origen: o.origen || 'Manual', sf: o.sf || '',
      estado: 'Planificado', fecha: UI.ahora(), fechaLib: '', fechaCierre: '', fechaFin: o.fechaFin || '', obs: o.obs || '',
      mats: L ? Explosion.materiales(L.id, cant) : [], recs: L ? Explosion.recursos(L.id, cant) : [], textos: L ? Explosion.textos(L.id) : [],
      emisiones: [], recibos: [], compras: [], envios: [], tercero: null, adj: [], hist: [], costo: { mat: 0, rec: 0, serv: 0 }, absorbido: 0
    };
    BD.d.ofs.unshift(of);
    Prod._hist(of, 'Orden creada', of.tipofab + ' · ' + (of.sf ? 'desde ' + of.sf : 'en Producción') + ' · ' + Prod.nombreRef() + ' ' + of.ref);
    return of;
  },
  _crearSugeridas(sugeridas, nec, base, alms) {
    return Object.keys(sugeridas || {}).filter(art => (Number(sugeridas[art]) || 0) > 0).map(art => {
      const n = nec.find(x => x.art === art), L = M.ldmPred(art);
      if (!n && !L) throw new Error(M.nomArt(art) + ' no tiene lista de materiales');
      return Prod.crearOF(Object.assign({}, base, { art, ldm: n ? n.ldm : L.id, cant: Number(sugeridas[art]), alm: (alms && alms[art]) || (n ? n.alm : Prod.almRecibo(art)) }));
    });
  },
  /* orden creada en Producción (nace Planificada); la lista es opcional; sugeridas = {artículo fabricable: cantidad} */
  crearManual(o) {
    if (!o.art) throw new Error('Elija el artículo');
    if (!(o.cant > 0)) throw new Error('Indique la cantidad a fabricar');
    const ref = String(o.ref || '').trim() || Prod.nuevaRef();
    const nec = o.ldm && o.sugeridas ? Explosion.necesidades([{ art: o.art, cant: o.cant, ldm: o.ldm }]) : [];
    const base = { ref, origen: 'Manual', fechaFin: o.fechaFin, obs: o.obs };
    return [Prod.crearOF(Object.assign({}, base, { art: o.art, ldm: o.ldm, cant: o.cant, alm: o.alm }))].concat(o.ldm ? Prod._crearSugeridas(o.sugeridas, nec, base, o.alms) : []);
  },

  /* ---------- Solicitud de Fabricación (aprobada en Inventarios GI-23): sus órdenes nacen Liberadas ---------- */
  sfsProduccion() { return BD.d.sfs.filter(s => s.est === 'Aprobada' || s.est === 'Convertida en Orden' || s.est === 'Fabricada'); },
  firmasSF(sf) { return (sf.hist || []).filter(h => /V°B°|Aprobación/.test(h.a)).map(h => h.a + ' ' + String(h.f).slice(0, 10)).join(' · '); },
  generarDesdeSF(sfId, sugeridas, alms) {
    const sf = BD.sf(sfId);
    if (!sf) throw new Error('Solicitud no encontrada');
    if (sf.est !== 'Aprobada') throw new Error('La solicitud ' + sf.id + ' está ' + sf.est + ': solo se crean órdenes de una solicitud Aprobada');
    if (sf.ofs && sf.ofs.length) throw new Error('La solicitud ya generó sus órdenes (' + Prod.nombreRef() + ' ' + sf.ref + ')');
    const nec = Explosion.necesidades(sf.lineas.map(l => ({ art: l.art, cant: l.cant, ldm: l.ldm })));
    let sug = sugeridas;
    if (!sug) { sug = {}; nec.forEach(n => { sug[n.art] = n.sugerido; }); }
    const alm = sf.almDestino && M.alm(sf.almDestino) ? sf.almDestino : '';
    const sinLista = sf.lineas.filter(l => !l.ldm || !M.ldm(l.ldm));
    if (sinLista.length) throw new Error('Sin lista de materiales: ' + sinLista.map(l => M.nomArt(l.art)).join(', '));
    const ref = Prod.nuevaRef();
    const base = { ref, origen: 'Solicitud', sf: sf.id, fechaFin: sf.fechaReq || '' };
    const creadas = sf.lineas.map(l => Prod.crearOF(Object.assign({}, base, { art: l.art, ldm: l.ldm, cant: l.cant, alm: alm || Prod.almRecibo(l.art) }))).concat(Prod._crearSugeridas(sug, nec, base, alms));
    /* la solicitud libera lo que comprometió al aprobarse; cada orden compromete lo suyo al liberarse (sin duplicar ni perder compromiso) */
    Docs.sf.convertir(sf.id, creadas.map(o => o.id), ref);
    creadas.forEach(of => Prod.liberar(of, 'Nace liberada desde ' + sf.id));
    return creadas;
  },
  /* la solicitud queda Fabricada cuando ninguna de sus órdenes está abierta y al menos una se cerró */
  _revisarSF(of) {
    if (!of.sf) return;
    const sf = BD.sf(of.sf);
    if (!sf || sf.est !== 'Convertida en Orden') return;
    const ofs = sf.ofs.map(id => BD.of(id)).filter(Boolean);
    if (ofs.every(o => !Prod.abierta(o)) && ofs.some(o => o.estado === 'Cerrado')) Docs.sf.fabricada(sf.id);
  },

  /* ---------- ciclo de vida ---------- */
  /* compromete lo disponible de la materia prima (no fabricada) que falta consumir */
  _comprometer(of) {
    of.mats.forEach(m => {
      if (m.fab) return;
      const falta = UI.r4(m.plan - m.consumido - m.comp); if (falta <= 0) return;
      const c = UI.r4(Math.min(falta, Math.max(0, Stock.disp(Prod.almComp(m), m.cod))));
      if (c > 0) { Stock.comprometer(Prod.almComp(m), m.cod, c); m.comp = UI.r4(m.comp + c); }
    });
  },
  liberar(of, detalle) {
    if (of.estado !== 'Planificado') throw new Error('Solo se libera una orden Planificada');
    if (!of.mats.length && !of.recs.length) throw new Error('Agregue al menos un material o recurso antes de liberar');
    const sinAlm = of.mats.filter(m => !m.alm);
    if (sinAlm.length) throw new Error('Elija el almacén de: ' + sinAlm.map(m => M.nomArt(m.cod)).join(', '));
    Prod._comprometer(of);
    of.estado = 'Liberado'; of.fechaLib = UI.ahora();
    Prod._hist(of, 'Orden liberada', detalle || '');
  },
  _liberarComprometido(of) { of.mats.forEach(m => { if (m.comp > 0) { Stock.liberar(Prod.almComp(m), m.cod, m.comp); m.comp = 0; } }); },
  _anularPendientes(of) {
    Prod.solicitudesDe(of).filter(s => s.estado === 'Borrador' || s.estado === 'Pendiente').forEach(s => {
      Docs.sol.anular(s.id, 'La orden ' + of.id + ' se cerró o canceló');
      Prod._hist(of, 'Solicitud de materiales anulada', s.id);
    });
  },
  cancelar(of) {
    if (!Prod.abierta(of)) throw new Error('La orden ya está ' + of.estado);
    if (Prod.tieneMovimientos(of) || (of.envios || []).length) throw new Error('La orden tiene envíos, emisiones o recibos: ciérrela en lugar de cancelarla');
    Prod._liberarComprometido(of);
    Prod._anularPendientes(of);
    of.estado = 'Cancelado';
    Prod._hist(of, 'Orden cancelada', '');
    Prod._revisarSF(of);
  },
  /* enviado al proveedor del servicio y lo que no retornó (C-4): se compara con lo recibido en la orden */
  enviadoTercero(of) { return UI.r4((of.envios || []).reduce((a, e) => a + e.cant, 0)); },
  faltanteTercero(of) { return (of.envios || []).length ? UI.r4(Math.max(0, Prod.enviadoTercero(of) - of.prod)) : 0; },
  /* deja registrado el faltante del proveedor al cerrar la orden; no mueve stock (el material sigue en el almacén de tránsito) */
  _registrarFaltante(of) {
    const c = Prod.faltanteTercero(of);
    if (c <= 0.00005) { of.faltante = null; return; }
    of.faltante = { cant: c, prov: Prod.provServicio(of), f: UI.ahora(), u: BD.usuario, estado: 'Abierto' };
    Prod._hist(of, 'Faltante del proveedor', UI.n(c, 0) + ' ' + M.u(of.art) + ' enviadas que no retornaron · ' + (M.provNom(of.faltante.prov) || 'proveedor del servicio') + ' · queda abierto para el reclamo (CO-11)');
  },
  cerrar(of) {
    if (of.estado !== 'Liberado') throw new Error('Solo se cierra una orden Liberada');
    Prod._liberarComprometido(of);
    Prod._anularPendientes(of);
    const resto = Prod.enProceso(of);
    if (resto > 0.004 && of.prod > 0) {
      Stock.revalorizar(of.alm, of.art, resto); of.absorbido = UI.r2(of.absorbido + resto);
      Prod._hist(of, 'Diferencia de costo al cerrar', UI.s(resto) + ' emitido y no recibido se suma al costo de ' + of.art);
    }
    Prod._registrarFaltante(of);
    of.estado = 'Cerrado'; of.fechaCierre = UI.ahora();
    Prod._hist(of, 'Orden cerrada', 'Recibido ' + UI.n(of.prod, 0) + ' de ' + UI.n(of.cant, 0));
    Prod._revisarSF(of);
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
      of.mats.push({ cod: a.cod, cons: 1, plan: 0, u: a.u, alm: Prod.almRecibo(a.cod) || Prod.almStock(a.cod), metodo: Explosion.fabricable(a.cod) ? 'Manual' : 'Notificación', fab: Explosion.fabricable(a.cod), consumido: 0, comp: 0, valor: 0 });
    }
    Prod._recalc(of);
  },
  cambiarLinea(of, tipo, i, campo, valor) {
    Prod._edit(of);
    if (tipo === 'Texto') { of.textos[i] = valor; return; }
    const l = tipo === 'Recurso' ? of.recs[i] : of.mats[i];
    if (campo === 'cons') { const v = parseFloat(valor); if (!(v >= 0)) throw new Error('Cantidad no válida'); l.cons = UI.r4(v); }
    if (campo === 'alm') { if (!M.alm(valor)) throw new Error('Almacén no válido'); l.alm = valor; }
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

  /* ---------- solicitudes de materiales (Docs.sol): Producción pide qué y a dónde; Logística define el propósito POR LÍNEA en GI-13 ---------- */
  ABIERTAS_SOL: ['Borrador', 'Pendiente', 'Aprobada', 'En proceso'],
  solicitudesDe(of) { return BD.d.sols.filter(s => s.of === of.id); },
  nomItem(cod) { const R = M.rec(cod); return R ? R.nom : M.nomArt(cod); },
  uItem(cod) { const R = M.rec(cod); return R ? R.u : M.u(cod); },
  /* cantidad pedida a Logística y aún no llegada (línea Pendiente, En compra o En transferencia) de un artículo hacia un almacén para la orden:
     es el «Pedido» de la orden; al llegar se compromete para ella (Docs.reserva) */
  pedido(of, art, alm) {
    return UI.r4(Prod.solicitudesDe(of).filter(s => s.estado !== 'Anulada' && s.estado !== 'Rechazada' && s.destino === alm)
      .reduce((a, s) => a + s.lineas.filter(l => l.art === art && (l.estado === 'Pendiente' || l.estado === 'En compra' || l.estado === 'En transferencia'))
        .reduce((z, l) => z + UI.r4(l.cant - (l.recibido || 0)), 0), 0));
  },
  /* pide a Logística todo lo que a la orden le falta reservar (una solicitud por almacén) */
  solicitarLoQueFalta(of) {
    const items = of.mats.filter(m => !m.fab).map(m => ({ art: m.cod, cant: Prod.faltaPedir(of, m), destino: m.alm })).filter(x => x.cant > 0);
    if (!items.length) throw new Error('La orden no tiene materiales por pedir: todo está comprometido o ya solicitado');
    return Prod.solicitarFaltantes(of, items, 'Materia prima sin cobertura para la orden');
  },
  /* items: [{art, cant, destino}] → una solicitud por almacén destino, enviada a Logística; las líneas nacen sin propósito */
  solicitarFaltantes(of, items, motivo) {
    if (!Prod.abierta(of)) throw new Error('La orden no está abierta');
    const grupos = {};
    items.forEach(x => {
      if (!(x.cant > 0)) throw new Error('Cantidad a solicitar no válida');
      if (!x.destino || !M.alm(x.destino)) throw new Error('Almacén destino no válido para ' + Prod.nomItem(x.art));
      (grupos[x.destino] = grupos[x.destino] || []).push({ art: x.art, cant: UI.r4(x.cant) });
    });
    return Object.keys(grupos).map(destino => {
      const sol = Docs.sol.crear({ area: Prod.MODULO, destino, of: of.id, ref: of.ref, sf: of.sf || '', obs: motivo || 'Falta stock para producir', lineas: grupos[destino] }, true);
      Prod._hist(of, 'Solicitud de materiales ' + sol.id, 'hacia ' + destino + ' · ' + sol.lineas.map(l => Prod.nomItem(l.art) + ' ' + UI.n(l.cant)).join(', '));
      return sol;
    });
  },
  /* Producción crea una solicitud a mano en PR-05: d = {of (opcional), destino, motivo, lineas: [{art, cant}]} */
  crearSolicitud(d) {
    const of = d.of ? BD.of(d.of) : null;
    if (d.of && !of) throw new Error('No existe la orden ' + d.of);
    if (!d.destino || !M.alm(d.destino)) throw new Error('Elija el almacén destino');
    const items = (d.lineas || []).filter(l => l.art);
    if (!items.length) throw new Error('Agregue al menos un artículo');
    items.forEach(l => { if (!(parseFloat(l.cant) > 0)) throw new Error('Cantidad no válida en ' + Prod.nomItem(l.art)); });
    const motivo = String(d.motivo || '').trim() || 'Solicitud de Producción';
    if (of) return Prod.solicitarFaltantes(of, items.map(l => ({ art: l.art, cant: parseFloat(l.cant), destino: d.destino })), motivo)[0];
    return Docs.sol.crear({ area: Prod.MODULO, destino: d.destino, obs: motivo, lineas: items.map(l => ({ art: l.art, cant: parseFloat(l.cant) })) }, true);
  },
  anularSolicitud(id) {
    const sol = BD.sol(id);
    if (!sol || (sol.estado !== 'Pendiente' && sol.estado !== 'Borrador')) throw new Error('Solo se anula una solicitud en Borrador o Pendiente');
    Docs.sol.anular(id, 'Anulada por Producción');
    const of = BD.of(sol.of); if (of) Prod._hist(of, 'Solicitud de materiales anulada', sol.id);
  },

  /* ---------- servicio de terceros y fase tercerizada ---------- */
  /* líneas que se consumen en un almacén de tránsito (en poder del proveedor) */
  lineasTercero(of) { return of.mats.filter(m => (M.alm(m.alm) || {}).transito); },
  serviciosDe(of) { return [...new Set(of.recs.filter(r => Prod.esServicio(r.cod)).map(r => r.cod))]; },
  /* proveedor del servicio: el elegido al tercerizar o el habitual del recurso */
  provServicio(of) { if (of.tercero && of.tercero.prov) return of.tercero.prov; const s = Prod.serviciosDe(of)[0]; return s ? ((M.rec(s) || {}).prov || '') : ''; },
  almTercero(of) { const l = Prod.lineasTercero(of)[0]; return (of.tercero && of.tercero.alm) || (l && l.alm) || ((M.transitos()[0] || {}).cod) || ''; },
  /* solicitudes abiertas o atendidas (no anuladas ni rechazadas) que piden el servicio para la orden */
  solicitudesServicio(of, cod) {
    return Prod.solicitudesDe(of).filter(s => s.estado !== 'Anulada' && s.estado !== 'Rechazada' && s.lineas.some(l => l.art === cod));
  },
  /* (a) Pedir servicio: Solicitud de materiales con la línea del servicio por la cantidad de la orden, destino el almacén de tránsito */
  pedirServicio(of) {
    if (!Prod.abierta(of)) throw new Error('La orden no está abierta');
    const servs = Prod.serviciosDe(of);
    if (!servs.length) throw new Error('La orden no lleva un servicio de terceros');
    const nuevos = servs.filter(cod => !Prod.solicitudesServicio(of, cod).length);
    if (!nuevos.length) throw new Error('El servicio ya se pidió: ' + servs.map(cod => Prod.solicitudesServicio(of, cod).map(s => s.id).join(', ')).join(', '));
    const destino = Prod.almTercero(of);
    if (!M.alm(destino)) throw new Error('No hay almacén de tránsito para el servicio');
    const prov = Prod.provServicio(of);
    const sol = Docs.sol.crear({
      area: Prod.MODULO, destino, of: of.id, ref: of.ref, sf: of.sf || '',
      obs: 'Compra de servicio para ' + of.id + ' · ' + M.nomArt(of.art) + (prov ? ' · proveedor habitual ' + M.provNom(prov) + ' (' + prov + ')' : ''),
      lineas: nuevos.map(cod => ({ art: cod, cant: UI.r4(of.recs.filter(r => r.cod === cod).reduce((a, r) => a + r.plan, 0)) }))
    }, true);
    Prod._hist(of, 'Servicio pedido a Logística ' + sol.id, sol.lineas.map(l => Prod.nomItem(l.art) + ' × ' + UI.n(l.cant, 0)).join(', '));
    return sol;
  },
  /* Tercerizar o cambiar el servicio de una orden sin movimientos.
     - Si la orden aún no lleva servicio: sus materiales pasan al almacén de tránsito (se mandan con «Enviar al proveedor»), se quitan los recursos propios y se agrega el servicio.
     - Si ya lleva servicio (p. ej. el lavado tercerizado por su lista): se reemplaza el servicio y/o el proveedor.
     d = {rec, prov, alm, solicitar}; con solicitar !== false se pide el servicio a Logística. */
  tercerizar(of, d) {
    if (!Prod.abierta(of)) throw new Error('La orden no está abierta');
    if (Prod.tieneMovimientos(of) || (of.envios || []).length) throw new Error('La orden ya tiene envíos, emisiones o recibos');
    const P = M.prov(d.prov), A = M.alm(d.alm), R = M.rec(d.rec);
    if (!R || !Prod.esServicio(R.cod)) throw new Error('Elija el servicio');
    if (!P) throw new Error('Elija el proveedor');
    if (!A) throw new Error('Elija el almacén');
    if (!A.transito) throw new Error('El almacén ' + A.cod + ' no está marcado como «en tránsito»: el material en poder del proveedor va a un almacén en tránsito');
    const anteriores = Prod.serviciosDe(of);
    const abiertas = anteriores.flatMap(cod => Prod.solicitudesServicio(of, cod)).filter(s => s.estado !== 'Borrador' && s.estado !== 'Pendiente');
    if (abiertas.length && anteriores.some(c => c !== R.cod)) throw new Error('Logística ya atendió ' + abiertas.map(s => s.id).join(', ') + ': no se cambia el servicio');
    let detalle;
    if (anteriores.length) {
      /* ya tercerizada: se cambia el servicio (misma cantidad por unidad) y las líneas en tránsito pasan al almacén elegido */
      of.recs.forEach(r => { if (Prod.esServicio(r.cod) && r.cod !== R.cod) { r.cod = R.cod; r.u = R.u; } });
      Prod.lineasTercero(of).forEach(m => { m.alm = A.cod; });
      if (anteriores.some(c => c !== R.cod)) Prod.solicitudesDe(of).filter(s => (s.estado === 'Pendiente' || s.estado === 'Borrador') && s.lineas.some(l => anteriores.includes(l.art))).forEach(s => Docs.sol.anular(s.id, 'Cambio de servicio en ' + of.id));
      detalle = 'Servicio ' + anteriores.join(', ') + ' → ' + R.cod;
    } else {
      of.mats.forEach(m => { if (!(M.alm(m.alm) || {}).transito) { m.almPropio = m.alm; m.alm = A.cod; } });
      const quitados = of.recs.filter(r => !Prod.esServicio(r.cod)).map(r => r.cod);
      of.recs = of.recs.filter(r => Prod.esServicio(r.cod));
      of.recs.push({ cod: R.cod, cons: 1, plan: of.cant, u: R.u, metodo: 'Notificación', real: 0, costoReal: 0 });
      detalle = 'materiales hacia ' + A.cod + (quitados.length ? ' · se quitan ' + quitados.join(', ') : '');
    }
    of.tercero = { prov: P.cod, alm: A.cod, rec: R.cod, f: UI.ahora() };
    of.tipofab = 'Especial';
    Prod._hist(of, 'Fase tercerizada', P.nom + ' · ' + R.nom + ' · ' + detalle);
    const sol = d.solicitar === false || Prod.solicitudesServicio(of, R.cod).length ? null : Prod.pedirServicio(of);
    return { sol };
  },
  /* (c) envío al proveedor: transferencia de lo que la fase consume en el almacén de tránsito + GRE «Traslado de bienes para transformación» */
  enviarProveedor(of, d) {
    d = d || {};
    if (of.estado !== 'Liberado') throw new Error('Libere la orden antes de enviar');
    const cant = UI.r4(d.cant);
    if (!(cant > 0)) throw new Error('Indique la cantidad a enviar');
    const lineas = Prod.lineasTercero(of);
    if (!lineas.length) throw new Error('La orden no tiene materiales en un almacén de tránsito');
    const rutas = {};
    lineas.forEach(m => { const origen = m.almPropio || Prod.almStock(m.cod) || Prod.almRecibo(m.cod), k = origen + '|' + m.alm; (rutas[k] = rutas[k] || { origen, destino: m.alm, items: [] }).items.push({ m, cant: UI.r4(m.cons * cant) }); });
    Object.values(rutas).forEach(g => {
      if (g.origen === g.destino) throw new Error('El material ' + M.nomArt(g.items[0].m.cod) + ' ya está en ' + g.destino);
      const f = Stock.faltantes(g.origen, g.items.map(x => ({ art: x.m.cod, cant: x.cant })));
      if (f.length) throw new Error('No se puede enviar. ' + Stock.textoFaltantes(g.origen, f));
    });
    const prov = Prod.provServicio(of);
    of.envios = of.envios || [];
    const env = { n: of.envios.length + 1, f: d.fecha || UI.ahora(), cant, prov, sts: [], guias: [], guia: '', movs: [] };
    Object.values(rutas).forEach(g => {
      /* lo que la propia orden comprometió en su almacén (fase tercerizada a mano) se libera antes: la ST compromete el origen al aprobarse */
      const lib = g.items.map(x => ({ x, c: x.m.almPropio && x.m.comp > 0 ? Math.min(x.m.comp, x.cant) : 0 }));
      lib.forEach(y => { if (y.c > 0) { Stock.liberar(y.x.m.almPropio, y.x.m.cod, y.c); y.x.m.comp = UI.r4(y.x.m.comp - y.c); } });
      let r;
      try {
        r = Docs.trf.directa({ origen: g.origen, destino: g.destino, tipoMov: 'TRF-FABRIC', of: of.id, fecha: env.f, modulo: 'Producción',
          lineas: g.items.map(x => ({ art: x.m.cod, cant: x.cant })), obs: 'Envío ' + env.n + ' de ' + of.id + ' · traslado de bienes para transformación' + (prov ? ' · ' + M.provNom(prov) : '') });
      } catch (e) {
        lib.forEach(y => { if (y.c > 0) { Stock.comprometer(y.x.m.almPropio, y.x.m.cod, y.c); y.x.m.comp = UI.r4(y.x.m.comp + y.c); } });
        throw e;
      }
      env.sts.push(r.trf.id);
      env.movs.push(r.mov.id);
      const lin = g.items.map(x => ({ art: x.m.cod, cant: x.cant }));
      if (d.sinGuia) { (d.rutas = d.rutas || []).push({ origen: g.origen, destino: g.destino, mov: r.mov.id, of: of.id, lineas: lin }); return; }
      const gre = Docs.gre.crear({ motivo: 'Traslado de bienes para transformación', origen: g.origen, destino: g.destino, prov, mov: r.mov.id, of: of.id,
        lineas: lin, obs: 'Envío ' + env.n + ' de ' + of.id + ' · ' + r.trf.id });
      env.guias.push(gre.id);
    });
    env.guia = env.guias.join(', ');
    of.envios.push(env);
    Prod._hist(of, 'Envío al proveedor ' + env.n, UI.n(cant, 0) + ' ' + M.u(of.art) + ' · ' + env.sts.join(', ') + ' · ' + env.movs.join(', ') + (env.guia ? ' · GRE ' + env.guia : ' · guía pendiente'));
    return env;
  },
  /* órdenes que se pueden enviar junto con ésta: liberadas, con material en tránsito pendiente de enviar y el mismo proveedor de servicio */
  enviablesCon(of) {
    const prov = Prod.provServicio(of);
    return BD.d.ofs.filter(o => o.id !== of.id && o.estado === 'Liberado' && Prod.lineasTercero(o).length && Prod.provServicio(o) === prov &&
      UI.r4(o.cant - (o.envios || []).reduce((a, e) => a + e.cant, 0)) > 0);
  },
  /* lo que saldría de cada almacén si se envían varias órdenes juntas: {almacén|artículo: cantidad} */
  _necesidadEnvio(lista) {
    const req = {};
    lista.forEach(x => Prod.lineasTercero(x.of).forEach(m => {
      const origen = m.almPropio || Prod.almStock(m.cod) || Prod.almRecibo(m.cod), k = origen + '|' + m.cod;
      req[k] = UI.r4((req[k] || 0) + m.cons * UI.r4(x.cant));
    }));
    return req;
  },
  /* envío consolidado (P-2): varias órdenes del mismo proveedor en UNA guía por ruta. lista = [{of, cant}] */
  enviarConsolidado(lista, d) {
    d = d || {};
    const envios = (lista || []).filter(x => x.of && UI.r4(x.cant) > 0);
    if (!envios.length) throw new Error('Elija al menos una orden y su cantidad');
    const prov = Prod.provServicio(envios[0].of);
    envios.forEach(x => { if (Prod.provServicio(x.of) !== prov) throw new Error('Todas las órdenes deben tener el mismo proveedor de servicio'); });
    /* se revisa el stock de todas juntas ANTES de mover nada: si falta, no se envía ninguna */
    const req = Prod._necesidadEnvio(envios), faltan = [];
    Object.keys(req).forEach(k => {
      const x = k.split('|'), hay = Stock.act(x[0], x[1]);
      if (hay + 0.00005 < req[k]) faltan.push(M.nomArt(x[1]) + ' en ' + x[0] + ' (hay ' + UI.n(hay) + ', faltan ' + UI.n(UI.r4(req[k] - hay)) + ')');
    });
    if (faltan.length) throw new Error('No se puede enviar el conjunto: ' + faltan.join('; '));
    const acumulado = { rutas: [], sinGuia: true, fecha: d.fecha };
    const hechos = envios.map(x => ({ of: x.of, env: Prod.enviarProveedor(x.of, { cant: x.cant, fecha: d.fecha, sinGuia: true, rutas: acumulado.rutas }) }));
    /* una guía por ruta origen → destino, con las líneas de todas las órdenes */
    const porRuta = {};
    acumulado.rutas.forEach(r => { const k = r.origen + '|' + r.destino; (porRuta[k] = porRuta[k] || { origen: r.origen, destino: r.destino, movs: [], ofs: [], lineas: [] }); const g = porRuta[k];
      g.movs.push(r.mov); if (g.ofs.indexOf(r.of) < 0) g.ofs.push(r.of);
      r.lineas.forEach(l => { const y = g.lineas.find(z => z.art === l.art); if (y) y.cant = UI.r4(y.cant + l.cant); else g.lineas.push({ art: l.art, cant: l.cant }); }); });
    const guias = Object.values(porRuta).map(g => Docs.gre.crear({ motivo: 'Traslado de bienes para transformación', origen: g.origen, destino: g.destino, prov, movs: g.movs, ofs: g.ofs,
      lineas: g.lineas, fecha: d.fecha, obs: 'Envío consolidado de ' + g.ofs.join(', ') }).id);
    hechos.forEach(h => {
      h.env.guias = guias.slice(); h.env.guia = guias.join(', '); h.env.consolidado = hechos.map(y => y.of.id);
      Prod._hist(h.of, 'Guía del envío ' + h.env.n, 'GRE ' + h.env.guia + ' · consolidada con ' + hechos.filter(y => y.of.id !== h.of.id).map(y => y.of.id).join(', '));
    });
    return { envios: hechos, guias };
  },

  /* ---------- consumo ---------- */
  /* items: [{i, m, cant}] con stock suficiente → salidas por almacén; devuelve las líneas valorizadas */
  _consumir(of, items, det, obs, movs, fecha) {
    const porAlm = {};
    items.forEach(x => (porAlm[x.m.alm] = porAlm[x.m.alm] || []).push(x));
    const lineas = [];
    Object.keys(porAlm).forEach(alm => {
      const lin = porAlm[alm].map(x => ({ art: x.m.cod, cant: x.cant, liberar: x.m.almPropio ? 0 : Math.min(x.m.comp, x.cant) }));
      const tipoMov = (M.alm(alm) || {}).transito ? 'SAL-MAQUILA' : 'SAL-USOPROD';
      const r = Stock.salida({ det: tipoMov === 'SAL-MAQUILA' ? det + ' (material en poder del proveedor)' : det, tipoMov, alm, destino: of.id, ndoc: of.id, doc: of.id, modulo: Prod.MODULO, fecha, lineas: lin, obs });
      if (!r.ok) throw new Error(r.error);
      movs.push(r.mov.id);
      porAlm[alm].forEach((x, k) => {
        const ml = r.mov.lineas.find(l => l.art === x.m.cod && !l._usada); if (ml) ml._usada = true;
        const valor = ml ? ml.valor : 0;
        x.m.comp = UI.r4(x.m.comp - lin[k].liberar); x.m.consumido = UI.r4(x.m.consumido + x.cant); x.m.valor = UI.r2((x.m.valor || 0) + valor);
        of.costo.mat = UI.r2(of.costo.mat + valor);
        lineas.push({ i: x.i, cod: x.m.cod, u: x.m.u, alm, cant: x.cant, valor });
      });
      r.mov.lineas.forEach(l => { delete l._usada; });
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
  /* d: {fecha, obs, mats:{i: cant}, recs:{i: {cant, operarios:[{ope, horas}]}}, parcial}.
     Q3: solo se emite lo que la orden puede consumir (Disponible + su propio comprometido): lo reservado por otros documentos no se toca.
     Si no alcanza, la emisión se BLOQUEA; con parcial = true (botón «Emitir lo disponible y pedir el resto») se emite lo que hay
     y la diferencia se pide a Logística con una Solicitud de materiales. */
  emitir(of, d) {
    if (of.estado !== 'Liberado') throw new Error('Libere la orden antes de emitir');
    const mats = [], recs = [], faltan = [], cortos = [];
    Object.keys(d.mats || {}).forEach(k => {
      const v = d.mats[k], i = Number(k), m = of.mats[i];
      if (!m || v == null || v === '') return;
      const cant = UI.r4(v);
      if (!(parseFloat(v) >= 0)) throw new Error('Cantidad no válida en ' + M.nomArt(m.cod));
      if (!cant) return;
      if (m.metodo === 'Notificación') throw new Error(M.nomArt(m.cod) + ' es de método Notificación: se consume al registrar el recibo');
      const cap = Prod.dispPara(m), sale = UI.r4(Math.min(cant, cap)), falta = UI.r4(cant - sale);
      if (falta > 0) { faltan.push({ art: m.cod, cant: falta, destino: m.alm }); cortos.push(Prod.textoCorto(m, cant)); }
      if (sale > 0) mats.push({ i, m, cant: sale });
    });
    if (cortos.length && !d.parcial) throw new Error('No se puede emitir. ' + cortos.join('; ') + '. Emita menos o use «Emitir lo disponible y pedir el resto»');
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
      em.lineas = Prod._consumir(of, mats, 'Salida - Emisión para producción', 'Emisión ' + em.n + ' de ' + of.id, em.movs, em.f);
      em.recursos = Prod._consumirRec(of, recs);
      em.valor = UI.r2(em.lineas.concat(em.recursos).reduce((a, x) => a + x.valor, 0));
      of.emisiones.push(em);
      Prod._hist(of, 'Emisión ' + em.n, (em.movs.join(', ') || 'solo recursos') + ' · ' + UI.s(em.valor));
    }
    const sols = faltan.length ? Prod.solicitarFaltantes(of, faltan, 'Falta stock para emitir') : [];
    if (em) em.sols = sols.map(s => s.id);
    return { em, sols };
  },
  /* explicación de por qué una línea no alcanza: lo que hay, lo que reservaron otros y lo que la orden puede usar */
  textoCorto(m, cant) {
    const act = Stock.act(m.alm, m.cod), otros = UI.r4(Math.max(0, Stock.comp(m.alm, m.cod) - (m.almPropio ? 0 : m.comp)));
    return M.nomArt(m.cod) + ' en ' + m.alm + ': pide ' + UI.n(cant) + ' ' + m.u + ' y la orden puede usar ' + UI.n(Prod.dispPara(m)) + ' (hay ' + UI.n(act) + (otros > 0 ? ', ' + UI.n(otros) + ' comprometidos por otros documentos' : '') + ')';
  },
  /* líneas Notificación que no alcanzan para recibir "cant" (agrupadas por almacén y artículo), contra lo que la orden puede usar (Q3) */
  faltantesNotificacion(of, cant) {
    const req = {}, propio = {};
    of.mats.forEach(m => { if (m.metodo !== 'Notificación') return; const k = m.alm + '|' + m.cod; req[k] = UI.r4((req[k] || 0) + m.cons * cant); propio[k] = UI.r4((propio[k] || 0) + (m.almPropio ? 0 : m.comp)); });
    return Object.keys(req).map(k => { const p = k.split('|'), act = Stock.act(p[0], p[1]), disp = UI.r4(Math.max(0, Stock.disp(p[0], p[1])) + propio[k]); return { alm: p[0], cod: p[1], req: req[k], act, disp, falta: UI.r4(req[k] - disp) }; })
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
    if (falt.length) throw new Error('Falta stock para el consumo por notificación: ' + falt.map(f => M.nomArt(f.cod) + ' en ' + f.alm + ' (la orden puede usar ' + UI.n(f.disp) + ', faltan ' + UI.n(f.falta) + ')').join('; ') + '. Solicite los materiales a Logística');
    const rc = { n: of.recibos.length + 1, f: d.fecha || UI.ahora(), cant, obs: d.obs || '', lineas: [], recursos: [], movs: [], costo: 0, cu: 0 };
    const wip = Prod.enProceso(of), factor = cant >= pend - 0.0001 ? 1 : cant / pend;
    rc.lineas = Prod._consumir(of, of.mats.map((m, i) => ({ i, m, cant: UI.r4(m.cons * cant) })).filter(x => x.m.metodo === 'Notificación' && x.cant > 0),
      'Salida - Emisión para producción (notificación)', 'Recibo ' + rc.n + ' de ' + of.id, rc.movs, rc.f);
    rc.recursos = Prod._consumirRec(of, of.recs.map((r, i) => ({ i, r, cant: UI.r4(r.cons * cant) })).filter(x => x.r.metodo === 'Notificación' && x.cant > 0));
    const back = rc.lineas.concat(rc.recursos).reduce((a, x) => a + x.valor, 0);
    rc.costo = UI.r2(back + wip * factor);
    const ing = Stock.ingreso({ det: 'Ingreso - Recibo de producción', tipoMov: 'ING-PROD', alm: of.alm, origen: of.id, ndoc: of.id, doc: of.id, modulo: Prod.MODULO, fecha: rc.f,
      lineas: [{ art: of.art, cant, costo: UI.r4(rc.costo / cant) }], obs: 'Recibo ' + rc.n + ' de ' + of.id });
    if (!ing.ok) throw new Error(ing.error);
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
  /* servicios de terceros: costo estándar cargado a la orden vs OC vs factura (menos notas de crédito).
     OC y factura las agrega Compras (Docs.oc al aprobar, Docs.fac al facturar) en of.compras; la nota de crédito se vincula a mano. */
  TIPOS_COMPRA: ['OC', 'Factura', 'Nota de crédito'],
  contrasteServicios(of) {
    return Prod.serviciosDe(of).map(cod => {
      const ls = of.recs.filter(r => r.cod === cod), docs = (of.compras || []).filter(c => c.rec === cod);
      const suma = t => UI.r2(docs.filter(c => c.tipo === t).reduce((a, c) => a + c.importe, 0));
      const estandar = UI.r2(ls.reduce((a, r) => a + r.costoReal, 0)), oc = suma('OC'), factura = suma('Factura'), nc = suma('Nota de crédito');
      const hayFac = docs.some(c => c.tipo === 'Factura'), hayOC = docs.some(c => c.tipo === 'OC');
      const real = UI.r2((hayFac ? factura : oc) - nc);
      return { cod, cant: UI.r4(ls.reduce((a, r) => a + r.real, 0)), plan: UI.r4(ls.reduce((a, r) => a + r.plan, 0)), estandar, oc, factura, nc, hayOC, hayFac, docs, real, dif: hayFac || hayOC ? UI.r2(real - estandar) : null };
    });
  },
  /* solo la nota de crédito o devolución de compra se vincula a mano (OC y factura llegan desde Compras) */
  registrarNotaCredito(of, c) {
    const doc = String(c.doc || '').trim(), importe = UI.r2(c.importe);
    if (!Prod.esServicio(c.rec) || !of.recs.some(r => r.cod === c.rec)) throw new Error('Elija un servicio de la orden');
    if (!doc) throw new Error('Indique el número de la nota de crédito');
    if (!(importe > 0)) throw new Error('Indique el importe');
    const R = M.rec(c.rec) || {};
    (of.compras = of.compras || []).push({ tipo: 'Nota de crédito', doc, rec: c.rec, prov: Prod.provServicio(of) || R.prov || '', cant: UI.r4(c.cant), importe, f: UI.ahora(), u: BD.usuario });
    Prod._hist(of, 'Nota de crédito ' + doc, (R.nom || c.rec) + ' · ' + UI.s(importe));
  },

  /* ---------- producto fallado (J1 no hay tipo Ajuste · J2): salida del artículo (SAL-FALLADO) + ingreso del artículo "FALLADO" al mismo costo (ING-FALLADO) ---------- */
  MOTIVOS_FALLA: ['Defecto de corte', 'Defecto de confección', 'Defecto de lavandería (servicio de terceros)', 'Defecto de acabado', 'Otro'],
  falladoDe(art) { const a = M.art(art); return a ? M.ARTICULOS.find(x => x.nom === a.nom + ' FALLADO') || null : null; },
  reclasificarFallado(d) {
    const A = M.art(d.art), F = M.art(d.fallado), cant = UI.r4(d.cant), obs = String(d.obs || '').trim();
    if (!A || !F || A.cod === F.cod) throw new Error('Elija el artículo fallado (distinto del original)');
    if (!(cant > 0)) throw new Error('Indique la cantidad fallada');
    if (!d.motivo) throw new Error('Indique el motivo del defecto');
    if (!obs) throw new Error('Justifique el movimiento en la observación');
    if (Stock.act(d.alm, A.cod) + 0.00005 < cant) throw new Error('Solo hay ' + UI.n(Stock.act(d.alm, A.cod)) + ' de ' + A.nom + ' en ' + d.alm);
    const doc = BD.sig('fall', 'FALL-', 4), costo = Stock.costo(d.alm, A.cod), just = d.motivo + ' · ' + obs;
    const s = Stock.salida({ det: 'Salida - Producto fallado', tipoMov: 'SAL-FALLADO', alm: d.alm, destino: F.cod, ndoc: doc, doc, modulo: Prod.MODULO, lineas: [{ art: A.cod, cant, liberar: 0 }], obs: 'Producto fallado → ' + F.cod + ' · ' + just });
    if (!s.ok) throw new Error(s.error);
    const i = Stock.ingreso({ det: 'Ingreso - Producto fallado', tipoMov: 'ING-FALLADO', alm: d.alm, origen: A.cod, ndoc: doc, doc, modulo: Prod.MODULO, lineas: [{ art: F.cod, cant, costo }], obs: 'Producto fallado de ' + A.cod + ' · ' + just });
    if (!i.ok) throw new Error(i.error);
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
  movimientosOF(of) { return BD.d.movs.filter(m => m.ndoc === of.id).slice().reverse(); },
  gresOF(of) { return BD.d.gres.filter(g => g.of === of.id); },

  adjuntar(of, nombre, desc) {
    if (!nombre) throw new Error('Elija el archivo');
    of.adj.push({ nombre, desc: desc || '', f: UI.ahora(), u: BD.usuario });
    Prod._hist(of, 'Adjunto', nombre);
  }
};

/* Lo que Explosion (COMPARTIDO/bd/explosion.js) no trae porque depende de las órdenes de Producción. Propuesto para el núcleo. */
Object.assign(Explosion, {
  /* órdenes que hacen falta para los materiales fabricables: requerido − disponible proyectado */
  necesidades(productos) {
    const disp = {}, res = {};
    const visitar = (art, cant, ldmId) => {
      const L = ldmId ? BD.ldm(ldmId) : BD.ldmPred(art); if (!L) return;
      L.items.forEach(i => {
        if (i.tipo !== 'Artículo' || !Explosion.fabricable(i.cod)) return;
        const req = UI.r4(cant * i.cant / (L.base || 1));
        if (disp[i.cod] == null) disp[i.cod] = Math.max(0, Prod.proyectado(i.cod));
        const usa = Math.min(disp[i.cod], req); disp[i.cod] = UI.r4(disp[i.cod] - usa);
        const neto = UI.r4(req - usa);
        const r = res[i.cod] = res[i.cod] || { art: i.cod, ldm: BD.ldmPred(i.cod).id, alm: Prod.almRecibo(i.cod), req: 0, cubre: 0, sugerido: 0 };
        r.req = UI.r4(r.req + req); r.cubre = UI.r4(r.cubre + usa); r.sugerido = UI.r4(r.sugerido + neto);
        if (neto > 0) visitar(i.cod, neto, null);
      });
    };
    productos.forEach(p => visitar(p.art, p.cant, p.ldm));
    return Object.values(res);
  },
  refs() { return [...new Set(BD.d.ofs.map(o => o.ref))].sort((a, b) => String(b).localeCompare(String(a))); }
});
