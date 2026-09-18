/* COMPRAS · CO-09/10 Facturas de Compra — HTML
   Conectado a la base compartida: BD.d.facturas con Docs.fac (docs/16 §3.4) */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-co09">
    <div class="screen-head">
      <h1>Facturas de Compra</h1><span class="code">CO-09</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="abrirFacOC()">+ Registrar Factura</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (factura / comprobante / proveedor / OC)</label><input id="f-fac-q" placeholder="Ej. F001-00012, LANDEO, OC-…" oninput="renderFac()"></div>
        <div class="field"><label>Estado</label><select id="f-fac-e" onchange="renderFac()"><option value="">Todos</option><option>Impagado</option><option>Pagado</option></select></div>
        <div class="field"><label>Proveedor</label><select id="f-fac-p" onchange="renderFac()"><option value="">Todos</option></select></div>
        <div class="field"><label>Emitidas desde</label><input type="date" id="f-fac-d" value="" onchange="renderFac()"></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Proveedor</th><th>N° de comprobante</th><th>Moneda</th><th style="text-align:right">Monto total</th><th>Estado</th><th>F. emisión</th><th>OC origen</th><th style="width:70px"></th></tr></thead>
        <tbody id="fac-body"></tbody>
      </table>
      <div class="pager"><span id="fac-count"></span></div>
    </div>
    <p class="hint">Facturas que emite el proveedor: se registran contra una Orden de Compra aprobada para controlar lo que se debe y sustentar los pagos. El estado Pagado lo actualiza el flujo de pagos de Tesorería: aquí solo se refleja.</p>
  </section>

  <!-- ==================================================== CO-10 · Factura de Compra -->
  <section class="screen" id="scr-co10">
    <div class="screen-head">
      <h1 id="fac-titulo">FACTURA DE COMPRA</h1><span class="code">CO-10</span>
      <span class="badge" id="fac-badge" style="background:var(--borrador)">Por registrar</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" id="fac-b-cancelar" onclick="cancelarFacForm()">Cancelar</button>
      <button class="btn btn-primary" id="fac-b-emitir" onclick="registrarFac()">Registrar factura</button>
      <button class="btn btn-secondary" id="fac-b-pago" onclick="marcarPagada()">Registrar pago (Tesorería) <span class="warn" title="El pago se ejecuta en Tesorería: aquí solo se refleja el estado">⚠</span></button>
      <button class="btn btn-secondary" id="fac-b-volver" onclick="go('co09')">Volver</button>
    </div>

    <div class="card" id="fac-aviso-of" style="display:none;border-left:4px solid var(--primario-claro)"></div>

    <div class="card">
      <b style="font-size:13px">Cabecera del comprobante recibido</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (auto)</label><input id="fac-id" readonly></div>
        <div class="field"><label>OC origen</label>
          <div style="display:flex;gap:8px"><input id="fac-oc" readonly style="flex:1"><button class="btn btn-secondary btn-sm" onclick="verOCdeFac()">Ver OC</button></div></div>
        <div class="field"><label>Proveedor (heredado)</label><input id="fac-prov" readonly></div>
        <div class="field"><label>Serie y número del comprobante del proveedor <span style="color:var(--cancelada)">*</span></label><input id="fac-ndoc" placeholder="Ej. F001-00012"></div>
        <div class="field"><label>Fecha de emisión del comprobante</label><input type="date" id="fac-fecha"></div>
        <div class="field"><label>Condición de pago (heredada de la OC)</label><input id="fac-cond" readonly></div>
        <div class="field"><label>Moneda (CT-08)</label><input id="fac-mon" readonly></div>
        <div class="field"><label>Tipo de Cambio</label><input id="fac-tc" readonly style="text-align:right"></div>
        <div class="field"><label>Detracción / retención <span class="warn" title="Dato informativo del maestro del proveedor: porcentaje y cuenta a confirmar con contabilidad">⚠</span></label><input id="fac-fiscal" readonly></div>
        <div class="field full"><label>Observaciones</label><input id="fac-obs"></div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Productos facturados por el proveedor</b>
      <p class="hint" style="margin-top:4px" id="fac-items-hint">Precargados con lo pendiente de facturar de la OC. Ajuste cantidad y precio para que coincidan con el comprobante recibido: no se factura más de lo pedido.</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead id="fac-items-head"></thead>
        <tbody id="fac-items"></tbody>
        <tfoot id="fac-items-foot"></tfoot>
      </table>
      <div id="fac-detr-box" style="display:none;margin-top:10px" class="hint"></div>
    </div>

    <div class="card">
      <b style="font-size:13px">Documentos relacionados e historial</b>
      <div id="fac-docs" style="margin-top:10px;font-size:13px"></div>
    </div>

    <div class="card" style="border-left:4px solid var(--primario-claro)">
      <b style="font-size:12.5px">Efecto en el costo del artículo</b>
      <p class="hint" style="margin-top:5px">La factura no mueve stock. El <b>ingreso a almacén</b> de la compra (desde la OC) es el que recalcula el costo promedio ponderado de cada artículo recibido en ese almacén: costo nuevo = (valor del saldo anterior + valor del ingreso) ÷ cantidad total. En un servicio para producción, el importe facturado se contrasta con el costo estándar en la pestaña Costo de la orden. <button class="btn-link" onclick="go('gi01')">Ver el maestro de artículos</button>.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<div class="overlay" id="m-co10a">
  <div class="modal lg">
    <div class="modal-h"><b>Registrar la factura del proveedor contra una OC</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-10a</span><span class="x" onclick="closeModal('m-co10a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>OC</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th style="text-align:right">Total</th><th style="text-align:right">% Recibido</th><th style="text-align:right">% Facturado</th><th style="width:100px"></th></tr></thead>
        <tbody id="co10a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo OCs aprobadas (V°B° de Logística y Gerencia) con cantidades pendientes de facturar. La factura la emite el proveedor: aquí se registra contra su OC.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co10a')">Cerrar</button></div>
  </div>
</div>
`);
