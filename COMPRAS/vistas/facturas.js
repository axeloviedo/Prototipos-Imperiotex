/* COMPRAS · CO-09/10 Facturas de Compra — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-co09">
    <div class="screen-head">
      <h1>Facturas de Compra</h1><span class="code">CO-09</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="abrirFacOC()">+ Registrar Factura</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (factura / proveedor / OC)</label><input id="f-fac-q" placeholder="Ej. F212-00841, YKK…" oninput="renderFac()"></div>
        <div class="field"><label>Estado</label><select id="f-fac-e" onchange="renderFac()"><option value="">Todos</option><option>Borrador</option><option>Impagado</option><option>Pagado</option></select></div>
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
    <p class="hint">Estas son las facturas que emite el proveedor: el sistema solo las registra para controlar lo que se debe y sustentar los pagos. Toda factura se registra contra una Orden de Compra (Crear ▾ en CO-07). El estado Pagado lo actualiza el flujo de pagos de BPD_TESORERIA: aquí solo se refleja.</p>
  </section>

  <!-- ==================================================== CO-10 · Factura de Compra -->
  <section class="screen" id="scr-co10">
    <div class="screen-head">
      <h1 id="fac-titulo">FACTURA DE COMPRA</h1><span class="code">CO-10</span>
      <span class="badge" id="fac-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" id="fac-b-cancelar" onclick="go('co09')">Cancelar</button>
      <button class="btn btn-secondary" id="fac-b-guardar" onclick="toast('Borrador guardado')">Guardar borrador</button>
      <button class="btn btn-primary" id="fac-b-emitir" onclick="registrarFac()">Registrar factura</button>
      <button class="btn btn-secondary" id="fac-b-pago" onclick="marcarPagada()">Registrar pago (Tesorería) <span class="warn" title="El pago se ejecuta en BPD_TESORERIA: aquí solo se refleja el estado">⚠</span></button>
      <button class="btn btn-secondary" id="fac-b-volver" onclick="go('co09')">Volver</button>
    </div>

    <div class="card">
      <b style="font-size:13px">Cabecera del comprobante recibido</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (auto)</label><input id="fac-id" readonly></div>
        <div class="field"><label>OC origen</label>
          <div style="display:flex;gap:8px"><input id="fac-oc" readonly style="flex:1"><button class="btn btn-secondary btn-sm" onclick="loadOC(FAC.ock)">Ver OC</button></div></div>
        <div class="field"><label>Proveedor (heredado)</label><input id="fac-prov" readonly></div>
        <div class="field"><label>Serie y número del comprobante del proveedor <span style="color:var(--cancelada)">*</span></label><input id="fac-ndoc" placeholder="Ej. F212-00841"></div>
        <div class="field"><label>Fecha de emisión del comprobante</label><input type="date" id="fac-fecha" value="2026-07-19"></div>
        <div class="field"><label>Condición de pago (heredada, editable <span class="warn" title="Puede diferir de la OC según lo pactado en el comprobante">⚠</span>)</label>
          <select id="fac-cond"><option>Contado</option><option>Crédito 15 días</option><option>Crédito 30 días</option><option>Crédito 60 días</option></select></div>
        <div class="field"><label>Moneda (CT-08)</label><input id="fac-mon" readonly></div>
        <div class="field"><label>Tipo de Cambio</label><input id="fac-tc" readonly style="text-align:right"></div>
        <div class="field"><label>Detracción <span class="warn" title="Aplica a ciertos servicios: porcentaje y cuenta a confirmar con contabilidad">⚠</span></label>
          <div style="display:flex;gap:8px;align-items:center"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12.5px"><input type="checkbox" id="fac-detr" onchange="renderFacItems()" style="width:auto"> Aplica</label><input id="fac-detrp" value="12" style="width:70px;text-align:right" oninput="facTotalesUI()"><span class="hint">%</span></div></div>
        <div class="field full"><label>Observaciones</label><input id="fac-obs"></div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Productos facturados por el proveedor (precargados de la OC, editables para que coincidan con el comprobante recibido <span class="warn" title="Diferencias contra la OC quedan visibles para Contabilidad">⚠</span>)</b>
      <table class="grid subtable" style="margin-top:12px">
        <thead id="fac-items-head"></thead>
        <tbody id="fac-items"></tbody>
        <tfoot id="fac-items-foot"></tfoot>
      </table>
      <div id="fac-detr-box" style="display:none;margin-top:10px" class="hint"></div>
    </div>

    <div class="card" id="fac-nc" style="display:none;border-left:4px solid var(--pendiente)">
      <b style="font-size:13px">NC aplicables <span class="warn" title="Notas de Crédito Pendientes del proveedor: Tesorería las consulta antes de pagar">⚠</span></b>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>N° de NC</th><th>Reclamo origen</th><th>OC</th><th style="text-align:right">Monto</th><th style="width:150px">Acción</th></tr></thead>
        <tbody id="fac-nc-body"></tbody>
      </table>
      <p class="hint" style="margin-top:8px">Aplicar una NC aquí la marca como Aplicada en CO-12 y descuenta su monto del total a pagar.</p>
    </div>

    <div class="card">
      <b style="font-size:13px">Documentos relacionados</b>
      <div id="fac-docs" style="margin-top:10px;font-size:13px"></div>
    </div>

    <div class="card" style="border-left:4px solid var(--primario-claro)">
      <b style="font-size:12.5px">Efecto en el costo del artículo</b>
      <p class="hint" style="margin-top:5px">El ingreso a almacén de esta compra <b>recalcula el costo promedio ponderado</b> de cada artículo recibido: costo nuevo = (valor del saldo anterior + valor de este ingreso) ÷ cantidad total. Solo los ingresos mueven el costo; las salidas se valorizan al costo vigente en ese momento. El resultado se ve en el maestro de artículos como <b>último precio de compra</b> y <b>precio de compra promedio</b>, que por eso son de solo lectura: <button class="btn-link" onclick="go('gi01')">ver el maestro de artículos</button>.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<div class="overlay" id="m-co10a">
  <div class="modal lg">
    <div class="modal-h"><b>Registrar la factura del proveedor contra una OC</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-10a</span><span class="x" onclick="closeModal('m-co10a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>OC</th><th>Proveedor</th><th>Fecha</th><th style="text-align:right">Total</th><th style="text-align:right">% Facturado</th><th style="width:100px"></th></tr></thead>
        <tbody id="co10a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo OCs validadas con facturación pendiente. La factura la emite el proveedor: aquí se registra contra su OC.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co10a')">Cerrar</button></div>
  </div>
</div>
`);
