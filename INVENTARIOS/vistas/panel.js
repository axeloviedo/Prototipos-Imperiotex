/* INVENTARIOS · GI-00 Panel de Logística — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-00 · Panel de Logística -->
  <section class="screen" id="scr-gi00">
    <div class="screen-head">
      <h1>Panel de Logística</h1><span class="code">GI-00</span>
      <div class="spacer"></div>
      <span class="hint" id="kpi-fecha"></span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">
      <div class="card" style="margin:0"><span class="hint">Valor total del inventario</span><div id="kpi-valor" style="font-size:24px;font-weight:700;color:var(--primario);margin-top:6px"></div><span class="hint">promedio ponderado vigente · almacenes valorizados</span></div>
      <div class="card" style="margin:0"><span class="hint">Almacenes con stock</span><div id="kpi-alm" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint" id="kpi-alm-sub"></span></div>
      <div class="card" style="margin:0"><span class="hint">Artículos activos</span><div id="kpi-art" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">inventariables en el maestro</span></div>
      <div class="card" style="margin:0;cursor:pointer" onclick="go('gi05')"><span class="hint">Alertas de stock</span><div id="kpi-alertas" style="font-size:24px;font-weight:700;color:var(--cancelada);margin-top:6px"></div><span class="hint">con mínimo definido: por agotarse o agotado</span></div>
    </div>
    <div class="gp2col" style="margin-top:16px">
      <div>
        <div class="card">
          <b style="font-size:13px">Valor de stock por grupo de artículos</b>
          <p class="hint" style="margin-top:4px">Capital en materia prima, producto terminado y mercadería. El producto en proceso se muestra en cantidades (almacenes sin Kardex valorizado).</p>
          <div id="chart-grupos" style="margin-top:16px"></div>
        </div>
        <div class="card">
          <b style="font-size:13px">Últimos movimientos</b>
          <table class="grid subtable" style="margin-top:10px"><thead><tr><th>ID</th><th>Tipo</th><th>Detalle</th><th>Origen → Destino</th><th>Fecha</th><th>Módulo</th></tr></thead><tbody id="dash-movs"></tbody></table>
        </div>
      </div>
      <div>
        <div class="card">
          <b style="font-size:13px">Pendientes de Logística</b>
          <div id="dash-pend" style="margin-top:10px;font-size:13px"></div>
        </div>
        <div class="card">
          <b style="font-size:13px">Accesos del día</b>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button class="btn btn-secondary btn-sm" onclick="go('gi05')">Existencias</button>
            <button class="btn btn-secondary btn-sm" onclick="go('gi07')">Movimientos</button>
            <button class="btn btn-secondary btn-sm" onclick="go('gi21')">Solicitudes de Fabricación</button>
            <button class="btn btn-secondary btn-sm" onclick="go('gi13')">Solicitudes de Materiales</button>
            <button class="btn btn-secondary btn-sm" onclick="go('gi14')">Guías de Remisión</button>
          </div>
        </div>
      </div>
    </div>
  </section>
`);
