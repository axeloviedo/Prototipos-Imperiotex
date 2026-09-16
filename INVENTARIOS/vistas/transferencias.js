/* INVENTARIOS · GI-11 Solicitud de Transferencia entre almacenes en dos pasos (BD.d.trfs con Docs.trf) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-11 · Solicitud de Transferencia -->
  <section class="screen" id="scr-gi11">
    <div class="screen-head">
      <h1 id="trf-titulo">SOLICITUD DE TRANSFERENCIA</h1><span class="code">GI-11</span>
      <span class="badge" id="trf-badge" style="background:var(--borrador)">Nuevo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi07')">Volver</button>
      <button class="btn btn-danger" id="trf-b-cancelar" onclick="cancelarST()">Cancelar</button>
      <button class="btn btn-secondary" id="trf-b-guardar" onclick="guardarST(false)">Guardar borrador</button>
      <button class="btn btn-primary" id="trf-b-aprobar" onclick="guardarST(true)">Aprobar Transferencia</button>
      <button class="btn btn-danger" id="trf-b-cancelpend" onclick="openModal('m-gi11b')">Cancelar pendientes</button>
      <button class="btn btn-primary" id="trf-b-recibir" onclick="abrirRecepcion()">Confirmar Recepción</button>
    </div>
    <div class="card" id="trf-aviso" style="display:none;border-left:4px solid var(--aprobada);background:#EFF6FF"></div>
    <div class="gp2col">
      <div>
        <div class="card">
          <b style="font-size:13px">Detalles generales</b>
          <div class="formgrid" style="margin-top:12px">
            <div class="field"><label>N°</label><input id="trf-id" readonly></div>
            <div class="field"><label>Registrado por</label><input id="trf-user" readonly></div>
            <div class="field req"><label>Tipo de movimiento</label><select id="trf-tipo"></select></div>
            <div class="field"><label>Fecha</label><input id="trf-fecha" readonly></div>
            <div class="field req"><label>Almacén origen</label><select id="trf-origen" onchange="sugerirTipoTRF();renderTRF()"></select></div>
            <div class="field req"><label>Almacén destino</label><select id="trf-destino" onchange="sugerirTipoTRF();renderTRF()"></select></div>
            <div class="field full"><label>Observaciones</label><input id="trf-obs" placeholder="Ej. reposición de tienda por alerta de mínimos"></div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <b style="font-size:13px">Listado de artículos</b>
            <div style="flex:1"></div>
            <button class="btn btn-secondary btn-sm" id="trf-b-add" onclick="openBuscador('trf')">+ Agregar artículo</button>
          </div>
          <table class="grid subtable">
            <thead id="trf-head"></thead><tbody id="trf-items"></tbody><tfoot id="trf-foot"></tfoot>
          </table>
          <p class="hint" style="margin-top:8px">Al <b>aprobar</b>, el stock queda Comprometido en el origen y como Pedido en el destino (visibles en Existencias). Al <b>confirmar la recepción</b> (total o parcial) se registra la transferencia en el Kardex de ambos almacenes; los pendientes se reciben después o se cancelan (se libera lo comprometido). La nota interna (NT) y la Guía de Remisión se generan desde el movimiento (GI-08).</p>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Historial</b>
        <div id="trf-hist" style="margin-top:10px;font-size:13px"></div>
      </div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-11a Confirmar Recepción -->
<div class="overlay" id="m-gi11a">
  <div class="modal lg">
    <div class="modal-h"><b>Confirmar Recepción</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-11a · CT-05</span><span class="x" onclick="closeModal('m-gi11a')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">Indique lo recibido en el destino. Se permite recepción parcial: lo pendiente queda por recibir o se cancela.</p>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre</th><th style="text-align:right">Pendiente</th><th style="width:140px;text-align:right">Cant. recibida</th></tr></thead>
        <tbody id="rec-items"></tbody>
      </table>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi11a')">No</button><button class="btn btn-primary" onclick="confirmarRecepcion()">Sí, confirmar</button></div>
  </div>
</div>

<!-- GI-11b Cancelar pendientes -->
<div class="overlay" id="m-gi11b">
  <div class="modal">
    <div class="modal-h"><b>Cancelar pendientes</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-11b</span><span class="x" onclick="closeModal('m-gi11b')">✕</span></div>
    <div class="modal-b">
      <p>¿Cancelar lo pendiente de recibir de esta transferencia?</p>
      <p class="hint" style="margin-top:8px">La transferencia se cierra: se libera el comprometido del origen y el pedido del destino.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi11b')">No</button><button class="btn btn-primary" onclick="cancelarPendientes()">Sí, cancelar pendientes</button></div>
  </div>
</div>
`);
