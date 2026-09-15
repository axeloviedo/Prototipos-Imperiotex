/* COMERCIAL V9 — utilidades de interfaz (sin dependencias). Base tomada de PRODUCCION para que ambos prototipos se vean igual. */
const UI = {
  /* Fecha fija "dd/mm/aaaa hh:mm" que usa la demo al armar su historia; en uso normal es null (hora local) */
  reloj: null,

  esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  r2(v) { return Math.round((Number(v) || 0) * 100) / 100; },
  r4(v) { return Math.round((Number(v) || 0) * 10000) / 10000; },
  n(v, d) { d = d == null ? 2 : d; return (Number(v) || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d }); },
  q(v, u) { const r = UI.r4(v); return UI.n(r, Number.isInteger(r) ? 0 : 2) + (u ? ' ' + u : ''); },
  s(v) { return 'S/ ' + UI.n(v, 2); },
  /* importe con el símbolo de su moneda */
  m(v, mon) { return (mon === 'USD' ? 'US$ ' : 'S/ ') + UI.n(v, 2); },
  pad(x) { return String(x).padStart(2, '0'); },

  ahora() {
    if (UI.reloj) return UI.reloj;
    const d = new Date();
    return UI.pad(d.getDate()) + '/' + UI.pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + UI.pad(d.getHours()) + ':' + UI.pad(d.getMinutes());
  },
  hoy() { return UI.ahora().slice(0, 10); },
  /* "dd/mm/aaaa" <-> valor de <input type="date"> */
  dIso(txt) { if (!txt) return ''; const f = txt.slice(0, 10).split('/'); return f[2] + '-' + f[1] + '-' + f[0]; },
  dTxt(iso) { if (!iso) return ''; const f = iso.split('-'); return f[2] + '/' + f[1] + '/' + f[0]; },
  aFecha(txt) {
    if (!txt) return null; const p = txt.split(' '); const f = p[0].split('/'); const h = (p[1] || '00:00').split(':');
    return new Date(+f[2], +f[1] - 1, +f[0], +h[0], +h[1]);
  },
  sumarDias(txt, dias, hora) {
    const d = UI.aFecha(txt); d.setDate(d.getDate() + dias);
    return UI.pad(d.getDate()) + '/' + UI.pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + (hora || txt.split(' ')[1] || '08:00');
  },
  dias(a, b) { const x = UI.aFecha(a), y = UI.aFecha(b || UI.ahora()); if (!x || !y) return 0; return Math.round((new Date(y.getFullYear(), y.getMonth(), y.getDate()) - new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000); },
  enRango(txt, desdeIso, hastaIso) {
    const f = UI.aFecha(txt.slice(0, 10));
    if (desdeIso && f < UI.aFecha(UI.dTxt(desdeIso))) return false;
    if (hastaIso && f > UI.aFecha(UI.dTxt(hastaIso))) return false;
    return true;
  },

  badge(t, color) { return '<span class="badge" style="background:' + color + '">' + UI.esc(t) + '</span>'; },
  COLORES: {
    'Vigente': 'var(--prp)', 'Convertida': 'var(--aprobada)', 'Vencida': 'var(--borrador)', 'Anulada': 'var(--cancelada)', 'Anulado': 'var(--cancelada)',
    'Registrada': 'var(--confirmado)', 'Pendiente': 'var(--pendiente)', 'Finalizada': 'var(--completada)',
    'Abierta': 'var(--aprobado-sol)', 'Cerrada': 'var(--borrador)',
    'Pagado': 'var(--completada)', 'Parcial': 'var(--parcial)', 'Pendiente de pago': 'var(--pendiente)', 'Por devolver': 'var(--rechazado-sol)',
    'Por validar': 'var(--pendiente)', 'Validado': 'var(--confirmado)', 'Procesado': 'var(--confirmado)',
    'Nuevo': 'var(--prp)', 'Activo': 'var(--confirmado)', 'Por recuperar': 'var(--parcial)', 'Sin compras': 'var(--borrador)', 'Inactivo': 'var(--borrador)'
  },
  estado(t) { return UI.badge(t, UI.COLORES[t] || 'var(--borrador)'); },
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
  aviso(html, tipo) { return '<div class="card aviso ' + (tipo || '') + '">' + html + '</div>'; },
  campo(lbl, control, o) {
    o = o || {};
    return '<div class="field' + (o.req ? ' req' : '') + (o.full ? ' full' : '') + '"' + (o.estilo ? ' style="' + o.estilo + '"' : '') + '><label>' + lbl + '</label>' + control + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
  },
  dato(lbl, html, o) { return UI.campo(lbl, '<div class="dato">' + (html === '' || html == null ? '—' : html) + '</div>', o); },

  toast(msg) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(UI._tt); UI._tt = setTimeout(() => t.classList.remove('show'), 4200);
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
  /* confirmación con motivo obligatorio (lista o texto libre) */
  motivo(titulo, html, opciones, accion, txtOk) {
    UI._accMot = accion;
    const ctrl = opciones ? '<select id="mot-v">' + UI.opts(opciones, '', 'Seleccionar…') + '</select>' : '<input id="mot-v" placeholder="Escriba el motivo">';
    UI.modal({ titulo, cuerpo: html + '<div class="formgrid" style="margin-top:10px">' + UI.campo('Motivo', ctrl, { req: true, full: true }) + '</div>', pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cancelar</button><button class="btn btn-danger" onclick="UI._accMot(UI.v(\'mot-v\'))">' + (txtOk || 'Confirmar') + '</button>' });
  },
  v(id) { const e = document.getElementById(id); return e ? e.value : ''; },
  f(id) { return parseFloat(UI.v(id)) || 0; },
  chk(id) { const e = document.getElementById(id); return !!(e && e.checked); },
  archivo(id) { const e = document.getElementById(id); return e && e.files && e.files[0] ? e.files[0].name : ''; },

  /* exportación a Excel como CSV (separador ;) */
  csv(nombre, heads, filas) {
    const cel = x => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"';
    const txt = '﻿' + [heads].concat(filas).map(f => f.map(cel).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = nombre + '-' + UI.dIso(UI.hoy()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast('Exportado ' + a.download + ' (' + filas.length + ' filas)');
  },
  /* vista imprimible (PDF desde el diálogo de impresión) */
  imprimir(titulo, html) {
    const w = window.open('', '_blank');
    if (!w) { UI.toast('El navegador bloqueó la ventana de impresión'); return; }
    w.document.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>' + UI.esc(titulo) + '</title><style>' +
      'body{font-family:"Segoe UI",Arial,sans-serif;font-size:12px;color:#1F2937;margin:28px}h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;margin:18px 0 6px}' +
      'table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#1F3A5F;color:#fff;text-align:left;padding:6px 8px;font-size:11px}td{padding:6px 8px;border-bottom:1px solid #E2E8F0}' +
      '.num{text-align:right}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}.mini{color:#64748B;font-size:11px}.tot td{font-weight:600}' +
      '.head{display:flex;justify-content:space-between;border-bottom:2px solid #1F3A5F;padding-bottom:10px;margin-bottom:14px}</style></head><body>' + html +
      '<script>window.onload=function(){window.print()}<\/script></body></html>');
    w.document.close();
  }
};
