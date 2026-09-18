/* COMPRAS · CO-01/02/03 Proveedores y Grupos de Proveedor, CT-09 buscador de proveedor — HTML
   Conectado a la base compartida: BD.d.maestros.proveedores / gruposProveedor / condicionesPago */
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
        <div class="field"><label>Buscar (código / nombre / documento)</label><input id="f-prv-q" placeholder="Ej. PROV-0005, LANDEO, 20456…" oninput="renderProv()"></div>
        <div class="field"><label>Grupo de proveedor</label><select id="f-prv-g" onchange="renderProv()"><option value="">Todos</option></select></div>
        <div class="field"><label>Tipo</label><select id="f-prv-t" onchange="renderProv()"><option value="">Todos</option><option>Nacional</option><option>Internacional</option></select></div>
        <div class="field"><label>Estado</label><select id="f-prv-e" onchange="renderProv()"><option value="">Todos</option><option>Activo</option><option>Inactivo</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Grupo de proveedor</th><th>Tipo y N° de documento</th><th>Condición de pago</th><th>Servicio que presta</th><th>Estado</th><th style="width:150px">Acciones</th></tr></thead>
        <tbody id="prv-body"></tbody>
      </table>
      <div class="pager"><span id="prv-count"></span></div>
    </div>
    <p class="hint">Maestro de proveedores de la base compartida (lo usan Inventarios, Compras y Producción). Un proveedor Internacional habilita compras en USD. Los datos marcados «a confirmar» son supuestos del prototipo (RUC, condiciones) que el usuario debe validar.</p>
  </section>

  <!-- ==================================================== CO-02 · Proveedor (Formulario / Ver) -->
  <section class="screen" id="scr-co02">
    <div class="screen-head">
      <h1 id="prv-titulo">NUEVO PROVEEDOR</h1><span class="code">CO-02</span>
      <span class="badge" id="prv-badge" style="background:var(--confirmado)">Activo</span>
      <span class="badge" id="prv-aconf" style="display:none;background:var(--pendiente)" title="Datos inventados en el prototipo: confirmar con el usuario">Datos a confirmar</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="prv-b-cancelar" onclick="go('co01')">Cancelar</button>
      <button class="btn btn-danger" id="prv-b-desactivar" style="display:none" onclick="desactivarProv()">Desactivar</button>
      <button class="btn btn-secondary" id="prv-b-activar" style="display:none" onclick="activarProv()">Activar</button>
      <button class="btn btn-secondary" id="prv-b-editar" style="display:none" onclick="editarProv()">Editar</button>
      <button class="btn btn-primary" id="prv-b-guardar" onclick="guardarProv()">Guardar</button>
      <button class="btn btn-secondary" id="prv-b-volver" style="display:none" onclick="go('co01')">Volver</button>
    </div>

    <div class="card" style="padding:0 16px">
      <div style="display:flex;gap:2px">
        <button class="tabbtn active" id="prv-tab-datos" onclick="prvTab('datos')">Datos del proveedor</button>
        <button class="tabbtn" id="prv-tab-compras" onclick="prvTab('compras')">Historial de compras</button>
        <button class="tabbtn" id="prv-tab-reclamos" onclick="prvTab('reclamos')">Reclamos y calidad <span class="warn" title="Reclamos: datos de ejemplo, no conectados a la base">⚠</span></button>
      </div>
    </div>

    <div id="prv-pane-datos">
      <div class="card">
        <b style="font-size:13px">Detalles generales (obligatorios)</b>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>Código (auto)</label><input id="prv-id" value="" readonly></div>
          <div class="field"><label>Tipo de proveedor <span style="color:var(--cancelada)">*</span></label>
            <select id="prv-tipo"><option value="">Seleccionar…</option><option>Nacional</option><option>Internacional</option></select></div>
          <div class="field"><label>Razón social <span style="color:var(--cancelada)">*</span></label><input id="prv-nombre" placeholder="Razón social o nombre"></div>
          <div class="field"><label>Nombre comercial</label><input id="prv-comercial" placeholder="Como se le conoce"></div>
          <div class="field"><label>Grupo de Proveedor</label>
            <div style="display:flex;gap:8px"><select id="prv-grupo" style="flex:1"></select><button class="btn btn-secondary btn-sm" id="prv-b-grupos" onclick="renderGrupos();openModal('m-co03')">Gestionar</button></div></div>
          <div class="field"><label>Tipo de documento <span style="color:var(--cancelada)">*</span></label>
            <select id="prv-tdoc"><option selected>RUC</option><option>DNI</option><option>Tax ID</option></select></div>
          <div class="field"><label>N° de documento <span style="color:var(--cancelada)">*</span> <span class="warn" title="Único por proveedor">⚠</span></label><input id="prv-ndoc" placeholder="Ej. 20456123789"></div>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Contacto y dirección (opcional)</b>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>Email</label><input id="prv-email" placeholder="correo@dominio.com"></div>
          <div class="field"><label>Teléfono</label><input id="prv-tel" placeholder="01-…"></div>
          <div class="field"><label>Celular</label><input id="prv-cel" placeholder="9…"></div>
          <div class="field full"><label>Dirección</label><input id="prv-dir"></div>
          <div class="field"><label>Ubigeo (departamento / provincia / distrito)</label><input id="prv-ubigeo" placeholder="LIMA / Lima / La Victoria"></div>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Condiciones comerciales y fiscales</b>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>Moneda</label><select id="prv-mon"><option value="S/.">Soles (S/.)</option><option value="USD">Dólares (USD)</option></select></div>
          <div class="field"><label>Condición de pago</label><select id="prv-cond"></select></div>
          <div class="field"><label>Sujeto a retención</label><select id="prv-retencion"><option value="no">No</option><option value="si">Sí</option></select></div>
          <div class="field"><label>Sujeto a detracción</label><select id="prv-detraccion"><option value="no">No</option><option value="si">Sí</option></select></div>
        </div>
      </div>
      <div class="card">
        <b style="font-size:13px">Servicio de terceros (opcional)</b>
        <p class="hint" style="margin-top:4px">Para talleres y lavanderías: el servicio que presta (artículo SRV), el almacén donde queda el material mientras lo tiene y los días estimados de atención.</p>
        <div class="formgrid" style="margin-top:12px">
          <div class="field"><label>Servicio que presta</label><select id="prv-servicio"></select></div>
          <div class="field"><label>Almacén del material enviado</label><select id="prv-alm"></select></div>
          <div class="field"><label>Días estimados</label><input id="prv-diasest" style="text-align:right" placeholder="0"></div>
        </div>
      </div>
    </div>

    <div id="prv-pane-compras" style="display:none">
      <div class="card">
        <b style="font-size:13px">Órdenes de compra del proveedor</b>
        <table class="grid subtable" style="margin-top:12px">
          <thead><tr><th>OC</th><th>Fecha</th><th>Concepto</th><th style="text-align:right">Monto</th><th style="text-align:right">% Recibido</th><th style="text-align:right">% Facturado</th><th>Estado</th></tr></thead>
          <tbody id="prv-hist-compras"></tbody>
        </table>
        <p class="hint" style="margin-top:8px">Calculado de las órdenes de compra de la base. Abra una OC para ver su detalle, recepciones y facturas.</p>
      </div>
    </div>

    <div id="prv-pane-reclamos" style="display:none">
      <div class="card">
        <b style="font-size:13px">Historial de reclamos y calidad</b> <span class="badge" style="background:var(--pendiente)">Datos de ejemplo · no conectado a la base</span>
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
        <div class="field" style="flex:1"><label>Descripción</label><input id="grp-desc" placeholder="Opcional"></div>
        <div style="display:flex;align-items:flex-end"><button class="btn btn-primary" onclick="crearGrupo()">+ Crear</button></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:80px">Código</th><th>Grupo</th><th>Descripción</th><th style="width:130px;text-align:right">Proveedores asignados</th><th style="width:150px">Acciones</th></tr></thead>
        <tbody id="grp-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Grupos del maestro compartido (estructura organizativa): el proveedor guarda el código del grupo. Al crear uno, el código se propone con las primeras letras del nombre. No se elimina un grupo con proveedores asignados: reasígnelos antes. Renombrar no cambia el código, así que los proveedores no se tocan.</p>
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
        <div class="field"><label>Código / nombre / N° de documento</label><input id="ct09-q" placeholder="Buscar…" oninput="renderCT09()"></div>
        <div class="field"><label>Grupo de proveedor</label><select id="ct09-g" onchange="renderCT09()"><option value="">Todos</option></select></div>
        <div class="field"><label>Tipo</label><select id="ct09-t" onchange="renderCT09()"><option value="">Todos</option><option>Nacional</option><option>Internacional</option></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre</th><th>Tipo y N° de documento</th><th>Grupo</th><th>Servicio</th><th>Tipo</th><th style="width:100px"></th></tr></thead>
        <tbody id="ct09-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo proveedores activos. Si la orden tiene servicios, se listan primero los proveedores que prestan ese servicio.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-ct09');nuevoProv();toast('Al guardar el proveedor, vuelva a la OC')">+ Nuevo Proveedor</button><button class="btn btn-secondary" onclick="closeModal('m-ct09')">Cerrar</button></div>
  </div>
</div>
`);
