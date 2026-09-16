/* PRODUCCION · PR-08 Existencias y movimientos (lo que mueve Producción) · PR-09 Costos y eficiencia */
const PR08 = {
  tab: 'ex', f: { alm: '', grupo: '', q: '', cero: false, tipo: '', mq: '', art: 'MP-0012', kalm: '' },
  render() {
    const t = PR08.tab;
    const tabs = [['ex', 'Existencias'], ['mov', 'Movimientos (' + Store.d.movs.length + ')'], ['kar', 'Kardex']];
    return '<div class="screen-head"><h1>Existencias y movimientos</h1><span class="code">PR-08</span></div>' +
      '<div class="tabs">' + tabs.map(x => '<div class="tab' + (x[0] === t ? ' active' : '') + '" onclick="PR08.tab=\'' + x[0] + '\';App.refrescar()">' + x[1] + '</div>').join('') + '</div>' +
      (t === 'ex' ? PR08.existencias() : t === 'mov' ? PR08.movimientos() : PR08.kardex());
  },
  existencias() {
    const f = PR08.f, q = f.q.toLowerCase();
    const filas = Store.d.stock.filter(s => (f.cero || s.act || s.comp) && (!f.alm || s.alm === f.alm) && (!f.grupo || (M.art(s.art) || {}).grupo === f.grupo) &&
      (!q || s.art.toLowerCase().includes(q) || M.nomArt(s.art).toLowerCase().includes(q)))
      .sort((a, b) => a.alm.localeCompare(b.alm) || a.art.localeCompare(b.art));
    const valor = filas.reduce((a, s) => a + s.act * s.costo, 0);
    return '<div class="card"><div class="filters">' +
      UI.campo('Almacén', '<select onchange="PR08.f.alm=this.value;App.refrescar()">' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), f.alm, 'Todos') + '</select>') +
      UI.campo('Grupo de artículo', '<select onchange="PR08.f.grupo=this.value;App.refrescar()">' + UI.opts([...new Set(M.ARTICULOS.map(a => a.grupo))], f.grupo, 'Todos') + '</select>') +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="PR08.f.q=this.value;App.refrescar()" placeholder="Código o nombre">') +
      '<label class="check"><input type="checkbox"' + (f.cero ? ' checked' : '') + ' onchange="PR08.f.cero=this.checked;App.refrescar()"> Mostrar en cero</label></div></div>' +
      UI.tabla(['Almacén', 'Código', 'Artículo', 'UM', ['Actual', 'num'], ['Comprometido', 'num'], ['Disponible', 'num'], ['Costo prom.', 'num'], ['Valor', 'num'], ['', '', '70px']], filas.map(s => {
        const disp = UI.r4(s.act - s.comp);
        return '<tr><td class="mini">' + s.alm + '</td><td>' + s.art + '</td><td>' + UI.esc(M.nomArt(s.art)) + '</td><td>' + M.u(s.art) + '</td><td class="num">' + UI.n(s.act) + '</td><td class="num">' + UI.n(s.comp) + '</td>' +
          '<td class="num"><span class="' + (disp < 0 ? 'err-t' : '') + '">' + UI.n(disp) + '</span></td><td class="num">' + UI.n(s.costo, 4) + '</td><td class="num">' + UI.s(s.act * s.costo) + '</td>' +
          '<td>' + (s.act > 0 && !(M.alm(s.alm) || {}).transito ? '<button class="btn-link" style="padding:0" onclick="PR08.fallado(\'' + s.alm + '\',\'' + s.art + '\')">Fallado</button>' : '') + '</td></tr>';
      }), { foot: '<tr><td colspan="8" class="num"><b>Valor total</b></td><td class="num"><b>' + UI.s(valor) + '</b></td><td></td></tr>' }) +
      '<p class="hint">Disponible = Actual − Comprometido (T1). La materia prima se compromete al aprobarse la Solicitud de Fabricación en Inventarios (T7) o al liberar una orden creada en Producción, y se libera al emitirse o al cerrar la orden. No existe el tipo Ajuste: una regularización o un producto fallado se registran con una Salida y un Ingreso justificados.</p>';
  },
  movimientos() {
    const f = PR08.f;
    const lista = Store.d.movs.filter(m => (!f.tipo || m.tipo === f.tipo) && (!f.mq || (m.ndoc + ' ' + m.id + ' ' + m.det).toLowerCase().includes(f.mq.toLowerCase())));
    return '<div class="card"><div class="filters">' +
      UI.campo('Tipo', '<select onchange="PR08.f.tipo=this.value;App.refrescar()">' + UI.opts(['Ingreso', 'Salida', 'Transferencia'], f.tipo, 'Todos') + '</select>') +
      UI.campo('Buscar (documento / movimiento)', '<input value="' + UI.esc(f.mq) + '" onchange="PR08.f.mq=this.value;App.refrescar()" placeholder="Ej. OF-000131">') + '</div></div>' +
      UI.tabla(['Movimiento', 'Fecha', 'Tipo', 'Detalle', 'Documento', 'Origen → destino', ['Líneas', 'num'], ['Valor', 'num']], lista.map(m => {
        const col = { Ingreso: 'var(--confirmado)', Salida: 'var(--parcial)', Transferencia: 'var(--aprobada)' }[m.tipo];
        return '<tr class="clickable" onclick="PR08.verMov(\'' + m.id + '\')"><td><b>' + m.id + '</b></td><td class="mini">' + m.fecha + '</td><td>' + UI.badge(m.tipo, col) + '</td><td>' + UI.esc(m.det) + '</td>' +
          '<td>' + m.ndoc + '</td><td class="mini">' + UI.esc(m.od) + '</td><td class="num">' + m.lineas.length + '</td><td class="num">' + UI.s(m.valor) + '</td></tr>';
      }), { vacio: 'Sin movimientos' }) +
      '<p class="hint">Movimientos V7 separados (T2): Ingresos, Salidas y Transferencias, con la orden de fabricación como documento de origen. Aparecen en Movimientos (GI-07) y Kardex (GI-06).</p>';
  },
  kardex() {
    const f = PR08.f;
    const arts = [...new Set(Store.d.movs.flatMap(m => m.lineas.map(l => l.art)))].sort();
    if (arts.indexOf(f.art) < 0) f.art = arts[0] || '';
    const filas = f.art ? Stock.kardex(f.art, f.kalm) : [];
    return '<div class="card"><div class="filters">' +
      UI.campo('Artículo', '<select onchange="PR08.f.art=this.value;App.refrescar()">' + UI.opts(arts.map(a => ({ v: a, t: a + ' · ' + M.nomArt(a) })), f.art) + '</select>') +
      UI.campo('Almacén', '<select onchange="PR08.f.kalm=this.value;App.refrescar()">' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod })), f.kalm, 'Todos') + '</select>') + '</div></div>' +
      UI.tabla(['Fecha', 'Movimiento', 'Detalle', 'Documento', 'Almacén', ['Entrada', 'num'], ['Salida', 'num'], ['Costo', 'num'], ['Saldo en almacén', 'num']], filas.map(k =>
        '<tr><td class="mini">' + k.fecha + '</td><td><button class="btn-link" onclick="PR08.verMov(\'' + k.id + '\')">' + k.id + '</button></td><td>' + UI.esc(k.det) + '</td><td>' + k.ndoc + '</td><td class="mini">' + k.alm + '</td>' +
        '<td class="num">' + (k.ent ? UI.n(k.ent) : '') + '</td><td class="num">' + (k.sal ? UI.n(k.sal) : '') + '</td><td class="num">' + UI.n(k.costo, 4) + '</td><td class="num">' + UI.n(k.saldo) + '</td></tr>'), { vacio: 'Sin movimientos para este artículo' });
  },
  /* producto fallado: salida del artículo + ingreso del artículo FALLADO al mismo costo; opcional orden de reproceso */
  fallado(alm, art) {
    const F = Prod.falladoDe(art), cands = M.ARTICULOS.filter(a => a.inv !== false && a.cod !== art && /FALLADO/.test(a.nom)), ult = Prod.ordenesDe(art)[0];
    const sel = (id, lista, v, vacio) => '<select id="' + id + '">' + UI.opts(lista, v, vacio) + '</select>';
    UI.modal({
      lg: true, titulo: 'Producto fallado · ' + art,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Artículo', '<b>' + art + '</b> · ' + UI.esc(M.nomArt(art))) +
        UI.dato('Almacén', alm + '<br><span class="mini">hay ' + UI.n(Stock.act(alm, art)) + ' · costo ' + UI.n(Stock.costo(alm, art), 4) + '</span>') +
        UI.campo('Cantidad fallada', '<input id="fa-cant" type="number" min="0" step="any">', { req: true }) +
        UI.campo('Artículo fallado', sel('fa-art', cands.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), F ? F.cod : '', '—'), { req: true, estilo: 'grid-column:span 2', hint: F ? '' : 'Créelo antes en el maestro de artículos (GI-04) como "' + UI.esc(M.nomArt(art)) + ' FALLADO"' }) +
        UI.campo('Motivo', sel('fa-mot', Prod.MOTIVOS_FALLA, '', '—'), { req: true }) +
        UI.campo('Observación (justificación)', '<input id="fa-obs">', { req: true, full: true }) + '</div>' +
        '<div class="card" style="margin-top:10px;padding:10px 14px"><label class="check"><input type="checkbox" id="fa-rep"> <b>Crear orden de reproceso</b> (vuelve a fabricar ' + UI.esc(M.nomArt(art)) + ' consumiendo el fallado; solo mano de obra)</label>' +
        '<div class="formgrid c3" style="margin-top:8px">' + UI.campo('Mano de obra', sel('fa-rec', M.recActivos(r => r.tipo === 'RECURSO HUMANO').map(r => ({ v: r.cod, t: r.nom })), '', '—')) +
        UI.campo('Horas por unidad', '<input id="fa-h" type="number" min="0" step="any">') +
        UI.campo(Prod.nombreRef(), '<input id="fa-ref" value="' + (ult ? ult.ref : '') + '">', { hint: 'Para recostear con las demás órdenes' }) + '</div></div>' +
        '<p class="hint">Se registra una Salida del artículo y un Ingreso del artículo fallado al mismo costo (no existe el tipo Ajuste). Si el defecto es de un servicio de terceros, vincule la nota de crédito o devolución de compra en la pestaña Costo de la orden del servicio.</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR08.guardarFallado(\'' + alm + '\',\'' + art + '\')">Registrar</button>'
    });
  },
  guardarFallado(alm, art) {
    const rep = UI.chk('fa-rep');
    const r = App.accion(() => {
      if (rep && !M.rec(UI.v('fa-rec'))) throw new Error('Elija la mano de obra del reproceso');
      if (rep && !(UI.f('fa-h') > 0)) throw new Error('Indique las horas por unidad del reproceso');
      const x = Prod.reclasificarFallado({ alm, art, fallado: UI.v('fa-art'), cant: UI.f('fa-cant'), motivo: UI.v('fa-mot'), obs: UI.v('fa-obs') });
      if (rep) x.of = Prod.crearReproceso({ art, fallado: UI.v('fa-art'), cant: UI.f('fa-cant'), alm, ref: UI.v('fa-ref'), rec: UI.v('fa-rec'), horas: UI.f('fa-h') });
      return x;
    }, x => x.doc + ': ' + x.salida + ' y ' + x.ingreso + (x.of ? ' · ' + x.of.id + ' de reproceso' : ''));
    if (r) { UI.cerrar(); if (r.of) App.go('pr02', { id: r.of.id }); else App.refrescar(); }
  },
  verMov(id) {
    const m = Store.d.movs.find(x => x.id === id);
    if (!m) { UI.toast('Movimiento no encontrado'); return; }
    UI.modal({
      titulo: m.id + ' · ' + m.tipo, lg: true,
      cuerpo: '<div class="formgrid c3">' + UI.dato('Detalle', UI.esc(m.det), { estilo: 'grid-column:span 2' }) + UI.dato('Estado', m.est) + UI.dato('Fecha', m.fecha) + UI.dato('Documento de origen', m.ndoc) +
        UI.dato('Usuario', UI.esc(m.usuario)) + UI.dato('Origen → destino', UI.esc(m.od), { estilo: 'grid-column:span 2' }) + UI.dato('Valor', UI.s(m.valor)) + (m.obs ? UI.dato('Observación', UI.esc(m.obs), { full: true }) : '') + '</div>' +
        '<div class="sec" style="margin-top:14px">Líneas</div>' +
        UI.tabla(['Almacén', 'Código', 'Artículo', ['Cantidad', 'num'], ['Costo', 'num'], ['Valor', 'num'], ['Saldo', 'num']], m.lineas.map(l => '<tr><td class="mini">' + l.alm + '</td><td>' + l.art + '</td><td>' + UI.esc(M.nomArt(l.art)) + '</td>' +
          '<td class="num"><span class="' + (l.signo < 0 ? 'err-t' : 'ok-t') + '">' + (l.signo < 0 ? '−' : '+') + UI.n(l.cant) + '</span></td><td class="num">' + UI.n(l.costo, 4) + '</td><td class="num">' + UI.s(l.valor) + '</td><td class="num">' + UI.n(l.saldo) + '</td></tr>'))
    });
  }
};
App.pantalla('pr08', { titulo: 'Existencias y movimientos', render: PR08.render });

const PR09 = {
  render() {
    const R = Prod.nombreRef();
    const ofs = Store.d.ofs.filter(o => o.estado !== 'Cancelado');
    const cerr = ofs.filter(o => o.estado === 'Cerrado');
    const pt = ofs.filter(o => (M.art(o.art) || {}).grupo === 'PRODUCTOS TERMINADOS');
    const undPT = pt.reduce((a, o) => a + o.prod, 0);
    const recs = {};
    ofs.forEach(o => o.recs.forEach(r => { const x = recs[r.cod] = recs[r.cod] || { plan: 0, real: 0, costo: 0 }; x.plan += r.cons * o.prod; x.real += r.real; x.costo += r.costoReal; }));
    return '<div class="screen-head"><h1>Costos</h1><span class="code">PR-09</span></div>' +
      UI.kpis([
        { l: 'Órdenes cerradas', v: cerr.length + ' de ' + ofs.length },
        { l: 'Producto terminado', v: UI.n(undPT, 0), s: 'unidades', color: 'var(--confirmado)' },
        { l: 'Costo unitario promedio', v: UI.s(undPT ? pt.reduce((a, o) => a + Prod.costoTotal(o), 0) / undPT : 0), s: 'producto terminado', color: 'var(--prp)' }
      ]) +
      '<div class="sec">Por ' + UI.esc(R.toLowerCase()) + '</div>' +
      UI.tabla([R, 'Estado', ['Órdenes', 'num'], 'Produce al final', ['Costo agregado', 'num']], Explosion.refs().map(ref => {
        const os = ofs.filter(o => o.ref === ref); if (!os.length) return '';
        const sec = Explosion.secuencia(os), max = Math.max.apply(null, os.map(o => sec[o.id])), est = PR04.estado(ref);
        return '<tr class="clickable" onclick="App.go(\'pr04\',{id:\'' + ref + '\'})"><td><b>' + ref + '</b></td><td>' + UI.badge(est[0], est[1]) + '</td><td class="num">' + os.length + '</td>' +
          '<td class="mini">' + os.filter(o => sec[o.id] === max).map(o => UI.esc(M.nomArt(o.art)) + ' ' + UI.n(o.prod, 0) + ' × ' + UI.s(Prod.costoUnit(o))).join('<br>') + '</td>' +
          '<td class="num">' + UI.s(os.reduce((a, o) => a + Prod.costoAgregado(o), 0)) + '</td></tr>';
      }).filter(Boolean)) +
      '<div class="sec">Por recurso</div>' +
      UI.tabla(['Recurso', 'Tipo', ['Previsto para lo producido', 'num'], ['Real', 'num'], ['Costo', 'num']], Object.keys(recs).map(cod => {
        const x = recs[cod], Rc = M.rec(cod) || {};
        return '<tr class="clickable" onclick="App.go(\'pr11f\',{id:\'' + cod + '\'})"><td>' + UI.esc(Rc.nom || cod) + '<br><span class="mini">' + cod + '</span></td><td class="mini">' + UI.esc(Rc.tipo || '') + '</td><td class="num">' + UI.n(x.plan, 1) + ' ' + (Rc.u || '') + '</td><td class="num">' + UI.n(x.real, 1) + ' ' + (Rc.u || '') + '</td><td class="num">' + UI.s(x.costo) + '</td></tr>';
      })) +
      '<div class="sec">Por tipo de recurso</div>' +
      UI.tabla(['Tipo de recurso', ['Recursos', 'num'], ['Costo', 'num']], [...new Set(Object.keys(recs).map(cod => (M.rec(cod) || {}).tipo || '—'))].map(t => {
        const cods = Object.keys(recs).filter(cod => ((M.rec(cod) || {}).tipo || '—') === t);
        return '<tr><td>' + UI.esc(t) + '</td><td class="num">' + cods.length + '</td><td class="num">' + UI.s(cods.reduce((a, cod) => a + recs[cod].costo, 0)) + '</td></tr>';
      }));
  }
};
App.pantalla('pr09', { titulo: 'Costos', render: PR09.render });
