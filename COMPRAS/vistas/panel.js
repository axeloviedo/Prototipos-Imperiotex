/* COMPRAS · CO-00 Panel de Compras — HTML (indicadores calculados de la base compartida) */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-00 · Panel de Compras -->
  <section class="screen" id="scr-co00">
    <div class="screen-head">
      <h1>Panel de Compras</h1><span class="code">CO-00</span>
      <div class="spacer"></div>
      <div class="field" style="min-width:110px"><label>Año</label>
        <select id="cpk-anio" onchange="renderPanelCompras()"></select></div>
      <div class="field" style="min-width:150px"><label>Mes</label>
        <select id="cpk-mes" onchange="renderPanelCompras()"><option value="">Todos los meses</option><option value="01">Enero</option><option value="02">Febrero</option><option value="03">Marzo</option><option value="04">Abril</option><option value="05">Mayo</option><option value="06">Junio</option><option value="07">Julio</option><option value="08">Agosto</option><option value="09">Setiembre</option><option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option></select></div>
      <div class="field" style="min-width:150px"><label>Moneda</label>
        <select id="cpk-mon" onchange="renderPanelCompras()"><option value="S/." selected>Soles (S/.)</option><option value="USD">Dólares (USD)</option></select></div>
    </div>

    <b style="font-size:13px;display:block;margin:4px 0 10px">Pendientes de hoy <span class="hint" style="font-weight:400">· de cualquier fecha, clic para ir a la bandeja</span></b>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px">
      <div class="card clickable" style="margin:0;cursor:pointer" onclick="go('gi13')" title="Líneas de Solicitudes de Materiales aprobadas con propósito Compra que aún no tienen OC"><span class="hint">Líneas de compra sin OC</span><div id="cpk-sol" style="font-size:24px;font-weight:700;color:var(--pendiente);margin-top:6px">0</div><span class="hint" id="cpk-sol-sub">solicitudes de materiales aprobadas</span></div>
      <div class="card clickable" style="margin:0;cursor:pointer" onclick="cpkIr('Pendiente de Validar')"><span class="hint">OC por validar</span><div id="cpk-val" style="font-size:24px;font-weight:700;color:var(--pendiente);margin-top:6px">0</div><span class="hint" id="cpk-val-sub">V°B° Logística o aprobación Gerencia</span></div>
      <div class="card clickable" style="margin:0;cursor:pointer" onclick="cpkIr('*rec')"><span class="hint">OC por recibir</span><div id="cpk-rec" style="font-size:24px;font-weight:700;color:var(--oc-recibir);margin-top:6px">0</div><span class="hint" id="cpk-rec-sub">ingreso o conformidad pendiente</span></div>
      <div class="card clickable" style="margin:0;cursor:pointer" onclick="cpkIr('*fac')"><span class="hint">OC por facturar</span><div id="cpk-fac" style="font-size:24px;font-weight:700;color:var(--oc-pagar);margin-top:6px">0</div><span class="hint">aprobadas con cantidades sin factura</span></div>
      <div class="card clickable" style="margin:0;cursor:pointer" onclick="cpkIrFac()"><span class="hint">Facturas impagas</span><div id="cpk-imp" style="font-size:24px;font-weight:700;color:var(--impagado);margin-top:6px">0</div><span class="hint" id="cpk-imp-sub">S/. 0.00</span></div>
    </div>

    <b style="font-size:13px;display:block;margin:18px 0 10px">Compras del período</b>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">
      <div class="card" style="margin:0"><span class="hint">Órdenes de compra del período</span><div id="cpk-count" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint" id="cpk-count-sub"></span></div>
      <div class="card" style="margin:0"><span class="hint">Monto total comprado</span><div id="cpk-total" style="font-size:24px;font-weight:700;color:var(--primario);margin-top:6px"></div><span class="hint" id="cpk-total-sub"></span></div>
      <div class="card" style="margin:0"><span class="hint">Valor promedio por orden</span><div id="cpk-prom" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">monto del período / órdenes del período</span></div>
      <div class="card" style="margin:0"><span class="hint">Bienes / servicios</span><div id="cpk-tipos" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">órdenes del período con bienes / con servicios (una OC puede tener ambos)</span></div>
    </div>
    <div class="card" style="margin-top:16px">
      <b style="font-size:13px" id="cpk-top-titulo">¿Qué se compra más?</b>
      <p class="hint" style="margin-top:4px" id="cpk-top-sub">Artículos con mayor monto comprado en el período, calculados de las Órdenes de Compra (sin borradores ni canceladas).</p>
      <div id="cpk-top" style="margin-top:14px"></div>
    </div>
    <div class="card" style="margin-top:16px">
      <b style="font-size:13px" id="cpk-chart-titulo">Tendencia de compras por mes (S/.)</b>
      <p class="hint" style="margin-top:4px">Valor de las órdenes de compra por mes del año elegido (fecha de la OC, sin borradores ni canceladas).</p>
      <div id="cpk-chart" style="display:flex;align-items:flex-end;gap:14px;height:190px;margin-top:18px;padding:0 6px"></div>
    </div>
    <div class="card">
      <b style="font-size:13px">Accesos del día</b>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-secondary" onclick="go('co06')">Órdenes de Compra</button>
        <button class="btn btn-secondary" onclick="go('co09')">Facturas del Proveedor</button>
        <button class="btn btn-secondary" onclick="go('gi13')">Solicitudes de Materiales</button>
        <button class="btn btn-secondary" onclick="go('co01')">Proveedores</button>
      </div>
    </div>
  </section>
`);
