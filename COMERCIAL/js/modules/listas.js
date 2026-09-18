/* COMERCIAL V9 · CL-40 Listas de precios y ofertas: listado y «Probar precio»; el detalle de cada lista se abre en el modal CL-50 (modales CL-41, CL-42 cancelar, CL-49 artículos, CL-50 detalle, CL-51 grupo)
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
    html += UI.aviso('<b>Cómo se calcula el precio</b> en la cotización y la venta (moneda del documento, <b>sede</b> de su tienda, <b>segmento</b> del cliente): ' +
      '<b>1. Precio base:</b> la lista más específica (sede y segmento → sede → segmento → general) o, si ninguna tiene el artículo, el precio sugerido de GI-02 (solo S/). ' +
      '<b>2. Ofertas:</b> todas las vigentes que aplican. <b>3. Mejor precio:</b> gana el menor; una oferta nunca empeora el precio, salvo que tenga <b>Precio obligatorio</b>. ' +
      '<b>4. Piso:</b> nunca por debajo del <b>precio mínimo</b> del artículo (se ajusta al mínimo) ni en 0. ' +
      'Cada fila lleva precio fijo o % de descuento. Dos listas del mismo nivel no pueden tener el mismo artículo. La venta guarda en su línea cómo se llegó al precio. <b>Haga clic en una lista</b> para ver y editar sus artículos.', 'info');

    html += '<div class="card"><div class="filters">' + UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" onchange="CM08.f.q=this.value;App.refrescar()" placeholder="Nombre, código o artículo">') +
      UI.campo('Tipo', '<select onchange="CM08.f.tipo=this.value;App.refrescar()">' + UI.opts([{ v: 'LP', t: 'Listas de precios' }, { v: 'OF', t: 'Ofertas' }], f.tipo, 'Todas') + '</select>') +
      UI.campo('Moneda', '<select onchange="CM08.f.mon=this.value;App.refrescar()">' + UI.opts(M.MONEDAS.map(m => m.cod), f.mon, 'Todas') + '</select>') + '</div>' +
      UI.tabla(['Código', 'Nombre', 'Tipo', 'Moneda', 'Sede', 'Segmento', 'Vigencia', 'Estado', ['Filas', 'num']], listas.map(L =>
        '<tr class="clickable" onclick="CM08.ver(\'' + L.cod + '\')"><td>' + L.cod + '</td><td><b>' + UI.esc(L.nom) + '</b></td>' +
        '<td>' + (Precios.esOferta(L) ? '<b class="ok-t">Oferta</b>' + (L.forzado ? '<br><span class="mini">precio obligatorio</span>' : '') : 'Lista') + '</td><td>' + L.mon + '</td><td>' + (L.sede ? UI.esc(CM08.sedeNom(L.sede)) : '<span class="mini">Todas</span>') + '</td>' +
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
    const piso = (x, base) => { const m = Precios.minimo(f.art, um, L.mon); return x < m ? { precio: m, um, base, ajuste: x } : { precio: x, um, base }; };
    if (f.precio > 0) return { precio: f.precio, um };
    if (!(f.pct > 0)) return null;
    const fecha = Precios.esOferta(L) ? (L.desde || UI.hoy()) : UI.hoy();
    const otras = Precios.candidatos(f.art, um, L.sede, L.tipo, L.mon, fecha).filter(c => !Precios.esOferta(c.L) && c.L.cod !== L.cod &&
      (Precios.esOferta(L) || Precios.espec(c.L) > Precios.espec(L)));
    const b = Precios._normal(otras, 0, f.art, um, L.mon);
    return b ? piso(UI.r2(b.precio * (1 - f.pct / 100)), b.precio) : null;
  },
  /* CL-50: detalle de la lista u oferta en un modal (datos, artículos o grupos con precio o %, agregar, cancelar e historial) */
  ver(cod) {
    const L = Precios.lista(cod);
    if (!L) { UI.cerrar(); return; }
    CM08.sel = cod;
    UI.modal({ ancho: '1080px', titulo: (Precios.esOferta(L) ? 'Oferta ' : 'Lista ') + L.cod + ' · ' + UI.esc(L.nom), code: 'CL-50',
      cuerpo: CM08.detalle(L, Store.puede('editar_precios') && !L.cancelada), pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>' });
  },
  /* después de un cambio: refresca el listado y vuelve a pintar el modal de la lista */
  _otraVez() { App.refrescar(); CM08.ver(CM08.sel); },
  detalle(L, ed) {
    const of = Precios.esOferta(L);
    const inp = (i, campo, v, w) => '<input class="celda" type="number" min="0" step="any" style="width:' + w + 'px" value="' + (v == null ? '' : v) + '" onchange="CM08.fila(' + i + ',\'' + campo + '\',this.value)">';
    const filas = L.filas.map((f, i) => {
      const a = f.art ? Store.art(f.art) : null, r = CM08.resulta(L, f);
      const um = f.grupo ? '<span class="mini">Todas</span>' : ed ? '<select class="celda" onchange="CM08.fila(' + i + ',\'um\',this.value)">' +
        UI.opts((f.pct > 0 ? [{ v: '', t: 'Todas' }] : []).concat(Precios.unidades(f.art)), f.um || '') + '</select>' : (f.um || 'Todas');
      return '<tr><td>' + (f.grupo ? '<b>Grupo ' + UI.esc(M.grupoNom(f.grupo)) + '</b><br><span class="mini">todos sus artículos</span>' : f.art + '<br><span class="mini">' + UI.esc(a ? a.nom : '') + '</span>') + '</td>' +
        '<td>' + um + '</td>' +
        '<td class="num">' + (f.grupo ? '<span class="mini">—</span>' : ed ? inp(i, 'precio', f.precio, 90) : f.precio > 0 ? UI.m(f.precio, L.mon) : '') + '</td>' +
        '<td class="num">' + (ed ? inp(i, 'pct', f.pct, 70) : f.pct > 0 ? UI.n(f.pct) + ' %' : '') + '</td>' +
        '<td class="num">' + (r ? '<b>' + UI.m(r.precio, L.mon) + '</b>' + (r.base ? '<br><span class="mini">sobre ' + UI.n(r.base) + '</span>' : '') + (r.ajuste ? '<br><span class="warn-t">daría ' + UI.n(r.ajuste) + ': se ajusta al mínimo</span>' : '') +
'' : f.grupo ? '<span class="mini">según cada artículo</span>' : '<span class="mini">sin precio base</span>') + '</td>' +
        '<td>' + (ed ? '<button class="btn-link" title="Queda en el historial quién lo retiró y con qué valor" onclick="CM08.quitarFila(' + i + ')">Retirar</button>' : '') + '</td></tr>';
    });
    return '<div class="sec" style="margin-top:0">' + UI.estado(Precios.estado(L)) + ' ' + (of ? '<b class="ok-t">Oferta</b>' : 'Lista de precios') + '<div class="spacer"></div>' +
      (ed ? '<button class="btn btn-secondary btn-sm" onclick="CM08.editar(\'' + L.cod + '\',' + of + ')">Editar datos</button> <button class="btn btn-danger btn-sm" onclick="CM08.cancelar()">Cancelar ' + (of ? 'oferta' : 'lista') + '</button> ' +
        '<button class="btn btn-secondary btn-sm" onclick="CM08.agregarGrupo()">+ Agregar grupo</button> <button class="btn btn-primary btn-sm" onclick="CM08.agregar()">+ Agregar artículos</button>' : '') + '</div>' +
      (L.cancelada ? UI.aviso('<b>Cancelada</b> por <b>' + UI.esc(L.cancelada.u) + '</b> el ' + L.cancelada.f + '. Motivo: ' + UI.esc(L.cancelada.motivo) + '. Ya no se aplica ni se modifica; los documentos emitidos conservan su precio.', 'err') : '') +
      '<div class="formgrid c4">' + UI.dato('Moneda', L.mon) + UI.dato('Sede', L.sede ? UI.esc(CM08.sedeNom(L.sede)) : 'Todas') + UI.dato('Segmento de cliente', L.tipo || 'Todos') +
      UI.dato('Vigencia', of ? (L.desde || '…') + ' al ' + (L.hasta || 'sin fecha final') + (L.forzado ? '<br><b>Precio obligatorio</b>' : '') : 'Siempre (lista de precios)') + '</div>' +
      UI.tabla(['Artículo o grupo', 'Unidad', ['Precio fijo', 'num'], ['% descuento', 'num'], ['Resulta', 'num'], ['', '', '70px']], filas,
        { vacio: 'La lista no tiene artículos: use «+ Agregar artículos» o «+ Agregar grupo»', estilo: 'margin-top:10px' }) +
      '<p class="hint">Escriba el <b>precio fijo</b> o el <b>% de descuento</b> (uno borra el otro). Un precio en la unidad de inventario sirve también para las unidades mayores (× conversión). ' +
      'Un % con unidad «Todas» y un grupo valen para cualquier unidad. «Resulta» se calcula con la sede, el segmento y la moneda de la lista' + (of ? ', en el primer día de la oferta' : '') + '. Cada artículo debe tener precio o %.</p>' +
      (L.creadoPor ? '<p class="mini">Creada por ' + UI.esc(L.creadoPor) + ' el ' + L.creado + '</p>' : '') + DOCUI.historial(L);
  },

  probar() {
    const s = CM08.sim, arts = Store.arts().filter(a => a.venta);
    if (!Store.art(s.art)) s.art = arts[0].cod;
    const ums = Precios.unidades(s.art);
    if (ums.indexOf(s.um) < 0) s.um = ums[0];
    const fecha = s.fecha || UI.hoy();
    const sel = (campo, lista, val, vacio) => '<select onchange="CM08.sim.' + campo + '=this.value;App.refrescar()">' + UI.opts(lista, val, vacio) + '</select>';
    const r = Precios.resolver(s.art, s.um, s.sede, s.tipo, s.mon, fecha), a = Store.art(s.art);
    const ok = '<b class="ok-t">✓ gana</b>', no = t => '<span class="mini">' + t + '</span>';
    const filas = [];
    if (r) {
      filas.push('<tr><td><b>1. Precio base</b></td><td>' + (r.base ? UI.esc(r.base.origen) + (r.base.lista ? ' <span class="mini">' + r.base.lista + '</span>' : '') : '—') + '</td><td class="num">' + (r.base ? UI.m(r.base.precio, s.mon) : '—') + '</td><td>' + (r.base && !r.oferta ? ok : '') + '</td></tr>');
      r.ofertas.forEach(o => filas.push('<tr><td>2. Oferta</td><td>' + UI.esc(o.nom) + ' <span class="mini">' + o.cod + (o.forzado ? ' · precio obligatorio' : '') + '</span></td><td class="num">' + UI.m(o.precio, s.mon) + '</td><td>' +
        (r.oferta && r.oferta.cod === o.cod ? ok : no(r.base && o.precio >= r.base.precio && !o.forzado ? 'no mejora el precio base' : 'hay un precio mejor')) + '</td></tr>'));
      if (!r.ofertas.length) filas.push('<tr><td>2. Ofertas</td><td colspan="3">' + no('ninguna vigente para este caso') + '</td></tr>');
      filas.push('<tr><td>4. Piso (precio mínimo)</td><td>' + (r.minimo > 0 ? 'mínimo del artículo en ' + s.um : 'sin mínimo: solo mayor que cero') + '</td><td class="num">' + (r.minimo > 0 ? UI.m(r.minimo, s.mon) : '—') + '</td><td>' + (r.ajusteMin ? '<b class="warn-t">se ajusta al mínimo</b>' : no('se respeta')) + '</td></tr>');
    }
    return '<div class="card"><div class="sec">Probar precio</div><div class="formgrid c4">' +
      UI.campo('Artículo', sel('art', arts.map(x => ({ v: x.cod, t: x.cod + ' · ' + x.nom })), s.art), { estilo: 'grid-column:span 2' }) + UI.campo('Unidad', sel('um', ums, s.um)) + UI.campo('Moneda', sel('mon', M.MONEDAS.map(m => m.cod), s.mon)) +
      UI.campo('Sede', sel('sede', CM08.sedesOpts(), s.sede, 'Sin sede')) + UI.campo('Segmento de cliente', sel('tipo', M.TIPOS_CLIENTE, s.tipo, 'Sin segmento')) +
      UI.campo('Fecha', '<input type="date" value="' + UI.dIso(fecha) + '" onchange="CM08.sim.fecha=UI.dTxt(this.value);App.refrescar()">', { hint: 'para probar una oferta antes de que empiece' }) + '</div>' +
      '<div style="display:flex;gap:18px;align-items:flex-start;margin-top:12px;flex-wrap:wrap"><div style="flex:1;min-width:320px">' +
      UI.tabla(['Fase', 'Lista u oferta', ['Precio', 'num'], ''], filas, { vacio: 'Sin precio en ' + s.mon + ': ninguna lista tiene el artículo' + (s.mon === 'PEN' ? ' ni hay precio sugerido' : ' (en dólares no hay precio sugerido)') }) + '</div>' +
      '<div class="kpi" style="min-width:220px"><div class="l">Precio resultante</div><div class="v">' + (r ? UI.m(r.precio, s.mon) : '<span class="err-t">Sin precio</span>') + '</div>' +
      '<div class="s">' + (r ? UI.esc(r.origen) + (r.precioLista && r.precio !== r.precioLista ? '<br>precio base ' + UI.m(r.precioLista, s.mon) : '') : 'no se puede vender en ' + s.mon) + '</div></div></div></div>';
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
        (oferta ? '<div class="field full"><label class="check"><input type="checkbox" id="lp-forzado"' + (L.forzado ? ' checked' : '') + '> <b>Precio obligatorio</b> <span class="hint">— la oferta se aplica aunque sea más cara que la lista del cliente (liquidación, precio único). Sin marcar, solo se aplica si mejora el precio</span></label></div>' : '') +
        '<div class="field full"><label class="check"><input type="checkbox" id="lp-activa"' + (L.activa ? ' checked' : '') + '> Activa</label></div></div>' +
        '<p class="hint" style="margin-top:8px">' + (oferta ? 'Una oferta es una lista con fechas. Mientras está vigente se aplica si <b>mejora</b> el precio del cliente (o siempre, con «Precio obligatorio»), y nunca por debajo del precio mínimo. Luego agregue artículos o grupos con su precio o % de descuento.'
          : 'Sin fechas: es una lista de precios permanente. Deje Sede y Segmento en «Todas / Todos» para que valga en general.') + '</p>',
      pie: '<button class="btn btn-secondary" onclick="' + (cod ? 'CM08.ver(\'' + cod + '\')' : 'UI.cerrar()') + '">Cancelar</button><button class="btn btn-primary" onclick="CM08.guardar(\'' + (cod || '') + '\',' + !!oferta + ')">Guardar</button>'
    });
  },
  guardar(cod, oferta) {
    const x = { nom: UI.v('lp-nom'), mon: UI.v('lp-mon'), sede: UI.v('lp-sede'), tipo: UI.v('lp-tipo'), oferta, desde: UI.dTxt(UI.v('lp-desde')), hasta: UI.dTxt(UI.v('lp-hasta')), activa: UI.chk('lp-activa'), forzado: UI.chk('lp-forzado') };
    let hecha = null;
    if (App.accion(() => (hecha = Listas.guardar(x, cod || null)), L => (oferta ? 'Oferta ' : 'Lista ') + L.cod + ' guardada')) { CM08.sel = hecha.cod; CM08._otraVez(); }
  },
  /* CL-42: una lista u oferta no se borra: se cancela con motivo y queda quién la canceló (LP6) */
  cancelar() {
    const L = Precios.lista(CM08.sel);
    UI.motivo('Cancelar ' + (Precios.esOferta(L) ? 'oferta ' : 'lista ') + L.cod + ' · ' + UI.esc(L.nom),
      '<p>La ' + (Precios.esOferta(L) ? 'oferta' : 'lista') + ' deja de aplicarse en cotizaciones y ventas nuevas y ya no se podrá modificar. <b>No se borra</b>: queda como «Cancelada» con su motivo, el usuario (<b>' + UI.esc(Store.usuario().nom) + '</b>) y la fecha. Los documentos emitidos conservan su precio.</p>' +
      '<p class="hint">Para dejar de usarla solo un tiempo, desmarque «Activa» en Editar datos.</p>',
      null, m => { if (App.accion(() => Listas.cancelar(L.cod, m), L.cod + ' cancelada')) CM08._otraVez(); }, 'Cancelar ' + (Precios.esOferta(L) ? 'oferta' : 'lista'), 'CL-42');
  },
  fila(i, campo, val) { App.accion(() => Listas.fila(CM08.sel, i, campo, val)); CM08._otraVez(); },
  quitarFila(i) { if (App.accion(() => Listas.quitarFila(CM08.sel, i), 'Artículo retirado (queda en el historial)')) CM08._otraVez(); },

  /* CL-49: agregar artículos (varios a la vez) o un grupo entero, con un precio o % para todos (opcional) */
  agregar() {
    const grupos = [...new Set(Store.arts().filter(a => a.venta && Store.activo(a)).map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) }));
    UI.modal({
      ancho: '860px', titulo: 'Agregar a ' + UI.esc(Precios.lista(CM08.sel).nom), code: 'CL-49',
      cuerpo: '<div class="filters" style="margin-bottom:10px">' +
        UI.campo('Grupo de Artículo', '<select id="ag-g" onchange="CM08.pintarAg()">' + UI.opts(grupos, '', 'Todos') + '</select>') +
        UI.campo('Código o nombre', '<input id="ag-q" oninput="CM08.pintarAg()" placeholder="Buscar…">') + '</div>' +
        '<div class="formgrid c4" style="margin-bottom:10px">' +
        UI.campo('Unidad', '<select id="ag-um">' + UI.opts([{ v: '', t: 'La de venta de cada artículo' }, { v: '*', t: 'Todas (solo con %)' }], '') + '</select>') +
        UI.campo('Precio fijo', '<input id="ag-precio" type="number" min="0" step="any" placeholder="precio…">', { req: true, hint: 'o bien' }) +
        UI.campo('% de descuento', '<input id="ag-pct" type="number" min="0" max="99.99" step="any" placeholder="%…">', { req: true }) + '</div>' +
        '<div id="ag-body"></div><p class="hint">Obligatorio: <b>precio fijo o % de descuento</b> (uno de los dos). Se aplica a todos los artículos marcados; luego puede cambiarlo artículo por artículo. Una lista no guarda artículos con precio 0 y descuento 0.</p>',
      pie: '<button class="btn btn-secondary" onclick="CM08.ver(CM08.sel)">Volver</button><button class="btn btn-primary" onclick="CM08.agregarOk()">Agregar</button>'
    });
    CM08.pintarAg();
  },
  pintarAg() {
    const b = document.getElementById('ag-body'), L = Precios.lista(CM08.sel);
    if (!b || !L) return;
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
      const arts = [...document.querySelectorAll('.ag-chk')].filter(c => c.checked).map(c => c.value);
      if (!arts.length) throw new Error('Marque los artículos que quiere agregar');
      const n = Listas.agregarArts(CM08.sel, arts, v);
      return n + (n === 1 ? ' artículo agregado' : ' artículos agregados');
    }, m => m);
    if (ok) CM08._otraVez();
  },
  /* CL-51: todo un grupo de artículos con un % de descuento */
  agregarGrupo() {
    const L = Precios.lista(CM08.sel), arts = Store.arts().filter(a => a.venta && Store.activo(a));
    const grupos = [...new Set(arts.map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) + ' (' + arts.filter(a => a.grupo === g).length + ' artículos)' }));
    UI.modal({
      titulo: 'Agregar grupo a ' + UI.esc(L.nom), code: 'CL-51',
      cuerpo: '<div class="formgrid">' + UI.campo('Grupo de Artículo', '<select id="gr-g">' + UI.opts(grupos, '', 'Seleccionar…') + '</select>', { req: true }) +
        UI.campo('% de descuento', '<input id="gr-pct" type="number" min="0" max="99.99" step="any" placeholder="Ej. 10">', { req: true }) + '</div>' +
        '<p class="hint" style="margin-top:8px">El % vale para <b>todos los artículos del grupo</b>, en cualquier unidad, también los que se creen después. Se aplica sobre el precio de lista de cada artículo. ' +
        'Si un artículo del grupo también está en la lista con su propio precio o %, manda el del artículo.</p>',
      pie: '<button class="btn btn-secondary" onclick="CM08.ver(CM08.sel)">Volver</button><button class="btn btn-primary" onclick="CM08.agregarGrupoOk()">Agregar grupo</button>'
    });
  },
  agregarGrupoOk() {
    if (App.accion(() => Listas.agregarGrupo(CM08.sel, UI.v('gr-g'), UI.v('gr-pct')), 'Grupo agregado')) CM08._otraVez();
  },
  excel() {
    const filas = [];
    Precios.listas().forEach(L => L.filas.forEach(f => filas.push([L.cod, L.nom, Precios.esOferta(L) ? 'Oferta' : 'Lista', L.mon, L.sede ? CM08.sedeNom(L.sede) : 'Todas', L.tipo || 'Todos',
      L.desde, L.hasta, L.forzado ? 'Sí' : '', Precios.estado(L), L.cancelada ? L.cancelada.u + ' · ' + L.cancelada.f + ' · ' + L.cancelada.motivo : '', f.art || 'Grupo ' + M.grupoNom(f.grupo), f.art ? M.nomArt(f.art) : '', f.um || 'Todas', f.precio || '', f.pct || ''])));
    UI.csv('listas-de-precios-y-ofertas', ['Código', 'Nombre', 'Tipo', 'Moneda', 'Sede', 'Segmento', 'Desde', 'Hasta', 'Precio obligatorio', 'Estado', 'Cancelada (quién · cuándo · motivo)', 'Artículo o grupo', 'Descripción', 'Unidad', 'Precio fijo', '% descuento'], filas);
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
        '<td class="num">' + UI.s(a.precioVenta) + '</td><td class="num">' + (a.precioMin ? UI.s(a.precioMin) + '<br><span class="mini">' + 'se exige siempre' + '</span>' : '—') + '</td>' +
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
        '<div class="field full"><span class="hint">En Comercial el precio mínimo <b>se exige siempre</b>: ninguna lista, oferta, precio a mano ni descuento lo puede bajar (LP8, LP12). 0 = sin mínimo (el precio debe ser mayor que cero).</span><input type="hidden" id="av-verif" value="' + (a.verifMin ? '1' : '') + '"></div>' +
        UI.campo('Descuento mínimo (%)', '<input id="av-dmin" type="number" min="0" max="100" step="any" value="' + (a.dctoMin || 0) + '">') +
        UI.campo('Descuento máximo (%)', '<input id="av-dmax" type="number" min="0" max="100" step="any" value="' + (a.dctoMax || 0) + '">') +
        UI.campo('Afectación IGV', '<select id="av-igv">' + UI.opts(M.AFECTACION, a.igv) + '</select>', { req: true }) +
        '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="CM09.guardar(\'' + cod + '\')">Guardar</button>'
    });
  },
  guardar(cod) {
    const x = { precio: UI.v('av-precio'), precioMin: UI.v('av-min'), verifMin: !!UI.v('av-verif'), dctoMin: UI.v('av-dmin'), dctoMax: UI.v('av-dmax'), igv: UI.v('av-igv') };
    if (App.accion(() => Arts.guardar(cod, x), cod + ' actualizado')) { UI.cerrar(); App.refrescar(); }
  }
};
App.pantalla('cm09', { titulo: 'Artículos de venta', permiso: 'ver_venta', render: CM09.render });
