/* COMERCIAL · CL-47 Recepción de mercadería (menú Abastecimiento) y modal CL-48 Confirmar recepción.
   Flujo NEUTRAL (decisión 2026-09-18): es la misma Solicitud de Transferencia de Inventarios (BD.d.trfs, ST-000001) y la misma
   operación Docs.trf.recibir que usa GI-11; aquí solo cambia la presentación, más simple para la tienda. No hay otro documento ni otro estado.
   Quién confirma: el usuario cuya sede es la del almacén de destino (Store.enMiSede) o un usuario logístico general (acceso_logistico_general).
   Se listan solo las transferencias que llegan a los almacenes de la sede del usuario (todas si es logístico general); los Borradores no se muestran. */
const CM14 = {
  tab: 'pend',
  /* el documento conserva sus estados; en la tienda se leen así */
  ETIQUETA: { Aprobada: 'En camino', Parcial: 'Llegó incompleto', Recibida: 'Recibido', Cancelada: 'Anulado' },
  COLOR: { Aprobada: 'var(--prp)', Parcial: 'var(--pendiente)', Recibida: 'var(--confirmado)', Cancelada: 'var(--cancelada)' },
  lista() {
    return (Store.d.trfs || []).filter(t => t.estado !== 'Borrador' && Store.enMiSede(t.destino));
  },
  pendientes() { return CM14.lista().filter(t => t.estado === 'Aprobada' || t.estado === 'Parcial'); },
  unidades(t, campo) { return t.lineas.reduce((a, l) => a + (campo === 'pend' ? Docs.trf.pendiente(l) : campo === 'rec' ? (l.recibido || 0) : l.cant), 0); },
  render(p) {
    const todas = CM14.lista(), pend = CM14.pendientes(), rec = todas.filter(t => t.estado === 'Recibida' || t.estado === 'Cancelada');
    if (p && p.id) { const t = todas.find(x => x.id === p.id); if (t) CM14.tab = (t.estado === 'Aprobada' || t.estado === 'Parcial') ? 'pend' : 'rec'; }
    const alcance = Store.general() ? 'todos los almacenes (usuario logístico general)' : 'los almacenes de su sede: <b>' + Store.almsSede().map(a => UI.esc(a + ' · ' + M.almNom(a))).join(', ') + '</b>';
    const lista = CM14.tab === 'pend' ? pend : rec;
    const ajena = p && p.id && !todas.some(x => x.id === p.id) ? BD.trf(p.id) : null;
    const tabs = [['pend', 'Por recibir (' + pend.length + ')'], ['rec', 'Recibidas (' + rec.length + ')']];
    return '<div class="screen-head"><h1>Recepción de mercadería</h1><span class="code">CL-47</span></div>' +
      '<p class="hint" style="margin:0 0 10px">Lo que Logística envía a su tienda. Cuando la mercadería llegue, revise las cantidades y confirme: recién ahí se suma a su stock. Se muestran ' + alcance + '.</p>' +
      (ajena ? UI.aviso('La transferencia <b>' + UI.esc(ajena.id) + '</b> va a ' + UI.esc(ajena.destino + ' · ' + M.almNom(ajena.destino)) + ', que no es de su sede: la confirma alguien de esa sede o un usuario logístico general.') : '') +
      '<div class="tabs">' + tabs.map(x => '<div class="tab' + (x[0] === CM14.tab ? ' active' : '') + '" onclick="CM14.tab=\'' + x[0] + '\';App.go(\'cm14\')">' + x[1] + '</div>').join('') + '</div>' +
      (lista.length ? lista.map(t => CM14.tarjeta(t, p && p.id === t.id)).join('') :
        UI.aviso(CM14.tab === 'pend' ? 'No hay mercadería en camino a su sede.' : 'Todavía no hay recepciones registradas en su sede.', 'info'));
  },
  tarjeta(t, resaltar) {
    const puede = Store.puede('recibir_transferencia') && Store.enMiSede(t.destino) && (t.estado === 'Aprobada' || t.estado === 'Parcial');
    const recs = (t.hist || []).filter(h => /^Recepción confirmada/.test(h.a));
    const origen = t.sol ? 'Atiende su solicitud <b>' + UI.esc(t.sol) + '</b>' : 'Envío directo de Logística';
    return '<div class="card" id="trf-' + t.id + '"' + (resaltar ? ' style="box-shadow:0 0 0 2px var(--primario)"' : '') + '>' +
      '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:240px"><div style="font-size:15px;font-weight:600">Desde ' + UI.esc(M.almNom(t.origen)) + ' → ' + UI.esc(M.almNom(t.destino)) + '</div>' +
        '<div class="mini">' + t.id + ' · enviado el ' + UI.esc(String(t.fecha || '').split(' ')[0]) + ' · ' + origen + '</div></div>' +
        '<div style="text-align:right">' + UI.badge(CM14.ETIQUETA[t.estado] || t.estado, CM14.COLOR[t.estado] || 'var(--borrador)') +
          '<div class="mini" style="margin-top:3px">' + UI.q(CM14.unidades(t)) + (CM14.unidades(t) === 1 ? ' unidad enviada' : ' unidades enviadas') + '</div></div>' +
      '</div>' +
      UI.tabla(['Producto', ['Enviado', 'num'], ['Recibido', 'num'], ['Falta', 'num']], t.lineas.map(l => {
        const f = Docs.trf.pendiente(l);
        return '<tr><td>' + UI.esc(M.nomArt(l.art)) + '<br><span class="mini">' + l.art + '</span></td><td class="num">' + UI.q(l.cant) + '</td><td class="num">' + (l.recibido ? UI.q(l.recibido) : '') + '</td>' +
          '<td class="num">' + (f > 0 && t.estado !== 'Cancelada' ? '<b style="color:var(--pendiente)">' + UI.q(f) + '</b>' : '') + '</td></tr>';
      }), { sub: true, estilo: 'margin-top:10px' }) +
      (recs.length ? '<p class="mini" style="margin-top:8px">' + recs.map(h => 'Recibido el ' + UI.esc(h.f) + ' por ' + UI.esc(h.u)).join(' · ') + (t.estado === 'Recibida' && t.lineas.some(l => Docs.trf.pendiente(l) > 0) ? ' · lo que faltaba se anuló' : '') + '</p>' : '') +
      (t.estado === 'Parcial' ? '<p class="mini" style="margin-top:4px">Lo que falta sigue en camino: se confirma cuando llegue, o Logística lo anula.</p>' : '') +
      (puede ? '<div style="margin-top:10px;text-align:right"><button class="btn btn-primary" onclick="CM14.recibir(\'' + t.id + '\')">Recibir mercadería</button></div>' : '') +
    '</div>';
  },
  /* CL-48: cantidades precargadas con lo que falta llegar; se puede bajar si llegó menos */
  recibir(id) {
    const t = BD.trf(id); if (!t) return;
    if (!Store.puede('recibir_transferencia') || !Store.enMiSede(t.destino)) { UI.toast('Solo confirma la recepción alguien de la sede de ' + M.almNom(t.destino) + ' o un usuario logístico general'); return; }
    const ls = t.lineas.map((l, i) => ({ l, i, f: Docs.trf.pendiente(l) })).filter(x => x.f > 0);
    UI.modal({
      titulo: 'Recibir mercadería · ' + t.id, code: 'CL-48', lg: true,
      cuerpo: '<p style="margin:0 0 10px">Cuente lo que llegó a <b>' + UI.esc(M.almNom(t.destino)) + '</b>. Si llegó todo, confirme tal cual; si llegó menos, corrija la cantidad.</p>' +
        UI.tabla(['Producto', ['Debe llegar', 'num'], ['Llegó', 'num', '130px']], ls.map(x =>
          '<tr><td>' + UI.esc(M.nomArt(x.l.art)) + '<br><span class="mini">' + x.l.art + '</span></td><td class="num">' + UI.q(x.f) + '</td>' +
          '<td class="num"><input id="rc-' + x.i + '" type="number" min="0" max="' + x.f + '" step="1" value="' + x.f + '" data-max="' + x.f + '" oninput="CM14.aviso()" style="width:100%;text-align:right"></td></tr>'), { sub: true }) +
        '<div id="rc-aviso" class="mini" style="margin-top:8px"></div>' +
        '<div class="formgrid" style="margin-top:8px">' + UI.campo('Observación (opcional)', '<input id="rc-obs" placeholder="Ej. llegó una caja abierta">', { full: true }) + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM14.confirmar(\'' + id + '\')">Confirmar recepción</button>'
    });
    CM14.aviso();
  },
  aviso() {
    const el = document.getElementById('rc-aviso'); if (!el) return;
    const menos = [...document.querySelectorAll('[id^="rc-"][data-max]')].some(x => (parseFloat(x.value) || 0) < Number(x.dataset.max));
    el.innerHTML = menos ? '<b style="color:var(--pendiente)">Llegó incompleto:</b> lo que falta queda en camino hasta que llegue o Logística lo anule.' : 'Llegó todo: la transferencia queda Recibida.';
  },
  confirmar(id) {
    const t = BD.trf(id);
    const lineas = t.lineas.map((l, i) => ({ art: l.art, cant: UI.f('rc-' + i) })).filter(x => x.cant > 0);
    if (!lineas.length) { UI.toast('Indique al menos una cantidad recibida'); return; }
    const obs = UI.v('rc-obs').trim(), total = lineas.reduce((a, x) => a + x.cant, 0);
    const ok = App.accion(() => {
      Store.exigir('recibir_transferencia', 'confirmar recepciones');
      if (!Store.enMiSede(t.destino)) throw new Error('El almacén ' + t.destino + ' no es de su sede');
      return Docs.trf.recibir(id, lineas, obs);   /* la misma operación que GI-11 de Inventarios */
    }, () => 'Se ' + (total === 1 ? 'sumó 1 unidad' : 'sumaron ' + UI.q(total) + ' unidades') + ' a ' + M.almNom(t.destino) + ' (' + id + ' ' + (CM14.ETIQUETA[BD.trf(id).estado] || '').toLowerCase() + ')');
    if (!ok) return;
    UI.cerrar();
    App.go('cm14', { id });
  }
};
App.pantalla('cm14', {
  titulo: 'Recepción de mercadería', permiso: 'ver_existencias',
  miga: p => p && p.id ? 'Recepción de mercadería / <b>' + UI.esc(p.id) + '</b>' : '<b>Recepción de mercadería</b>',
  render: CM14.render,
  /* App.go vuelve al inicio después de pintar: se desplaza a la tarjeta en el siguiente ciclo */
  despues: p => { if (p && p.id) setTimeout(() => { const e = document.getElementById('trf-' + p.id); if (e) e.scrollIntoView({ block: 'center' }); }, 0); }
});
