/* INVENTARIOS · GI-13 Solicitudes de Materiales (BD.d.sols con Docs.sol) — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-gi13">
    <div class="screen-head">
      <h1>Solicitudes de Materiales</h1><span class="code">GI-13</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaSOL()">+ Nueva Solicitud</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar</label><input id="f-sol-q" placeholder="SOL, OF, SF o artículo…" oninput="renderSol()"></div>
        <div class="field"><label>Estado</label><select id="f-sol-e" onchange="renderSol()"><option value="">Todos</option><option>Borrador</option><option>Pendiente</option><option>Aprobada</option><option>En proceso</option><option>Atendida</option><option>Rechazada</option><option>Anulada</option></select></div>
        <div class="field"><label>Área</label><select id="f-sol-a" onchange="renderSol()"><option value="">Todas</option><option>Producción</option><option>Logística</option><option>Comercial</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Fecha</th><th>Área · Solicitante</th><th>Destino</th><th>Artículos</th><th>Propósito</th><th>Documentos</th><th>Fecha req.</th><th>Estado</th></tr></thead>
        <tbody id="sol-body"></tbody>
      </table>
      <div class="pager"><span id="sol-count"></span></div>
    </div>
    <p class="hint">Cualquier área solicita <b>qué</b> necesita y <b>a dónde</b> (Producción lo hace desde sus órdenes, p. ej. el servicio de lavado SRV-0001 con destino SB-TRANSITO). Logística revisa existencias y, <b>por cada línea</b>, define el propósito: <b>Transferencia</b> desde un almacén con stock o <b>Compra</b> (Orden de Compra con el proveedor elegido). Un servicio (SRV) solo se compra. Una Solicitud de Materiales no es una Solicitud de Fabricación (GI-21).</p>
  </section>

  <!-- ==================================================== GI-13F · Solicitud -->
  <section class="screen" id="scr-gi13f">
    <div class="screen-head">
      <h1 id="sol-titulo">SOLICITUD DE MATERIALES</h1><span class="code">GI-13</span>
      <span class="badge" id="sol-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="sol-b-volver" onclick="go('gi13')">Volver</button>
      <button class="btn btn-danger" id="sol-b-anular" onclick="anularSOL()">Anular</button>
      <button class="btn btn-secondary" id="sol-b-guardar" onclick="guardarSOL(false)">Guardar borrador</button>
      <button class="btn btn-primary" id="sol-b-enviar" onclick="guardarSOL(true)">Enviar a Logística</button>
      <button class="btn btn-danger" id="sol-b-rechazar" onclick="openModal('m-gi13a')">Rechazar</button>
      <button class="btn btn-primary" id="sol-b-aprobar" onclick="aprobarSOL()">Aprobar</button>
      <div class="dropwrap" id="sol-b-crear">
        <button class="btn btn-primary" onclick="event.stopPropagation();crearMenuSOL();document.getElementById('sol-crear-menu').classList.toggle('open')">Atender ▾</button>
        <div class="dropmenu" id="sol-crear-menu"></div>
      </div>
    </div>
    <div class="card" id="sol-nota" style="display:none;border-left:4px solid var(--aprobado-sol)"></div>
    <div class="gp2col">
      <div>
        <div class="card">
          <b style="font-size:13px">Detalles generales</b>
          <div class="formgrid" style="margin-top:12px">
            <div class="field"><label>ID</label><input id="sol-id" readonly></div>
            <div class="field"><label>Área · Solicitante</label><input id="sol-user" readonly></div>
            <div class="field"><label>Fecha de requerimiento</label><input type="date" id="sol-freq"></div>
            <div class="field req"><label>Almacén destino</label><select id="sol-alm" onchange="renderSOLform()"></select></div>
            <div class="field full"><label>Observaciones</label><input id="sol-obs" placeholder="Qué se necesita y para qué"></div>
            <div class="field full" id="sol-vinc-fld"><label>Vinculada a</label><div id="sol-vinc" style="padding:6px 0"></div></div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <b style="font-size:13px">Listado de artículos</b>
            <div style="flex:1"></div>
            <button class="btn btn-secondary btn-sm" id="sol-b-add" onclick="openBuscador('sol')">+ Agregar artículo</button>
          </div>
          <div class="tbl-wrap" style="margin:0">
          <table class="grid subtable">
            <thead id="sol-items-head"></thead>
            <tbody id="sol-items"></tbody>
          </table>
          </div>
          <p class="hint" style="margin-top:8px" id="sol-items-hint">Tabla sin precio. El solicitante indica qué y a dónde; Logística define el propósito de cada línea al aprobar.</p>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Historial</b>
        <div id="sol-hist" style="margin-top:10px;font-size:13px"></div>
      </div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-13a Rechazar solicitud -->
<div class="overlay" id="m-gi13a">
  <div class="modal">
    <div class="modal-h"><b>Rechazar solicitud</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-13a</span><span class="x" onclick="closeModal('m-gi13a')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">¿Está seguro de rechazar esta solicitud de materiales?</p>
      <div class="field wide"><label>Motivo del rechazo (obligatorio)</label>
      <textarea id="sol-motivo-rechazo" rows="3" placeholder="El solicitante verá este motivo en el historial"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi13a')">Cancelar</button><button class="btn btn-danger" onclick="rechazarSOL()">Rechazar solicitud</button></div>
  </div>
</div>

<!-- GI-13b Crear Orden de Compra desde la solicitud -->
<div class="overlay" id="m-gi13b">
  <div class="modal lg">
    <div class="modal-h"><b>Crear Orden de Compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-13b</span><span class="x" onclick="closeModal('m-gi13b')">✕</span></div>
    <div class="modal-b">
      <div class="formgrid">
        <div class="field full req"><label>Proveedor</label><select id="sol-oc-prov"></select></div>
      </div>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th>Código</th><th>Artículo</th><th style="text-align:right">Cantidad</th><th style="width:140px;text-align:right">Precio unit. S/.</th></tr></thead>
        <tbody id="sol-oc-items"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Se crea en <b>Borrador</b> con las líneas de propósito Compra pendientes y se abre en Compras (CO-07) para enviarla, validarla y aprobarla. El precio propuesto es el de referencia del artículo (o el costo estándar del servicio).</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi13b')">Cancelar</button><button class="btn btn-primary" onclick="confirmarOCdesdeSOL()">Crear Orden de Compra</button></div>
  </div>
</div>
`);
