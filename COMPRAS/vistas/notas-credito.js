/* COMPRAS · CO-12 Notas de Crédito — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-co12">
    <div class="screen-head">
      <h1>Notas de Crédito de Proveedor</h1><span class="code">CO-12</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaNC()">+ Registrar nota de crédito</button>
    </div>
    <div class="card" id="nc-favor" style="display:none;border-left:4px solid var(--primario-claro)"></div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (NC / proveedor / factura)</label><input id="f-nc-q" placeholder="Ej. NC-000001, LANDEO…" oninput="renderNC()"></div>
        <div class="field"><label>Motivo</label><select id="f-nc-m" onchange="renderNC()"><option value="">Todos</option><option value="07">07 · Devolución por ítem</option><option value="05">05 · Descuento por ítem</option><option value="09">09 · Disminución en el valor</option></select></div>
        <div class="field"><label>Estado</label><select id="f-nc-e" onchange="renderNC()"><option value="">Todos</option><option>Registrada</option><option>Anulada</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>N°</th><th>N° del proveedor</th><th>Fecha</th><th>Proveedor</th><th>Factura</th><th>Motivo</th><th>Reclamo</th><th style="text-align:right">Total</th><th>Se aplica a</th><th>Estado</th></tr></thead>
        <tbody id="nc-body"></tbody>
      </table>
      <div class="pager"><span id="nc-count"></span></div>
    </div>
    <p class="hint">Siempre contra una <b>factura</b> del mismo proveedor (como exige SUNAT) y sin superar su saldo. Si la factura está impaga, la nota <b>rebaja lo que se debe</b>; si ya se pagó, queda como <b>saldo a favor</b> del proveedor para descontarlo en el próximo pago (Tesorería). Motivos SUNAT: <b>07</b> devolución (desde un reclamo) · <b>05</b> descuento (baja el costo de lo que sigue en stock) · <b>09</b> disminución en el valor (servicio mal ejecutado o faltante). Concepto contable 12.</p>
  </section>

  <!-- CO-12f · Nota de crédito -->
  <section class="screen" id="scr-co12f">
    <div class="screen-head">
      <h1 id="nc-titulo">REGISTRAR NOTA DE CRÉDITO</h1><span class="code">CO-12</span>
      <span class="badge" id="nc-badge" style="background:var(--borrador)">Nueva</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('co12')">Volver</button>
      <button class="btn btn-danger" id="nc-b-anular" onclick="anularNC()">Anular</button>
      <button class="btn btn-primary" id="nc-b-guardar" onclick="guardarNC()">Registrar nota de crédito</button>
    </div>
    <div class="card" id="nc-aviso" style="display:none;border-left:4px solid var(--primario-claro)"></div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>ID (auto)</label><input id="nc-id" readonly></div>
        <div class="field"><label>Factura del proveedor <span style="color:var(--cancelada)">*</span></label><select id="nc-fac" onchange="ncElegirFactura(this.value)"></select></div>
        <div class="field"><label>N° de la nota del proveedor <span style="color:var(--cancelada)">*</span></label><input id="nc-ndoc" placeholder="Ej. NC01-000123"></div>
        <div class="field"><label>Fecha</label><input type="date" id="nc-fecha"></div>
        <div class="field"><label>Motivo SUNAT <span style="color:var(--cancelada)">*</span></label><select id="nc-motivo" onchange="NCF.motivo=this.value;renderNCForm()"></select></div>
        <div class="field"><label>Reclamo</label><input id="nc-rec" readonly></div>
        <div class="field full"><label>Observaciones</label><input id="nc-obs"></div>
      </div>
    </div>
    <div class="card">
      <b style="font-size:13px">Líneas</b> <span class="hint">precio sin IGV, en la moneda de la factura</span>
      <table class="grid subtable" style="margin-top:10px">
        <thead><tr><th>Código</th><th>Artículo / servicio</th><th style="text-align:right">Facturado</th><th style="width:120px;text-align:right">Cantidad</th><th style="width:120px;text-align:right">Precio</th><th style="text-align:right">IGV %</th><th style="text-align:right">Total</th></tr></thead>
        <tbody id="nc-items"></tbody>
        <tfoot id="nc-foot"></tfoot>
      </table>
    </div>
  </section>
`);
