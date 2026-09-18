/* COMPRAS · CO-15 Sugerido de Compras — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-15 · Sugerido de Compras -->
  <section class="screen" id="scr-co15">
    <div class="screen-head">
      <h1>Sugerido de Compras</h1><span class="code">CO-15</span>
      <div class="spacer"></div>
      <span class="hint">Calculado al momento con el stock, las órdenes y las OC de la base</span>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>Buscar artículo</label><input id="f-sug-q" placeholder="Código o nombre…" oninput="renderSugerido()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-sug-g" onchange="renderSugerido()"><option value="">Todos</option></select></div>
        <div class="field"><label>Proveedor por defecto</label><select id="f-sug-p" onchange="renderSugerido()"><option value="">Todos</option></select></div>
        <div class="field" style="display:flex;align-items:flex-end"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12.5px;color:var(--texto)"><input type="checkbox" id="f-sug-solo" checked onchange="renderSugerido()" style="width:auto"> Solo lo que hay que comprar</label></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid subtable">
        <thead><tr>
          <th>Código</th><th>Artículo</th><th>Unidad</th>
          <th style="text-align:right" title="Stock mínimo del artículo (GI-02 · Planificación)">Stock mínimo</th>
          <th style="text-align:right" title="Lo que les falta consumir a las órdenes abiertas y todavía no se pidió con una Solicitud de Materiales">Órdenes sin solicitud</th>
          <th style="text-align:right" title="Actual − Comprometido en todos los almacenes (ya descuenta lo que comprometieron las SF aprobadas)">Disponible</th>
          <th style="text-align:right" title="OC aprobadas pendientes de recibir">Pedido</th>
          <th style="text-align:right">Sugerido</th>
          <th style="width:130px;text-align:right">Comprar</th>
        </tr></thead>
        <tbody id="co15-body"></tbody>
      </table>
      <div class="pager"><span id="co15-count"></span></div>
    </div>
    <div class="card">
      <b style="font-size:13px">¿Cómo se calcula?</b>
      <p class="hint" style="margin-top:6px"><b>Sugerido = Stock mínimo + Órdenes sin solicitud − Disponible − Pedido</b> (si sale negativo, no se compra). Una Solicitud de Fabricación aprobada ya comprometió su materia prima: si no alcanza, el Disponible queda negativo y ese déficit entra solo. De las órdenes abiertas se cuenta lo que les falta consumir, salvo lo que ya tiene una Solicitud de Materiales (para no pedirlo dos veces). Se agrupa por el proveedor por defecto del artículo: <b>Crear OC</b> genera una orden de compra en Borrador con las cantidades de la columna «Comprar», que se pueden cambiar. El sistema sugiere; la persona decide.</p>
    </div>
  </section>
`);
