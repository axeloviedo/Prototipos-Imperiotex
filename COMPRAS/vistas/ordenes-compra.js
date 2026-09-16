/* COMPRAS · CO-06/07 Órdenes de Compra — HTML */
Vistas.pantallas(String.raw`
  <!-- Placeholders CO (proximas olas) -->
  <section class="screen" id="scr-co06">
    <div class="screen-head">
      <h1>Órdenes de Compra</h1><span class="code">CO-06</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaOC()">+ Agregar OC</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (OC / proveedor)</label><input id="f-oc-q" placeholder="Ej. OC-000231, YKK…" oninput="renderOCS()"></div>
        <div class="field"><label>Estado</label><select id="f-oc-e" onchange="renderOCS()"><option value="">Todos</option><option>Borrador</option><option>Pendiente de Validar</option><option>Para Recibir y Pagar</option><option>Para Recibir</option><option>Para Pagar</option><option>Completada</option><option>Cancelada</option></select></div>
        <div class="field"><label>Moneda</label><select id="f-oc-m" onchange="renderOCS()"><option value="">Todas</option><option>S/.</option><option>USD</option></select></div>
        <div class="field" style="display:flex;align-items:flex-end;gap:6px"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12.5px;color:var(--texto)"><input type="checkbox" id="f-oc-i" onchange="renderOCS()" style="width:auto"> Solo Importación (proveedor internacional)</label></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Proveedor</th><th>Moneda</th><th style="text-align:right">Total</th><th>Estado</th><th>Fecha</th><th>Solicitud origen</th><th style="width:80px;text-align:right" title="% recibido: según los ingresos vinculados a la OC">% Recibido <span class="warn" title="Según ingresos vinculados (inferencia)">⚠</span></th><th style="width:80px;text-align:right" title="% facturado: según las facturas vinculadas a la OC">% Facturado <span class="warn" title="Según facturas vinculadas (inferencia)">⚠</span></th><th style="width:70px">Acciones</th></tr></thead>
        <tbody id="ocs-body"></tbody>
      </table>
      <div class="pager"><span id="ocs-count"></span></div>
    </div>
    <p class="hint">Una OC puede nacer de una Solicitud de Materiales aprobada (Crear ▾ en la solicitud, hereda los ítems) o crearse directa con "+ Agregar OC". En ambos casos la aprobación de Gerencia es obligatoria.</p>
  </section>

  <!-- ==================================================== CO-07 · Orden de Compra -->
  <section class="screen" id="scr-co07">
    <div class="screen-head">
      <h1 id="oc-titulo">ORDEN DE COMPRA</h1><span class="code">CO-07</span>
      <span class="badge" id="oc-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" id="oc-b-cancelar" onclick="openModal('m-co07c')">Cancelar</button>
      <button class="btn btn-secondary" id="oc-b-guardar" onclick="toast('Borrador guardado')">Guardar borrador</button>
      <button class="btn btn-primary" id="oc-b-enviar" onclick="enviarValidacionOC()">Enviar a validación</button>
      <button class="btn btn-secondary" id="oc-b-vallog" onclick="validarLogOC()">Validar (Logística)</button>
      <button class="btn btn-primary" id="oc-b-valger" onclick="preAprobarOC()">Aprobar (Gerencia)</button>
      <div class="dropwrap" id="oc-b-crear">
        <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('oc-crear-menu').classList.toggle('open')">Crear ▾</button>
        <div class="dropmenu" id="oc-crear-menu">
          <div class="op" onclick="crearIngresoDesdeOC()">Ingreso de Compra<small>GI-09 precargado contra esta OC (registra la llegada física)</small></div>
          <div class="op" onclick="crearFacDesdeOC()">Factura de Compra<small>CO-10 con ítems y montos de la OC</small></div>
        </div>
      </div>
      <button class="btn btn-secondary" id="oc-b-volver" onclick="go('co06')">Volver</button>
    </div>

    <div class="card" id="oc-val" style="display:none">
      <div style="display:flex;gap:26px;align-items:center;font-size:13px">
        <b style="font-size:12.5px">Validaciones:</b>
        <span id="oc-val-log"></span>
        <span id="oc-val-ger"></span>
        <span class="hint">Con ambas validaciones la OC pasa a Para Recibir y Pagar y queda inmutable.</span>
      </div>
    </div>
    <div class="card" id="oc-avance" style="display:none">
      <div style="display:flex;gap:34px;align-items:center">
        <div title="% recibido: según los ingresos vinculados a esta OC"><span class="hint">Recibido</span><br><span id="oc-pct-rec" style="font-size:19px;font-weight:700"></span></div>
        <div title="% facturado: según las facturas vinculadas a esta OC"><span class="hint">Facturado</span><br><span id="oc-pct-fac" style="font-size:19px;font-weight:700"></span></div>
        <div id="oc-conformidad" style="display:none;margin-left:auto">
          <b style="font-size:12.5px">Conformidad del servicio</b><br>
          <button class="btn btn-secondary btn-sm" onclick="conformidadOC(true)">Recepcionada conforme</button>
          <button class="btn btn-secondary btn-sm" onclick="conformidadOC(false)">Con observaciones → Reclamo</button>
        </div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (auto)</label><input id="oc-id" readonly></div>
        <div class="field"><label>Solicitud de Materiales origen (solo lectura)</label>
          <div style="display:flex;gap:8px"><input id="oc-sol" readonly style="flex:1"><button class="btn btn-secondary btn-sm" onclick="verSolDeOC()">Ver</button></div></div>
        <div class="field"><label>PROVEEDOR <span style="color:var(--cancelada)">*</span> (CT-09)</label>
          <div style="display:flex;gap:8px"><input id="oc-prov" readonly placeholder="Seleccionar proveedor…" style="flex:1"><button class="btn btn-secondary btn-sm" id="oc-b-prov" onclick="openCT09()">Buscar</button></div></div>
        <div class="field"><label>Condición de pago</label>
          <select id="oc-cond"><option>Contado</option><option>Crédito 15 días</option><option>Crédito 30 días</option><option>Crédito 60 días</option></select></div>
        <div class="field"><label>Moneda (CT-08)</label>
          <select id="oc-mon" onchange="ocMoneda()"><option>S/.</option><option>USD</option></select></div>
        <div class="field"><label>Tipo de Cambio</label>
          <input id="oc-tc" value="3.75" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Fecha</label><input type="date" id="oc-fecha" value="2026-07-19"></div>
        <div class="field"><label>Orden de Fabricación (opcional)</label><input id="oc-op" placeholder="OF-000131"></div>
        <div class="field full"><label>Referencia de cotización del proveedor (opcional)</label><input id="oc-ref" placeholder="N° de cotización, validez y condiciones ofrecidas (aún no hay factura)"></div>
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
      <p class="hint" style="margin-top:8px">El IGV nunca se digita: se calcula desde la afectación del artículo (default 18%; importación: se paga en la nacionalización). En OC de SERVICIOS cada línea lleva su Código de servicio; si es para producción indique la Orden de Fabricación.</p>
    </div>

    <div class="card" id="oc-costos" style="display:none;border-left:4px solid var(--opt-compras)">
      <b style="font-size:13px">COSTOS ADICIONALES de importación (proveedor Internacional: aduanas · nacionalización · flete)</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Agente de aduanas (USD)</label><input id="oc-ca-adu" value="0" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Nacionalización / impuestos (USD)</label><input id="oc-ca-nac" value="0" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Flete internacional (USD)</label><input id="oc-ca-fle" value="0" style="text-align:right" oninput="ocTotalesUI()"></div>
        <div class="field"><label>Adjuntos (opcional)</label><button class="btn btn-secondary btn-sm" onclick="toast('Adjuntar documentos de aduanas (prototipo)')">Adjuntar…</button></div>
      </div>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Código</th><th>Nombre</th><th style="text-align:right">Precio unit. USD</th><th style="text-align:right">Costo unitario FINAL (al Kardex, S/.) <span class="warn" title="Prorrateo de costos adicionales por valor; el Kardex valoriza siempre en soles al TC de la OC (inferencia)">⚠</span></th></tr></thead>
        <tbody id="oc-costos-body"></tbody>
      </table>
    </div>

    <div class="card">
      <b style="font-size:13px">Documentos relacionados</b>
      <div id="oc-docs" style="margin-top:10px;font-size:13px"></div>
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
      <p class="hint" style="margin-top:8px">Con ambas validaciones (Logística y Gerencia): Para Recibir y Pagar, tipo de cambio congelado, solicitud origen bloqueada y documento inmutable.</p>
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
      <div class="field wide"><label>Motivo (obligatorio)</label><textarea id="oc-motivo-cancel" rows="3" placeholder="Si había servicio de terceros pendiente, el material retorna vía ingreso a almacén"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co07c')">Volver</button><button class="btn btn-danger" onclick="cancelarOC()">Cancelar OC</button></div>
  </div>
</div>

<!-- CO-07b - agregar item a la orden de compra -->
<div class="overlay" id="m-oc-item">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar &iacute;tem a la orden de compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-07b</span><span class="x" onclick="closeModal('m-oc-item')">&#10005;</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>C&oacute;digo / nombre</label><input id="oc-it-q" placeholder="Buscar..." oninput="renderBuscarOC()"></div>
        <div class="field"><label>Grupo de Art&iacute;culo</label><select id="oc-it-g" onchange="renderBuscarOC()"></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>C&oacute;digo</th><th>Art&iacute;culo</th><th>Unidad de compra</th><th style="text-align:right">&Uacute;ltimo precio</th><th style="width:90px"></th></tr></thead>
        <tbody id="oc-it-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo art&iacute;culos activos marcados como <b>Se compra</b> en su maestro. La unidad que se propone es la unidad de medida de compra del art&iacute;culo; el precio es el &uacute;ltimo registrado y se puede cambiar en la l&iacute;nea.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-oc-item')">Cerrar</button></div>
  </div>
</div>
`);
