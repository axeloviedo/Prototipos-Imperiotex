/* COMPRAS · CO-14 Comprobante de Costos de Destino (Landed Cost) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-14 · Costos de Destino (Bandeja) -->
  <section class="screen" id="scr-co14">
    <div class="screen-head">
      <h1>Comprobantes de Costos de Destino Estimados</h1><span class="code">CO-14</span><span class="badge" style="background:var(--pendiente)" title="Pantalla fuera del alcance de la base compartida (docs/16 §5): usa datos propios de ejemplo">Datos de ejemplo · no conectado a la base</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevoCCD()">+ Nuevo Comprobante</button>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>N°</th><th>Fecha</th><th>Facturas incluidas</th><th>Proveedor(es)</th><th style="text-align:right">Total costos S/.</th><th>Estado</th><th style="width:70px"></th></tr></thead>
        <tbody id="ccd-body"></tbody>
      </table>
      <div class="pager"><span id="ccd-count"></span></div>
    </div>
    <p class="hint">Registra los costos de nacionalización, transporte y otros cargos de una importación, y los aplica al costo de Kardex de los ítems de las facturas seleccionadas. Basado en el Landed Cost Voucher de ERPNext. Un comprobante en Borrador no afecta el Kardex: debe enviarse para aplicarse.</p>
  </section>

  <!-- CO-14f · Comprobante (Formulario) -->
  <section class="screen" id="scr-co14f">
    <div class="screen-head">
      <h1 id="ccd-titulo">COMPROBANTE DE COSTOS DE DESTINO</h1><span class="code">CO-14</span><span class="badge" style="background:var(--pendiente)" title="Pantalla fuera del alcance de la base compartida (docs/16 §5): usa datos propios de ejemplo">Datos de ejemplo · no conectado a la base</span>
      <span class="badge" id="ccd-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('co14')">Volver</button>
      <button class="btn btn-secondary" id="ccd-b-save" onclick="guardarCCD()">Guardar borrador</button>
      <button class="btn btn-primary" id="ccd-b-send" onclick="preEnviarCCD()">Enviar (aplicar al Kardex)</button>
    </div>

    <div class="card" id="ccd-aviso" style="display:none;border-left:4px solid var(--completada);background:#F0FDF4"></div>

    <div class="card">
      <div class="formgrid">
        <div class="field"><label>N° (auto)</label><input id="ccd-id" readonly></div>
        <div class="field"><label>Fecha</label><input id="ccd-fecha" readonly></div>
        <div class="field"><label>TC del día <span class="warn" title="Tipo de cambio del día del comprobante: convierte los costos ingresados en USD. Es distinto del TC congelado de cada OC">⚠</span></label><input id="ccd-tc" value="3.40" style="text-align:right" oninput="ccdTotalesUI()"></div>
        <div class="field"><label>Prorratear según</label><select id="ccd-base" onchange="ccdTotalesUI()"><option selected>Cantidad</option><option>Valor</option></select></div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">1 · Compras (facturas del proveedor)</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" id="ccd-b-addfac" onclick="abrirModalFacCCD()">+ Agregar factura</button>
      </div>
      <p class="hint" style="margin-top:5px">Facturas registradas de la importación. No necesitan estar pagadas ni recibidas. El total se muestra en soles al TC congelado de su OC.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Factura</th><th>N° comprobante</th><th>OC</th><th>Proveedor</th><th style="width:130px;text-align:right">Total S/.</th><th style="width:70px"></th></tr></thead>
        <tbody id="ccd-facs"></tbody>
      </table>
    </div>

    <div class="card">
      <b style="font-size:13px">2 · Ítems implicados (auto)</b>
      <p class="hint" style="margin-top:5px">Se llenan solos desde las facturas seleccionadas. El costo base es el subtotal sin IGV convertido a soles.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Código</th><th>Producto</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Total S/.</th><th style="text-align:right">Costo unit. actual</th><th style="text-align:right">Costo adicional</th><th style="text-align:right">Nuevo costo Kardex</th></tr></thead>
        <tbody id="ccd-items"></tbody>
        <tfoot id="ccd-items-foot"></tfoot>
      </table>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">3 · Costos Implicados</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" id="ccd-b-addcosto" onclick="addCostoCCD()">+ Agregar costo</button>
      </div>
      <p class="hint" style="margin-top:5px">Cargos aplicables de la importación. Si el importe está en USD se convierte a soles con el TC del día.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th style="width:250px">Cuenta de costos <span class="warn" title="Catálogo mínimo: cuentas definitivas a confirmar con contabilidad">⚠</span></th><th>Descripción</th><th style="width:80px">Moneda</th><th style="width:110px;text-align:right">Importe</th><th style="width:120px;text-align:right">Importe S/.</th><th style="width:70px"></th></tr></thead>
        <tbody id="ccd-costos"></tbody>
        <tfoot id="ccd-costos-foot"></tfoot>
      </table>
      <div id="ccd-resumen" style="margin-top:12px"></div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-14a Seleccionar facturas -->
<div class="overlay" id="m-co14a">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar factura al comprobante</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-14a</span><span class="x" onclick="closeModal('m-co14a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>Factura</th><th>N° comprobante</th><th>OC</th><th>Proveedor</th><th>Estado</th><th style="text-align:right">Total S/.</th><th style="width:90px"></th></tr></thead>
        <tbody id="co14a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Facturas registradas en el sistema (CO-10). No necesitan estar pagadas ni recibidas para asignarles costos de destino.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co14a')">Cerrar</button></div>
  </div>
</div>

<!-- CO-14b Confirmar aplicacion -->
<div class="overlay" id="m-co14b">
  <div class="modal">
    <div class="modal-h"><b>Aplicar costos al Kardex</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-14b · CT-05</span><span class="x" onclick="closeModal('m-co14b')">✕</span></div>
    <div class="modal-b">
      <p>¿Confirma el envío del comprobante?</p>
      <p class="hint" style="margin-top:8px">El costo promedio de Kardex de los ítems implicados se recalculará con el costo adicional prorrateado. El comprobante quedará Aplicado y en solo lectura.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co14b')">No</button><button class="btn btn-primary" onclick="enviarCCD()">Sí, aplicar</button></div>
  </div>
</div>
`);
