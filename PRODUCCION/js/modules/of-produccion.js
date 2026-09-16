/* PRODUCCION · PR-02 pestañas Emisiones, Recibos y Costo (como SAP Business One, con operarios).
   Emisión para producción (Salida): líneas Manual; los recursos llevan sus operarios como detalle. Si falta stock se solicita una transferencia.
   Recibo de producción (Ingreso): entra lo producido y se consumen las líneas Notificación. Ambos se registran directo, sin estados. */
const PRUI = {
  inp(id, ph, on) { return '<input type="number" min="0" step="any" id="' + id + '" placeholder="' + (ph || '') + '" oninput="' + (on || '') + '" style="width:100px;text-align:right;border:1px solid var(--borde);border-radius:5px;padding:5px">'; },
  chips(ids) { return ids.length ? '<div class="chips" style="margin-top:4px">' + ids.map(id => '<span class="chip" style="cursor:pointer" onclick="PRUI.doc(\'' + id + '\')">' + id + '</span>').join('') + '</div>' : ''; },
  doc(id) { UI.cerrar(); if (id.indexOf('SOL-') === 0) App.go('pr05', { id }); else if (id.indexOf('OC-') === 0) PRCOS.verOC(id); else if (id.indexOf('T001-') === 0) PRENV.verGre(id); else PR08.verMov(id); },
  nomOpe(cod) { return (Prod.operario(cod) || {}).nom || cod; },
  nomRec(cod) { return (M.rec(cod) || {}).nom || cod; },
  barra(of) {
    if (of.estado !== 'Liberado') return '';
    const pend = Prod.solicitudesDe(of).filter(s => Prod.ABIERTAS_SOL.includes(s.estado)).length;
    return '<div class="filters" style="margin-bottom:10px">' + (Prod.lineasTercero(of).length ? '<button class="btn btn-secondary" onclick="PRENV.abrir()">Enviar al proveedor</button>' : '') +
      '<button class="btn btn-secondary" onclick="PREM.abrir()">+ Emisión (salida)</button><button class="btn btn-primary" onclick="PRRE.abrir()">+ Recibo (ingreso)</button>' +
      '<span class="mini">Recibido ' + UI.n(of.prod, 0) + ' de ' + UI.n(of.cant, 0) + ' · en proceso ' + UI.s(Prod.enProceso(of)) +
      (pend ? ' · <button class="btn-link" style="padding:0" onclick="App.go(\'pr05\')">' + pend + ' solicitud(es) de materiales abierta(s)</button>' : '') + '</span></div>';
  },
  /* tabla de recursos con sus operarios como detalle */
  recursos(lista) {
    return UI.tabla(['Recurso / operario', ['Cantidad', 'num'], ['Costo', 'num']], lista.flatMap(r => {
      const costo = (M.rec(r.cod) || {}).costo || 0;
      return ['<tr><td><b>' + UI.esc(PRUI.nomRec(r.cod)) + '</b> <span class="mini">' + r.cod + '</span></td><td class="num">' + UI.n(r.cant) + ' ' + r.u + '</td><td class="num">' + UI.s(r.valor) + '</td></tr>']
        .concat((r.operarios || []).map(o => '<tr><td style="padding-left:30px" class="mini">└ ' + UI.esc(PRUI.nomOpe(o.ope)) + '</td><td class="num mini">' + UI.n(o.horas) + ' h</td><td class="num mini">' + UI.s(o.horas * costo) + '</td></tr>'));
    }), { vacio: 'Sin recursos' });
  }
};

/* ---------- Emisiones ---------- */
const PREM = {
  render(of) {
    return PRUI.barra(of) + PRENV.tabla(of) + UI.tabla(['#', 'Fecha', 'Materiales', 'Recursos y operarios', 'Documentos', ['Valor', 'num'], ['', '', '56px']], of.emisiones.slice().reverse().map(e =>
      '<tr><td><b>' + e.n + '</b></td><td class="mini">' + e.f + '</td>' +
      '<td class="mini">' + (e.lineas.map(l => UI.esc(M.nomArt(l.cod)) + ' ' + UI.q(l.cant, l.u)).join('<br>') || '—') + '</td>' +
      '<td class="mini">' + (e.recursos.map(r => UI.esc(PRUI.nomRec(r.cod)) + ' ' + UI.n(r.cant) + ' ' + r.u + r.operarios.map(o => '<br>&nbsp;&nbsp;└ ' + UI.esc(PRUI.nomOpe(o.ope)) + ' ' + UI.n(o.horas) + ' h').join('')).join('<br>') || '—') + '</td>' +
      '<td>' + PRUI.chips(e.movs.concat(e.sols)) + '</td><td class="num">' + UI.s(e.valor) + '</td>' +
      '<td><button class="btn btn-secondary btn-sm" onclick="PREM.ver(' + e.n + ')">👁</button></td></tr>'),
      { vacio: of.estado === 'Planificado' ? 'Libere la orden para emitir' : 'Sin emisiones' });
  },
  nOps: 0,
  abrir() {
    const of = PR02.of(); if (!of || of.estado !== 'Liberado') return;
    PREM.nOps = 0;
    const gris = ' style="color:var(--texto-sec)"';
    const filasM = of.mats.map((m, i) => {
      const notif = m.metodo === 'Notificación', pend = UI.r4(Math.max(0, m.plan - m.consumido));
      return '<tr' + (notif ? gris : '') + '><td>' + UI.esc(M.nomArt(m.cod)) + '<br><span class="mini">' + m.cod + ' · ' + m.alm + '</span></td><td class="mini">' + m.metodo + '</td>' +
        '<td class="num">' + UI.q(m.plan, m.u) + '</td><td class="num">' + UI.q(m.consumido, m.u) + '</td><td class="num">' + UI.n(Stock.act(m.alm, m.cod)) + '</td>' +
        '<td class="num">' + (notif ? '<span class="mini">se consume al recibir</span>' : PRUI.inp('em-m' + i, UI.n(pend), 'PREM.check()') + ' ' + m.u) + '</td></tr>' +
        (notif ? '' : '<tr id="em-f' + i + '" style="display:none"><td colspan="6" style="padding-left:30px;background:#FFFBEB"><span class="warn-t" id="em-ft' + i + '"></span> · la diferencia se pide a Logística con una Solicitud de materiales</td></tr>');
    });
    const filasR = of.recs.map((r, i) => {
      const notif = r.metodo === 'Notificación', ops = M.operarios().filter(o => o.rec === r.cod && o.activo);
      return '<tr' + (notif ? gris : '') + '><td>' + UI.esc(PRUI.nomRec(r.cod)) + '<br><span class="mini">' + r.cod + ' · ' + ((M.rec(r.cod) || {}).tipo || '') + '</span></td><td class="mini">' + r.metodo + '</td>' +
        '<td class="num">' + UI.n(r.plan) + ' ' + r.u + '</td><td class="num">' + UI.n(r.real) + ' ' + r.u + '</td>' +
        '<td class="num">' + (notif ? '<span class="mini">se registra al recibir</span>' : PRUI.inp('em-r' + i, UI.n(Math.max(0, r.plan - r.real)), 'PREM.check()') + ' ' + r.u) + '</td></tr>' +
        (!notif && ops.length ? '<tr><td colspan="5" style="padding:4px 10px 8px 30px;background:#F8FAFC"><div id="em-ops' + i + '"></div><button class="btn-link" style="padding:0" onclick="PREM.addOp(' + i + ')">+ operario</button></td></tr>' : '');
    });
    UI.modal({
      lg: true, ancho: '900px', titulo: 'Emisión para producción · ' + of.id,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Orden', '<b>' + of.id + '</b> · ' + UI.esc(M.nomArt(of.art))) +
        UI.campo('Fecha', '<input id="em-fecha" type="datetime-local" value="' + UI.dtLocal() + '">') + UI.campo('Observación', '<input id="em-obs">') + '</div>' +
        '<div class="sec" style="margin-top:12px">Materiales<div style="flex:1"></div><button class="btn-link" onclick="PREM.copiar()">Copiar pendiente</button></div>' +
        UI.tabla(['Componente', 'Método', ['Planificado', 'num'], ['Emitido', 'num'], ['Stock en almacén', 'num'], ['A emitir', 'num']], filasM, { vacio: 'Sin materiales', estilo: 'margin-bottom:8px' }) +
        '<div class="sec">Recursos y operarios</div>' +
        UI.tabla(['Recurso', 'Método', ['Planificado', 'num'], ['Registrado', 'num'], ['A registrar', 'num']], filasR, { vacio: 'Sin recursos' }) +
        '<p class="hint">Solo se emiten las líneas Manual; las de Notificación se consumen al registrar el recibo. Si falta stock en el almacén de la línea se emite lo que hay y la diferencia se pide a Logística. Las horas del recurso son la suma de sus operarios.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PREM.guardar()">Registrar emisión</button>'
    });
  },
  addOp(i) {
    const box = document.getElementById('em-ops' + i); if (!box) return;
    const r = PR02.of().recs[i], div = document.createElement('div');
    div.className = 'em-op'; div.dataset.rec = String(i);
    div.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:4px';
    div.innerHTML = '<span class="mini">└ Operario</span><select class="em-ope" onchange="PREM.check()" style="border:1px solid var(--borde);border-radius:5px;padding:4px;min-width:240px">' +
      UI.opts(M.operarios().filter(o => o.rec === r.cod && o.activo).map(o => ({ v: o.cod, t: o.nom })), '', '—') + '</select>' +
      '<input class="em-hor" type="number" min="0" step="any" placeholder="horas" oninput="PREM.check()" style="width:80px;text-align:right;border:1px solid var(--borde);border-radius:5px;padding:4px"><span class="mini">h</span>' +
      '<button class="btn-link" onclick="this.parentNode.remove();PREM.check()">✕</button>';
    box.appendChild(div);
  },
  ops(i) {
    return Array.prototype.slice.call(document.querySelectorAll('.em-op')).filter(d => d.dataset.rec === String(i))
      .map(d => ({ ope: d.querySelector('.em-ope').value, horas: parseFloat(d.querySelector('.em-hor').value) || 0 })).filter(o => o.ope);
  },
  check() {
    const of = PR02.of(); if (!of) return;
    of.mats.forEach((m, i) => {
      const e = document.getElementById('em-m' + i), row = document.getElementById('em-f' + i); if (!e || !row) return;
      const act = Math.max(0, Stock.act(m.alm, m.cod)), falta = UI.r4((parseFloat(e.value) || 0) - act);
      row.style.display = falta > 0 ? '' : 'none';
      if (falta > 0) document.getElementById('em-ft' + i).textContent = 'Hay ' + UI.n(act) + ' en ' + m.alm + ': se emite eso y faltan ' + UI.n(falta) + ' ' + m.u;
    });
    of.recs.forEach((r, i) => {
      const e = document.getElementById('em-r' + i); if (!e) return;
      const ops = PREM.ops(i);
      e.readOnly = ops.length > 0;
      if (ops.length) e.value = UI.r4(ops.reduce((s, o) => s + o.horas, 0));
    });
  },
  copiar() {
    const of = PR02.of();
    of.mats.forEach((m, i) => { const e = document.getElementById('em-m' + i); if (e) e.value = UI.r4(Math.max(0, m.plan - m.consumido)); });
    of.recs.forEach((r, i) => { const e = document.getElementById('em-r' + i); if (e && !PREM.ops(i).length) e.value = UI.r4(Math.max(0, r.plan - r.real)); });
    PREM.check();
  },
  guardar() {
    const of = PR02.of(), d = { fecha: UI.dtTexto(UI.v('em-fecha')), obs: UI.v('em-obs'), mats: {}, recs: {} };
    of.mats.forEach((m, i) => { const e = document.getElementById('em-m' + i); if (e && e.value !== '') d.mats[i] = e.value; });
    of.recs.forEach((r, i) => { const e = document.getElementById('em-r' + i), ops = PREM.ops(i); if (e && (e.value !== '' || ops.length)) d.recs[i] = { cant: e.value, operarios: ops }; });
    const r = App.accion(() => Prod.emitir(of, d), x => (x.em ? 'Emisión ' + x.em.n + (x.em.movs.length ? ': ' + x.em.movs.join(', ') : '') : 'Sin stock para emitir') +
      (x.sols.length ? ' · ' + x.sols.map(s => s.id).join(', ') + ' enviada a Logística' : ''));
    if (r) { UI.cerrar(); PR02.tab = 'emi'; App.refrescar(); }
  },
  ver(n) {
    const of = PR02.of(), e = of.emisiones.find(x => x.n === n); if (!e) return;
    UI.modal({
      titulo: 'Emisión ' + e.n + ' · ' + of.id, lg: true,
      cuerpo: '<p>' + e.f + (e.obs ? ' · ' + UI.esc(e.obs) : '') + ' · valor <b>' + UI.s(e.valor) + '</b></p>' +
        '<div class="sec">Materiales</div>' + UI.tabla(['Componente', 'Almacén', ['Cantidad', 'num'], ['Costo', 'num']], e.lineas.map(l =>
          '<tr><td>' + UI.esc(M.nomArt(l.cod)) + ' <span class="mini">' + l.cod + '</span></td><td class="mini">' + l.alm + '</td><td class="num">' + UI.q(l.cant, l.u) + '</td><td class="num">' + UI.s(l.valor) + '</td></tr>'), { vacio: 'Sin materiales', estilo: 'margin-bottom:8px' }) +
        '<div class="sec">Recursos y operarios</div>' + PRUI.recursos(e.recursos) +
        (e.movs.length || e.sols.length ? '<div class="sec">Documentos</div>' + PRUI.chips(e.movs.concat(e.sols)) : '')
    });
  }
};
PR02.registrarTab({ id: 'emi', orden: 2, titulo: of => 'Emisiones (' + of.emisiones.length + ')', render: PREM.render });

/* ---------- Envíos al proveedor (fase tercerizada) ---------- */
const PRENV = {
  /* compra del servicio: solicitudes de materiales con el servicio y sus OC (estado real en la base compartida) */
  compra(of) {
    const sols = Prod.serviciosDe(of).flatMap(cod => Prod.solicitudesServicio(of, cod));
    if (!sols.length) return '<span class="warn-t">Servicio aún no pedido</span>' + (Prod.abierta(of) ? ' · <button class="btn-link" style="padding:0" onclick="PR02.pedirServicio()">Pedir servicio</button>' : '');
    return sols.map(s => {
      const ocs = [...new Set(s.lineas.map(l => l.doc).filter(d => /^OC-/.test(d || '')))].map(id => BD.oc(id)).filter(Boolean);
      return '<span class="chip" style="cursor:pointer" onclick="PRUI.doc(\'' + s.id + '\')">' + s.id + ' · ' + UI.esc(s.estado) + '</span>' +
        (ocs.length ? ocs.map(o => ' <span class="chip" style="cursor:pointer" onclick="PRUI.doc(\'' + o.id + '\')">' + o.id + ' · ' + UI.esc(o.est) + '</span>').join('') : ' <span class="mini">Logística aún no crea la OC (GI-13)</span>');
    }).join(' ');
  },
  tabla(of) {
    if (!Prod.lineasTercero(of).length && !(of.envios || []).length) return '';
    const prov = Prod.provServicio(of);
    return '<div class="card" style="padding:10px 14px"><b style="font-size:13px">Fase tercerizada</b> <span class="mini">' + UI.esc(prov ? M.provNom(prov) + ' (' + prov + ')' : 'proveedor') +
      ' · los materiales se envían a ' + UI.esc(Prod.almTercero(of)) + ' con guía de remisión y lo producido vuelve a ' + of.alm + ' con el recibo</span>' +
      '<div style="margin-top:6px"><span class="mini">Compra del servicio:</span> ' + PRENV.compra(of) + '</div>' +
      UI.tabla(['Envío', 'Fecha', ['Cantidad', 'num'], 'Guía de remisión', 'Transferencias'], (of.envios || []).map(e =>
        '<tr><td><b>' + e.n + '</b></td><td class="mini">' + e.f + '</td><td class="num">' + UI.q(e.cant, M.u(of.art)) + '</td><td>' + PRUI.chips(e.guias || []) + '</td><td>' + PRUI.chips(e.movs) + '</td></tr>'),
        { vacio: 'Sin envíos', estilo: 'margin:8px 0 0' }) + '</div>';
  },
  verGre(id) {
    const g = BD.d.gres.find(x => x.id === id); if (!g) { UI.toast('Guía no encontrada'); return; }
    UI.modal({
      titulo: 'Guía de remisión ' + g.id, lg: true,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Motivo', UI.esc(g.motivo), { estilo: 'grid-column:span 2' }) + UI.dato('Estado', UI.esc(g.estado)) + UI.dato('Fecha', g.fecha) +
        UI.dato('Origen → destino', UI.esc(g.origen + ' → ' + g.destino)) + UI.dato('Proveedor', UI.esc(g.prov ? M.provNom(g.prov) : '—')) + UI.dato('Movimiento', UI.esc(g.mov)) + UI.dato('Orden', UI.esc(g.of)) + UI.dato('Observación', UI.esc(g.obs)) + '</div>' +
        '<div class="sec" style="margin-top:12px">Bienes trasladados</div>' + UI.tabla(['Código', 'Artículo', ['Cantidad', 'num']], g.lineas.map(l => '<tr><td>' + l.art + '</td><td>' + UI.esc(M.nomArt(l.art)) + '</td><td class="num">' + UI.q(l.cant, M.u(l.art)) + '</td></tr>')) +
        '<p class="hint">Se consulta también en Inventarios (GI-14).</p>'
    });
  },
  abrir() {
    const of = PR02.of(); if (!of || of.estado !== 'Liberado') return;
    const enviado = UI.r4((of.envios || []).reduce((a, e) => a + e.cant, 0));
    UI.modal({
      lg: true, titulo: 'Envío al proveedor · ' + of.id,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Enviado', UI.n(enviado, 0) + ' de ' + UI.n(of.cant, 0) + ' ' + M.u(of.art)) +
        UI.campo('Cantidad a producir que se envía', '<input id="env-cant" type="number" min="0" step="any" value="' + Math.max(0, UI.r4(of.cant - enviado)) + '" oninput="PRENV.resumen()">', { req: true }) +
        UI.campo('Fecha', '<input id="env-fecha" type="datetime-local" value="' + UI.dtLocal() + '">') + '</div>' +
        UI.dato('Proveedor', UI.esc(M.provNom(Prod.provServicio(of)) || '—') + '<br><span class="mini">compra del servicio: ' + PRENV.compra(of) + '</span>', { estilo: 'margin-top:8px' }) +
        '<div id="env-res" style="margin-top:10px"></div><p class="hint">Transferencia (tipo TRF-FABRIC) con guía de remisión «Traslado de bienes para transformación»; se ve en Inventarios (GI-07 / GI-14).</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PRENV.guardar()">Registrar envío</button>'
    });
    PRENV.resumen();
  },
  resumen() {
    const of = PR02.of(), box = document.getElementById('env-res'); if (!box) return;
    const c = Math.max(0, UI.f('env-cant'));
    box.innerHTML = UI.tabla(['Material', 'Desde', 'Hacia', ['Cantidad', 'num'], ['Stock en origen', 'num']], Prod.lineasTercero(of).map(m => {
      const o = m.almPropio || Prod.almRecibo(m.cod), q = UI.r4(m.cons * c), act = Stock.act(o, m.cod);
      return '<tr><td>' + UI.esc(M.nomArt(m.cod)) + '</td><td class="mini">' + o + '</td><td class="mini">' + m.alm + '</td><td class="num">' + UI.q(q, m.u) + '</td><td class="num"><span class="' + (act + 0.00005 < q ? 'err-t' : 'mini') + '">' + UI.n(act) + '</span></td></tr>';
    }));
  },
  guardar() {
    const of = PR02.of();
    const r = App.accion(() => Prod.enviarProveedor(of, { cant: UI.f('env-cant'), fecha: UI.dtTexto(UI.v('env-fecha')) }), x => 'Envío ' + x.n + ': ' + x.movs.join(', ') + ' · GRE ' + x.guia);
    if (r) { UI.cerrar(); PR02.tab = 'emi'; App.refrescar(); }
  }
};

/* ---------- Recibos ---------- */
const PRRE = {
  render(of) {
    return PRUI.barra(of) + UI.tabla(['#', 'Fecha', ['Cantidad', 'num'], 'Consumo por notificación', 'Documentos', ['Costo', 'num'], ['Unitario', 'num'], ['', '', '56px']], of.recibos.slice().reverse().map(r =>
      '<tr><td><b>' + r.n + '</b></td><td class="mini">' + r.f + '</td><td class="num"><b>' + UI.q(r.cant, M.u(of.art)) + '</b></td>' +
      '<td class="mini">' + (r.lineas.map(l => UI.esc(M.nomArt(l.cod)) + ' ' + UI.q(l.cant, l.u)).concat(r.recursos.map(x => UI.esc(PRUI.nomRec(x.cod)) + ' ' + UI.n(x.cant) + ' ' + x.u)).join('<br>') || '—') + '</td>' +
      '<td>' + PRUI.chips(r.movs) + '</td><td class="num">' + UI.s(r.costo) + '</td><td class="num"><b>' + UI.s(r.cu) + '</b></td>' +
      '<td><button class="btn btn-secondary btn-sm" onclick="PRRE.ver(' + r.n + ')">👁</button></td></tr>'),
      { vacio: of.estado === 'Planificado' ? 'Libere la orden para recibir' : 'Sin recibos' });
  },
  abrir() {
    const of = PR02.of(); if (!of || of.estado !== 'Liberado') return;
    const max = Prod.pendiente(of);
    UI.modal({
      lg: true, ancho: '860px', titulo: 'Recibo de producción · ' + of.id,
      cuerpo: '<div class="formgrid c3">' +
        UI.dato('Produce', UI.esc(M.nomArt(of.art)) + '<br><span class="mini">pendiente por recibir ' + UI.n(max, 0) + ' ' + M.u(of.art) + '</span>') +
        UI.campo('Cantidad producida', '<input id="re-cant" type="number" min="0" step="any" value="' + max + '" oninput="PRRE.resumen()" style="font-size:16px;font-weight:600">', { req: true }) +
        UI.campo('Fecha', '<input id="re-fecha" type="datetime-local" value="' + UI.dtLocal() + '">') + '</div>' +
        UI.campo('Observación', '<input id="re-obs" style="width:100%">', { estilo: 'margin-top:8px' }) +
        '<div id="re-res" style="margin-top:12px"></div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" id="re-b" onclick="PRRE.guardar()">Registrar recibo</button>'
    });
    PRRE.resumen();
  },
  resumen() {
    const of = PR02.of(), box = document.getElementById('re-res'); if (!box) return;
    const cant = UI.f('re-cant'), max = Prod.pendiente(of), exceso = cant > max + 0.0001, c = cant > 0 && !exceso ? cant : 0;
    const falt = c ? Prod.faltantesNotificacion(of, c) : [], est = Prod.estimarRecibo(of, c);
    const b = document.getElementById('re-b'); if (b) b.disabled = exceso || !(cant > 0) || falt.length > 0;
    const mats = of.mats.filter(m => m.metodo === 'Notificación'), recs = of.recs.filter(r => r.metodo === 'Notificación');
    box.innerHTML = (exceso ? UI.aviso('Quedan por recibir <b>' + UI.n(max, 0) + '</b>: no puede recibir ' + UI.n(cant, 0) + '.', 'err') : '') +
      '<div class="sec">Se consume por notificación</div>' +
      UI.tabla(['Componente', 'Almacén', ['Cantidad', 'num'], ['Stock en almacén', 'num']], mats.map(m => {
        const q = UI.r4(m.cons * c), act = Stock.act(m.alm, m.cod);
        return '<tr><td>' + UI.esc(M.nomArt(m.cod)) + ' <span class="mini">' + m.cod + '</span></td><td class="mini">' + m.alm + '</td><td class="num">' + UI.q(q, m.u) + '</td><td class="num"><span class="' + (act + 0.00005 < q ? 'err-t' : 'mini') + '">' + UI.n(act) + '</span></td></tr>';
      }).concat(recs.map(r => '<tr><td>' + UI.esc(PRUI.nomRec(r.cod)) + ' <span class="mini">recurso</span></td><td class="mini">—</td><td class="num">' + UI.n(r.cons * c) + ' ' + r.u + '</td><td></td></tr>')),
        { vacio: 'Ninguna línea es de método Notificación', estilo: 'margin-bottom:8px' }) +
      (falt.length ? '<div class="card aviso err"><b>Falta stock para el consumo por notificación.</b> Solicite los materiales a Logística y registre el recibo cuando lleguen.' +
        UI.tabla(['Componente', 'Hacia', ['Falta', 'num']], falt.map(x => '<tr><td>' + UI.esc(M.nomArt(x.cod)) + '</td><td class="mini">' + x.alm + '</td><td class="num"><b>' + UI.n(x.falta) + '</b></td></tr>'), { estilo: 'margin:8px 0' }) +
        '<button class="btn btn-secondary btn-sm" onclick="PRRE.solicitar()">Solicitar materiales a Logística</button></div>' : '') +
      '<div class="sec">Entra al almacén</div>' +
      UI.tabla(['', ['Cantidad', 'num'], 'Almacén', ['Costo estimado', 'num']], ['<tr><td><b>' + UI.esc(M.nomArt(of.art)) + '</b></td><td class="num ok-t">+' + UI.q(c, M.u(of.art)) + '</td><td>' + of.alm + '</td>' +
        '<td class="num"><b>' + UI.s(est.total) + '</b><br><span class="mini">notificación ' + UI.s(est.back) + ' + emitido ' + UI.s(est.wip) + '</span></td></tr>']);
  },
  solicitar() {
    const of = PR02.of(), falt = Prod.faltantesNotificacion(of, UI.f('re-cant'));
    const r = App.accion(() => Prod.solicitarFaltantes(of, falt.map(x => ({ art: x.cod, cant: x.falta, destino: x.alm })), 'Falta stock para recibir'),
      x => x.map(s => s.id).join(', ') + ' enviada a Logística');
    if (r) { UI.cerrar(); App.refrescar(); }
  },
  guardar() {
    const of = PR02.of();
    const r = App.accion(() => Prod.recibir(of, { cant: UI.f('re-cant'), fecha: UI.dtTexto(UI.v('re-fecha')), obs: UI.v('re-obs') }), x => 'Recibo ' + x.n + ': ' + x.movs.join(', '));
    if (r) { UI.cerrar(); PR02.tab = 'rec'; App.refrescar(); }
  },
  ver(n) {
    const of = PR02.of(), r = of.recibos.find(x => x.n === n); if (!r) return;
    UI.modal({
      titulo: 'Recibo ' + r.n + ' · ' + of.id, lg: true,
      cuerpo: '<p><b>' + UI.q(r.cant, M.u(of.art)) + '</b> de ' + UI.esc(M.nomArt(of.art)) + ' a ' + of.alm + ' · ' + r.f + (r.obs ? ' · ' + UI.esc(r.obs) : '') + '</p>' +
        '<p>Costo ' + UI.s(r.costo) + ' · unitario <b>' + UI.s(r.cu) + '</b></p>' +
        '<div class="sec">Consumido por notificación</div>' + UI.tabla(['Componente', 'Almacén', ['Cantidad', 'num'], ['Costo', 'num']], r.lineas.map(l =>
          '<tr><td>' + UI.esc(M.nomArt(l.cod)) + '</td><td class="mini">' + l.alm + '</td><td class="num">' + UI.q(l.cant, l.u) + '</td><td class="num">' + UI.s(l.valor) + '</td></tr>'), { vacio: 'Sin materiales', estilo: 'margin-bottom:8px' }) +
        PRUI.recursos(r.recursos) + '<div class="sec">Documentos</div>' + PRUI.chips(r.movs)
    });
  }
};
PR02.registrarTab({ id: 'rec', orden: 3, titulo: of => 'Recibos (' + of.recibos.length + ')', render: PRRE.render });

/* ---------- Costo ---------- */
const PRCOS = {
  render(of) {
    const sv = Prod.contrasteServicios(of);
    return UI.kpis([
      { l: 'Materiales', v: UI.s(of.costo.mat) },
      { l: 'Recursos', v: UI.s(of.costo.rec) },
      { l: 'Servicios (estándar)', v: UI.s(of.costo.serv) },
      { l: 'En proceso', v: UI.s(Prod.enProceso(of)), s: 'emitido sin recibir' },
      { l: 'Costo unitario', v: UI.s(Prod.costoUnit(of)), s: UI.n(of.prod, 0) + ' recibidos' }
    ]) +
      '<div style="margin-bottom:10px"><button class="btn btn-secondary btn-sm" onclick="PRCOS.detalle()">Ver detalle por material y recurso</button></div>' +
      UI.tabla(['Recibo', ['Cantidad', 'num'], ['Costo', 'num'], ['Unitario', 'num']], of.recibos.map(r =>
        '<tr><td>' + r.n + ' · ' + r.f + '</td><td class="num">' + UI.n(r.cant, 0) + '</td><td class="num">' + UI.s(r.costo) + '</td><td class="num"><b>' + UI.s(r.cu) + '</b></td></tr>'), { vacio: 'Sin recibos' }) +
      (sv.length ? '<div class="sec">Servicios de terceros: costo estándar vs OC vs factura<div style="flex:1"></div><button class="btn btn-secondary btn-sm" onclick="PRCOS.notaCredito()">+ Nota de crédito</button></div>' +
        '<div style="margin-bottom:8px"><span class="mini">Compra del servicio:</span> ' + PRENV.compra(of) + '</div>' +
        UI.tabla(['Servicio', ['Cantidad', 'num'], ['Estándar', 'num'], ['OC', 'num'], ['Factura', 'num'], ['Nota de crédito', 'num'], ['Costo de compra', 'num'], ['Diferencia', 'num'], 'Documentos'], sv.map(x =>
          '<tr><td>' + UI.esc(PRUI.nomRec(x.cod)) + '<br><span class="mini">' + UI.esc(M.provNom(Prod.provServicio(of))) + '</span></td><td class="num">' + UI.n(x.cant) + ' / ' + UI.n(x.plan) + '</td><td class="num">' + UI.s(x.estandar) + '</td>' +
          '<td class="num">' + (x.hayOC ? UI.s(x.oc) : '—') + '</td><td class="num">' + (x.hayFac ? UI.s(x.factura) : '—') + '</td><td class="num">' + (x.nc ? '− ' + UI.s(x.nc) : '—') + '</td>' +
          '<td class="num">' + (x.hayOC || x.hayFac ? UI.s(x.real) : '—') + '</td><td class="num">' + (x.dif == null ? '—' : '<span class="' + (x.dif > 0 ? 'err-t' : x.dif < 0 ? 'ok-t' : '') + '">' + UI.s(x.dif) + '</span>') + '</td>' +
          '<td class="mini">' + (x.docs.map(c => c.tipo + ' ' + (c.tipo === 'OC' ? '<button class="btn-link" style="padding:0" onclick="PRCOS.verOC(\'' + c.doc + '\')">' + UI.esc(c.doc) + '</button>' : UI.esc(c.doc)) + ' · ' + c.f.slice(0, 10) + ' · ' + UI.s(c.importe)).join('<br>') || 'sin OC ni factura') + '</td></tr>')) +
        '<p class="hint">El servicio entra a la orden como recurso con su costo estándar (al recibir). La OC la crea Logística desde la solicitud (GI-13) y aparece aquí cuando Compras la aprueba; la factura, cuando Compras la registra (CO-10). Costo de compra = factura (o la OC si aún no hay factura) − notas de crédito. Solo la nota de crédito o devolución de compra se vincula a mano.</p>' : '');
  },
  detalle() {
    const of = PR02.of(), d = Prod.costoDetalle(of);
    const tot = l => l.reduce((s, x) => s + x.valor, 0);
    UI.modal({
      titulo: 'Detalle de costo · ' + of.id, lg: true,
      cuerpo: '<div class="sec">Materiales</div>' +
        UI.tabla(['Material', ['Cantidad', 'num'], ['Costo unitario', 'num'], ['Costo', 'num']], d.mats.map(x => '<tr><td>' + UI.esc(M.nomArt(x.cod)) + '</td><td class="num">' + UI.q(x.cant, x.u) + '</td><td class="num">' + UI.n(x.cant ? x.valor / x.cant : 0, 4) + '</td><td class="num">' + UI.s(x.valor) + '</td></tr>'),
          { vacio: 'Sin consumo', foot: '<tr><td colspan="3" class="num"><b>Total materiales</b></td><td class="num"><b>' + UI.s(tot(d.mats)) + '</b></td></tr>' }) +
        '<div class="sec">Recursos y servicios</div>' +
        UI.tabla(['Recurso', ['Cantidad', 'num'], ['Costo estándar', 'num'], ['Costo', 'num']], d.recs.map(x => '<tr><td>' + UI.esc(PRUI.nomRec(x.cod)) + '</td><td class="num">' + UI.n(x.cant) + ' ' + x.u + '</td><td class="num">' + UI.s(x.cant ? x.valor / x.cant : 0) + '</td><td class="num">' + UI.s(x.valor) + '</td></tr>'),
          { vacio: 'Sin recursos', foot: '<tr><td colspan="3" class="num"><b>Total recursos y servicios</b></td><td class="num"><b>' + UI.s(tot(d.recs)) + '</b></td></tr>' }) +
        '<p><b>Costo total ' + UI.s(tot(d.mats) + tot(d.recs)) + '</b> · recibido ' + UI.s(of.absorbido) + ' · unitario ' + UI.s(Prod.costoUnit(of)) + '</p>'
    });
  },
  verOC(id) {
    const o = BD.oc(id); if (!o) { UI.toast('OC no encontrada'); return; }
    const t = Docs.oc.totales(o), av = Docs.oc.avance(o);
    UI.modal({
      titulo: 'Orden de compra ' + o.id + ' · ' + o.tipo, lg: true,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Estado', UI.esc(o.est)) + UI.dato('Proveedor', UI.esc(M.provNom(o.prov)) + ' <span class="mini">' + o.prov + '</span>') + UI.dato('Fecha', o.fecha) +
        UI.dato('Solicitud', UI.esc(o.sol || '—')) + UI.dato('Orden', UI.esc(o.of || '—')) + UI.dato('Avance', 'Recibido ' + av.rec + ' % · facturado ' + av.fac + ' %') + '</div>' +
        '<div class="sec" style="margin-top:12px">Líneas</div>' + UI.tabla(['Código', 'Descripción', ['Cantidad', 'num'], ['Precio', 'num'], ['Recibido / conforme', 'num'], ['Facturado', 'num']], o.items.map(i =>
          '<tr><td>' + i.art + '</td><td>' + UI.esc(M.nomArt(i.art)) + '</td><td class="num">' + UI.n(i.cant) + '</td><td class="num">' + UI.n(i.pu, 2) + '</td><td class="num">' + UI.n(i.recq) + '</td><td class="num">' + UI.n(i.facq) + '</td></tr>'),
          { foot: '<tr><td colspan="5" class="num">Subtotal ' + UI.s(t.sub) + ' · IGV ' + UI.s(t.igv) + '</td><td class="num"><b>' + UI.s(t.total) + '</b></td></tr>' }) +
        '<p class="hint">La OC se gestiona en Compras (CO-07): aprobación, conformidad del servicio y factura.</p>'
    });
  },
  notaCredito() {
    const of = PR02.of(), sv = Prod.contrasteServicios(of);
    UI.modal({
      titulo: 'Vincular nota de crédito del servicio · ' + of.id,
      cuerpo: '<div class="formgrid">' +
        UI.campo('Servicio', '<select id="cp-rec">' + UI.opts(sv.map(x => ({ v: x.cod, t: x.cod + ' · ' + PRUI.nomRec(x.cod) })), sv.length ? sv[0].cod : '') + '</select>', { req: true, full: true }) +
        UI.campo('Número', '<input id="cp-doc" placeholder="NC01-000123">', { req: true }) +
        UI.campo('Cantidad', '<input id="cp-cant" type="number" min="0" step="any" value="' + (sv.length ? sv[0].cant : 0) + '">') +
        UI.campo('Importe sin IGV', '<input id="cp-imp" type="number" min="0" step="any">', { req: true }) + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PRCOS.guardarNota()">Vincular</button>'
    });
  },
  guardarNota() {
    const of = PR02.of();
    if (App.accion(() => Prod.registrarNotaCredito(of, { rec: UI.v('cp-rec'), doc: UI.v('cp-doc'), cant: UI.f('cp-cant'), importe: UI.f('cp-imp') }), 'Nota de crédito vinculada')) { UI.cerrar(); App.refrescar(); }
  }
};
PR02.registrarTab({ id: 'cost', orden: 4, titulo: 'Costo', render: PRCOS.render });
