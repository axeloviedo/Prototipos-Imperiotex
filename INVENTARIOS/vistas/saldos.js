/* INVENTARIOS · GI-20 Saldos por almacén y fecha — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-20 · Saldos por almacén y fecha -->
  <section class="screen" id="scr-gi20">
    <div class="screen-head">
      <h1>Saldos por Fecha</h1><span class="code">GI-20</span>
      <div class="spacer"></div>
      
    </div>
    <p class="hint" style="margin:0 0 14px">Foto del inventario a una fecha de corte, por almacén y artículo. Es la tabla de saldos que pide el cierre contable: para recostear un periodo hay que poder responder cuánto había el último día del mes. El saldo no se guarda día a día — se reconstruye a partir de los movimientos de ingreso y de salida hasta la fecha elegida.</p>
    <div class="card">
      <div class="filters">
        <div class="field req"><label>Fecha de corte</label><input type="date" id="f-sal-f" onchange="renderSaldos()"></div>
        <div class="field"><label>Almacén</label><select id="f-sal-alm" onchange="renderSaldos()"><option value="">Todos</option></select></div>
        <div class="field"><label>Artículo</label><input id="f-sal-q" placeholder="Código o nombre…" oninput="renderSaldos()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-sal-g" onchange="renderSaldos()"><option value="">Todos</option></select></div>
        <div class="field"><div class="check" style="margin-top:22px"><input type="checkbox" id="f-sal-cero" onchange="renderSaldos()"> Mostrar artículos con saldo cero</div></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Almacén</th><th>Código</th><th>Artículo</th><th>Unidad</th>
          <th style="text-align:right">Saldo a la fecha</th>
          <th style="text-align:right">Comprometido</th>
          <th style="text-align:right">Disponible</th>
          <th style="text-align:right">Costo unitario</th>
          <th style="text-align:right">Valorizado S/.</th></tr></thead>
        <tbody id="sal-body"></tbody>
        <tfoot id="sal-foot"></tfoot>
      </table>
      <div class="pager"><span id="sal-count"></span></div>
    </div>
    <p class="hint">El saldo y el costo unitario (promedio ponderado) se reconstruyen con los movimientos de la base hasta el cierre de la fecha de corte. Comprometido y Disponible solo se muestran para la fecha de hoy (el comprometido no tiene historia). Los almacenes sin Kardex valorizado muestran solo cantidades.</p>
  </section>
`);
