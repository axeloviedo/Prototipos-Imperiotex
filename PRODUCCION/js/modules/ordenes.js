/* PRODUCCION · PR-01 Órdenes de Fabricación (por N° Referencia, en orden de fase) y Nueva OF */
const PR01 = {
  f: { q: '', est: 'abiertas', vista: 'todas' },
  render() {
    const ofs = BD.d.ofs, R = Prod.nombreRef(), f = PR01.f;
    const lib = ofs.filter(o => o.estado === 'Liberado');
    return '<div class="screen-head"><h1>Órdenes de Fabricación</h1><span class="code">PR-01</span><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="App.go(\'pr03\')">Desde una solicitud</button>' +
      '<button class="btn btn-primary" onclick="App.go(\'pr01n\')">+ Nueva OF</button></div>' +
      UI.kpis([
        { l: 'Planificadas', v: ofs.filter(o => o.estado === 'Planificado').length },
        { l: 'Liberadas', v: lib.length, s: UI.n(lib.reduce((a, o) => a + Prod.pendiente(o), 0), 0) + ' unidades por producir' },
        { l: 'Cerradas', v: ofs.filter(o => o.estado === 'Cerrado').length }
      ]) +
      '<div class="card"><div class="filters">' +
      UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="OF, referencia o artículo" oninput="PR01.f.q=this.value;PR01.pintar()" style="min-width:220px">') +
      UI.campo('Estado', '<select onchange="PR01.f.est=this.value;PR01.pintar()">' + UI.opts([{ v: 'abiertas', t: 'Abiertas' }, { v: '', t: 'Todas' }, 'Planificado', 'Liberado', 'Cerrado', 'Cancelado'], f.est) + '</select>') +
      UI.campo('Ver fases', '<select onchange="PR01.f.vista=this.value;PR01.pintar()">' + UI.opts([{ v: 'todas', t: 'Todas las fases' }, { v: 'avance', t: 'Solo fases en curso' }], f.vista) + '</select>') +
      '</div></div><div id="pr01-body"></div>';
  },
  pintar() {
    const f = PR01.f, q = f.q.trim().toLowerCase(), R = Prod.nombreRef();
    const pasa = o => (!f.est || (f.est === 'abiertas' ? Prod.abierta(o) : o.estado === f.est)) &&
      (!q || o.id.toLowerCase().includes(q) || String(o.ref).includes(q) || o.art.toLowerCase().includes(q) || M.nomArt(o.art).toLowerCase().includes(q));
    const html = Explosion.refs().map(ref => {
      const todas = BD.d.ofs.filter(o => o.ref === ref && o.estado !== 'Cancelado' || o.ref === ref && f.est === 'Cancelado');
      const sec = Explosion.secuencia(todas);
      /* solo fases con avance: la fase 1, las que ya tuvieron emisiones o recibos y la siguiente */
      let limite = 99;
      if (f.vista === 'avance') {
        const con = todas.filter(o => Prod.tieneMovimientos(o));
        limite = con.length ? Math.max.apply(null, con.map(o => sec[o.id])) + 1 : 1;
      }
      const vis = Explosion.ordenar(todas).filter(o => pasa(o) && sec[o.id] <= limite);
      if (!vis.length) return '';
      const sf = todas.find(o => o.sf), nAdj = Prod.adjuntosRef(ref).length;
      return '<div class="sec" style="margin-top:14px"><button class="btn-link" style="font-size:14px;font-weight:700;padding:0" onclick="App.go(\'pr04\',{id:\'' + ref + '\'})">' + UI.esc(R) + ' ' + ref + '</button>' +
        '<span class="mini">' + (sf ? 'Solicitud ' + sf.sf : 'Creada en Producción') + ' · ' + todas.length + ' órdenes</span>' +
        '<button class="btn btn-secondary btn-sm" onclick="PR01.adjuntos(\'' + ref + '\')" title="Adjuntos de la referencia">📎 ' + nAdj + '</button></div>' +
        UI.tabla([['Fase', 'num', '56px'], ['Orden', '', '110px'], 'Produce', 'Tipo', ['Recibido / Cantidad', 'num'], 'Progreso', 'Estado', ['Acciones', '', '80px']], vis.map(o =>
          '<tr><td class="num"><b>' + sec[o.id] + '</b></td><td><b>' + o.id + '</b></td>' +
          '<td>' + UI.esc(M.nomArt(o.art)) + '<br><span class="mini">' + o.art + '</span></td>' +
          '<td>' + PR01.tipo(o) + '</td>' +
          '<td class="num">' + UI.n(o.prod, 0) + ' / ' + UI.q(o.cant, M.u(o.art)) + '</td><td>' + UI.barra(o.prod, o.cant) + '</td><td>' + UI.estadoOF(o.estado) + '</td>' +
          '<td><button class="btn btn-secondary btn-sm" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})">👁 Ver</button></td></tr>'), { estilo: 'margin-bottom:6px' });
    }).join('');
    document.getElementById('pr01-body').innerHTML = html || UI.aviso('No hay órdenes con esos filtros', 'info');
  },
  tipo(o) { return o.tipofab; },
  adjuntos(ref) {
    const lista = Prod.adjuntosRef(ref);
    UI.modal({
      titulo: '📎 Adjuntos · ' + Prod.nombreRef() + ' ' + ref, lg: true,
      cuerpo: UI.tabla(['Archivo', 'Orden', 'Descripción', 'Fecha'], lista.map(a => '<tr><td>📎 ' + UI.esc(a.nombre) + '</td><td><button class="btn-link" onclick="UI.cerrar();App.go(\'pr02\',{id:\'' + a.of + '\',tab:\'adj\'})">' + a.of + '</button><br><span class="mini">' + UI.esc(M.nomArt(a.art)) + '</span></td><td>' + UI.esc(a.desc) + '</td><td class="mini">' + a.f + '</td></tr>'), { vacio: 'Ninguna orden de esta referencia tiene adjuntos' })
    });
  }
};
App.pantalla('pr01', { titulo: 'Órdenes de Fabricación', render: PR01.render, despues: PR01.pintar });

/* ---------- Nueva OF (creada en Producción: nace Planificada) ---------- */
const PR01N = {
  art: '',
  render(p) {
    const R = Prod.nombreRef();
    PR01N.art = p.art && M.art(p.art) ? p.art : '';
    return '<div class="screen-head"><h1>Nueva Orden de Fabricación</h1><div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="App.go(\'pr01\')">Cancelar</button><button class="btn btn-primary" onclick="PR01N.crear()">Crear</button></div>' +
      '<div class="card"><div class="formgrid c3">' +
      UI.campo('Artículo', '<div style="display:flex;gap:6px"><input id="n-artnom" readonly placeholder="Seleccione…" style="flex:1"><button class="btn btn-secondary btn-sm" onclick="PR01N.buscar()">🔍 Buscar</button></div>', { req: true, estilo: 'grid-column:span 2' }) +
      UI.campo('Cantidad', '<input id="n-cant" type="number" min="0" step="any" value="' + (p.cant || 1) + '" oninput="PR01N.prev()">', { req: true }) +
      UI.campo('Lista de materiales (opcional)', '<select id="n-ldm" onchange="PR01N.proponerAlm();PR01N.prev()"></select>', { estilo: 'grid-column:span 2', hint: 'Con lista: Estándar. Si luego la modifica o no elige lista: Especial' }) +
      UI.campo('Almacén donde entra', '<select id="n-alm">' + UI.opts([{ v: '', t: 'Seleccionar…' }].concat(M.opcionesAlm(BD.empresa)), '') + '</select>', { req: true, hint: 'Solo almacenes de ' + UI.esc(BD.empNom(BD.empresa)) + ' (empresa activa)' }) +
      UI.campo(R, PR01N.selRef('n-ref', p.ref), { hint: '«Nueva» asigna un número al crear. Vincular a una existente agrupa la orden con esas órdenes para el listado por fase y el recosteo' }) +
      UI.campo('Fecha requerida', '<input id="n-fecha" type="date">', { hint: 'Cuándo debe estar lo producido (las órdenes de una SF la heredan de la solicitud)' }) +
      UI.campo('Observación', '<input id="n-obs">') +
      '</div></div>' +
      '<div class="card" id="n-sugcard" style="display:none"><label class="check"><input type="checkbox" id="n-sug" checked onchange="PR01N.prev()"> <b>Crear también las órdenes de lo que se fabrica antes</b></label><div id="n-prev" style="margin-top:8px"></div></div>';
  },
  /* Q1: selector de referencia: nueva o una existente con órdenes abiertas (también lo usa PR-03) */
  selRef(id, sel, todas) {
    const R = Prod.nombreRef();
    const lista = Prod.refsAbiertas(todas).map(x => ({ v: x.ref, t: 'Vincular a ' + R + ' ' + x.ref + ' · ' + (x.sf ? x.sf : 'creada en Producción') + ' · ' + x.n + ' orden(es), ' + x.abiertas + ' abierta(s) · ' + x.arts.slice(0, 2).join(', ') + (x.arts.length > 2 ? '…' : '') }));
    return '<select id="' + id + '">' + UI.opts([{ v: '', t: 'Nueva (se asigna al crear)' }].concat(lista), sel || '') + '</select>';
  },
  despues() { PR01N.pintarArt(); },
  buscar() {
    BUS.articulo('Seleccionar artículo a fabricar', a => a.inv !== false && (a.grupo === 'PT' || a.grupo === 'PPT' || BD.fabricable(a.cod)), cod => { PR01N.art = cod; PR01N.pintarArt(); });
  },
  pintarArt() {
    const a = M.art(PR01N.art);
    document.getElementById('n-artnom').value = a ? a.cod + ' · ' + a.nom : '';
    const ldms = a ? M.ldmsDe(a.cod) : [];
    document.getElementById('n-ldm').innerHTML = UI.opts([{ v: '', t: 'Sin lista' }].concat(ldms.map(l => ({ v: l.id, t: l.id + ' · ' + l.nom + (l.almProd ? ' · entra en ' + l.almProd : '') }))), ldms.length ? ldms[0].id : '');
    PR01N.proponerAlm();
    PR01N.prev();
  },
  /* propone el almacén de la lista elegida (Q5) o el de la heurística; vacío si no hay propuesta: el usuario lo elige */
  proponerAlm() { const a = M.art(PR01N.art); if (a) document.getElementById('n-alm').value = Prod.almRecibo(a.cod, UI.v('n-ldm')); },
  prev() {
    const box = document.getElementById('n-prev'), card = document.getElementById('n-sugcard'); if (!box) return;
    const ldm = UI.v('n-ldm'), cant = UI.f('n-cant'), art = PR01N.art;
    const nec = art && ldm && cant > 0 ? Explosion.necesidades([{ art, cant, ldm }]) : [];
    card.style.display = nec.length ? 'block' : 'none';
    if (!nec.length || !UI.chk('n-sug')) { box.innerHTML = ''; return; }
    const filas = nec.sort((a, b) => Explosion.pasoArt(a.art) - Explosion.pasoArt(b.art)).map(n => '<tr><td class="num">' + Explosion.pasoArt(n.art) + '</td><td>' + UI.esc(M.nomArt(n.art)) + '<br><span class="mini">' + n.art + '</span></td>' +
      '<td class="num">' + UI.n(n.req, 0) + '</td><td class="num"><input type="number" min="0" step="any" id="h-' + n.art + '" value="' + n.sugerido + '" style="width:90px;text-align:right;border:1px solid var(--borde);border-radius:5px;padding:5px"></td><td>' + '<select id="h-alm-' + n.art + '" style="border:1px solid var(--borde);border-radius:5px;padding:5px">' + UI.opts([{ v: '', t: 'Seleccionar…' }].concat(M.opcionesAlm(BD.empresa, n.alm, null, false)), n.alm) + '</select>' + '</td></tr>')
      .concat(['<tr><td class="num">' + Explosion.pasoArt(art, ldm) + '</td><td><b>' + UI.esc(M.nomArt(art)) + '</b></td><td class="num">' + UI.n(cant, 0) + '</td><td class="num"><b>' + UI.n(cant, 0) + '</b></td><td class="mini">' + UI.esc(UI.v('n-alm')) + '</td></tr>']);
    box.innerHTML = UI.tabla([['Fase', 'num'], 'Orden para', ['Se necesita', 'num'], ['A fabricar', 'num'], 'Entra en'], filas);
  },
  crear() {
    let sugeridas = null; const alms = {};
    if (UI.chk('n-sug') && UI.v('n-ldm')) { sugeridas = {}; document.querySelectorAll('#n-prev input[id^="h-"]').forEach(i => { sugeridas[i.id.slice(2)] = parseFloat(i.value) || 0; }); }
    document.querySelectorAll('#n-prev select[id^="h-alm-"]').forEach(s => { alms[s.id.slice(6)] = s.value; });
    const iso = UI.v('n-fecha'), fechaFin = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
    const r = App.accion(() => Prod.crearManual({ art: PR01N.art, ldm: UI.v('n-ldm'), cant: UI.f('n-cant'), alm: UI.v('n-alm'), ref: UI.v('n-ref'), obs: UI.v('n-obs'), fechaFin, sugeridas, alms }),
      x => x.length + ' orden(es) creada(s) · ' + Prod.nombreRef() + ' ' + x[0].ref);
    if (r) App.go('pr02', { id: r[0].id });
  }
};
App.pantalla('pr01n', { titulo: 'Nueva OF', menu: 'pr01', miga: () => '<a class="btn-link" onclick="App.go(\'pr01\')">Órdenes de Fabricación</a> / <b>Nueva</b>', render: PR01N.render, despues: PR01N.despues });
