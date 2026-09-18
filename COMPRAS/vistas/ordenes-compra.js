/* COMPRAS · CO-06/07 Órdenes de Compra — HTML
   Conectado a la base compartida: BD.d.ocs con Docs.oc (docs/16 §3.4) */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-06 · Órdenes de Compra (Bandeja) -->
  <section class="screen" id="scr-co06">
    <div class="screen-head">
      <h1>Órdenes de Compra</h1><span class="code">CO-06</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaOC()">+ Agregar OC</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (OC / proveedor / solicitud / orden)</label><input id="f-oc-q" placeholder="Ej. OC-000001, LANDEO, SOL-…" oninput="renderOCS()"></div>
        <div class="field"><label>Estado</label><select id="f-oc-e" onchange="renderOCS()"><option value="">Todos</option><option>Borrador</option><option>Pendiente de Validar</option><option>Para Recibir y Pagar</option><option>Para Recibir</option><option>Para Pagar</option><option>Completada</option><option>Cancelada</option><option value="*rec">Pendientes de recibir</option><option value="*fac">Pendientes de facturar</option></select></div>
        <div class="field"><label>Tipo</label><select id="f-oc-t" onchange="renderOCS()"><option value="">Todos</option><option>Bienes</option><option>Servicio</option></select></div>
        <div class="field"><label>Moneda</label><select id="f-oc-m" onchange="renderOCS()"><option value="">Todas</option><option>S/.</option><option>USD</option></select></div>
        <div class="field" style="display:flex;align-items:flex-end;gap:6px"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12.5px;color:var(--texto)"><input type="checkbox" id="f-oc-i" onchange="renderOCS()" style="width:auto"> Solo Importación (proveedor internacional)</label></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Tipo</th><th>Proveedor</th><th>Moneda</th><th style="text-align:right">Total</th><th>Estado</th><th>Fecha</th><th>Origen</th><th style="width:80px;text-align:right" title="% recibido: cantidades ingresadas al almacén o con conformidad del servicio">% Recibido</th><th style="width:80px;text-align:right" title="% facturado: cantidades de las facturas registradas contra la OC">% Facturado</th><th style="width:70px">Acciones</th></tr></thead>
        <tbody id="ocs-body"></tbody>
      </table>
      <div class="pager"><span id="ocs-count"></span></div>
    </div>
    <p class="hint">Una OC nace de una Solicitud de Materiales aprobada (Logística la crea desde GI-13 con las líneas de Compra) o se crea directa con "+ Agregar OC". En ambos casos necesita el V°B° de Logística y la aprobación de Gerencia. Las OC de bienes se reciben con un ingreso al almacén; las de servicio, con la conformidad del servicio.</p>
  </section>

  <!-- ==================================================== CO-07 · Orden de Compra -->
  <section class="screen" id="scr-co07">
    <div class="screen-head">
      <h1 id="oc-titulo">ORDEN DE COMPRA</h1><span class="code">CO-07</span>
      <span class="badge" id="oc-badge" style="background:var(--borrador)">Borrador</span>
      <span class="badge" id="oc-tipo-badge" style="background:var(--primario-claro)">Bienes</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" id="oc-b-cancelar" onclick="preCancelarOC()">Cancelar OC</button>
      <button class="btn btn-secondary" id="oc-b-guardar" onclick="guardarBorradorOC()">Guardar borrador</button>
      <button class="btn btn-primary" id="oc-b-enviar" onclick="enviarValidacionOC()">Enviar a validación</button>
      <button class="btn btn-secondary" id="oc-b-vallog" onclick="validarLogOC()">Validar (Logística)</button>
      <button class="btn btn-primary" id="oc-b-valger" onclick="preAprobarOC()">Aprobar (Gerencia)</button>
      <button class="btn btn-primary" id="oc-b-ingreso" onclick="abrirRecepcionOC()">Registrar ingreso</button>
      <button class="btn btn-primary" id="oc-b-conf" onclick="abrirConformidadOC()">Conformidad del servicio</button>
      <div class="dropwrap" id="oc-b-crear">
        <button class="btn btn-secondary" onclick="event.stopPropagation();document.getElementById('oc-crear-menu').classList.toggle('open')">Crear ▾</button>
        <div class="dropmenu" id="oc-crear-menu"></div>
      </div>
      <button class="btn btn-secondary" id="oc-b-volver" onclick="go('co06')">Volver</button>
    </div>

    <div class="card" id="oc-val" style="display:none">
      <div style="display:flex;gap:26px;align-items:center;font-size:13px;flex-wrap:wrap">
        <b style="font-size:12.5px">Validaciones:</b>
        <span id="oc-val-log"></span>
        <span id="oc-val-ger"></span>
        <span class="hint">Con ambas validaciones la OC pasa a Para Recibir y Pagar y ya no se edita.</span>
      </div>
    </div>
    <div class="card" id="oc-avance" style="display:none">
      <div style="display:flex;gap:34px;align-items:center;flex-wrap:wrap">
        <div title="% recibido: ingresos al almacén o conformidades del servicio"><span class="hint" id="oc-pct-rec-lbl">Recibido</span><br><span id="oc-pct-rec" style="font-size:19px;font-weight:700"></span></div>
        <div title="% facturado: facturas registradas contra la OC"><span class="hint">Facturado</span><br><span id="oc-pct-fac" style="font-size:19px;font-weight:700"></span></div>
        <div id="oc-aviso-of" class="hint" style="display:none;flex:1;min-width:260px;border-left:4px solid var(--primario-claro);padding-left:10px"></div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (auto)</label><input id="oc-id" readonly></div>
        <div class="field"><label>Solicitud de Materiales origen</label>
          <div style="display:flex;gap:8px"><input id="oc-sol" readonly style="flex:1"><button class="btn btn-secondary btn-sm" id="oc-b-versol" onclick="verSolDeOC()">Ver</button></div></div>
        <div class="field"><label>PROVEEDOR <span style="color:var(--cancelada)">*</span> (CT-09)</label>
          <div style="display:flex;gap:8px"><input id="oc-prov" readonly placeholder="Seleccionar proveedor…" style="flex:1"><button class="btn btn-secondary btn-sm" id="oc-b-prov" onclick="openCT09()">Buscar</button></div></div>
        <div class="field"><label>Condición de pago</label><select id="oc-cond"></select></div>
        <div class="field"><label>Moneda (CT-08)</label>
          <select id="oc-mon" onchange="ocMoneda()"><option>S/.</option><option>USD</option></select></div>
        <div class="field"><label>Tipo de Cambio</label>
          <input id="oc-tc" value="3.75" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Fecha</label><input type="date" id="oc-fecha"></div>
        <div class="field"><label>Almacén destino (bienes)</label><select id="oc-alm"></select></div>
        <div class="field"><label>Orden de Fabricación (opcional)</label>
          <div style="display:flex;gap:8px"><input id="oc-op" placeholder="Ej. OF-000001" style="flex:1"><button class="btn btn-secondary btn-sm" id="oc-b-verof" onclick="verOFdeOC()">Ver</button></div></div>
        <div class="field"><label>Solicitud de Fabricación</label><input id="oc-sf" readonly></div>
        <div class="field full"><label>Referencia de cotización del proveedor (opcional)</label><input id="oc-ref" placeholder="N° de cotización, validez y condiciones ofrecidas"></div>
        <div class="field full"><label>Observaciones</label><input id="oc-obs"></div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">Listado de ítems (heredados de la solicitud o agregados aquí: se asignan los precios)</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="oc-b-additem" onclick="openBuscadorOC()">+ Agregar ítem</button>
      </div>
      <table class="grid subtable" style="margin-top:12px">
        <thead id="oc-items-head"></thead>
        <tbody id="oc-items"></tbody>
        <tfoot id="oc-items-foot"></tfoot>
      </table>
      <p class="hint" style="margin-top:8px">El IGV no se digita: sale de la afectación del artículo (Gravado 18%; importación: se paga en la nacionalización). Los servicios (SRV) no entran al almacén: se cierran con la conformidad del servicio; si son para producción indique la Orden de Fabricación.</p>
    </div>

    <div class="card" id="oc-costos" style="display:none;border-left:4px solid var(--opt-compras)">
      <b style="font-size:13px">COSTOS ADICIONALES de importación (estimación, no se guarda)</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Agente de aduanas (USD)</label><input id="oc-ca-adu" value="0" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Nacionalización / impuestos (USD)</label><input id="oc-ca-nac" value="0" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Flete internacional (USD)</label><input id="oc-ca-fle" value="0" style="text-align:right" oninput="ocTotalesUI()"></div>
      </div>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Código</th><th>Nombre</th><th style="text-align:right">Precio unit. USD</th><th style="text-align:right">Costo unitario estimado (S/.)</th></tr></thead>
        <tbody id="oc-costos-body"></tbody>
      </table>
    </div>

    <div class="card">
      <b style="font-size:13px">Recepciones y facturas</b>
      <div id="oc-docs" style="margin-top:10px;font-size:13px"></div>
    </div>

    <div class="card">
      <b style="font-size:13px">Historial</b>
      <table class="grid subtable" style="margin-top:10px">
        <thead><tr><th style="width:130px">Fecha</th><th style="width:190px">Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
        <tbody id="oc-hist"></tbody>
      </table>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-07a Aprobar OC -->
<div class="overlay" id="m-co07a">
  <div class="modal">
    <div class="modal-h"><b>Aprobar Orden de Compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-07a · CT-05</span><span class="x" onclick="closeModal('m-co07a')">✕</span></div>
    <div class="modal-b">
      <p>¿Está seguro que desea aprobar esta orden de compra (Gerencia)?</p>
      <p class="hint" style="margin-top:8px">Con ambas validaciones (Logística y Gerencia) pasa a Para Recibir y Pagar. Si es un servicio para una orden de fabricación, queda registrada en la pestaña Costo de esa orden.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co07a')">No</button><button class="btn btn-primary" onclick="aprobarOC()">Sí</button></div>
  </div>
</div>

<!-- CO-07c Cancelar OC -->
<div class="overlay" id="m-co07c">
  <div class="modal">
    <div class="modal-h"><b>Cancelar Orden de Compra</b><span class="x" onclick="closeModal('m-co07c')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">¿Está seguro de cancelar esta OC?</p>
      <div class="field wide"><label>Motivo (obligatorio)</label><textarea id="oc-motivo-cancel" rows="3" placeholder="Solo se cancela una OC sin recepciones. Las líneas de la solicitud de origen vuelven a quedar pendientes."></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co07c')">Volver</button><button class="btn btn-danger" onclick="cancelarOC()">Cancelar OC</button></div>
  </div>
</div>

<!-- CO-07b - agregar item a la orden de compra -->
<div class="overlay" id="m-oc-item">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar ítem a la orden de compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-07b</span><span class="x" onclick="closeModal('m-oc-item')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>Código / nombre</label><input id="oc-it-q" placeholder="Buscar..." oninput="renderBuscarOC()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="oc-it-g" onchange="renderBuscarOC()"></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Artículo</th><th>Grupo</th><th>Unidad</th><th style="text-align:right">Precio de referencia</th><th style="width:90px"></th></tr></thead>
        <tbody id="oc-it-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo artículos activos marcados como <b>Se compra</b> en el maestro compartido. El precio propuesto es el precio de compra o costo de referencia del artículo (o del recurso, si es un servicio) y se puede cambiar en la línea.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-oc-item')">Cerrar</button></div>
  </div>
</div>

<!-- CO-07d - registrar ingreso (bienes) -->
<div class="overlay" id="m-oc-rec">
  <div class="modal lg">
    <div class="modal-h"><b>Registrar ingreso de la compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-07d · GI-09</span><span class="x" onclick="closeModal('m-oc-rec')">✕</span></div>
    <div class="modal-b">
      <div class="formgrid" style="margin-bottom:12px">
        <div class="field"><label>Almacén de ingreso <span style="color:var(--cancelada)">*</span></label><select id="oc-rec-alm"></select></div>
        <div class="field full"><label>Observaciones (guía del proveedor, diferencias)</label><input id="oc-rec-obs"></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Artículo</th><th>Unidad</th><th style="text-align:right">Pedido</th><th style="text-align:right">Recibido</th><th style="text-align:right">Pendiente</th><th style="width:120px;text-align:right">Recibir ahora</th></tr></thead>
        <tbody id="oc-rec-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Genera un movimiento de Ingreso (Ingreso - Compra) en el almacén elegido, valorizado al precio de la OC (en soles al TC de la OC). No se recibe más de lo pedido.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-oc-rec')">Cancelar</button><button class="btn btn-primary" onclick="confirmarRecepcionOC()">Registrar ingreso</button></div>
  </div>
</div>

<!-- CO-07e - conformidad del servicio -->
<div class="overlay" id="m-oc-conf">
  <div class="modal lg">
    <div class="modal-h"><b>Conformidad del servicio</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-07e</span><span class="x" onclick="closeModal('m-oc-conf')">✕</span></div>
    <div class="modal-b">
      <div id="oc-conf-of" class="hint" style="display:none;margin-bottom:10px;border-left:4px solid var(--primario-claro);padding-left:10px"></div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Servicio</th><th>Unidad</th><th style="text-align:right">Pedido</th><th style="text-align:right">Con conformidad</th><th style="text-align:right">Pendiente</th><th style="width:120px;text-align:right">Conformidad ahora</th></tr></thead>
        <tbody id="oc-conf-body"></tbody>
      </table>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Resultado</label><select id="oc-conf-res"><option value="si">Recepcionado conforme</option><option value="no">Con observaciones</option></select></div>
        <div class="field full"><label>Observaciones</label><input id="oc-conf-obs" placeholder="Obligatorio si hay observaciones"></div>
      </div>
      <p class="hint" style="margin-top:10px">El servicio no mueve stock: el envío y el retorno del material se registran en la orden de fabricación (Producción). La conformidad avanza el % recibido de la OC.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-oc-conf')">Cancelar</button><button class="btn btn-primary" onclick="confirmarConformidadOC()">Registrar conformidad</button></div>
  </div>
</div>
`);
