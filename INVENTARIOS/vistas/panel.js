/* INVENTARIOS · GI-00 Panel de Logística — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-00 · Panel de Logística -->
  <section class="screen" id="scr-gi00">
    <div class="screen-head">
      <h1>Panel de Logística</h1><span class="code">GI-00</span>
      <div class="spacer"></div>
      <span class="hint">Datos al 19/07/2026 · calculados de Existencias y Kardex</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">
      <div class="card" style="margin:0"><span class="hint">Valor total del inventario</span><div id="kpi-valor" style="font-size:24px;font-weight:700;color:var(--primario);margin-top:6px"></div><span class="hint" id="kpi-valor-sub"></span></div>
      <div class="card" style="margin:0"><span class="hint">Almacenes activos</span><div id="kpi-alm" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">con stock o movimientos</span></div>
      <div class="card" style="margin:0"><span class="hint">Artículos activos</span><div id="kpi-art" style="font-size:24px;font-weight:700;margin-top:6px"></div><span class="hint">inventariables en el maestro</span></div>
      <div class="card" style="margin:0"><span class="hint">Alertas de stock</span><div id="kpi-alertas" style="font-size:24px;font-weight:700;color:var(--cancelada);margin-top:6px"></div><span class="hint">bajo mínimo o en cero</span></div>
    </div>
    <div class="card" style="margin-top:16px">
      <b style="font-size:13px">Valor de stock por grupo de artículos</b>
      <p class="hint" style="margin-top:4px">Cuánto capital hay en materia prima, en producto terminado para venta y en proceso. El PPT se muestra solo en cantidades (sin valorizar) según la política definida.</p>
      <div id="chart-grupos" style="margin-top:16px"></div>
    </div>
    <div class="card">
      <b style="font-size:13px">Accesos del día</b>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-secondary" onclick="go('gi05')">Existencias</button>
        <button class="btn btn-secondary" onclick="go('gi07')">Movimientos</button>
        <button class="btn btn-secondary" onclick="go('gi13')">Solicitudes</button>
        <button class="btn btn-secondary" onclick="go('gi18')">Rotación de Artículos</button>
        <button class="btn btn-secondary" onclick="go('gi14')">Guías de Remisión Electrónicas</button>
      </div>
    </div>
  </section>
`);
