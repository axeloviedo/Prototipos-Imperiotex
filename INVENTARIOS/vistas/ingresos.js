/* INVENTARIOS · GI-09 Crear Ingreso (manual o desde una Orden de Compra de bienes) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-09 · Crear Ingreso -->
  <section class="screen" id="scr-gi09">
    <div class="screen-head">
      <h1>MOVIMIENTO: INGRESO</h1><span class="code">GI-09</span>
      <span class="badge" style="background:var(--borrador)">Nuevo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi07')">Cancelar</button>
      <button class="btn btn-primary" onclick="pedirConfirmarIngreso()">Confirmar Ingreso</button>
    </div>
    <div class="card" id="gi09-oc-aviso" style="display:none;border-left:4px solid var(--aprobada);background:#EFF6FF"></div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (se asigna al confirmar)</label><input id="gi09-id" readonly></div>
        <div class="field"><label>Registrado por</label><input id="gi09-user" readonly></div>
        <div class="field req"><label>Tipo de movimiento</label><select id="gi09-tipo"></select></div>
        <div class="field"><label>Orden de Compra vinculada</label>
          <div style="display:flex;gap:8px"><input id="gi09-ndoc" placeholder="N° de documento libre" style="flex:1"><button class="btn btn-secondary btn-sm" id="gi09-b-vinc" onclick="abrirVincularOC()">Vincular OC</button><button class="btn btn-secondary btn-sm" id="gi09-b-desv" style="display:none" onclick="nuevoIngreso()">Quitar</button></div></div>
        <div class="field"><label>Fecha de movimiento</label><input id="gi09-fecha" readonly></div>
        <div class="field"><label>Origen</label><input id="gi09-origen" placeholder="Proveedor, cliente o motivo"></div>
        <div class="field req"><label>Almacén destino</label><select id="gi09-alm" onchange="renderIngreso()"></select></div>
        <div class="field"><label id="lbl-refetq-09">N° Referencia <span class="hint">(se imprime en la etiqueta)</span></label><input id="gi09-refetq" placeholder="Ej. REF-0001"></div>
        <div class="field full"><label>Observaciones</label><input id="gi09-obs" placeholder="Diferencias contra lo vinculado u otras notas"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" id="gi09-b-add" onclick="openBuscador('gi09')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead id="gi09-head"></thead>
        <tbody id="gi09-items"></tbody>
        <tfoot id="gi09-foot"></tfoot>
      </table>
      <p class="hint" style="margin-top:8px">El ingreso suma al stock del almacén destino y recalcula el costo promedio ponderado con el costo unitario de cada línea. Desde una OC la cantidad no puede superar lo pendiente y el costo es el precio de la OC (en soles). La regularización por sobrante (ING-REGULARIZ), el ingreso con observación (ING-OBSERV) y el del artículo fallado (ING-FALLADO) piden observación.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-09a Vincular a Orden de Compra -->
<div class="overlay" id="m-gi09a">
  <div class="modal lg">
    <div class="modal-h"><b>Vincular Orden de Compra de bienes</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-09a</span><span class="x" onclick="closeModal('m-gi09a')">✕</span></div>
    <div class="modal-b">
      <table class="grid subtable">
        <thead><tr><th>N° OC</th><th>Proveedor</th><th>Fecha</th><th>Almacén destino</th><th>Estado</th><th style="text-align:right">Pendiente</th><th style="width:90px"></th></tr></thead>
        <tbody id="gi09a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo órdenes de compra de bienes aprobadas (Para Recibir y Pagar / Para Recibir) con cantidades pendientes. Las OC de servicio no ingresan a almacén: se les da conformidad en Compras (CO-07).</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi09a')">Cerrar</button></div>
  </div>
</div>

<!-- GI-09b Confirmar Ingreso (CT-05) -->
<div class="overlay" id="m-gi09b">
  <div class="modal">
    <div class="modal-h"><b>Confirmar Ingreso</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-09b · CT-05</span><span class="x" onclick="closeModal('m-gi09b')">✕</span></div>
    <div class="modal-b">
      <p id="gi09b-txt">¿Está seguro de confirmar este ingreso?</p>
      <p class="hint" style="margin-top:8px">Confirmar es irreversible: suma el stock, escribe el Kardex y queda en la base para todos los módulos.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi09b')">No</button><button class="btn btn-primary" onclick="confirmarIngreso()">Sí, confirmar</button></div>
  </div>
</div>
`);
