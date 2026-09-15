/* PRODUCCION · Maestros de Producción: PR-10 Listas de materiales · PR-11 Recursos (ficha y operarios) ·
   PR-12 Tipos de recurso · PR-13 Configuración */
const PR10 = {
  art: 'PT-0001',
  render() {
    const fabr = M.fabricables();
    if (!M.art(PR10.art) || !M.ldmsDe(PR10.art).length) PR10.art = fabr[0].cod;
    const lista = M.LDMS.map(l => '<tr class="clickable" onclick="PR10.art=\'' + l.art + '\';App.refrescar()"><td><b>' + l.id + '</b></td><td>' + l.art + '<br><span class="mini">' + UI.esc(M.nomArt(l.art)) + '</span></td>' +
      '<td>' + UI.esc(l.nom) + '<br><span class="mini">' + UI.esc(l.desc) + '</span></td><td>' + (l.pred ? UI.badge('Predeterminada', 'var(--confirmado)') : '<span class="mini">Alternativa</span>') + '</td>' +
      '<td class="num">' + l.items.filter(i => i.tipo === 'Artículo').length + '</td><td class="num">' + l.items.filter(i => i.tipo === 'Recurso').length + '</td></tr>');
    return '<div class="screen-head"><h1>Listas de materiales</h1><span class="code">PR-10</span><div class="spacer"></div><a class="btn btn-secondary" style="text-decoration:none" href="../Prototipo_GI.html" target="_blank">Editar en GI-17</a></div>' +
      UI.aviso('Las listas se mantienen en Inventarios (GI-17) y Producción las consulta. Una lista es la <b>fórmula de un artículo</b>: sus materiales, recursos e instrucciones. ' +
        'Si uno de sus materiales también tiene lista, es un artículo fabricable y puede tener su propia orden de fabricación.', 'info') +
      '<div class="card"><div class="filters">' + UI.campo('Artículo', '<select onchange="PR10.art=this.value;App.refrescar()" style="min-width:420px">' + UI.opts(fabr.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), PR10.art) + '</select>') + '</div></div>' +
      M.ldmsDe(PR10.art).map(PR10.ficha).join('') +
      '<div class="sec">Todas las listas</div>' + UI.tabla(['Lista', 'Artículo', 'Nombre', 'Tipo', ['Materiales', 'num'], ['Recursos', 'num']], lista);
  },
  ficha(L) {
    const filas = L.items.map(i => {
      if (i.tipo === 'Texto') return '<tr><td>' + UI.badge('Texto', 'var(--borrador)') + '</td><td colspan="5" class="mini">📝 ' + UI.esc(i.txt) + '</td></tr>';
      if (i.tipo === 'Recurso') { const R = M.rec(i.cod) || {}; return '<tr><td>' + UI.badge('Recurso', 'var(--prp)') + '</td><td>' + i.cod + '</td><td>' + UI.esc(R.nom) + '</td><td class="num">' + UI.n(i.cant, 2) + ' ' + (R.u || '') + '</td><td class="mini">—</td><td class="mini">' + (i.metodo || (R.tipo === 'RECURSO HUMANO' ? 'Manual' : 'Notificación')) + '</td></tr>'; }
      const fab = Explosion.fabricable(i.cod);
      return '<tr><td>' + UI.badge('Artículo', 'var(--primario-claro)') + '</td><td>' + i.cod + '</td><td>' + UI.esc(M.nomArt(i.cod)) + (fab ? ' <button class="btn-link" onclick="PR10.art=\'' + i.cod + '\';App.refrescar()">fabricable · ver su lista</button>' : '') + '</td>' +
        '<td class="num">' + UI.n(i.cant, 2) + ' ' + M.u(i.cod) + '</td><td class="mini">' + (i.alm || '—') + '</td><td class="mini">' + (i.metodo || '') + '</td></tr>';
    });
    return '<div class="card"><div class="sec">' + L.id + ' · ' + UI.esc(L.nom) + ' ' + (L.pred ? UI.badge('Predeterminada', 'var(--confirmado)') : '<span class="chip">Alternativa</span>') +
      ' <span class="mini">' + UI.esc(L.desc) + ' · cantidad base ' + L.base + '</span></div>' +
      UI.tabla(['Tipo', 'Código', 'Componente', ['Por unidad base', 'num'], 'Almacén', 'Método'], filas, { estilo: 'margin:0' }) + '</div>';
  }
};
App.pantalla('pr10', { titulo: 'Listas de materiales', render: PR10.render });

/* ---------- PR-11 Recursos: mano de obra, máquinas, equipos y servicios de terceros (no mueven almacén) ---------- */
const PR11 = {
  tab: 'rec', f: { q: '', tipo: '', est: '' },
  ESTADOS: ['Activo', 'Inactivo'],
  /* correlativo sobre los códigos existentes: nunca repite uno que ya está */
  sigCod(lista, pref, dig) { return pref + String(lista.reduce((a, x) => Math.max(a, parseInt(String(x.cod).slice(pref.length), 10) || 0), 0) + 1).padStart(dig, '0'); },
  estado(r) { return r.activo !== false ? UI.badge('Activo', 'var(--confirmado)') : UI.badge('Inactivo', 'var(--borrador)'); },
  esHumano(r) { return !!r && r.tipo === 'RECURSO HUMANO'; },
  horasOpe(cod) { return Store.d.ofs.reduce((a, of) => a + of.emisiones.reduce((s, e) => s + e.recursos.reduce((z, r) => z + (r.operarios || []).filter(x => x.ope === cod).reduce((w, x) => w + x.horas, 0), 0), 0), 0); },

  render() {
    const t = PR11.tab, f = PR11.f;
    const tabs = [['rec', 'Recursos (' + M.recursos().length + ')'], ['ope', 'Operarios (' + Store.d.operarios.length + ')']];
    return '<div class="screen-head"><h1>Recursos</h1><span class="code">PR-11</span><div class="spacer"></div>' +
      (t === 'rec' ? '<button class="btn btn-primary" onclick="App.go(\'pr11f\',{id:\'nuevo\'})">+ Nuevo recurso</button>' : '<button class="btn btn-primary" onclick="PR11.editarOpe(-1)">+ Nuevo operario</button>') + '</div>' +
      '<div class="tabs">' + tabs.map(x => '<div class="tab' + (x[0] === t ? ' active' : '') + '" onclick="PR11.tab=\'' + x[0] + '\';App.refrescar()">' + x[1] + '</div>').join('') + '</div>' +
      (t === 'rec' ? '<div class="card"><div class="filters">' +
        UI.campo('Buscar', '<input value="' + UI.esc(f.q) + '" placeholder="Código o nombre" oninput="PR11.f.q=this.value;PR11.pintar()" style="min-width:220px">') +
        UI.campo('Tipo de recurso', '<select onchange="PR11.f.tipo=this.value;PR11.pintar()">' + UI.opts(M.tiposRecurso().map(x => x.nom), f.tipo, 'Todos') + '</select>') +
        UI.campo('Estado', '<select onchange="PR11.f.est=this.value;PR11.pintar()">' + UI.opts(PR11.ESTADOS, f.est, 'Todos') + '</select>') + '</div></div>' +
        '<div id="pr11-body"></div>' +
        '<p class="hint">No mueven almacén: su costo entra a la orden con el costo por unidad de consumo vigente al emitir o recibir. Un servicio de terceros se contrasta con la OC o la factura en la pestaña Costo de la orden.</p>'
        : PR11.operarios());
  },
  despues() { PR11.pintar(); },
  pintar() { const b = document.getElementById('pr11-body'); if (b) b.innerHTML = PR11.lista(); },
  lista() {
    const f = PR11.f, q = f.q.trim().toLowerCase();
    const filas = M.recursos().filter(r => (!q || r.cod.toLowerCase().includes(q) || r.nom.toLowerCase().includes(q)) && (!f.tipo || r.tipo === f.tipo) && (!f.est || (f.est === 'Activo') === (r.activo !== false)))
      .map(r => '<tr><td><b>' + r.cod + '</b></td><td>' + UI.esc(r.nom) + (r.resp ? '<br><span class="mini">' + UI.esc(r.resp) + '</span>' : '') + '</td><td class="mini">' + UI.esc(r.tipo) + '</td><td>' + UI.esc(r.u) + '</td>' +
        '<td class="num">' + UI.n(r.costo, 2) + '</td><td>' + PR11.estado(r) + '</td><td><button class="btn btn-secondary btn-sm" onclick="App.go(\'pr11f\',{id:\'' + r.cod + '\'})">Editar</button></td></tr>');
    return UI.tabla([['Código', '', '100px'], 'Nombre', 'Tipo', 'Unidad de consumo', ['Costo por unidad (S/.)', 'num'], 'Estado', ['Acciones', '', '80px']], filas, { vacio: 'No hay recursos con esos filtros' });
  },
  /* d: {nom, tipo, resp, activo, u, costo, cuenta}; sin cod crea el recurso con el siguiente código */
  guardarRecurso(cod, d) {
    const lista = Store.d.recursos, R = cod ? lista.find(r => r.cod === cod) : null, nom = String(d.nom || '').trim(), costo = parseFloat(d.costo);
    if (cod && !R) throw new Error('No existe el recurso ' + cod);
    if (!nom) throw new Error('Indique el nombre del recurso');
    if (lista.some(r => r !== R && r.nom.trim().toLowerCase() === nom.toLowerCase())) throw new Error('Ya existe un recurso llamado ' + nom);
    if (!M.tipoRec(d.tipo)) throw new Error('Elija el tipo de recurso');
    if (M.UNIDADES_RECURSO.indexOf(d.u) < 0) throw new Error('Elija la unidad de consumo');
    if (d.costo === '' || d.costo == null || !(costo >= 0)) throw new Error('Indique el costo por unidad de consumo (0 o más)');
    if (!M.cuenta(d.cuenta)) throw new Error('Elija la cuenta contable de costo');
    if (R) {
      if (PR11.esHumano(R) && d.tipo !== R.tipo && Store.d.operarios.some(o => o.rec === R.cod)) throw new Error('Tiene operarios asignados: páselos a otro recurso antes de cambiar el tipo');
      if (d.u !== R.u && Store.d.ofs.some(o => o.recs.some(x => x.cod === R.cod))) throw new Error('Ya se usa en órdenes de fabricación con la unidad ' + R.u + ': no se puede cambiar');
    }
    const datos = { nom, tipo: d.tipo, resp: String(d.resp || '').trim(), activo: d.activo !== false, u: d.u, costo: UI.r4(costo), cuenta: d.cuenta };
    if (R) return Object.assign(R, datos);
    const nuevo = Object.assign({ cod: PR11.sigCod(lista, 'REC-', 4) }, datos);
    lista.push(nuevo);
    return nuevo;
  },

  operarios() {
    const filas = Store.d.operarios.map((o, i) => {
      const R = M.rec(o.rec) || {};
      return '<tr><td><b>' + o.cod + '</b></td><td>' + UI.esc(o.nom) + '</td><td class="mini">' + o.rec + ' · ' + UI.esc(R.nom || '') + '</td><td>' + UI.esc(o.sede) + '</td>' +
        '<td class="num">' + UI.n(PR11.horasOpe(o.cod), 1) + '</td><td>' + UI.badge(o.activo ? 'Activo' : 'Inactivo', o.activo ? 'var(--confirmado)' : 'var(--borrador)') + '</td>' +
        '<td><button class="btn-link" onclick="PR11.editarOpe(' + i + ')">Editar</button> <button class="btn-link" onclick="PR11.alternar(' + i + ')">' + (o.activo ? 'Desactivar' : 'Activar') + '</button></td></tr>';
    });
    return UI.tabla(['Código', 'Nombre', 'Recurso que ocupa', 'Sede', ['Horas registradas', 'num'], 'Estado', ''], filas) +
      '<p class="hint">Cada operario ocupa un recurso de tipo RECURSO HUMANO: en la emisión se registra como detalle del recurso y sus horas se valorizan con el costo de ese recurso.</p>';
  },
  editarOpe(i) {
    const o = i >= 0 ? Store.d.operarios[i] : { nom: '', rec: (M.recActivos(PR11.esHumano)[0] || {}).cod || '', sede: M.SEDES_OP[0] };
    const recs = M.recursos().filter(r => PR11.esHumano(r) && (r.activo !== false || r.cod === o.rec));
    if (!recs.length) { UI.toast('Primero cree un recurso de tipo RECURSO HUMANO'); return; }
    UI.modal({
      titulo: i >= 0 ? 'Editar ' + o.cod : 'Nuevo operario',
      cuerpo: '<div class="formgrid">' + UI.campo('Nombre', '<input id="op-nom" value="' + UI.esc(o.nom) + '">', { req: true, full: true }) +
        UI.campo('Recurso que ocupa', '<select id="op-rec">' + UI.opts(recs.map(r => ({ v: r.cod, t: r.cod + ' · ' + r.nom })), o.rec) + '</select>', { req: true }) +
        UI.campo('Sede', '<select id="op-sede">' + UI.opts(M.SEDES_OP, o.sede) + '</select>') + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR11.guardarOpe(' + i + ')">Guardar</button>'
    });
  },
  /* d: {nom, rec, sede}; i < 0 crea el operario */
  guardarOperario(i, d) {
    const nom = String(d.nom || '').trim(), lista = Store.d.operarios;
    if (!nom) throw new Error('Indique el nombre');
    if (!PR11.esHumano(M.rec(d.rec))) throw new Error('El operario debe ocupar un recurso de tipo RECURSO HUMANO');
    const datos = { nom, rec: d.rec, sede: d.sede };
    if (i >= 0) return Object.assign(lista[i], datos);
    const o = Object.assign({ cod: PR11.sigCod(lista, 'OPE-', 3), activo: true }, datos);
    lista.push(o);
    return o;
  },
  guardarOpe(i) {
    if (App.accion(() => PR11.guardarOperario(i, { nom: UI.v('op-nom'), rec: UI.v('op-rec'), sede: UI.v('op-sede') }), 'Operario guardado')) { UI.cerrar(); App.refrescar(); }
  },
  alternar(i) { const o = Store.d.operarios[i]; o.activo = !o.activo; Store.guardar(); App.refrescar(); }
};
M.SEDES_OP = [...new Set(M.ALMACENES.map(a => a.sede).filter(s => s !== 'Virtual'))];
App.pantalla('pr11', { titulo: 'Recursos', render: PR11.render, despues: PR11.despues });

/* ---------- Ficha del recurso ---------- */
const PR11F = {
  render(p) {
    const nuevo = !p.id || p.id === 'nuevo';
    const r = nuevo ? { cod: PR11.sigCod(M.recursos(), 'REC-', 4), nom: '', tipo: '', resp: '', activo: true, u: 'HORA', costo: '', cuenta: '' } : M.rec(p.id);
    if (!r) return UI.aviso('No existe el recurso ' + UI.esc(p.id), 'err');
    return '<div class="screen-head"><h1>' + (nuevo ? 'Nuevo recurso' : r.cod + ' · ' + UI.esc(r.nom)) + '</h1>' + (nuevo ? '' : PR11.estado(r)) + '<div class="spacer"></div>' +
      '<button class="btn btn-secondary" onclick="App.go(\'pr11\')">Volver</button><button class="btn btn-primary" onclick="PR11F.guardar(' + (nuevo ? 'null' : '\'' + r.cod + '\'') + ')">Guardar</button></div>' +
      '<div class="card"><div class="formgrid c3">' +
      UI.dato('Código', '<b>' + r.cod + '</b>' + (nuevo ? ' <span class="mini">se asigna al guardar</span>' : '')) +
      UI.campo('Nombre', '<input id="rf-nom" value="' + UI.esc(r.nom) + '">', { req: true, estilo: 'grid-column:span 2' }) +
      UI.campo('Tipo de recurso', '<select id="rf-tipo">' + UI.opts(M.tiposRecurso().map(t => t.nom), r.tipo, nuevo ? '— Seleccione —' : null) + '</select>', { req: true, hint: 'RECURSO HUMANO: se emite a mano y lleva operarios · SERVICIO DE TERCEROS: se compra al proveedor' }) +
      UI.campo('Responsable / operador', '<input id="rf-resp" value="' + UI.esc(r.resp) + '" placeholder="Opcional">') +
      UI.campo('Estado', '<select id="rf-est">' + UI.opts(PR11.ESTADOS, r.activo !== false ? 'Activo' : 'Inactivo') + '</select>', { hint: 'Un recurso inactivo no se ofrece en órdenes nuevas' }) +
      UI.campo('Unidad de consumo', '<select id="rf-u">' + UI.opts(M.UNIDADES_RECURSO, r.u) + '</select>', { req: true }) +
      UI.campo('Costo por unidad de consumo (S/.)', '<input id="rf-costo" type="number" min="0" step="any" value="' + UI.esc(r.costo) + '">', { req: true }) +
      UI.campo('Cuenta contable de costo', '<select id="rf-cta">' + UI.opts(M.CUENTAS_COSTO.map(c => ({ v: c.cod, t: c.cod + ' · ' + c.nom })), r.cuenta, '— Seleccione —') + '</select>', { req: true }) +
      '</div></div>' + (nuevo ? '' : PR11F.uso(r));
  },
  /* solo lectura: órdenes que llevan el recurso, con lo consumido y el costo que se les imputó */
  uso(r) {
    const tot = { plan: 0, real: 0, costo: 0 };
    const filas = Store.d.ofs.filter(o => o.recs.some(x => x.cod === r.cod)).map(o => {
      const ls = o.recs.filter(x => x.cod === r.cod), plan = ls.reduce((a, x) => a + x.plan, 0), real = ls.reduce((a, x) => a + x.real, 0), costo = ls.reduce((a, x) => a + x.costoReal, 0);
      tot.plan += plan; tot.real += real; tot.costo += costo;
      return '<tr class="clickable" onclick="App.go(\'pr02\',{id:\'' + o.id + '\'})"><td><b>' + o.id + '</b></td><td>' + o.ref + '</td><td>' + UI.esc(M.nomArt(o.art)) + '<br><span class="mini">' + o.art + '</span></td><td>' + UI.estadoOF(o.estado) + '</td>' +
        '<td class="num">' + UI.q(plan, r.u) + '</td><td class="num">' + UI.q(real, r.u) + '</td><td class="num">' + UI.s(costo) + '</td></tr>';
    });
    const ops = Store.d.operarios.filter(o => o.rec === r.cod);
    return '<div class="sec">Uso en producción <span class="mini">solo lectura</span></div>' +
      UI.kpis([{ l: 'Órdenes que lo usan', v: filas.length }, { l: 'Consumido', v: UI.q(tot.real, r.u), s: 'planificado ' + UI.q(tot.plan, r.u) }, { l: 'Costo imputado', v: UI.s(tot.costo), color: 'var(--prp)' }]) +
      UI.tabla(['Orden', Prod.nombreRef(), 'Produce', 'Estado', ['Planificado', 'num'], ['Consumido', 'num'], ['Costo imputado', 'num']], filas,
        { vacio: 'Ninguna orden de fabricación usa este recurso', foot: filas.length ? '<tr><td colspan="4" class="num"><b>Total</b></td><td class="num"><b>' + UI.q(tot.plan, r.u) + '</b></td><td class="num"><b>' + UI.q(tot.real, r.u) + '</b></td><td class="num"><b>' + UI.s(tot.costo) + '</b></td></tr>' : '' }) +
      (ops.length ? '<div class="sec">Operarios que ocupan este recurso</div>' + UI.tabla(['Código', 'Nombre', 'Sede', ['Horas registradas', 'num'], 'Estado'], ops.map(o =>
        '<tr><td>' + o.cod + '</td><td>' + UI.esc(o.nom) + '</td><td>' + UI.esc(o.sede) + '</td><td class="num">' + UI.n(PR11.horasOpe(o.cod), 1) + '</td><td>' + UI.badge(o.activo ? 'Activo' : 'Inactivo', o.activo ? 'var(--confirmado)' : 'var(--borrador)') + '</td></tr>')) : '') +
      '<p class="hint">El costo imputado se valorizó con el costo por unidad vigente al emitir o recibir: cambiar el costo aquí no recalcula lo ya registrado.</p>';
  },
  guardar(cod) {
    const r = App.accion(() => PR11.guardarRecurso(cod, { nom: UI.v('rf-nom'), tipo: UI.v('rf-tipo'), resp: UI.v('rf-resp'), activo: UI.v('rf-est') !== 'Inactivo', u: UI.v('rf-u'), costo: UI.v('rf-costo'), cuenta: UI.v('rf-cta') }),
      x => 'Recurso ' + x.cod + ' guardado');
    if (r) App.go('pr11f', { id: r.cod });
  }
};
App.pantalla('pr11f', {
  titulo: 'Recurso', menu: 'pr11', render: PR11F.render,
  miga: p => '<a class="btn-link" onclick="App.go(\'pr11\')">Recursos</a> / <b>' + (!p.id || p.id === 'nuevo' ? 'Nuevo' : UI.esc(p.id)) + '</b>'
});

/* ---------- PR-12 Tipos de recurso ---------- */
const PR12 = {
  CLASES: { humano: 'Mano de obra: método Manual, operarios y reproceso', servicio: 'Servicio de terceros: se compra y se contrasta con la OC o factura' },
  usos(nom) { return M.recursos().filter(r => r.tipo === nom).length; },
  render() {
    const filas = M.tiposRecurso().map(t => {
      const n = PR12.usos(t.nom);
      return '<tr><td><b>' + t.cod + '</b></td><td>' + UI.esc(t.nom) + '</td><td class="mini">' + (t.clase ? PR12.CLASES[t.clase] : '—') + '</td>' +
        '<td class="num">' + (n ? '<button class="btn-link" onclick="PR12.verRecursos(\'' + t.cod + '\')">' + n + '</button>' : '0') + '</td>' +
        '<td><button class="btn-link" onclick="PR12.editar(\'' + t.cod + '\')">Editar</button>' + (n || t.clase ? '' : ' <button class="btn-link" onclick="PR12.eliminar(\'' + t.cod + '\')">Eliminar</button>') + '</td></tr>';
    });
    return '<div class="screen-head"><h1>Tipos de recurso</h1><span class="code">PR-12</span><div class="spacer"></div><button class="btn btn-primary" onclick="PR12.editar(null)">+ Nuevo tipo</button></div>' +
      UI.tabla([['Código', '', '100px'], 'Nombre', 'Comportamiento', ['Recursos', 'num', '90px'], ['Acciones', '', '130px']], filas) +
      '<p class="hint">No se elimina un tipo que usa algún recurso. RECURSO HUMANO y SERVICIO DE TERCEROS no se renombran ni eliminan: las órdenes dependen de ellos (método Manual y operarios; compra del servicio y contraste con la OC o factura).</p>';
  },
  verRecursos(cod) { const T = M.tiposRecurso().find(t => t.cod === cod); PR11.tab = 'rec'; PR11.f = { q: '', tipo: T ? T.nom : '', est: '' }; App.go('pr11'); },
  editar(cod) {
    const T = cod ? M.tiposRecurso().find(t => t.cod === cod) : { cod: PR11.sigCod(M.tiposRecurso(), 'TRC-', 4), nom: '' };
    if (!T) return;
    UI.modal({
      titulo: cod ? 'Editar ' + T.cod : 'Nuevo tipo de recurso',
      cuerpo: '<div class="formgrid">' + UI.dato('Código', '<b>' + T.cod + '</b>' + (cod ? '' : ' <span class="mini">se asigna al guardar</span>')) +
        UI.campo('Nombre', '<input id="tr-nom" value="' + UI.esc(T.nom) + '"' + (T.clase ? ' readonly' : '') + '>', { req: true, hint: T.clase ? 'No se renombra: ' + PR12.CLASES[T.clase].toLowerCase() : (cod && PR12.usos(T.nom) ? 'Al renombrarlo se actualizan sus ' + PR12.usos(T.nom) + ' recurso(s)' : '') }) + '</div>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="PR12.guardar(' + (cod ? '\'' + cod + '\'' : 'null') + ')">Guardar</button>'
    });
  },
  /* sin cod crea el tipo; al renombrar se actualiza el tipo de sus recursos */
  guardarTipo(cod, nom) {
    const lista = Store.d.tiposRecurso, T = cod ? lista.find(t => t.cod === cod) : null;
    nom = String(nom || '').trim();
    if (cod && !T) throw new Error('No existe el tipo ' + cod);
    if (!nom) throw new Error('Indique el nombre del tipo de recurso');
    if (lista.some(t => t !== T && t.nom.trim().toLowerCase() === nom.toLowerCase())) throw new Error('Ya existe el tipo ' + nom);
    if (T) {
      if (T.nom === nom) return T;
      if (T.clase) throw new Error(T.nom + ' no se puede renombrar: ' + PR12.CLASES[T.clase].toLowerCase());
      Store.d.recursos.forEach(r => { if (r.tipo === T.nom) r.tipo = nom; });
      T.nom = nom;
      return T;
    }
    const t = { cod: PR11.sigCod(lista, 'TRC-', 4), nom };
    lista.push(t);
    return t;
  },
  eliminarTipo(cod) {
    const lista = Store.d.tiposRecurso, i = lista.findIndex(t => t.cod === cod), T = lista[i];
    if (!T) throw new Error('No existe el tipo ' + cod);
    if (T.clase) throw new Error(T.nom + ' no se puede eliminar: ' + PR12.CLASES[T.clase].toLowerCase());
    const n = PR12.usos(T.nom);
    if (n) throw new Error('No se puede eliminar ' + T.nom + ': lo usa(n) ' + n + ' recurso(s)');
    lista.splice(i, 1);
    return T;
  },
  guardar(cod) { if (App.accion(() => PR12.guardarTipo(cod, UI.v('tr-nom')), x => 'Tipo ' + x.cod + ' guardado')) { UI.cerrar(); App.refrescar(); } },
  eliminar(cod) {
    const T = M.tiposRecurso().find(t => t.cod === cod); if (!T) return;
    UI.confirmar('Eliminar ' + T.cod, '<p>Se elimina el tipo de recurso <b>' + UI.esc(T.nom) + '</b>.</p>', () => { if (App.accion(() => PR12.eliminarTipo(cod), 'Tipo eliminado')) App.refrescar(); }, 'Eliminar');
  }
};
App.pantalla('pr12', { titulo: 'Tipos de recurso', render: PR12.render });

const PR13 = {
  render() {
    const cfg = Store.d.cfg;
    return '<div class="screen-head"><h1>Configuración</h1><span class="code">PR-13</span></div>' +
      '<div class="card"><div class="formgrid">' +
      UI.campo('Nombre de la referencia', '<input id="cfg-ref" value="' + UI.esc(cfg.nombreRef) + '">', { hint: 'Cómo llaman al número que agrupa las órdenes: por ejemplo N° Referencia' }) +
      UI.campo('Almacén donde entra lo producido (por defecto)', '<select id="cfg-alm">' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), cfg.almRecibo) + '</select>', { hint: 'Si la lista de materiales no indica otro' }) +
      '</div><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="PR13.guardar()">Guardar</button></div>';
  },
  guardar() {
    const ref = UI.v('cfg-ref').trim();
    if (App.accion(() => { if (!ref) throw new Error('Indique el nombre'); Object.assign(Store.d.cfg, { nombreRef: ref, almRecibo: UI.v('cfg-alm') }); }, 'Configuración guardada')) { App.nav(); App.refrescar(); }
  }
};
App.pantalla('pr13', { titulo: 'Configuración', render: PR13.render });
