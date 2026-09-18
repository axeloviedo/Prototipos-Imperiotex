/* COMPRAS · CO-11 Reclamos — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-co11">
    <div class="screen-head">
      <h1>Reclamos a Proveedores</h1><span class="code">CO-11</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevoRec()">+ Registrar reclamo</button>
    </div>
    <div class="card" id="rec-faltantes" style="display:none;border-left:4px solid var(--pendiente)"></div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (reclamo / proveedor / OC / orden)</label><input id="f-rec-q" placeholder="Ej. RCL-000001, LANDEO…" oninput="renderRec()"></div>
        <div class="field"><label>Estado</label><select id="f-rec-e" onchange="renderRec()"><option value="">Todos</option><option>Registrado</option><option>En proceso</option><option>Resuelto</option><option>Anulado</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Fecha</th><th>Proveedor</th><th>OC / orden</th><th>Qué se reclama</th><th>Resolución</th><th>Estado</th><th style="width:70px"></th></tr></thead>
        <tbody id="rec-body"></tbody>
      </table>
      <div class="pager"><span id="rec-count"></span></div>
    </div>
    <p class="hint">El reclamo registra qué falló y cómo se resolvió; <b>no es un documento contable</b>. Lo que mueve stock o dinero son los documentos que genera, cada uno con su concepto: <b>Reposición</b> = salida al proveedor y reingreso de lo repuesto (11) · <b>Devolución</b> = salida al proveedor (11) y nota de crédito 07 (12) · <b>Nota de crédito</b> sin devolución = nota 05 o 09 (12). El faltante de una orden tercerizada sale además del almacén de tránsito como faltante (26).</p>
  </section>

  <!-- ==================================================== CO-11f · Reclamo -->
  <section class="screen" id="scr-co11f">
    <div class="screen-head">
      <h1 id="rec-titulo">REGISTRAR RECLAMO</h1><span class="code">CO-11</span>
      <span class="badge" id="rec-badge" style="background:var(--borrador)">Nuevo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('co11')">Volver</button>
      <button class="btn btn-danger" id="rec-b-anular" onclick="anularRec()">Anular</button>
      <button class="btn btn-primary" id="rec-b-guardar" onclick="guardarRec()">Registrar reclamo</button>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>ID (auto)</label><input id="rec-id" readonly></div>
        <div class="field"><label>OC vinculada <span style="color:var(--cancelada)">*</span></label>
          <div style="display:flex;gap:8px"><input id="rec-oc" readonly placeholder="Seleccionar OC…" style="flex:1"><button class="btn btn-secondary btn-sm" id="rec-b-oc" onclick="abrirRecOC()">Buscar</button></div></div>
        <div class="field"><label>Proveedor</label><input id="rec-prov" readonly></div>
        <div class="field"><label>Orden de fabricación</label><input id="rec-of" readonly></div>
        <div class="field full"><label>Observaciones</label><input id="rec-obs" placeholder="Qué pasó (se gestiona con el proveedor fuera del sistema)"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">Artículos o servicios reclamados</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" id="rec-b-additem" onclick="abrirRecItem()">+ Agregar línea</button>
      </div>
      <table class="grid subtable" style="margin-top:10px">
        <thead id="rec-head"></thead>
        <tbody id="rec-items"></tbody>
      </table>
    </div>
    <div class="card">
      <b style="font-size:13px">Historial</b>
      <table class="grid subtable" style="margin-top:10px"><tbody id="rec-hist"></tbody></table>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-11a Buscar OC para el reclamo -->
<div class="overlay" id="m-co11a">
  <div class="modal lg">
    <div class="modal-h"><b>Vincular orden de compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-11a</span><span class="x" onclick="closeModal('m-co11a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>OC</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th style="width:100px"></th></tr></thead>
        <tbody id="co11a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Todo reclamo se sustenta en una compra: se listan las OC con algo recibido o con conformidad.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co11a')">Cerrar</button></div>
  </div>
</div>

<!-- CO-11b Agregar línea al reclamo -->
<div class="overlay" id="m-co11b">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar artículo o servicio</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-11b</span><span class="x" onclick="closeModal('m-co11b')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Se puede reclamar</th><th style="width:100px"></th></tr></thead>
        <tbody id="co11b-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo lo recibido (o con conformidad) de la OC y aún no reclamado.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co11b')">Cerrar</button></div>
  </div>
</div>
`);
