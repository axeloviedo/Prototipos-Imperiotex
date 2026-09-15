/* COMERCIAL V9 · CM-11 Solicitudes de Pedido y CM-12 Solicitudes de Materiales.
   No se duplican: son las mismas pantallas GP-01 y GI-13 de Logística (Prototipo_GP.html) abiertas en vista compartida
   (?vista=comercial). Los datos viven en localStorage 'imperiotex.v9.solicitudes', así Logística y Comercial trabajan
   sobre las mismas solicitudes. Producción solo ve las Solicitudes de Pedido aprobadas (PR-03). */
const Compartida = {
  src(hash) {
    const u = Store.usuario();
    return '../Prototipo_GP.html?vista=comercial&usuario=' + encodeURIComponent(u.cod + ' · ' + u.nom + ' (Comercial)') + '#' + hash;
  },
  render(hash, nota) {
    return '<p class="hint" style="margin:0 0 8px">' + nota + '</p>' +
      '<iframe id="gp-compartida" title="Pantalla compartida con Logística" src="' + UI.esc(Compartida.src(hash)) + '"' +
      ' style="display:block;width:100%;height:calc(100vh - 140px);min-height:520px;border:1px solid var(--borde);border-radius:8px;background:#fff"></iframe>';
  }
};

/* la vista embebida avisa en qué pantalla está para actualizar la miga */
window.addEventListener('message', e => {
  const f = document.getElementById('gp-compartida');
  if (!f || e.source !== f.contentWindow || !e.data || e.data.tipo !== 'gp-miga') return;
  document.getElementById('breadcrumb').innerHTML = 'Comercial / ' + e.data.html;
});

App.pantalla('cm11', {
  titulo: 'Solicitudes de Pedido', permiso: 'ver_solicitud_pedido',
  render: () => Compartida.render('gp01', 'Misma pantalla que usa Logística (GP-01): Comercial y Logística crean, editan, envían y aprueban las mismas Solicitudes de Pedido. Producción solo recibe las aprobadas (PR-03).')
});
App.pantalla('cm12', {
  titulo: 'Solicitudes de Materiales', permiso: 'crear_solicitud_materiales',
  render: () => Compartida.render('gi13', 'Misma pantalla que usa Logística (GI-13): Comercial crea la solicitud indicando qué necesita y a dónde (por ejemplo, reposición de tienda). Logística la aprueba y define por línea si es Compra o Transferencia.')
});
