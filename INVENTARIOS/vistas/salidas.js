/* INVENTARIOS · GI-10 Crear Salida — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-10 · Crear Salida -->
  <section class="screen" id="scr-gi10">
    <div class="screen-head">
      <h1>MOVIMIENTO: SALIDA</h1><span class="code">GI-10</span>
      <span class="badge" style="background:var(--borrador)">Nuevo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi07')">Cancelar</button>
      <button class="btn btn-primary" onclick="pedirCompletarSalida()">Completar Salida</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>ID (se asigna al confirmar)</label><input id="gi10-id" readonly></div>
        <div class="field"><label>Registrado por</label><input id="gi10-user" readonly></div>
        <div class="field req"><label>Tipo de movimiento</label><select id="gi10-tipo"></select></div>
        <div class="field"><label>N° de documento</label><input id="gi10-ndoc" placeholder="Texto libre (p. ej. guía, acta)"></div>
        <div class="field"><label>Fecha de movimiento</label><input id="gi10-fecha" readonly></div>
        <div class="field req"><label>Almacén origen</label><select id="gi10-alm" onchange="renderSalida()"></select></div>
        <div class="field"><label>Destino</label><input id="gi10-dest" placeholder="Área, cliente o proveedor"></div>
        <div class="field"><div class="check" style="margin-top:22px"><input type="checkbox" id="gi10-bloq" checked onchange="renderSalida()"> Respetar el comprometido <span class="hint">(solo sale el disponible)</span></div></div>
        <div class="field full"><label>Observaciones</label><input id="gi10-obs"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="openBuscador('gi10')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead id="gi10-head"></thead><tbody id="gi10-items"></tbody><tfoot id="gi10-foot"></tfoot>
      </table>
      <p class="hint" style="margin-top:8px">La salida descuenta el stock al costo promedio vigente del almacén. Las salidas de venta y de producción las registran automáticamente Comercial y Producción; aquí se registran las manuales: devolución a proveedor, salida a maquila, <b>regularización de inventario por faltante</b> (SAL-REGULARIZ, con observación) o producto fallado. No existe un movimiento de ajuste: la regularización por sobrante es un ingreso (GI-09).</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-10b Confirmar Salida (CT-05) -->
<div class="overlay" id="m-gi10b">
  <div class="modal">
    <div class="modal-h"><b>Completar Salida</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-10b · CT-05</span><span class="x" onclick="closeModal('m-gi10b')">✕</span></div>
    <div class="modal-b">
      <p id="gi10b-txt">¿Está seguro de confirmar esta salida?</p>
      <p class="hint" style="margin-top:8px">Confirmar es irreversible: descuenta stock, escribe el Kardex y registra el usuario.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi10b')">No</button><button class="btn btn-primary" onclick="completarSalida()">Sí</button></div>
  </div>
</div>
`);
