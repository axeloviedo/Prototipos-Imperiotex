/* INVENTARIOS · GI-05 Existencias (stock único de la base: Actual, Comprometido, Disponible por almacén y artículo) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-05 · Existencias -->
  <section class="screen" id="scr-gi05">
    <div class="screen-head">
      <h1>Inventario - Existencias</h1><span class="code">GI-05</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="exportStockCSV()">⇩ Exportar Excel (CSV)</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Artículo</label><input id="f-stk-q" placeholder="Código o nombre…" oninput="renderStock()"></div>
        <div class="field"><label>Almacén</label><select id="f-stk-a" onchange="renderStock()"></select></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-stk-g" onchange="fillStockCat();renderStock()"><option value="">Todos</option></select></div>
        <div class="field"><label>Categoría</label><select id="f-stk-sg" onchange="fillStockSub();renderStock()"><option value="">Todas</option></select></div>
        <div class="field"><label>Sub categoría</label><select id="f-stk-ssg" onchange="renderStock()"><option value="">Todas</option></select></div>
        <div class="field" style="min-width:340px"><label>Estado del stock (combine los que quiera ver)</label>
          <div style="display:flex;gap:16px;align-items:center;padding:7px 2px">
            <label class="dotled" style="cursor:pointer"><input type="checkbox" id="f-sem-cero" checked onchange="renderStock()"> <span class="dot" style="background:var(--stock-cero)"></span> Agotado</label>
            <label class="dotled" style="cursor:pointer"><input type="checkbox" id="f-sem-ok" checked onchange="renderStock()"> <span class="dot" style="background:var(--stock-ok)"></span> Normal</label>
            <label class="dotled" style="cursor:pointer"><input type="checkbox" id="f-sem-bajo" checked onchange="renderStock()"> <span class="dot" style="background:var(--stock-bajo)"></span> Por agotarse</label>
          </div></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid" id="tbl-stock">
        <thead><tr><th style="width:30px"></th><th>Almacén</th><th>Artículo</th><th>UM</th><th style="text-align:right">Stock Actual</th><th style="text-align:right">Stock Comprometido</th><th style="text-align:right">Stock Pedido <span class="warn" title="Órdenes de compra de bienes aprobadas pendientes de ingreso a este almacén. No entra en el disponible.">ⓘ</span></th><th style="text-align:right">Stock Disponible</th><th style="text-align:right">Costo prom. S/.</th><th style="text-align:right">Valorizado S/.</th><th style="width:70px"></th></tr></thead>
        <tbody id="stk-body"></tbody>
        <tfoot id="stk-foot"></tfoot>
      </table>
      <div class="pager"><span id="stk-count"></span></div>
    </div>
    <div class="card" style="display:flex;gap:22px;align-items:center;font-size:12.5px;flex-wrap:wrap">
      <b>Semáforo:</b>
      <span class="dotled"><span class="dot" style="background:var(--stock-ok)"></span> Normal (sobre el mínimo)</span>
      <span class="dotled"><span class="dot" style="background:var(--stock-bajo)"></span> Por agotarse (disponible ≤ mínimo del almacén, GI-02 Planificación)</span>
      <span class="dotled"><span class="dot" style="background:var(--stock-cero)"></span> Agotado (disponible ≤ 0)</span>
      <span class="hint">Disponible = Actual − Comprometido. El Comprometido lo dejan las Solicitudes de Fabricación aprobadas, las órdenes de fabricación y las ventas pendientes. El stock lo mueven solo los movimientos (GI-07) de todos los módulos.</span>
    </div>
  </section>
`);
