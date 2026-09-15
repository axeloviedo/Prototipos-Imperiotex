/* PRODUCCION · Producción — utilidades de interfaz (sin dependencias) */
const UI = {
  /* Fecha fija "dd/mm/aaaa hh:mm" que usa la demo al armar su historia; en uso normal es null (hora local) */
  reloj: null,

  esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  r2(v) { return Math.round((Number(v) || 0) * 100) / 100; },
  r4(v) { return Math.round((Number(v) || 0) * 10000) / 10000; },
  n(v, d) { d = d == null ? 2 : d; return (Number(v) || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d }); },
  /* cantidad con su unidad: enteros sin decimales */
  q(v, u) { const r = UI.r4(v); return UI.n(r, Number.isInteger(r) ? 0 : 2) + (u ? ' ' + u : ''); },
  s(v) { return 'S/ ' + UI.n(v, 2); },
  pad(x) { return String(x).padStart(2, '0'); },

  ahora() {
    if (UI.reloj) return UI.reloj;
    const d = new Date();
    return UI.pad(d.getDate()) + '/' + UI.pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + UI.pad(d.getHours()) + ':' + UI.pad(d.getMinutes());
  },
  hoy() { return UI.ahora().slice(0, 10); },
  /* "dd/mm/aaaa hh:mm" -> valor de <input type="datetime-local"> (hora local, no UTC) */
  dtLocal(txt) {
    const t = txt || UI.ahora(); const p = t.split(' '); const f = p[0].split('/');
    return f[2] + '-' + f[1] + '-' + f[0] + 'T' + (p[1] || '00:00');
  },
  dtTexto(v) {
    if (!v) return ''; const p = v.split('T'); const f = p[0].split('-');
    return f[2] + '/' + f[1] + '/' + f[0] + ' ' + (p[1] || '00:00').slice(0, 5);
  },
  aFecha(txt) {
    if (!txt) return null; const p = txt.split(' '); const f = p[0].split('/'); const h = (p[1] || '00:00').split(':');
    return new Date(+f[2], +f[1] - 1, +f[0], +h[0], +h[1]);
  },
  sumarDias(txt, dias, hora) {
    const d = UI.aFecha(txt); d.setDate(d.getDate() + dias);
    return UI.pad(d.getDate()) + '/' + UI.pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + (hora || txt.split(' ')[1] || '08:00');
  },
  horas(a, b) { const x = UI.aFecha(a), y = UI.aFecha(b); if (!x || !y) return 0; return UI.r2(Math.max(0, (y - x) / 3600000)); },
  dias(a, b) { const x = UI.aFecha(a), y = UI.aFecha(b || UI.ahora()); if (!x || !y) return 0; return Math.floor((y - x) / 86400000); },

  badge(t, color) { return '<span class="badge" style="background:' + color + '">' + UI.esc(t) + '</span>'; },
  estadoOF(e) {
    const c = { Planificado: 'var(--borrador)', Liberado: 'var(--prp)', Cerrado: 'var(--completada)', Cancelado: 'var(--cancelada)' }[e] || 'var(--borrador)';
    return UI.badge(e, c);
  },
  fase(nom) { return '<span class="chip" style="background:#F0F9FF;border-color:#BAE6FD;color:#075985;font-weight:600">' + UI.esc(nom) + '</span>'; },
  opts(lista, sel, vacio) {
    return (vacio != null ? '<option value="">' + UI.esc(vacio) + '</option>' : '') + lista.map(o => {
      const v = typeof o === 'object' ? o.v : o, t = typeof o === 'object' ? o.t : o;
      return '<option value="' + UI.esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + UI.esc(t) + '</option>';
    }).join('');
  },
  kpis(items) {
    return '<div class="kpis">' + items.map(k => '<div class="kpi" style="border-left-color:' + (k.color || 'var(--primario)') + '"><div class="l">' + UI.esc(k.l) + '</div><div class="v">' + k.v + '</div>' + (k.s ? '<div class="s">' + k.s + '</div>' : '') + '</div>').join('') + '</div>';
  },
  /* heads: ['Título', ['Título','num','90px'], ...]; filas: array de <tr>…</tr> */
  tabla(heads, filas, o) {
    o = o || {};
    const th = heads.map(h => { const x = Array.isArray(h) ? h : [h]; return '<th' + (x[1] ? ' class="' + x[1] + '"' : '') + (x[2] ? ' style="width:' + x[2] + '"' : '') + '>' + x[0] + '</th>'; }).join('');
    const body = filas.length ? filas.join('') : '<tr><td colspan="' + heads.length + '" style="text-align:center;color:var(--texto-sec);padding:18px">' + (o.vacio || 'Sin registros') + '</td></tr>';
    return '<div class="tbl-wrap"' + (o.estilo ? ' style="' + o.estilo + '"' : '') + '><table class="grid' + (o.sub ? ' subtable' : '') + (o.clase ? ' ' + o.clase : '') + '"><thead><tr>' + th + '</tr></thead><tbody' + (o.bodyId ? ' id="' + o.bodyId + '"' : '') + '>' + body + '</tbody>' + (o.foot ? '<tfoot>' + o.foot + '</tfoot>' : '') + '</table></div>';
  },
  vacio(cols, txt) { return '<tr><td colspan="' + cols + '" style="text-align:center;color:var(--texto-sec);padding:18px">' + txt + '</td></tr>'; },
  barra(v, tot) {
    const p = tot > 0 ? Math.min(100, Math.round(v / tot * 100)) : 0;
    return '<span class="bar"><span class="barfill" style="width:' + p + '%;background:' + (p >= 100 ? 'var(--confirmado)' : 'var(--prp)') + '"></span></span> <span class="mini">' + p + '%</span>';
  },
  aviso(html, tipo) { return '<div class="card aviso ' + (tipo || '') + '">' + html + '</div>'; },
  campo(lbl, control, o) {
    o = o || {};
    return '<div class="field' + (o.req ? ' req' : '') + (o.full ? ' full' : '') + '"' + (o.estilo ? ' style="' + o.estilo + '"' : '') + '><label>' + lbl + '</label>' + control + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
  },
  dato(lbl, html, o) { return UI.campo(lbl, '<div class="dato">' + (html === '' || html == null ? '—' : html) + '</div>', o); },

  toast(msg) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(UI._tt); UI._tt = setTimeout(() => t.classList.remove('show'), 3600);
  },
  modal(o) {
    document.getElementById('modales').innerHTML =
      '<div class="overlay open"><div class="modal' + (o.lg ? ' lg' : '') + '"' + (o.ancho ? ' style="width:min(' + o.ancho + ',95vw)"' : '') + '>' +
      '<div class="modal-h"><b>' + o.titulo + '</b><span class="x" onclick="UI.cerrar()">&#10005;</span></div>' +
      '<div class="modal-b">' + o.cuerpo + '</div>' +
      '<div class="modal-f">' + (o.pie || '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>') + '</div></div></div>';
  },
  cerrar() { document.getElementById('modales').innerHTML = ''; },
  confirmar(titulo, html, accion, txtOk) {
    UI._acc = accion;
    UI.modal({ titulo, cuerpo: html, pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-primary" onclick="const f=UI._acc;UI.cerrar();f()">' + (txtOk || 'Confirmar') + '</button>' });
  },
  v(id) { const e = document.getElementById(id); return e ? e.value : ''; },
  f(id) { return parseFloat(UI.v(id)) || 0; },
  chk(id) { const e = document.getElementById(id); return !!(e && e.checked); }
};
