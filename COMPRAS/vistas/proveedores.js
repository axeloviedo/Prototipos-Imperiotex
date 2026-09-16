/* COMPRAS · CO-01/02/03 Proveedores y Grupos de Proveedor, CT-09 buscador de proveedor — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== CO-01 · Proveedores (Lista) -->
  <section class="screen" id="scr-co01">
    <div class="screen-head">
      <h1>Proveedores</h1><span class="code">CO-01</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="renderGrupos();openModal('m-co03')">Grupos de Proveedor</button>
      <button class="btn btn-primary" onclick="nuevoProv()">+ Nuevo Proveedor</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (nombre / documento)</label><input id="f-prv-q" placeholder="Ej. TEXTIL, 20512…" oninput="renderProv()"></div>
        <div class="field"><label>Grupo de proveedor</label><select id="f-prv-g" onchange="renderProv()"><option value="">Todos</option></select></div>
        <div class="field"><label>Tipo</label><select id="f-prv-t" onchange="renderProv()"><option value="">Todos</option><option>Nacional</option><option>Internacional</option></select></div>
        <div class="field"><label>Estado</label><select id="f-prv-e" onchange="renderProv()"><option value="">Todos</option><option>Activo</option><option>Inactivo</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Grupo de proveedor</th><th>Tipo y N° de documento</th><th>Estado</th><th style="width:150px">Acciones</th></tr></thead>
        <tbody id="prv-body"></tbody>
      </table>
      <div class="pager"><span id="prv-count"></span></div>
    </div>
    <p class="hint">El conocimiento de proveedores que hoy vive solo en Gerencia queda registrado y disponible. Un proveedor Internacional habilita compras en USD (CT-08, Ola 2).</p>
  </section>

  <!-- ==================================================== CO-02 · Proveedor (Formulario / Ver) -->
  <section class="screen" id="scr-co02">
    <div class="screen-head">
      <h1 id="prv-titulo">NUEVO PROVEEDOR</h1><span class="code">CO-02</span>
      <span class="badge" id="prv-badge" style="background:var(--confirmado)">Activo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="prv-b-cancelar" onclick="go('co01')">Cancelar</button>
      <button class="btn btn-danger" id="prv-b-desactivar" style="display:none" onclick="desactivarProv()">Desactivar</button>
      <button class="btn btn-secondary" id="prv-b-editar" style="display:none" onclick="editarProv()">Editar</button>
      <button class="btn btn-primary" id="prv-b-guardar" onclick="guardarProv()">Guardar</button>
      <button class="btn btn-secondary" id="prv-b-volver" style="display:none" onclick="go('co01')">Volver</button>
    </div>

    <div class="card" style="padding:0 16px">
      <div style="display:flex;gap:2px">
        <button class="tabbtn active" id="prv-tab-datos" onclick="prvTab('datos')">Datos del proveedor</button>
        <button class="tabbtn" id="prv-tab-compras" onclick="prvTab('compras')">Historial de compras <span class="warn" title="Pestañas de solo lectura en Ver (inferencia)">⚠</span></button>
        <button class="tabbtn" id="prv-tab-reclamos" onclick="prvTab('reclamos')">Reclamos y calidad <span class="warn" title="Pestañas de solo lectura en Ver (inferencia)">⚠</span></button>
      </div>
    </div>

    <div id="prv-pane-datos">
      <div class="card">
        <b style="font-size:13px">Detalles generales (obligatorios)</b>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>ID (auto)</label><input id="prv-id" value="" readonly></div>
          <div class="field"><label>Tipo de proveedor <span style="color:var(--cancelada)">*</span></label>
            <select id="prv-tipo"><option value="">Seleccionar…</option><option>Nacional</option><option>Internacional</option></select></div>
          <div class="field"><label>Nombre del proveedor <span style="color:var(--cancelada)">*</span></label><input id="prv-nombre" placeholder="Razón social o nombre"></div>
          <div class="field"><label>Grupo de Proveedor</label>
            <div style="display:flex;gap:8px"><select id="prv-grupo" style="flex:1"></select><button class="btn btn-secondary btn-sm" onclick="renderGrupos();openModal('m-co03')">Gestionar</button></div></div>
          <div class="field"><label>Tipo de documento <span style="color:var(--cancelada)">*</span></label>
            <select id="prv-tdoc"><option selected>RUC</option><option>DNI</option><option>Tax ID (extranjero)</option></select></div>
          <div class="field"><label>N° de documento <span style="color:var(--cancelada)">*</span> <span class="warn" title="Único por proveedor (inferencia)">⚠</span></label><input id="prv-ndoc" placeholder="Ej. 20512345678"></div>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Contacto principal (opcional)</b>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>Primer Nombre</label><input id="prv-cnom"></div>
          <div class="field"><label>Apellido</label><input id="prv-cape"></div>
          <div class="field"><label>Email</label><input id="prv-cmail" placeholder="correo@dominio.com"></div>
          <div class="field"><label>Teléfono</label><input id="prv-ctel" placeholder="+51 …"></div>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Detalles de la Dirección (opcional)</b>
        <div class="formgrid" style="margin-top:12px">
          <div class="field full"><label>Dirección línea 1</label><input id="prv-dir"></div>
          <div class="field"><label>País</label><input id="prv-pais" value="PERU"></div>
          <div class="field"><label>Provincia</label><input id="prv-prov"></div>
          <div class="field"><label>Ciudad</label><input id="prv-ciu"></div>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Condiciones comerciales y fiscales (opcional)</b>
        <p class="hint" style="margin-top:4px">Datos del socio de negocio usados por Compras y Contabilidad (portados del maestro Socio de Negocio del modelo propuesto).</p>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>Moneda</label><select id="prv-moneda"><option>Soles</option><option>Dólares</option><option>Todas</option></select></div>
          <div class="field"><label>Condiciones de pago</label><select id="prv-cndpago"><option>Contado</option><option>Crédito 15 días</option><option>Crédito 30 días</option><option>Crédito 60 días</option></select></div>
          <div class="field"><label>Sujeto a retención</label><select id="prv-retencion"><option>No</option><option>Sí</option></select></div>
          <div class="field"><label>Indicador de impuestos</label><select id="prv-igv"><option>IGV (18%)</option><option>Exonerado (EXE)</option><option>Inafecto</option></select></div>
          <div class="field"><label>Teléfono móvil</label><input id="prv-cmovil" placeholder="+51 …"></div>
        </div>
      </div>
    </div>

    <div id="prv-pane-compras" style="display:none">
      <div class="card">
        <b style="font-size:13px">Historial de compras</b>
        <table class="grid subtable" style="margin-top:12px">
          <thead><tr><th>OC</th><th>Fecha</th><th>Concepto</th><th style="text-align:right">Monto</th><th>Estado</th></tr></thead>
          <tbody id="prv-hist-compras"></tbody>
        </table>
        <p class="hint" style="margin-top:8px">El insumo para evaluar la continuidad del proveedor. Las OCs se abren en su bandeja (Ola 2).</p>
      </div>
    </div>

    <div id="prv-pane-reclamos" style="display:none">
      <div class="card">
        <b style="font-size:13px">Historial de reclamos y calidad</b>
        <table class="grid subtable" style="margin-top:12px">
          <thead><tr><th>Reclamo</th><th>Fecha</th><th>Motivo</th><th>Resultado</th><th>Salida</th></tr></thead>
          <tbody id="prv-hist-reclamos"></tbody>
        </table>
        <div id="prv-nc-pend" class="card" style="margin:12px 0 4px;border-left:4px solid var(--pendiente);display:none"></div>
      </div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- CO-01a Modal eliminar proveedor -->
<div class="overlay" id="m-co01a">
  <div class="modal">
    <div class="modal-h"><b>Eliminar proveedor</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-01a</span><span class="x" onclick="closeModal('m-co01a')">✕</span></div>
    <div class="modal-b" id="co01a-body"></div>
    <div class="modal-f" id="co01a-foot"></div>
  </div>
</div>

<!-- CO-03 Grupos de Proveedor (CRUD en modal) -->
<div class="overlay" id="m-co03">
  <div class="modal lg">
    <div class="modal-h"><b>Grupos de Proveedor</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CO-03</span><span class="x" onclick="closeModal('m-co03')">✕</span></div>
    <div class="modal-b">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div class="field" style="flex:1"><label>Buscar grupo</label><input id="grp-q" placeholder="Buscar…" oninput="renderGrupos()"></div>
        <div class="field" style="flex:1"><label>Nombre del Grupo de Proveedor</label><input id="grp-nuevo" placeholder="Ej. Estampado"></div>
        <div style="display:flex;align-items:flex-end"><button class="btn btn-primary" onclick="crearGrupo()">+ Crear</button></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Grupo</th><th style="width:150px;text-align:right">Proveedores asignados</th><th style="width:150px">Acciones</th></tr></thead>
        <tbody id="grp-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px"><b>Grupo de Proveedor</b> es el nombre definitivo: es genérico y se entiende en cualquier empresa, que era el criterio pedido en la revisión funcional. Todo vive en modales, sin pantalla completa. No se elimina un grupo con proveedores asignados <span class="warn" title="Reasignar antes (inferencia)">⚠</span>.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-co03')">Cerrar</button></div>
  </div>
</div>

<!-- CT-09 Buscar Proveedor -->
<div class="overlay" id="m-ct09">
  <div class="modal lg">
    <div class="modal-h"><b>Buscar proveedor</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CT-09</span><span class="x" onclick="closeModal('m-ct09')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:12px">
        <div class="field"><label>Nombre / N° de documento</label><input id="ct09-q" placeholder="Buscar…" oninput="renderCT09()"></div>
        <div class="field"><label>Grupo de proveedor</label><select id="ct09-g" onchange="renderCT09()"><option value="">Todos</option></select></div>
        <div class="field"><label>Tipo</label><select id="ct09-t" onchange="renderCT09()"><option value="">Todos</option><option>Nacional</option><option>Internacional</option></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Nombre</th><th>Tipo y N° de documento</th><th>Grupo</th><th>Tipo</th><th style="width:100px"></th></tr></thead>
        <tbody id="ct09-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo proveedores activos. "+ Nuevo Proveedor" abre CO-02 sin perder el documento en curso <span class="warn" title="Inferencia a afinar">⚠</span>.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-ct09');nuevoProv();toast('Al guardar el proveedor, vuelva a la OC (prototipo)')">+ Nuevo Proveedor</button><button class="btn btn-secondary" onclick="closeModal('m-ct09')">Cerrar</button></div>
  </div>
</div>
`);
