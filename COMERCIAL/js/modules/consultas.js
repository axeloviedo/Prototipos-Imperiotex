/* COMERCIAL · CL-32 Existencias y movimientos sobre la BASE COMPARTIDA: el mismo stock y los mismos movimientos que ven Inventarios (GI-05/06/07)
   y Producción. Existencias de TODOS los almacenes (por defecto los de venta), movimientos de todos los módulos y Kardex · modal CL-33 */
const CM06 = {
  tab: 'ex', f: { alm: '_venta', grupo: '', q: '', cero: false, tipo: '', tmov: '', modulo: '', malm: '', mq: '', art: 'PT-0001', kalm: '' },
  render() {
    const t = CM06.tab;
    const tabs = [['ex', 'Existencias'], ['mov', 'Movimientos (' + Store.d.movs.length + ')'], ['kar', 'Kardex']];
    return '<div class="screen-head"><h1>Existencias y movimientos</h1><span class="code">CL-32</span></div>' +
      '<div class="tabs">' + tabs.map(x => '<div class="tab' + (x[0] === t ? ' active' : '') + '" onclick="CM06.tab=\'' + x[0] + '\';App.refrescar()">' + x[1] + '</div>').join('') + '</div>' +
      (t === 'ex' ? CM06.existencias() : t === 'mov' ? CM06.movimientos() : CM06.kardex());
  },
  /* opciones de almacén: los de venta, todos y cada almacén de la base */
  optsAlm(sel, conVenta) {
    const venta = M.ALMACENES.map(a => a.cod);
    const grupo = [{ v: '', t: 'Todos los almacenes' }].concat(conVenta ? [{ v: '_venta', t: 'Almacenes de venta (' + venta.length + ')' }] : []);
    return UI.opts(grupo.concat(Store.d.maestros.almacenes.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom + (venta.indexOf(a.cod) >= 0 ? ' · venta' : '') }))), sel);
  },
  enAlm(cod, f) { return !f || (f === '_venta' ? M.ALMACENES.some(a => a.cod === cod) : cod === f); },
  existencias() {
    const f = CM06.f, q = f.q.toLowerCase(), sup = Store.puede('configurar_comercial');
    const filas = Store.d.stock.filter(s => (f.cero || s.act || s.comp) && CM06.enAlm(s.alm, f.alm) && (!f.grupo || (Store.art(s.art) || {}).grupo === f.grupo) &&
      (!q || s.art.toLowerCase().includes(q) || M.nomArt(s.art).toLowerCase().includes(q)))
      .sort((a, b) => a.alm.localeCompare(b.alm) || a.art.localeCompare(b.art));
    const valor = filas.reduce((a, s) => a + s.act * s.costo, 0);
    return '<div class="card"><div class="filters">' +
      UI.campo('Almacén', '<select onchange="CM06.f.alm=this.value;App.refrescar()">' + CM06.optsAlm(f.alm, true) + '</select>') +
      UI.campo('Grupo de artículo', '<select onchange="CM06.f.grupo=this.value;App.refrescar()">' + UI.opts(Store.d.maestros.grupos.filter(g => g.inv).map(g => ({ v: g.cod, t: g.nom })), f.grupo, 'Todos') + '</select>') +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="CM06.f.q=this.value;App.refrescar()" placeholder="Código o nombre">') +
      '<label class="check"><input type="checkbox"' + (f.cero ? ' checked' : '') + ' onchange="CM06.f.cero=this.checked;App.refrescar()"> Mostrar en cero</label></div></div>' +
      UI.tabla(['Almacén', 'Código', 'Artículo', 'UM', ['Actual', 'num'], ['Comprometido', 'num'], ['Disponible', 'num']].concat(sup ? [['Costo prom.', 'num'], ['Valor', 'num']] : []), filas.map(s => {
        const disp = UI.r4(s.act - s.comp), a = Store.art(s.art) || {}, cv = Ventas.comprometidoVentas(s.alm, s.art);
        return '<tr><td class="mini"><b>' + s.alm + '</b><br>' + UI.esc(M.almNom(s.alm)) + '</td><td>' + s.art + '</td><td>' + UI.esc(M.nomArt(s.art)) + '</td><td>' + (a.u || '') + '</td>' +
          '<td class="num"><span class="' + (s.act < 0 ? 'err-t' : '') + '">' + UI.q(s.act) + '</span></td><td class="num">' + (s.comp ? UI.q(s.comp) + (cv ? '<br><span class="mini">' + UI.q(cv) + ' por ventas pendientes</span>' : '') : '') + '</td>' +
          '<td class="num"><b class="' + (disp <= 0 ? 'err-t' : '') + '">' + UI.q(disp) + '</b></td>' + (sup ? '<td class="num">' + UI.n(s.costo, 4) + '</td><td class="num">' + UI.s(s.act * s.costo) + '</td>' : '') + '</tr>';
      }), { vacio: 'Sin existencias con estos filtros' + (Store.d.stock.length ? '' : ' (la base aún no tiene stock: escenario «Solo maestros»)'), foot: sup ? '<tr><td colspan="8" class="num"><b>Valor total</b></td><td class="num"><b>' + UI.s(valor) + '</b></td></tr>' : '' }) +
      '<p class="hint">Es el stock único de la base compartida: lo mismo que ven Inventarios (GI-05) y Producción. Disponible = Actual − Comprometido. <b>Comercial sí compromete stock</b>: la venta pendiente de pago sube el Comprometido de cada línea en su almacén; cuando los pagos validados cubren el total se registra su Salida, que baja el Actual y libera lo comprometido. La devolución sube el Actual con su ingreso. El resto del comprometido viene de otros módulos (p. ej. materia prima de Solicitudes de Fabricación aprobadas). El producto terminado entra a SB-CENTRAL por los recibos de Producción y llega a las tiendas por transferencia.</p>';
  },
  movimientos() {
    const f = CM06.f, mq = f.mq.toLowerCase();
    const modulos = [...new Set(Store.d.movs.map(m => m.modulo || 'Sin módulo'))].sort();
    const tipos = (Store.d.maestros.tiposMovimiento || []).map(t => ({ v: t.cod, t: t.cod + ' · ' + t.nom }));
    const lista = Store.d.movs.filter(m => (!f.tipo || m.tipo === f.tipo) && (!f.tmov || m.tipoMov === f.tmov) && (!f.modulo || (m.modulo || 'Sin módulo') === f.modulo) &&
      (!f.malm || m.lineas.some(l => CM06.enAlm(l.alm, f.malm))) &&
      (!mq || (m.ndoc + ' ' + m.id + ' ' + m.det + ' ' + m.od + ' ' + (m.obs || '')).toLowerCase().includes(mq)));
    const color = t => t === 'Ingreso' ? 'var(--confirmado)' : t === 'Salida' ? 'var(--parcial)' : 'var(--prp)';
    return '<div class="card"><div class="filters">' +
      UI.campo('Tipo', '<select onchange="CM06.f.tipo=this.value;App.refrescar()">' + UI.opts(['Ingreso', 'Salida', 'Transferencia'], f.tipo, 'Todos') + '</select>') +
      UI.campo('Tipo de movimiento', '<select onchange="CM06.f.tmov=this.value;App.refrescar()">' + UI.opts(tipos, f.tmov, 'Todos') + '</select>') +
      UI.campo('Módulo', '<select onchange="CM06.f.modulo=this.value;App.refrescar()">' + UI.opts(modulos, f.modulo, 'Todos') + '</select>') +
      UI.campo('Almacén', '<select onchange="CM06.f.malm=this.value;App.refrescar()">' + CM06.optsAlm(f.malm, true) + '</select>') +
      UI.campo('Buscar (documento / movimiento / cliente)', '<input value="' + UI.esc(f.mq) + '" onchange="CM06.f.mq=this.value;App.refrescar()" placeholder="Ej. VEN-2026-000003">') + '</div></div>' +
      UI.tabla(['Movimiento', 'Fecha', 'Tipo', 'Tipo de movimiento', 'Detalle', 'Módulo', 'Documento', 'Origen → destino', 'Concepto contable', ['Líneas', 'num'], ['Valor', 'num']], lista.map(m =>
        '<tr class="clickable" onclick="CM06.verMov(\'' + m.id + '\')"><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '</td><td>' + UI.badge(m.tipo, color(m.tipo)) + '</td>' +
        '<td class="mini">' + (m.tipoMov ? '<b>' + UI.esc(m.tipoMov) + '</b><br>' + UI.esc(m.tipoMovNom || '') : '—') + '</td><td>' + UI.esc(m.det) + '</td><td class="mini">' + UI.esc(m.modulo || '—') + '</td><td>' + CM06.linkDoc(m.ndoc) + '</td><td class="mini">' + UI.esc(m.od) + '</td><td class="mini">' + UI.esc(m.concepto) + '</td><td class="num">' + m.lineas.length + '</td><td class="num">' + UI.s(m.valor) + '</td></tr>'), { vacio: 'Sin movimientos' }) +
      '<p class="hint">Todos los movimientos de la base compartida (Inventarios, Compras, Producción y Comercial). La venta genera su <b>Salida SAL-VENTA</b> («Venta al por menor / por mayor») cuando el pago confirmado cubre el total; la devolución o la anulación, un <b>Ingreso ING-DEVCLI</b> («Devoluciones de Clientes») y, si llega en mal estado, un traslado <b>TRF-LIQUID</b> al almacén de liquidación; la reposición de tienda es <b>TRF-REPTIENDA</b>; con la venta o la devolución como documento de origen y módulo Comercial. Aparecen igual en Inventarios (GI-07 y Kardex GI-06).</p>';
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
      UI.campo('Almacén', '<select onchange="CM06.f.kalm=this.value;App.refrescar()">' + CM06.optsAlm(f.kalm, false) + '</select>') + '</div></div>' +
      UI.tabla(['Fecha', 'Movimiento', 'Detalle', 'Documento', 'Almacén', ['Entrada', 'num'], ['Salida', 'num'], ['Costo', 'num'], ['Saldo en almacén', 'num']], filas.map(k =>
        '<tr><td class="mini">' + k.fecha + '</td><td><button class="btn-link" onclick="CM06.verMov(\'' + k.id + '\')">' + k.id + '</button></td><td>' + UI.esc(k.det) + '</td><td>' + CM06.linkDoc(k.ndoc) + '</td><td class="mini">' + k.alm + '</td>' +
        '<td class="num">' + (k.ent ? UI.q(k.ent) : '') + '</td><td class="num">' + (k.sal ? UI.q(k.sal) : '') + '</td><td class="num">' + UI.n(k.costo, 4) + '</td><td class="num">' + UI.q(k.saldo) + '</td></tr>'), { vacio: 'Sin movimientos de este artículo' }) +
      '<p class="hint">Kardex de la base compartida (el mismo de Inventarios GI-06): recibos de Producción, transferencias, ventas y devoluciones. Muestra el Actual: lo comprometido por ventas pendientes no aparece aquí hasta que sale.</p>';
  },
  verMov(id) {
    const m = Store.d.movs.find(x => x.id === id);
    if (!m) { UI.toast('Movimiento no encontrado'); return; }
    UI.modal({
      titulo: m.id + ' · ' + m.tipo, lg: true, code: 'CL-33',
      cuerpo: '<div class="formgrid c3">' + UI.dato('Detalle', UI.esc(m.det), { estilo: 'grid-column:span 2' }) + UI.dato('Estado', m.est) + UI.dato('Tipo de movimiento', m.tipoMov ? UI.esc(m.tipoMov + ' · ' + (m.tipoMovNom || '')) : '—', { estilo: 'grid-column:span 2' }) + UI.dato('Fecha', m.fecha) +
        UI.dato('Documento de origen', UI.esc(m.ndoc)) + UI.dato('Módulo · usuario', UI.esc((m.modulo || '—') + ' · ' + (m.usuario || ''))) + UI.dato('Origen → destino', UI.esc(m.od), { estilo: 'grid-column:span 2' }) +
        UI.dato('Concepto contable', UI.esc(m.concepto)) + (m.obs ? UI.dato('Observación', UI.esc(m.obs), { full: true }) : '') + '</div>' +
        '<div class="sec">Líneas</div>' +
        UI.tabla(['Almacén', 'Código', 'Artículo', ['Cantidad', 'num'], ['Costo', 'num'], ['Valor', 'num'], ['Saldo', 'num']], m.lineas.map(l => '<tr><td class="mini">' + l.alm + '</td><td>' + l.art + '</td><td>' + UI.esc(M.nomArt(l.art)) + '</td>' +
          '<td class="num"><span class="' + (l.signo < 0 ? 'err-t' : 'ok-t') + '">' + (l.signo < 0 ? '−' : '+') + UI.q(l.cant) + '</span></td><td class="num">' + UI.n(l.costo, 4) + '</td><td class="num">' + UI.s(l.valor) + '</td><td class="num">' + UI.q(l.saldo) + '</td></tr>'))
    });
  }
};
App.pantalla('cm06', { titulo: 'Existencias y movimientos', permiso: 'ver_existencias', render: CM06.render });
