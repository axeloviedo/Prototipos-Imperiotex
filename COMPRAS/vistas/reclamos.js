/* COMPRAS · CO-11 Reclamos — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-co11">
    <div class="screen-head">
      <h1>Reclamos a Proveedores</h1><span class="code">CO-11</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevoRec()">+ Registrar Reclamo</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (reclamo / proveedor / OC)</label><input id="f-rec-q" placeholder="Ej. REC-000008, AVÍOS…" oninput="renderRec()"></div>
        <div class="field"><label>Estado</label><select id="f-rec-e" onchange="renderRec()"><option value="">Todos</option><option>Registrado</option><option>Resuelto</option></select></div>
        <div class="field"><label>Resultado</label><select id="f-rec-r" onchange="renderRec()"><option value="">Todos</option><option>Procedente</option><option>No procedente</option><option>Pendiente de gestión</option></select></div>
        <div class="field"><label>Salida</label><select id="f-rec-s" onchange="renderRec()"><option value="">Todas</option><option>Devolución</option><option>Reposición</option><option>Nota de Crédito</option><option>Sin acción</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Proveedor</th><th>OC vinculada</th><th>Motivo</th><th>Resultado</th><th>Salida</th><th>Estado</th><th>F. registro</th><th>F. cierre</th><th style="width:70px"></th></tr></thead>
        <tbody id="rec-body"></tbody>
      </table>
      <div class="pager"><span id="rec-count"></span></div>
    </div>
    <p class="hint">La gestión con el proveedor (WhatsApp, correo, visita) ocurre fuera del sistema: aquí se registra qué falló y con qué resultado se cerró. Solo 2 estados: el resultado y la salida son campos del registro, no estados.</p>
  </section>

  <!-- ==================================================== CO-11 · Reclamo (Registro 3 pasos) -->
  <section class="screen" id="scr-co11f">
    <div class="screen-head">
      <h1 id="rec-titulo">REGISTRAR RECLAMO</h1><span class="code">CO-11</span>
      <span class="badge" id="rec-badge" style="background:var(--reclamo-reg)">Registrado</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="rec-b-cancelar" onclick="go('co11')">Cancelar</button>
      <button class="btn btn-primary" id="rec-b-guardar" onclick="guardarRec()">Registrar Reclamo</button>
      <button class="btn btn-secondary" id="rec-b-volver" onclick="go('co11')">Volver</button>
    </div>

    <div class="card">
      <b style="font-size:13px">PASO 1 · Registrar: qué falló, cuánto y con qué evidencia</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (auto)</label><input id="rec-id" readonly></div>
        <div class="field"><label>OC vinculada <span style="color:var(--cancelada)">*</span></label>
          <div style="display:flex;gap:8px"><input id="rec-oc" readonly placeholder="Seleccionar OC…" style="flex:1"><button class="btn btn-secondary btn-sm" id="rec-b-oc" onclick="abrirRecOC()">Buscar</button></div></div>
        <div class="field"><label>Proveedor (del documento)</label><input id="rec-prov" readonly></div>
        <div class="field"><label>Fecha de registro</label><input type="date" id="rec-freg" value="2026-07-19"></div>
        <div class="field full"><label>Observaciones generales</label><input id="rec-obs" placeholder="Detalle de lo ocurrido"></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:16px">
        <b style="font-size:13px">Artículos o servicios afectados</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="rec-b-additem" onclick="abrirRecItem()">+ Agregar línea</button>
      </div>
      <table class="grid subtable" style="margin-top:10px">
        <thead><tr><th style="width:34px">#</th><th>Código</th><th>Nombre</th><th style="width:150px">Lote <span class="warn" title="Se indica cuando la falla se detecta tarde, en producción">⚠</span></th><th style="width:60px">Unidad</th><th style="width:95px;text-align:right">Recibido</th><th style="width:95px;text-align:right">Fallado</th><th style="width:210px">Motivo (maestro de fallas)</th><th style="width:80px;text-align:right">% fallado</th><th style="width:60px"></th></tr></thead>
        <tbody id="rec-items"></tbody>
      </table>
      <div id="rec-umbral" class="card" style="margin:12px 0 0;display:none"></div>
    </div>

    <div class="card" id="rec-paso2">
      <b style="font-size:13px">PASO 2 · Resultado de la gestión con el proveedor</b>
      <p class="hint" style="margin-top:6px">La gestión ocurre fuera del sistema. Aquí se registra en qué terminó.</p>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Resultado</label>
          <select id="rec-result" onchange="recResultChange()"><option>Pendiente de gestión</option><option>Procedente</option><option>No procedente</option></select></div>
        <div class="field full"><label>Observación del resultado</label><input id="rec-obsres" placeholder="Ej. el proveedor reconoce el faltante y repone en el próximo embarque"></div>
      </div>
    </div>

    <div class="card" id="rec-paso3" style="display:none">
      <b style="font-size:13px">PASO 3 · Salida y cierre</b>
      <p class="hint" style="margin-top:6px">Si el reclamo es Procedente se elige UNA salida; al ejecutarla el reclamo queda Resuelto.</p>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Salida elegida</label>
          <select id="rec-salida" onchange="recSalidaChange()"><option value="">Seleccionar…</option><option>Devolución</option><option>Reposición</option><option>Nota de Crédito</option></select></div>
        <div class="field" id="rec-nc-wrap" style="display:none"><label>Monto de la Nota de Crédito</label><input id="rec-ncmonto" style="text-align:right" placeholder="0.00"></div>
      </div>
      <div id="rec-salida-nota" class="card" style="margin:12px 0 0;border-left:4px solid var(--primario-claro);display:none"></div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <div class="dropwrap" id="rec-b-crear" style="display:none">
          <button class="btn btn-primary" onclick="event.stopPropagation();document.getElementById('rec-crear-menu').classList.toggle('open')">Crear ▾</button>
          <div class="dropmenu" id="rec-crear-menu"></div>
        </div>
        <button class="btn btn-primary" id="rec-b-cerrar" style="display:none" onclick="cerrarRec()">Cerrar reclamo</button>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Documentos relacionados</b>
      <div id="rec-docs" style="margin-top:10px;font-size:13px"></div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-11a Buscar OC para el reclamo -->
<div class="overlay" id="m-co11a">
  <div class="modal lg">
    <div class="modal-h"><b>Vincular Orden de Compra</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-11a</span><span class="x" onclick="closeModal('m-co11a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>OC</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th style="width:100px"></th></tr></thead>
        <tbody id="co11a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">La OC es obligatoria: todo reclamo se sustenta en una compra. Se listan las OCs validadas (con recepción o conformidad en curso).</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co11a')">Cerrar</button></div>
  </div>
</div>

<!-- CO-11b Agregar línea al reclamo -->
<div class="overlay" id="m-co11b">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar artículo o servicio afectado</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-11b</span><span class="x" onclick="closeModal('m-co11b')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre</th><th>Unidad</th><th style="text-align:right">Recibido</th><th style="width:100px"></th></tr></thead>
        <tbody id="co11b-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo los ítems de la OC vinculada. Un reclamo agrupa lo que se resuelve en una misma gestión con el proveedor.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co11b')">Cerrar</button></div>
  </div>
</div>
`);
