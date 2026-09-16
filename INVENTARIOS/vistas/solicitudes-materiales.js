/* INVENTARIOS · GI-13 Solicitudes de Materiales — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-gi13">
    <div class="screen-head">
      <h1>Solicitudes de Materiales</h1><span class="code">GI-13</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="loadSOL('nueva')">+ Nueva Solicitud</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Desde</label><input type="date" value="2026-07-01"></div>
        <div class="field"><label>Hasta</label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Estado</label><select id="f-sol-e" onchange="renderSol()"><option value="">Todos</option><option>Pendiente</option><option>Aprobado</option><option>Rechazado</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID de la solicitud</th><th>Estado</th><th>Propósito</th><th>Fecha de requerimiento</th><th>Fecha de creación</th><th style="width:70px">Acciones</th></tr></thead>
        <tbody id="sol-body"></tbody>
      </table>
      <div class="pager"><span id="sol-count"></span></div>
    </div>
    <p class="hint">Cualquier área solicita <b>qué</b> necesita y <b>a dónde</b>. Logística revisa existencias y, <b>por cada línea</b>, define el propósito: <b>Compra</b> (se crea la Orden de Compra) o <b>Transferencia</b> (se crea la transferencia GI-11 desde el almacén de origen). <span class="warn" title="Aclaración">ℹ</span> Una Solicitud de Materiales no es una Solicitud de Fabricación (GI-21).</p>
  </section>

  <!-- ==================================================== GI-13F · Solicitud (Crear / Ver) -->
  <section class="screen" id="scr-gi13f">
    <div class="screen-head">
      <h1>SOLICITUD DE MATERIALES</h1><span class="code">GI-13</span>
      <span class="badge" id="sol-badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="sol-b-cancelar" onclick="go('gi13')">Cancelar</button>
      <button class="btn btn-primary" id="sol-b-enviar" onclick="enviarSOL()">Enviar solicitud</button>
      <button class="btn btn-danger" id="sol-b-rechazar" style="display:none" onclick="openModal('m-gi13a')">Rechazar</button>
      <button class="btn btn-primary" id="sol-b-aprobar" style="display:none" onclick="aprobarSOL()">Aprobar</button>
      <button class="btn btn-secondary" id="sol-b-volver" style="display:none" onclick="go('gi13')">Volver</button>
      <div class="dropwrap" id="sol-b-crear">
        <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('sol-crear-menu').classList.toggle('open')">Crear ▾</button>
        <div class="dropmenu" id="sol-crear-menu"></div>
      </div>
    </div>
    <div class="card" id="sol-nota" style="display:none;border-left:4px solid var(--aprobado-sol)"></div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (auto)</label><input id="sol-id" value="" readonly></div>
        <div class="field"><label>Solicitante (auto)</label><input id="sol-user" value="" readonly></div>
        <div class="field"><label>Fecha de requerimiento (para cuándo se necesita)</label><input type="date" id="sol-freq" value="2026-07-24"></div>
        <div class="field"><label>Almacén destino <span class="warn" title="Campo inferido, a afinar">⚠</span></label>
          <select id="sol-alm"><option value="">Seleccionar…</option><option>SB-ALM-MPT · MP Telas</option><option>SB-ALM-MPA · MP Avíos</option><option>SB-ALM-PT · Central Mercadería</option><option>SB-TDA-01 · Tienda Gamarra 1</option><option>SB-TDA-02 · Tienda Gamarra 2</option></select></div>
        <div class="field full"><label>Observaciones</label><input id="sol-obs" placeholder="Qué se necesita y para qué"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="sol-b-add" onclick="openBuscador('sol')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead id="sol-items-head"></thead>
        <tbody id="sol-items"></tbody>
      </table>
      <p class="hint" style="margin-top:8px">Tabla sin precio. El solicitante indica qué y a dónde; Logística define el propósito de cada línea al aprobar.</p>
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
      <div class="field wide"><label>Motivo del rechazo (obligatorio) <span class="warn" title="Inferencia a afinar">⚠</span></label>
      <textarea id="sol-motivo-rechazo" rows="3" placeholder="Explique por qué se rechaza; el solicitante recibirá la notificación con este motivo"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi13a')">Cancelar</button><button class="btn btn-danger" onclick="rechazarSOL()">Rechazar solicitud</button></div>
  </div>
</div>
`);
