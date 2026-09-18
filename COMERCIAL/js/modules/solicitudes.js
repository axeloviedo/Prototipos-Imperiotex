/* COMERCIAL V9 · CL-30 Solicitudes de Fabricación y CL-31 Solicitudes de Materiales (menú Abastecimiento).
   No se duplican: son las mismas pantallas de Inventarios (INVENTARIOS/index.html) abiertas en vista compartida
   (?vista=comercial): GI-21 listado, GI-22 formulario y GI-23 ficha de la Solicitud de Fabricación (documentos SF-000001)
   y GI-13 Solicitudes de Materiales. Los datos viven en la base compartida (BD.d.sfs y BD.d.sols, clave 'imperiotex.bd'), así Logística y Comercial
   trabajan sobre las mismas solicitudes. Producción solo ve las Solicitudes de Fabricación aprobadas (PR-03). */
const Compartida = {
  src(hash) {
    const u = Store.usuario();
    return '../INVENTARIOS/index.html?vista=comercial&usuario=' + encodeURIComponent(u.cod + ' · ' + u.nom + ' (Comercial)') + '#' + hash;
  },
  render(titulo, code, hash, nota) {
    return '<div class="screen-head"><h1>' + titulo + '</h1><span class="code">' + code + '</span></div>' +
      '<p class="hint" style="margin:0 0 8px">' + nota + '</p>' +
      '<iframe id="gp-compartida" title="Pantalla compartida con Inventarios" src="' + UI.esc(Compartida.src(hash)) + '"' +
      ' style="display:block;width:100%;height:calc(100vh - 170px);min-height:520px;border:1px solid var(--borde);border-radius:8px;background:#fff"></iframe>';
  }
};

/* la vista embebida avisa en qué pantalla está para actualizar la miga */
window.addEventListener('message', e => {
  const f = document.getElementById('gp-compartida');
  if (!f || e.source !== f.contentWindow || !e.data) return;
  /* clic en una Solicitud de Transferencia dentro de la vista compartida: se abre en Recepción de mercadería (CL-47) */
  if (e.data.tipo === 'gp-abrir-st') { App.go('cm13', { id: e.data.id }); return; }
  if (e.data.tipo !== 'gp-miga') return;
  document.getElementById('breadcrumb').innerHTML = 'Comercial / ' + e.data.html;
});

App.pantalla('cm11', {
  titulo: 'Solicitudes de Fabricación', permiso: 'ver_solicitud_fabricacion',
  render: () => Compartida.render('Solicitudes de Fabricación', 'CL-30', 'gi21', 'Misma pantalla que usa Inventarios (GI-21 listado, GI-22 formulario y GI-23 ficha): Comercial y Logística crean, editan, envían y aprueban las mismas Solicitudes de Fabricación (SF-000001, SF-000002…). Producción solo recibe las aprobadas (PR-03).')
});
App.pantalla('cm12', {
  titulo: 'Solicitudes de Materiales', permiso: 'crear_solicitud_materiales',
  render: () => Compartida.render('Solicitudes de Materiales', 'CL-31', 'gi13', 'Misma pantalla que usa Inventarios (GI-13): Comercial crea la solicitud indicando qué necesita y a dónde (por ejemplo, reposición de tienda). Logística la aprueba y define por línea si es Compra o Transferencia.')
});
