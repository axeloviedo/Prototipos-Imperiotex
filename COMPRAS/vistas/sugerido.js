/* COMPRAS · CO-15 Sugerido de Compras — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-15 · Sugerido de Compras -->
  <section class="screen" id="scr-co15">
    <div class="screen-head">
      <h1>Sugerido de Compras</h1><span class="code">CO-15</span><span class="badge" style="background:var(--pendiente)" title="Pantalla fuera del alcance de la base compartida (docs/16 §5): usa datos propios de ejemplo">Datos de ejemplo · no conectado a la base</span>
      <div class="spacer"></div>
      <span class="hint">Artículos inventariables comprados · datos al 19/07/2026</span>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>Buscar artículo</label><input id="f-sug-q" placeholder="Código o nombre…" oninput="renderSugerido()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-sug-g" onchange="renderSugerido()"><option value="">Todos</option></select></div>
        <div class="field"><label>Categoría</label><select id="f-sug-sg" onchange="renderSugerido()"><option value="">Todas</option></select></div>
        <div class="field"><label>Consumo promedio de</label><select id="f-sug-m" onchange="renderSugerido()"><option value="3" selected>Últimos 3 meses</option><option value="6">Últimos 6 meses</option><option value="9">Últimos 9 meses</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid subtable">
        <thead><tr>
          <th style="width:36px">#</th><th>Código</th><th>Artículo</th><th>Unidad</th>
          <th style="text-align:right">Consumo prom. mensual</th>
          <th style="text-align:right">Plan (SF)</th>
          <th style="width:90px;text-align:right">Holgura %</th>
          <th style="text-align:right">Necesidad</th>
          <th style="text-align:right">Disponible</th>
          <th style="text-align:right">En camino</th>
          <th style="text-align:right">Sugerido</th>
          <th style="width:160px"></th>
        </tr></thead>
        <tbody id="co15-body"></tbody>
      </table>
      <div class="pager"><span id="co15-count"></span></div>
    </div>
    <div class="card">
      <b style="font-size:13px">¿Cómo se calcula? Solo con información que ya existe en el sistema</b>
      <p class="hint" style="margin-top:6px">El consumo promedio mensual son las salidas del Kardex de la ventana elegida (3, 6 o 9 meses), divididas entre los meses <span class="warn" title="En el prototipo los consumos son referenciales: simulan lo que el Kardex acumulará en producción">⚠</span>. Necesidad = mayor entre consumo × (1 + holgura) y el plan de producción aprobado (GP). Sugerido = Necesidad − Disponible (Existencias) − En camino (OCs abiertas). Si da negativo: No comprar. Pase el mouse sobre cualquier Sugerido para ver su cuenta completa con los números de esa fila. "Generar Solicitud" crea una Solicitud de Materiales con propósito Compras (GI-13) que sigue el circuito normal de aprobación y Orden de Compra: el sistema sugiere con datos, la persona decide. Ventana y holgura por defecto (15%) a confirmar con Gerencia <span class="warn" title="Parámetros a validar con David">⚠</span>.</p>
    </div>
  </section>
`);
