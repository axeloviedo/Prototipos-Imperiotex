/* INVENTARIOS · GI-11 Solicitud de Transferencia — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-11 · Solicitud de Transferencia -->
  <section class="screen" id="scr-gi11">
    <div class="screen-head">
      <h1>MOVIMIENTO: TRANSFERENCIA</h1><span class="code">GI-11</span>
      <span class="badge" id="trf-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="trf-b-nota" style="display:none" onclick="imprimirNota('trf')">Imprimir Nota (NT)</button>
      <button class="btn btn-danger" id="trf-b-cancelar" onclick="toast('Transferencia cancelada (solo posible en Borrador)');go('gi07')">Cancelar</button>
      <button class="btn btn-secondary" id="trf-b-guardar" onclick="toast('Borrador guardado')">Guardar borrador</button>
      <button class="btn btn-primary" id="trf-b-aprobar" onclick="aprobarTRF()">Aprobar Transferencia</button>
      <button class="btn btn-primary" id="trf-b-recibir" style="display:none" onclick="abrirRecepcion()">Confirmar Recepción</button>
      <button class="btn btn-danger" id="trf-b-cancelpend" style="display:none" onclick="openModal('m-gi11b')">Cancelar pendientes</button>
      <button class="btn btn-secondary" id="trf-b-volver" style="display:none" onclick="go('gi07')">Volver</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID / Código (auto)</label><input value="TRF-000215" readonly></div>
        <div class="field"><label>Creado por (auto)</label><input value="USER00 · Logística" readonly></div>
        <div class="field"><label>Tipo de documento</label><input value="Transferencia" readonly></div>
        <div class="field"><label>Fecha de movimiento</label><input type="date" value="2026-07-19" id="trf-fecha"></div>
        <div class="field"><label>Almacén origen <span style="color:var(--cancelada)">*</span> (obligatorio)</label>
          <select id="trf-origen"><option value="">Seleccionar…</option><option>SB-ALM-PT · Central Mercadería</option><option>SB-ALM-MPT · MP Telas</option><option>SB-ALM-MPA · MP Avíos</option><option>SB-TDA-01 · Tienda Gamarra 1</option><option>SB-TDA-02 · Tienda Gamarra 2</option></select></div>
        <div class="field"><label>Almacén destino <span style="color:var(--cancelada)">*</span> (obligatorio)</label>
          <select id="trf-destino"><option value="">Seleccionar…</option><option>SB-TDA-01 · Tienda Gamarra 1</option><option>SB-TDA-02 · Tienda Gamarra 2</option><option>SB-ALM-PT · Central Mercadería</option><option>SB-ALM-MPT · MP Telas</option><option>SB-ALM-MPA · MP Avíos</option></select></div>
        <div class="field full"><label>Observaciones</label><input id="trf-obs" placeholder="Reposición de tienda por alerta de mínimos"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="trf-b-add" onclick="openBuscador('trf')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:40px">#</th><th>Código</th><th>Nombre</th><th>Unidad</th><th style="width:110px;text-align:right">Cant. enviada</th><th style="width:110px;text-align:right">Cant. recibida</th><th style="width:100px;text-align:right">Pendiente (auto)</th><th style="width:190px">Lote</th><th style="width:60px"></th></tr></thead>
        <tbody id="trf-items"></tbody>
      </table>
      <p class="hint" style="margin-top:8px">Al aprobar, el stock queda bloqueado: Comprometido en el origen y Pedido en el destino (visibles en Existencias). El lote viaja con el stock y se mantiene idéntico en el destino. La GRE del traslado físico se crea por separado (GI-15), sin vínculo obligatorio.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-11a Confirmar Recepcion -->
<div class="overlay" id="m-gi11a">
  <div class="modal lg">
    <div class="modal-h"><b>Confirmar Recepción</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-11a · CT-05</span><span class="x" onclick="closeModal('m-gi11a')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">¿Está seguro de confirmar la recepción de esta transferencia en el destino?</p>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre</th><th style="text-align:right">Pendiente</th><th style="width:130px;text-align:right">Cant. recibida</th></tr></thead>
        <tbody id="rec-items"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Permite recepción completa o parcial: edite las cantidades recibidas por línea. Los pendientes quedan registrados hasta confirmarse o cancelarse.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi11a')">No</button><button class="btn btn-primary" onclick="confirmarRecepcion()">Sí, confirmar</button></div>
  </div>
</div>

<!-- GI-11b Cancelar Pendientes -->
<div class="overlay" id="m-gi11b">
  <div class="modal">
    <div class="modal-h"><b>Cancelar pendientes</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-11b</span><span class="x" onclick="closeModal('m-gi11b')">✕</span></div>
    <div class="modal-b">
      <p>¿Está seguro de cancelar los pendientes de esta transferencia?</p>
      <p class="hint" style="margin-top:8px">La transferencia parcial se cierra: los pendientes se cancelan y la reserva se libera devolviéndose al stock del origen <span class="warn" title="Inferencia a afinar">⚠</span>.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi11b')">No</button><button class="btn btn-primary" onclick="cancelarPendientes()">Sí, cancelar pendientes</button></div>
  </div>
</div>
`);
