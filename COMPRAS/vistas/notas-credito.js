/* COMPRAS · CO-12 Notas de Crédito — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-co12">
    <div class="screen-head">
      <h1>Notas de Crédito de Proveedor</h1><span class="code">CO-12</span><span class="badge" style="background:var(--pendiente)" title="Pantalla fuera del alcance de la base compartida (docs/16 §5): usa datos propios de ejemplo">Datos de ejemplo · no conectado a la base</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaNC()">+ Registrar NC</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (NC / proveedor / OC)</label><input id="f-nc-q" placeholder="Ej. NC-000009, AVÍOS…" oninput="renderNC()"></div>
        <div class="field"><label>Estado</label><select id="f-nc-e" onchange="renderNC()"><option value="">Todos</option><option>Pendiente</option><option>Aplicada</option></select></div>
        <div class="field"><label>Proveedor</label><select id="f-nc-p" onchange="renderNC()"><option value="">Todos</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>N° de NC</th><th>Proveedor</th><th>OC vinculada</th><th>Reclamo origen</th><th style="text-align:right">Monto</th><th>Moneda</th><th>Estado</th><th>F. registro</th><th>F. aplicación</th><th>Factura aplicada <span class="warn" title="Se indica al marcar Aplicada">⚠</span></th><th style="width:110px"></th></tr></thead>
        <tbody id="nc-body"></tbody>
      </table>
      <div class="pager"><span id="nc-count"></span></div>
    </div>
    <p class="hint">Pantalla con datos de ejemplo: sus NC no se cruzan con las facturas reales de la base (CO-10). En el diseño, una NC Pendiente la consulta Tesorería antes de pagar la siguiente factura del proveedor. Detracción cuando corresponda <span class="warn" title="Tratamiento de detracción a confirmar con contabilidad">⚠</span>.</p>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-12a Marcar NC como Aplicada -->
<div class="overlay" id="m-co12a">
  <div class="modal">
    <div class="modal-h"><b>Marcar Nota de Crédito como Aplicada</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-12a</span><span class="x" onclick="closeModal('m-co12a')">✕</span></div>
    <div class="modal-b">
      <p id="co12a-txt" style="margin-bottom:10px"></p>
      <div class="field wide"><label>Factura donde se aplicó el descuento <span style="color:var(--cancelada)">*</span> <span class="warn" title="Enlace con CO-09/CO-10 (Ola 5)">⚠</span></label><input id="co12a-fac" placeholder="Ej. F441-00223"></div>
      <div class="field wide" style="margin-top:10px"><label>Fecha de aplicación</label><input type="date" id="co12a-fecha" value="2026-07-19"></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co12a')">Cancelar</button><button class="btn btn-primary" onclick="aplicarNC()">Marcar Aplicada</button></div>
  </div>
</div>
`);
