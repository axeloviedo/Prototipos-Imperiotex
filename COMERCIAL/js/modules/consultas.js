/* COMERCIAL V9 · CM-06 Existencias y movimientos: lo que Comercial ve de Inventarios (T1) y lo que mueve (T2) */
const CM06 = {
  tab: 'ex', f: { alm: '', grupo: '', q: '', cero: false, tipo: '', mq: '', art: 'PT-0001', kalm: '' },
  render() {
    const t = CM06.tab;
    const tabs = [['ex', 'Existencias'], ['mov', 'Movimientos (' + Store.d.movs.length + ')'], ['kar', 'Kardex']];
    return '<div class="screen-head"><h1>Existencias y movimientos</h1><span class="code">CM-06</span></div>' +
      '<div class="tabs">' + tabs.map(x => '<div class="tab' + (x[0] === t ? ' active' : '') + '" onclick="CM06.tab=\'' + x[0] + '\';App.refrescar()">' + x[1] + '</div>').join('') + '</div>' +
      (t === 'ex' ? CM06.existencias() : t === 'mov' ? CM06.movimientos() : CM06.kardex());
  },
  existencias() {
    const f = CM06.f, q = f.q.toLowerCase(), sup = Store.puede('configurar_comercial');
    const filas = Store.d.stock.filter(s => (f.cero || s.act || s.comp) && (!f.alm || s.alm === f.alm) && (!f.grupo || (Store.art(s.art) || {}).grupo === f.grupo) &&
      (!q || s.art.toLowerCase().includes(q) || M.nomArt(s.art).toLowerCase().includes(q)))
      .sort((a, b) => a.alm.localeCompare(b.alm) || a.art.localeCompare(b.art));
    const valor = filas.reduce((a, s) => a + s.act * s.costo, 0);
    return '<div class="card"><div class="filters">' +
      UI.campo('Almacén', '<select onchange="CM06.f.alm=this.value;App.refrescar()">' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), f.alm, 'Todos') + '</select>') +
      UI.campo('Grupo de artículo', '<select onchange="CM06.f.grupo=this.value;App.refrescar()">' + UI.opts([...new Set(Store.d.arts.filter(a => a.inv).map(a => a.grupo))], f.grupo, 'Todos') + '</select>') +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="CM06.f.q=this.value;App.refrescar()" placeholder="Código o nombre">') +
      '<label class="check"><input type="checkbox"' + (f.cero ? ' checked' : '') + ' onchange="CM06.f.cero=this.checked;App.refrescar()"> Mostrar en cero</label></div></div>' +
      UI.tabla(['Almacén', 'Código', 'Artículo', 'UM', ['Actual', 'num'], ['Comprometido', 'num'], ['Disponible', 'num']].concat(sup ? [['Costo prom.', 'num'], ['Valor', 'num']] : []), filas.map(s => {
        const disp = UI.r4(s.act - s.comp), a = Store.art(s.art) || {};
        return '<tr><td class="mini">' + s.alm + '</td><td>' + s.art + '</td><td>' + UI.esc(M.nomArt(s.art)) + '</td><td>' + (a.u || '') + '</td>' +
          '<td class="num"><span class="' + (s.act < 0 ? 'err-t' : '') + '">' + UI.n(s.act, 0) + '</span></td><td class="num">' + (s.comp ? UI.n(s.comp, 0) : '') + '</td>' +
          '<td class="num"><b class="' + (disp <= 0 ? 'err-t' : '') + '">' + UI.n(disp, 0) + '</b></td>' + (sup ? '<td class="num">' + UI.n(s.costo, 4) + '</td><td class="num">' + UI.s(s.act * s.costo) + '</td>' : '') + '</tr>';
      }), { foot: sup ? '<tr><td colspan="8" class="num"><b>Valor total</b></td><td class="num"><b>' + UI.s(valor) + '</b></td></tr>' : '' }) +
      '<p class="hint">Disponible = Actual − Comprometido (T1). Comercial no compromete stock: la venta baja el Actual con su salida y la devolución lo sube con su ingreso. Lo comprometido que se ve aquí viene de transferencias aprobadas (GI-11) o de las solicitudes de GP (T7). El producto terminado entra por los recibos de Producción (PRODUCCION).</p>';
  },
  movimientos() {
    const f = CM06.f;
    const lista = Store.d.movs.filter(m => (!f.tipo || m.tipo === f.tipo) && (!f.mq || (m.ndoc + ' ' + m.id + ' ' + m.det + ' ' + m.od).toLowerCase().includes(f.mq.toLowerCase())));
    return '<div class="card"><div class="filters">' +
      UI.campo('Tipo', '<select onchange="CM06.f.tipo=this.value;App.refrescar()">' + UI.opts(['Ingreso', 'Salida'], f.tipo, 'Todos') + '</select>') +
      UI.campo('Buscar (documento / movimiento / cliente)', '<input value="' + UI.esc(f.mq) + '" onchange="CM06.f.mq=this.value;App.refrescar()" placeholder="Ej. VEN-2026-000230">') + '</div></div>' +
      UI.tabla(['Movimiento', 'Fecha', 'Tipo', 'Detalle', 'Documento', 'Origen → destino', 'Concepto contable', ['Líneas', 'num'], ['Valor', 'num']], lista.map(m =>
        '<tr class="clickable" onclick="CM06.verMov(\'' + m.id + '\')"><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '</td><td>' + UI.badge(m.tipo, m.tipo === 'Ingreso' ? 'var(--confirmado)' : 'var(--parcial)') + '</td>' +
        '<td>' + UI.esc(m.det) + '</td><td>' + CM06.linkDoc(m.ndoc) + '</td><td class="mini">' + UI.esc(m.od) + '</td><td class="mini">' + UI.esc(m.concepto) + '</td><td class="num">' + m.lineas.length + '</td><td class="num">' + UI.s(m.valor) + '</td></tr>'), { vacio: 'Sin movimientos' }) +
      '<p class="hint">Movimientos V7 separados (T2): la venta genera una <b>Salida</b> (GI-10 «Venta al por menor / por mayor») y la devolución o la anulación un <b>Ingreso</b> (GI-09 «Devoluciones de Clientes»), con la venta o la devolución como documento de origen. Aparecen igual en GI-07 y en el Kardex GI-06.</p>';
  },
  linkDoc(nd) {
    if (/^VEN-/.test(nd)) return '<button class="btn-link" style="padding:0" onclick="event.stopPropagation();App.go(\'cm02v\',{id:\'' + nd + '\'})">' + nd + '</button>';
    if (/^DEV-/.test(nd)) return '<button class="btn-link" style="padding:0" onclick="event.stopPropagation();App.go(\'cm03f\',{id:\'' + nd + '\'})">' + nd + '</button>';
    return UI.esc(nd);
  },
  kardex() {
    const f = CM06.f;
    const arts = [...new Set(Store.d.movs.flatMap(m => m.lineas.map(l => l.art)))].sort();
    if (arts.indexOf(f.art) < 0) f.art = arts[0] || '';
    const filas = f.art ? Stock.kardex(f.art, f.kalm) : [];
    return '<div class="card"><div class="filters">' +
      UI.campo('Artículo', '<select onchange="CM06.f.art=this.value;App.refrescar()">' + UI.opts(arts.map(a => ({ v: a, t: a + ' · ' + M.nomArt(a) })), f.art) + '</select>') +
      UI.campo('Almacén', '<select onchange="CM06.f.kalm=this.value;App.refrescar()">' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod })), f.kalm, 'Todos') + '</select>') + '</div></div>' +
      UI.tabla(['Fecha', 'Movimiento', 'Detalle', 'Documento', 'Almacén', ['Entrada', 'num'], ['Salida', 'num'], ['Costo', 'num'], ['Saldo en almacén', 'num']], filas.map(k =>
        '<tr><td class="mini">' + k.fecha + '</td><td><button class="btn-link" onclick="CM06.verMov(\'' + k.id + '\')">' + k.id + '</button></td><td>' + UI.esc(k.det) + '</td><td>' + CM06.linkDoc(k.ndoc) + '</td><td class="mini">' + k.alm + '</td>' +
        '<td class="num">' + (k.ent ? UI.n(k.ent, 0) : '') + '</td><td class="num">' + (k.sal ? UI.n(k.sal, 0) : '') + '</td><td class="num">' + UI.n(k.costo, 4) + '</td><td class="num">' + UI.n(k.saldo, 0) + '</td></tr>'), { vacio: 'Sin movimientos de este artículo' }) +
      '<p class="hint">Solo los movimientos registrados en esta demo comercial; el saldo inicial viene del inventario de producto terminado.</p>';
  },
  verMov(id) {
    const m = Store.d.movs.find(x => x.id === id);
    if (!m) { UI.toast('Movimiento no encontrado'); return; }
    UI.modal({
      titulo: m.id + ' · ' + m.tipo, lg: true,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Detalle', UI.esc(m.det), { estilo: 'grid-column:span 2' }) + UI.dato('Estado', m.est) + UI.dato('Fecha', m.fecha) +
        UI.dato('Documento de origen', m.ndoc) + UI.dato('Usuario', UI.esc(m.usuario)) + UI.dato('Origen → destino', UI.esc(m.od), { estilo: 'grid-column:span 2' }) +
        UI.dato('Concepto contable', UI.esc(m.concepto)) + (m.obs ? UI.dato('Observación', UI.esc(m.obs), { full: true }) : '') + '</div>' +
        '<div class="sec">Líneas</div>' +
        UI.tabla(['Almacén', 'Código', 'Artículo', ['Cantidad', 'num'], ['Costo', 'num'], ['Valor', 'num'], ['Saldo', 'num']], m.lineas.map(l => '<tr><td class="mini">' + l.alm + '</td><td>' + l.art + '</td><td>' + UI.esc(M.nomArt(l.art)) + '</td>' +
          '<td class="num"><span class="' + (l.signo < 0 ? 'err-t' : 'ok-t') + '">' + (l.signo < 0 ? '−' : '+') + UI.n(l.cant, 0) + '</span></td><td class="num">' + UI.n(l.costo, 4) + '</td><td class="num">' + UI.s(l.valor) + '</td><td class="num">' + UI.n(l.saldo, 0) + '</td></tr>'))
    });
  }
};
App.pantalla('cm06', { titulo: 'Existencias y movimientos', permiso: 'ver_existencias', render: CM06.render });
