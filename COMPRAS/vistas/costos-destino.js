/* COMPRAS · CO-14 Costos de Destino — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-14 · Costos de Destino (Bandeja) -->
  <section class="screen" id="scr-co14">
    <div class="screen-head">
      <h1>Costos de Destino</h1><span class="code">CO-14</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevoCCD()">+ Nuevo comprobante</button>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>N°</th><th>Fecha</th><th>Órdenes de compra</th><th>Costos</th><th>Reparto</th><th style="text-align:right">Total S/.</th><th>Estado</th><th style="width:70px"></th></tr></thead>
        <tbody id="ccd-body"></tbody>
      </table>
      <div class="pager"><span id="ccd-count"></span></div>
    </div>
    <p class="hint">Flete, seguro, derechos de aduana, agente u otros costos de entrega de <b>cualquier OC recibida</b>. Al registrar, el costo se reparte sobre lo recibido y <b>sube el costo promedio</b> de lo que sigue en stock (movimiento de revalorización REV-, visible en el Kardex); lo que ya se consumió va a variación de existencias. Cada costo lleva su concepto contable (05 flete · 06 seguro · 07 aduanas · 08 agente · 09 otros).</p>
  </section>

  <!-- CO-14f · Comprobante (Formulario) -->
  <section class="screen" id="scr-co14f">
    <div class="screen-head">
      <h1 id="ccd-titulo">COSTOS DE DESTINO</h1><span class="code">CO-14</span>
      <span class="badge" id="ccd-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('co14')">Volver</button>
      <button class="btn btn-danger" id="ccd-b-anular" onclick="anularCCD()">Anular</button>
      <button class="btn btn-secondary" id="ccd-b-save" onclick="guardarCCD()">Guardar borrador</button>
      <button class="btn btn-primary" id="ccd-b-send" onclick="preRegistrarCCD()">Registrar (aplicar al costo)</button>
    </div>

    <div class="card" id="ccd-aviso" style="display:none;border-left:4px solid var(--completada);background:#F0FDF4"></div>

    <div class="card">
      <div class="formgrid">
        <div class="field"><label>N° (auto)</label><input id="ccd-id" readonly></div>
        <div class="field"><label>Fecha</label><input id="ccd-fecha" type="date"></div>
        <div class="field"><label>Repartir por <span class="warn" title="Por valor (recomendado): cada artículo carga según lo que costó; es lo justo cuando la OC mezcla artículos de precios distintos. Por cantidad: igual por unidad, útil cuando todo es parecido">⚠</span></label><select id="ccd-base" onchange="ccdLeer();renderCCDForm()"><option>Valor</option><option>Cantidad</option></select></div>
        <div class="field"><label>Observaciones</label><input id="ccd-obs" onchange="ccdLeer()"></div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">1 · Órdenes de compra recibidas</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" id="ccd-b-addoc" onclick="abrirModalOCCCD()">+ Agregar OC</button>
      </div>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>OC</th><th>Proveedor</th><th>Moneda</th><th style="text-align:right">Recibido S/.</th><th style="width:70px"></th></tr></thead>
        <tbody id="ccd-ocs"></tbody>
      </table>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">2 · Costos</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" id="ccd-b-addcosto" onclick="addCostoCCD()">+ Agregar costo</button>
      </div>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th style="width:220px">Tipo de costo</th><th>Proveedor del costo</th><th style="width:140px">N° comprobante</th><th style="width:80px">Moneda</th><th style="width:80px;text-align:right">TC</th><th style="width:120px;text-align:right">Monto</th><th style="width:110px;text-align:right">En S/.</th><th style="width:40px"></th></tr></thead>
        <tbody id="ccd-costos"></tbody>
        <tfoot id="ccd-costos-foot"></tfoot>
      </table>
    </div>

    <div class="card">
      <b style="font-size:13px">3 · Reparto sobre lo recibido</b>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>OC</th><th>Código</th><th>Artículo</th><th>Almacén de ingreso</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Valor S/.</th><th style="text-align:right">Costo asignado S/.</th><th style="text-align:right">Por unidad</th></tr></thead>
        <tbody id="ccd-items"></tbody>
        <tfoot id="ccd-items-foot"></tfoot>
      </table>
      <div id="ccd-resumen" style="margin-top:12px"></div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-14a Seleccionar OC recibidas -->
<div class="overlay" id="m-co14a">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar orden de compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-14a</span><span class="x" onclick="closeModal('m-co14a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>OC</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th style="text-align:right">Recibido S/.</th><th style="width:90px"></th></tr></thead>
        <tbody id="co14a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Órdenes de compra con ingresos al almacén. Una OC puede tener varios comprobantes (por ejemplo, el flete y luego la aduana).</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co14a')">Cerrar</button></div>
  </div>
</div>

<!-- Motivo de anulación (compartido por CO-11, CO-12 y CO-14) -->
<div class="overlay" id="m-co-motivo">
  <div class="modal">
    <div class="modal-h"><b id="co-motivo-tit">Anular</b><span class="x" onclick="closeModal('m-co-motivo')">✕</span></div>
    <div class="modal-b">
      <p class="hint" id="co-motivo-txt" style="margin-bottom:8px"></p>
      <div class="field wide"><label>Motivo (obligatorio)</label><textarea id="co-motivo" rows="3"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co-motivo')">Cancelar</button><button class="btn btn-danger" id="co-motivo-ok" onclick="coMotivoOk()">Anular</button></div>
  </div>
</div>

<!-- CO-14b Confirmar registro -->
<div class="overlay" id="m-co14b">
  <div class="modal">
    <div class="modal-h"><b>Aplicar los costos de destino</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-14b</span><span class="x" onclick="closeModal('m-co14b')">✕</span></div>
    <div class="modal-b">
      <p id="co14b-txt">¿Registrar el comprobante?</p>
      <p class="hint" style="margin-top:8px">Sube el costo promedio de lo recibido que sigue en stock (revalorización REV-). Lo ya consumido va a variación de existencias. El comprobante queda de solo lectura; si se anula, se revierte.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co14b')">No</button><button class="btn btn-primary" onclick="registrarCCD()">Sí, registrar</button></div>
  </div>
</div>
`);
