/* COMPRAS · CO-00 Panel de Compras — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-00 · Panel de Compras -->
  <section class="screen" id="scr-co00">
    <div class="screen-head">
      <h1>Panel de Compras</h1><span class="code">CO-00</span>
      <div class="spacer"></div>
      <div class="field" style="min-width:110px"><label>Año</label>
        <select id="cpk-anio" onchange="renderPanelCompras()"><option>2025</option><option selected>2026</option></select></div>
      <div class="field" style="min-width:150px"><label>Mes</label>
        <select id="cpk-mes" onchange="renderPanelCompras()"><option value="">Todos los meses</option><option value="01">Enero</option><option value="02">Febrero</option><option value="03">Marzo</option><option value="04">Abril</option><option value="05">Mayo</option><option value="06">Junio</option><option value="07" selected>Julio</option><option value="08">Agosto</option><option value="09">Setiembre</option><option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option></select></div>
      <div class="field" style="min-width:150px"><label>Moneda</label>
        <select id="cpk-mon" onchange="renderPanelCompras()"><option value="S/." selected>Soles (S/.)</option><option value="USD">Dólares (USD)</option></select></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">
      <div class="card" style="margin:0"><span class="hint">Órdenes de compra del período</span><div id="cpk-count" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">julio 2026 · sin borradores ni canceladas</span></div>
      <div class="card" style="margin:0"><span class="hint">Monto total comprado</span><div id="cpk-total" style="font-size:24px;font-weight:700;color:var(--primario);margin-top:6px"></div><span class="hint">USD convertidos al TC de cada OC</span></div>
      <div class="card" style="margin:0"><span class="hint">Valor promedio por orden</span><div id="cpk-prom" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">monto del período / órdenes del período</span></div>
      <div class="card" style="margin:0"><span class="hint">Por recibir o pagar</span><div id="cpk-pend" style="font-size:24px;font-weight:700;color:var(--pendiente);margin-top:6px"></div><span class="hint">OCs abiertas de cualquier fecha</span></div>
    </div>
    <div class="card" style="margin-top:16px">
      <b style="font-size:13px" id="cpk-top-titulo">¿Qué se compra más?</b>
      <p class="hint" style="margin-top:4px" id="cpk-top-sub">Artículos con mayor monto comprado en el período elegido, calculados de las Órdenes de Compra (sin borradores ni canceladas).</p>
      <div id="cpk-top" style="margin-top:14px"></div>
    </div>
    <div class="card" style="margin-top:16px">
      <b style="font-size:13px" id="cpk-chart-titulo">Tendencia de compras por mes (S/.)</b>
      <p class="hint" style="margin-top:4px">Valor comprado por mes del 2026. Julio se calcula en vivo de las órdenes registradas; los meses anteriores son referenciales del prototipo <span class="warn" title="Histórico de ejemplo: en producción sale del acumulado real">⚠</span>.</p>
      <div id="cpk-chart" style="display:flex;align-items:flex-end;gap:14px;height:190px;margin-top:18px;padding:0 6px"></div>
    </div>
    <div class="card">
      <b style="font-size:13px">Accesos del día</b>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-secondary" onclick="go('co06')">Órdenes de Compra</button>
        <button class="btn btn-secondary" onclick="go('co09')">Facturas del Proveedor</button>
        <button class="btn btn-secondary" onclick="go('co11')">Reclamos</button>
        <button class="btn btn-secondary" onclick="go('co01')">Proveedores</button>
      </div>
    </div>
  </section>
`);
