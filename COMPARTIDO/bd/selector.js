/* COMPARTIDO · control de datos del prototipo para la barra superior de cada módulo:
   muestra el escenario activo y permite reiniciar TODO el prototipo con «Solo maestros» o «Con operación».
   Uso: BDSelector.montar(elementoContenedor) después de BD.iniciar(). Al reiniciar recarga la página. */
const BDSelector = {
  montar(cont) {
    if (!cont) return;
    const esc = BD.escenario();
    const div = document.createElement('div');
    div.className = 'bd-selector';
    div.title = 'Datos compartidos por Inventarios, Compras, Producción y Comercial';
    div.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--texto-sec,#64748B)';
    div.innerHTML = '<label for="bd-esc">Datos:</label>' +
      '<select id="bd-esc" style="border:1px solid var(--borde,#E2E8F0);border-radius:6px;padding:5px 8px;font-size:12.5px;background:#fff;font-weight:600">' +
      Object.keys(BD.ESCENARIOS).map(k => '<option value="' + k + '"' + (k === esc ? ' selected' : '') + '>' + BD.ESCENARIOS[k] + '</option>').join('') + '</select>' +
      '<button type="button" id="bd-reiniciar" style="border:1px solid var(--borde,#E2E8F0);background:#fff;border-radius:6px;padding:5px 9px;cursor:pointer;font-size:12.5px" title="Vuelve todos los módulos a los datos iniciales del escenario">↺ Reiniciar</button>';
    cont.appendChild(div);
    const sel = div.querySelector('#bd-esc');
    const pedir = e => {
      const texto = 'Se reinicia TODO el prototipo (Inventarios, Compras, Producción y Comercial) con «' + BD.ESCENARIOS[e] + '».\nSe pierde todo lo registrado. ¿Continuar?';
      if (!confirm(texto)) { sel.value = BD.escenario(); return; }
      BD.reiniciar(e);
      location.reload();
    };
    sel.onchange = () => pedir(sel.value);
    div.querySelector('#bd-reiniciar').onclick = () => pedir(sel.value);
  }
};
