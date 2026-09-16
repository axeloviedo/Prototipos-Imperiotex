/* INVENTARIOS · GI-06 Kardex (dinámico desde Stock.kardex) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-06 · Kardex -->
  <section class="screen" id="scr-gi06">
    <div class="screen-head">
      <h1>Kardex</h1><span class="code">GI-06</span>
      <div class="spacer"></div>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Artículo</label><select id="f-kdx-art" onchange="renderKardex()"></select></div>
        <div class="field"><label>Almacén</label><select id="f-kdx-alm" onchange="renderKardex()"></select></div>
        <div class="field"><label>Grupo de movimiento</label><select id="f-kdx-g" onchange="fillKdxTipos();renderKardex()"></select></div>
        <div class="field"><label>Tipo de movimiento</label><select id="f-kdx-t" onchange="renderKardex()"></select></div>
        <div class="field"><label>Desde</label><input type="date" id="f-kdx-d" onchange="renderKardex()"></div>
        <div class="field"><label>Hasta</label><input type="date" id="f-kdx-h" onchange="renderKardex()"></div>
      </div>
    </div>
    <div id="kdx-tablas"></div>
    <p class="hint">Solo artículos inventariables. Una tabla por artículo y almacén con todos los movimientos de la base (Inventarios, Compras, Producción y Comercial). El costo promedio ponderado se recalcula con los ingresos; las salidas y transferencias salen al costo vigente. Los almacenes sin Kardex valorizado (p. ej. SB-ZARATE-PP, SB-TRANSITO) muestran solo cantidades. Los filtros de fecha y tipo ocultan filas pero la columna Existencias es el saldo real después de cada movimiento.</p>
  </section>
`);
