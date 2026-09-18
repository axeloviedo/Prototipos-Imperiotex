/* COMERCIAL V9 · CL-40 Listas de precios y ofertas: listado y «Probar precio»; el detalle de cada lista se abre en el modal CL-50 (modales CL-41, CL-42, CL-49, CL-50)
   · CL-43 Artículos de venta (datos de la pestaña Venta de GI-02; modal CL-44) */
const CM08 = {
  sel: 'LP-01', f: { q: '', tipo: '', mon: '' },
  sim: { art: 'PT-0001', um: 'UND', sede: 'YA', tipo: 'MINORISTA', mon: 'PEN', fecha: '' },
  sedeNom(c) { return Precios.sedeNom(c); },
  sedesOpts() { return Precios.sedes().map(x => ({ v: x.cod, t: x.nom })); },
  vigencia(L) { return Precios.esOferta(L) ? (L.desde || '…') + ' al ' + (L.hasta || 'sin fin') : '<span class="mini">Siempre</span>'; },
  render() {
    const f = CM08.f, q = f.q.toLowerCase(), ed = Store.puede('editar_precios');
    const todas = Precios.listas().slice().sort((x, y) => Precios.esOferta(x) - Precios.esOferta(y) || x.cod.localeCompare(y.cod));
    const listas = todas.filter(L => (!f.tipo || (f.tipo === 'OF') === Precios.esOferta(L)) && (!f.mon || L.mon === f.mon) &&
      (!q || (L.cod + ' ' + L.nom + ' ' + L.filas.map(x => x.art || x.grupo).join(' ')).toLowerCase().includes(q)));

    let html = '<div class="screen-head"><h1>Listas de precios y ofertas</h1><span class="code">CL-40</span><div class="spacer"></div>' +
      (ed ? '<button class="btn btn-secondary" onclick="CM08.editar(\'\',false)">+ Nueva lista</button><button class="btn btn-primary" onclick="CM08.editar(\'\',true)">+ Nueva oferta</button>' : '') +
      '<button class="btn btn-secondary" onclick="CM08.excel()">⇩ Excel</button></div>';
    html += UI.aviso('<b>Cómo se elige el precio</b> en la cotización y la venta: se miran las listas <b>activas</b> de la <b>moneda</b> del documento que valen para la <b>sede</b> de su tienda y para el <b>segmento</b> del cliente (vacío = todas / todos). ' +
      '<b>1.</b> Una <b>oferta</b> vigente (lista con fechas) manda. <b>2.</b> Si no, la lista más específica: sede y segmento → sede → segmento → general. <b>3.</b> Si ninguna tiene el artículo, el precio sugerido de GI-02 (solo S/). ' +
      'Cada fila lleva <b>precio fijo</b> o <b>% de descuento</b>; el % se aplica sobre el precio que el artículo tendría sin esa lista. La oferta no se suma al descuento manual de la línea. ' +
      'Las listas están en la base compartida y cada venta guarda en su línea la lista u oferta con que se vendió. <b>Haga clic en una lista</b> para ver y editar sus artículos.', 'info');

    html += '<div class="card"><div class="filters">' + UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="CM08.f.q=this.value;App.refrescar()" placeholder="Nombre, código o artículo">') +
      UI.campo('Tipo', '<select onchange="CM08.f.tipo=this.value;App.refrescar()">' + UI.opts([{ v: 'LP', t: 'Listas de precios' }, { v: 'OF', t: 'Ofertas' }], f.tipo, 'Todas') + '</select>') +
      UI.campo('Moneda', '<select onchange="CM08.f.mon=this.value;App.refrescar()">' + UI.opts(M.MONEDAS.map(m => m.cod), f.mon, 'Todas') + '</select>') + '</div>' +
      UI.tabla(['Código', 'Nombre', 'Tipo', 'Moneda', 'Sede', 'Segmento', 'Vigencia', 'Estado', ['Filas', 'num']], listas.map(L =>
        '<tr class="clickable" onclick="CM08.ver(\'' + L.cod + '\')"><td>' + L.cod + '</td><td><b>' + UI.esc(L.nom) + '</b></td>' +
        '<td>' + (Precios.esOferta(L) ? '<b class="ok-t">Oferta</b>' : 'Lista') + '</td><td>' + L.mon + '</td><td>' + (L.sede ? UI.esc(CM08.sedeNom(L.sede)) : '<span class="mini">Todas</span>') + '</td>' +
        '<td>' + (L.tipo || '<span class="mini">Todos</span>') + '</td><td>' + CM08.vigencia(L) + '</td><td>' + UI.estado(Precios.estado(L)) + '</td><td class="num">' + L.filas.length + '</td></tr>'),
        { vacio: 'Sin listas con ese filtro' }) + '</div>';

    html += CM08.probar();
    return html;
  },

  /* precio que resulta de una fila con la sede, el segmento y la moneda de la lista (una oferta, en su primer día).
     El % de una lista se aplica sobre las listas menos específicas; el de una oferta, sobre el precio de lista */
  resulta(L, f) {
    if (f.grupo) return null;
    const um = f.um || Precios.umVenta(f.art);
    if (f.precio > 0) return { precio: f.precio, um };
    if (!(f.pct > 0)) return null;
    const fecha = Precios.esOferta(L) ? (L.desde || UI.hoy()) : UI.hoy();
    const otras = Precios.candidatos(f.art, um, L.sede, L.tipo, L.mon, fecha).filter(c => !Precios.esOferta(c.L) && c.L.cod !== L.cod &&
      (Precios.esOferta(L) || Precios.espec(c.L) > Precios.espec(L)));
    const b = Precios._normal(otras, 0, f.art, um, L.mon);
    return b ? { precio: UI.r2(b.precio * (1 - f.pct / 100)), um, base: b.precio } : null;
  },
  /* CL-50: detalle de la lista u oferta en un modal (datos, artículos o grupos con precio o %, agregar y quitar) */
  ver(cod) {
    const L = Precios.lista(cod);
    if (!L) { UI.cerrar(); return; }
    CM08.sel = cod;
    UI.modal({ ancho: '1080px', titulo: (Precios.esOferta(L) ? 'Oferta ' : 'Lista ') + L.cod + ' · ' + UI.esc(L.nom), code: 'CL-50',
      cuerpo: CM08.detalle(L, Store.puede('editar_precios')), pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>' });
  },
  /* después de un cambio: refresca el listado y vuelve a pintar el modal de la lista */
  _otraVez() { App.refrescar(); CM08.ver(CM08.sel); },
  detalle(L, ed) {
    const of = Precios.esOferta(L);
    const inp = (i, campo, v, w) => '<input class="celda" type="number" min="0" step="any" style="width:' + w + 'px" value="' + (v == null ? '' : v) + '" onchange="CM08.fila(' + i + ',\'' + campo + '\',this.value)">';
    const filas = L.filas.map((f, i) => {
      const a = f.art ? Store.art(f.art) : null, r = CM08.resulta(L, f);
      const bajoMin = r && a && a.precioMin > 0 && L.mon === 'PEN' && r.precio / Precios.factor(a.cod, r.um) + 0.001 < a.precioMin;
      const um = f.grupo ? '<span class="mini">Todas</span>' : ed ? '<select class="celda" onchange="CM08.fila(' + i + ',\'um\',this.value)">' +
        UI.opts((f.pct > 0 ? [{ v: '', t: 'Todas' }] : []).concat(Precios.unidades(f.art)), f.um || '') + '</select>' : (f.um || 'Todas');
      const sinValor = !(f.precio > 0) && !(f.pct > 0);
      return '<tr><td>' + (f.grupo ? '<b>Grupo ' + UI.esc(M.grupoNom(f.grupo)) + '</b><br><span class="mini">todos sus artículos</span>' : f.art + '<br><span class="mini">' + UI.esc(a ? a.nom : '') + '</span>') + '</td>' +
        '<td>' + um + '</td>' +
        '<td class="num">' + (f.grupo ? '<span class="mini">—</span>' : ed ? inp(i, 'precio', f.precio, 90) : f.precio > 0 ? UI.m(f.precio, L.mon) : '') + '</td>' +
        '<td class="num">' + (ed ? inp(i, 'pct', f.pct, 70) : f.pct > 0 ? UI.n(f.pct) + ' %' : '') + '</td>' +
        '<td class="num">' + (sinValor ? '<span class="err-t">Falta precio o %</span>' : r ? '<b>' + UI.m(r.precio, L.mon) + '</b>' + (r.base ? '<br><span class="mini">sobre ' + UI.n(r.base) + '</span>' : '') +
          (bajoMin ? '<br><span class="warn-t">⚠ bajo el mínimo ' + UI.s(a.precioMin) + '</span>' : '') : f.grupo ? '<span class="mini">según cada artículo</span>' : '<span class="mini">sin precio base</span>') + '</td>' +
        '<td>' + (ed ? '<button class="btn-link" onclick="CM08.quitarFila(' + i + ')">Quitar</button>' : '') + '</td></tr>';
    });
    return '<div class="sec" style="margin-top:0">' + UI.estado(Precios.estado(L)) + ' ' + (of ? '<b class="ok-t">Oferta</b>' : 'Lista de precios') + '<div class="spacer"></div>' +
      (ed ? '<button class="btn btn-secondary btn-sm" onclick="CM08.editar(\'' + L.cod + '\',' + of + ')">Editar datos</button> <button class="btn btn-secondary btn-sm" onclick="CM08.quitar()">Quitar</button> ' +
        '<button class="btn btn-primary btn-sm" onclick="CM08.agregar()">+ Agregar artículos</button>' : '') + '</div>' +
      '<div class="formgrid c4">' + UI.dato('Moneda', L.mon) + UI.dato('Sede', L.sede ? UI.esc(CM08.sedeNom(L.sede)) : 'Todas') + UI.dato('Segmento de cliente', L.tipo || 'Todos') +
      UI.dato('Vigencia', of ? (L.desde || '…') + ' al ' + (L.hasta || 'sin fecha final') : 'Siempre (lista de precios)') + '</div>' +
      UI.tabla(['Artículo o grupo', 'Unidad', ['Precio fijo', 'num'], ['% descuento', 'num'], ['Resulta', 'num'], ['', '', '70px']], filas,
        { vacio: 'La lista no tiene artículos: use «+ Agregar artículos»', estilo: 'margin-top:10px' }) +
      '<p class="hint">Escriba el <b>precio fijo</b> o el <b>% de descuento</b> (uno borra el otro). Un precio en la unidad de inventario sirve también para las unidades mayores (× conversión). ' +
      'Un % con unidad «Todas» y un grupo valen para cualquier unidad. «Resulta» se calcula con la sede, el segmento y la moneda de la lista' + (of ? ', en el primer día de la oferta' : '') + '.</p>';
  },

  probar() {
    const s = CM08.sim, arts = Store.arts().filter(a => a.venta);
    if (!Store.art(s.art)) s.art = arts[0].cod;
    const ums = Precios.unidades(s.art);
    if (ums.indexOf(s.um) < 0) s.um = ums[0];
    const fecha = s.fecha || UI.hoy();
    const sel = (campo, lista, val, vacio) => '<select onchange="CM08.sim.' + campo + '=this.value;App.refrescar()">' + UI.opts(lista, val, vacio) + '</select>';
    const cands = Precios.candidatos(s.art, s.um, s.sede, s.tipo, s.mon, fecha), r = Precios.resolver(s.art, s.um, s.sede, s.tipo, s.mon, fecha);
    const filas = cands.map(c => {
      const f = c.x.f, gana = r && r.lista === c.L.cod;
      return '<tr><td>' + c.L.cod + ' · ' + UI.esc(c.L.nom) + '</td><td>' + (Precios.esOferta(c.L) ? 'Oferta' : 'Lista') + '</td><td class="mini">' + Precios.nivel(c.L) + '</td>' +
        '<td class="num">' + (f.precio > 0 ? UI.m(f.precio * c.x.factor, s.mon) : Precios.pctTxt(f.pct)) + (f.grupo ? ' <span class="mini">(grupo)</span>' : '') + '</td><td>' + (gana ? '<b class="ok-t">✓ se usa</b>' : '<span class="mini">no se usa</span>') + '</td></tr>';
    });
    const a = Store.art(s.art);
    filas.push('<tr><td>Precio sugerido del artículo (GI-02)</td><td></td><td class="mini">si nada aplica</td><td class="num">' + (s.mon === 'PEN' && a.precioVenta > 0 ? UI.s(a.precioVenta * Precios.factor(s.art, s.um)) : '<span class="mini">solo S/</span>') + '</td><td>' + (r && !r.lista ? '<b class="ok-t">✓ se usa</b>' : '') + '</td></tr>');
    return '<div class="card"><div class="sec">Probar precio</div><div class="formgrid c4">' +
      UI.campo('Artículo', sel('art', arts.map(x => ({ v: x.cod, t: x.cod + ' · ' + x.nom })), s.art), { estilo: 'grid-column:span 2' }) + UI.campo('Unidad', sel('um', ums, s.um)) + UI.campo('Moneda', sel('mon', M.MONEDAS.map(m => m.cod), s.mon)) +
      UI.campo('Sede', sel('sede', CM08.sedesOpts(), s.sede, 'Sin sede')) + UI.campo('Segmento de cliente', sel('tipo', M.TIPOS_CLIENTE, s.tipo, 'Sin segmento')) +
      UI.campo('Fecha', '<input type="date" value="' + UI.dIso(fecha) + '" onchange="CM08.sim.fecha=UI.dTxt(this.value);App.refrescar()">', { hint: 'para probar una oferta antes de que empiece' }) + '</div>' +
      '<div style="display:flex;gap:18px;align-items:flex-start;margin-top:12px;flex-wrap:wrap"><div style="flex:1;min-width:320px">' +
      UI.tabla(['Lista u oferta que aplica', 'Tipo', 'Nivel', ['Precio o %', 'num'], ''], filas) + '</div>' +
      '<div class="kpi" style="min-width:220px"><div class="l">Precio resultante</div><div class="v">' + (r ? UI.m(r.precio, s.mon) : '<span class="err-t">Sin precio</span>') + '</div>' +
      '<div class="s">' + (r ? UI.esc(r.origen) + (r.oferta && r.precioLista ? '<br>precio de lista ' + UI.m(r.precioLista, s.mon) : '') : 'no se puede vender en ' + s.mon) + '</div></div></div></div>';
  },

  /* CL-41: datos de la lista (sin fechas) o de la oferta (con fechas) */
  editar(cod, oferta) {
    const L = cod ? Precios.lista(cod) : { nom: '', mon: 'PEN', sede: '', tipo: '', desde: oferta ? UI.hoy() : '', hasta: '', activa: true };
    UI.modal({
      titulo: cod ? 'Editar ' + cod : oferta ? 'Nueva oferta' : 'Nueva lista de precios', code: 'CL-41',
      cuerpo: '<div class="formgrid">' + UI.campo('Nombre', '<input id="lp-nom" value="' + UI.esc(L.nom) + '" placeholder="' + (oferta ? 'Ej. Fiestas Patrias' : 'Ej. Mayorista Damero') + '">', { req: true, full: true }) +
        UI.campo('Moneda', '<select id="lp-mon">' + UI.opts(M.MONEDAS.map(m => m.cod), L.mon) + '</select>', { req: true }) +
        UI.campo('Sede', '<select id="lp-sede">' + UI.opts([{ v: '', t: 'Todas' }].concat(CM08.sedesOpts()), L.sede) + '</select>') +
        UI.campo('Segmento de cliente', '<select id="lp-tipo">' + UI.opts([{ v: '', t: 'Todos' }].concat(M.TIPOS_CLIENTE.map(t => ({ v: t, t }))), L.tipo) + '</select>') +
        (oferta ? UI.campo('Desde', '<input id="lp-desde" type="date" value="' + UI.dIso(L.desde) + '">', { req: true }) +
          UI.campo('Hasta', '<input id="lp-hasta" type="date" value="' + UI.dIso(L.hasta) + '">', { hint: 'vacío = sin fecha final' }) : '') +
        '<div class="field full"><label class="check"><input type="checkbox" id="lp-activa"' + (L.activa ? ' checked' : '') + '> Activa</label></div></div>' +
        '<p class="hint" style="margin-top:8px">' + (oferta ? 'Una oferta es una lista con fechas: mientras esté vigente manda sobre las listas de precios. Luego agregue artículos o grupos con su precio o % de descuento.'
          : 'Sin fechas: es una lista de precios permanente. Deje Sede y Segmento en «Todas / Todos» para que valga en general.') + '</p>',
      pie: '<button class="btn btn-secondary" onclick="' + (cod ? 'CM08.ver(\'' + cod + '\')' : 'UI.cerrar()') + '">Cancelar</button><button class="btn btn-primary" onclick="CM08.guardar(\'' + (cod || '') + '\',' + !!oferta + ')">Guardar</button>'
    });
  },
  guardar(cod, oferta) {
    const x = { nom: UI.v('lp-nom'), mon: UI.v('lp-mon'), sede: UI.v('lp-sede'), tipo: UI.v('lp-tipo'), oferta, desde: UI.dTxt(UI.v('lp-desde')), hasta: UI.dTxt(UI.v('lp-hasta')), activa: UI.chk('lp-activa') };
    let hecha = null;
    if (App.accion(() => (hecha = Listas.guardar(x, cod || null)), L => (oferta ? 'Oferta ' : 'Lista ') + L.cod + ' guardada')) { CM08.sel = hecha.cod; CM08._otraVez(); }
  },
  quitar() {
    const L = Precios.lista(CM08.sel);
    UI.confirmar('Quitar ' + L.cod + ' · ' + UI.esc(L.nom), '<p>Los documentos ya emitidos conservan su precio; los nuevos tomarán la siguiente lista que aplique. Para dejar de usarla un tiempo, desmarque «Activa».</p>',
      () => { if (App.accion(() => Listas.quitar(L.cod), L.cod + ' quitada')) { CM08.sel = ''; App.refrescar(); } else CM08.ver(L.cod); }, 'Quitar', 'CL-42');
  },
  fila(i, campo, val) { App.accion(() => Listas.fila(CM08.sel, i, campo, val)); CM08._otraVez(); },
  quitarFila(i) { if (App.accion(() => Listas.quitarFila(CM08.sel, i), 'Fila quitada')) CM08._otraVez(); },

  /* CL-49: agregar artículos (varios a la vez) o un grupo entero, con un precio o % para todos (opcional) */
  agregar() {
    const grupos = [...new Set(Store.arts().filter(a => a.venta && Store.activo(a)).map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) }));
    UI.modal({
      ancho: '860px', titulo: 'Agregar a ' + UI.esc(Precios.lista(CM08.sel).nom), code: 'CL-49',
      cuerpo: '<div class="filters" style="margin-bottom:10px">' +
        UI.campo('Agregar', '<select id="ag-modo" onchange="CM08.pintarAg()">' + UI.opts([{ v: 'art', t: 'Artículos' }, { v: 'grupo', t: 'Grupo completo (con %)' }], 'art') + '</select>') +
        UI.campo('Grupo de Artículo', '<select id="ag-g" onchange="CM08.pintarAg()">' + UI.opts(grupos, '', 'Todos') + '</select>') +
        UI.campo('Código o nombre', '<input id="ag-q" oninput="CM08.pintarAg()" placeholder="Buscar…">') + '</div>' +
        '<div class="formgrid c4" style="margin-bottom:10px">' +
        UI.campo('Unidad', '<select id="ag-um">' + UI.opts([{ v: '', t: 'La de venta de cada artículo' }, { v: '*', t: 'Todas (solo con %)' }], '') + '</select>') +
        UI.campo('Precio fijo para todos', '<input id="ag-precio" type="number" min="0" step="any" placeholder="opcional">') +
        UI.campo('o % de descuento', '<input id="ag-pct" type="number" min="0" max="99.99" step="any" placeholder="opcional">') + '</div>' +
        '<div id="ag-body"></div><p class="hint">Si deja precio y % vacíos, los artículos entran sin valor y los completa en la tabla. Un grupo completo entra con su % y vale para todos sus artículos, también los que se creen después.</p>',
      pie: '<button class="btn btn-secondary" onclick="CM08.ver(CM08.sel)">Volver</button><button class="btn btn-primary" onclick="CM08.agregarOk()">Agregar</button>'
    });
    CM08.pintarAg();
  },
  pintarAg() {
    const b = document.getElementById('ag-body'), L = Precios.lista(CM08.sel);
    if (!b || !L) return;
    if (UI.v('ag-modo') === 'grupo') {
      b.innerHTML = UI.aviso(UI.v('ag-g') ? 'Se agregará el grupo <b>' + UI.esc(M.grupoNom(UI.v('ag-g'))) + '</b> con el % de descuento indicado.' : 'Elija el grupo de artículos.', 'info');
      return;
    }
    const q = UI.v('ag-q').toLowerCase(), g = UI.v('ag-g');
    const arts = Store.arts().filter(a => a.venta && Store.activo(a) && (!g || a.grupo === g) && (!q || (a.cod + ' ' + a.nom).toLowerCase().includes(q)));
    b.innerHTML = UI.tabla([['<input type="checkbox" onchange="document.querySelectorAll(\'.ag-chk\').forEach(c=>{if(!c.disabled)c.checked=this.checked})">', '', '34px'], 'Código', 'Artículo', 'Grupo', 'UM venta'],
      arts.map(a => { const ya = L.filas.some(f => f.art === a.cod);
        return '<tr><td><input type="checkbox" class="ag-chk" value="' + a.cod + '"' + (ya ? ' disabled' : '') + '></td><td>' + a.cod + '</td><td>' + UI.esc(a.nom) + (ya ? ' <span class="mini">(ya está en la lista)</span>' : '') + '</td>' +
          '<td class="mini">' + UI.esc(M.grupoNom(a.grupo)) + '</td><td>' + (a.uVenta || a.u) + '</td></tr>'; }),
      { vacio: 'Sin artículos de venta con ese filtro', estilo: 'max-height:320px;overflow:auto' });
  },
  agregarOk() {
    const v = { um: UI.v('ag-um'), precio: UI.v('ag-precio'), pct: UI.v('ag-pct') };
    const ok = App.accion(() => {
      if (v.precio !== '' && v.pct !== '') throw new Error('Escriba precio fijo O % de descuento, no los dos');
      if (UI.v('ag-modo') === 'grupo') { Listas.agregarGrupo(CM08.sel, UI.v('ag-g'), v.pct); return 'Grupo agregado'; }
      const arts = [...document.querySelectorAll('.ag-chk')].filter(c => c.checked).map(c => c.value);
      if (!arts.length) throw new Error('Marque los artículos que quiere agregar');
      const n = Listas.agregarArts(CM08.sel, arts, v);
      return n + (n === 1 ? ' artículo agregado' : ' artículos agregados');
    }, m => m);
    if (ok) CM08._otraVez();
  },
  excel() {
    const filas = [];
    Precios.listas().forEach(L => L.filas.forEach(f => filas.push([L.cod, L.nom, Precios.esOferta(L) ? 'Oferta' : 'Lista', L.mon, L.sede ? CM08.sedeNom(L.sede) : 'Todas', L.tipo || 'Todos',
      L.desde, L.hasta, Precios.estado(L), f.art || 'Grupo ' + M.grupoNom(f.grupo), f.art ? M.nomArt(f.art) : '', f.um || 'Todas', f.precio || '', f.pct || ''])));
    UI.csv('listas-de-precios-y-ofertas', ['Código', 'Nombre', 'Tipo', 'Moneda', 'Sede', 'Segmento', 'Desde', 'Hasta', 'Estado', 'Artículo o grupo', 'Descripción', 'Unidad', 'Precio fijo', '% descuento'], filas);
  }
};
App.pantalla('cm08', { titulo: 'Listas de precios y ofertas', permiso: 'ver_venta', render: CM08.render });

const CM09 = {
  f: { q: '', grupo: '' },
  render() {
    const f = CM09.f, q = f.q.toLowerCase(), ed = Store.puede('editar_precios');
    const arts = Store.arts().filter(a => a.venta && (!f.grupo || a.grupo === f.grupo) && (!q || (a.cod + ' ' + a.nom).toLowerCase().includes(q)));
    return '<div class="screen-head"><h1>Artículos de venta</h1><span class="code">CL-43</span></div>' +
      '<div class="card"><div class="filters">' + UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="CM09.f.q=this.value;App.refrescar()" placeholder="Código o nombre">') +
      UI.campo('Grupo de Artículo', '<select onchange="CM09.f.grupo=this.value;App.refrescar()">' + UI.opts([...new Set(Store.arts().map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) })), f.grupo, 'Todos') + '</select>') + '</div></div>' +
      UI.tabla(['Código', 'Artículo', 'Grupo', 'UM venta', ['Precio sugerido', 'num'], ['Precio mínimo', 'num'], ['Descuento', 'num'], 'IGV', ['Disponible', 'num'], ['', '', '70px']], arts.map(a =>
        '<tr><td>' + a.cod + '</td><td>' + UI.esc(a.nom) + '</td><td class="mini">' + UI.esc(M.grupoNom(a.grupo)) + (a.origen === 'comercial' ? '<br><span class="mini">servicio de Comercial</span>' : '') + '</td><td>' + (a.uVenta || a.u) + '</td>' +
        '<td class="num">' + UI.s(a.precioVenta) + '</td><td class="num">' + (a.precioMin ? UI.s(a.precioMin) + '<br><span class="mini">' + (Precios.verificaMin(a) ? 'se verifica' : 'no se verifica') + '</span>' : '—') + '</td>' +
        '<td class="num">' + (a.dctoMin || 0) + '% – ' + (a.dctoMax || 0) + '%</td><td class="mini">' + a.igv + '</td>' +
        '<td class="num">' + (a.inv ? UI.n(Stock.totalDisp(a.cod), 0) : '—') + '</td>' +
        '<td>' + (ed ? '<button class="btn-link" onclick="CM09.editar(\'' + a.cod + '\')">Editar</button>' : '') + '</td></tr>'), { vacio: 'Sin artículos' }) +
      '<p class="hint">Son los artículos de la base compartida marcados «Venta» (el maestro completo vive en Inventarios, GI-02); aquí solo se ven y ajustan los datos de su pestaña Venta, que se guardan en la misma base. ' +
      'Stock (L6): la orden y la venta directa <b>no se registran sin Disponible</b> (ya descuenta lo comprometido por ventas pendientes); la cotización solo avisa porque no reserva stock. Los servicios no son inventariables: no llevan almacén, stock ni devolución.</p>';
  },
  editar(cod) {
    const a = Store.art(cod);
    UI.modal({
      titulo: 'Datos de venta · ' + a.cod, code: 'CL-44',
      cuerpo: '<div class="formgrid">' + UI.dato('Artículo', UI.esc(a.nom), { full: true }) +
        UI.campo('Precio sugerido (S/, por ' + a.u + ')', '<input id="av-precio" type="number" min="0" step="any" value="' + (a.precioVenta || 0) + '">', { req: true }) +
        UI.campo('Precio mínimo de venta (S/)', '<input id="av-min" type="number" min="0" step="any" value="' + (a.precioMin || 0) + '">', { hint: '0 = sin mínimo' }) +
        '<div class="field full"><label class="check"><input type="checkbox" id="av-verif"' + (a.verifMin ? ' checked' : '') + '> Verificar el precio mínimo en este artículo <span class="hint">(la Configuración General de Inventarios puede exigirlo para toda la empresa)</span></label></div>' +
        UI.campo('Descuento mínimo (%)', '<input id="av-dmin" type="number" min="0" max="100" step="any" value="' + (a.dctoMin || 0) + '">') +
        UI.campo('Descuento máximo (%)', '<input id="av-dmax" type="number" min="0" max="100" step="any" value="' + (a.dctoMax || 0) + '">') +
        UI.campo('Afectación IGV', '<select id="av-igv">' + UI.opts(M.AFECTACION, a.igv) + '</select>', { req: true }) +
        '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM09.guardar(\'' + cod + '\')">Guardar</button>'
    });
  },
  guardar(cod) {
    const x = { precio: UI.v('av-precio'), precioMin: UI.v('av-min'), verifMin: UI.chk('av-verif'), dctoMin: UI.v('av-dmin'), dctoMax: UI.v('av-dmax'), igv: UI.v('av-igv') };
    if (App.accion(() => Arts.guardar(cod, x), cod + ' actualizado')) { UI.cerrar(); App.refrescar(); }
  }
};
App.pantalla('cm09', { titulo: 'Artículos de venta', permiso: 'ver_venta', render: CM09.render });
