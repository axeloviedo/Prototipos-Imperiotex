/* INVENTARIOS · GI-17 Listas de Materiales — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-17 · Listas de Materiales -->
  <section class="screen" id="scr-gi17">
    <div class="screen-head">
      <h1>Listas de Materiales</h1><span class="code">GI-17</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaLDM()">+ Nueva Lista de Materiales</button>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Código</th><th>Producto final (nombre de la lista)</th><th>Descripción</th><th style="width:130px">Predeterminada</th><th style="text-align:right">Cantidad que produce</th><th style="text-align:right">Líneas</th><th style="width:70px"></th></tr></thead>
        <tbody id="ldm-body"></tbody>
      </table>
      <div class="pager"><span id="ldm-count"></span></div>
    </div>
    <p class="hint">Un artículo puede tener varias listas (p. ej. el mismo pantalón con dos telas, según stock o disponibilidad de compra): una sola es la Predeterminada, que GI-23 usa por defecto y permite cambiar por una alternativa. El producto final debe ser un artículo apto para producción.</p>
  </section>

  <!-- GI-17f · Lista de Materiales (formulario) -->
  <section class="screen" id="scr-gi17f">
    <div class="screen-head">
      <h1 id="ldm-titulo">LISTA DE MATERIALES</h1><span class="code">GI-17</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi17')">Volver</button>
      <button class="btn btn-primary" onclick="guardarLDM()">Guardar</button>
    </div>
    <div class="card">
      <p class="leyenda-req"><i></i> Los campos resaltados son obligatorios.</p>
      <div class="formgrid">
        <div class="field"><label>Código (auto)</label><input id="ldm-id" readonly></div>
        <div class="field req"><label>Producto final <span class="hint">(el nombre de la lista es el de este artículo)</span></label>
          <select id="ldm-prod" onchange="ldmProdChange()"><option value="">Seleccionar…</option></select></div>
        <div class="field full"><label>Descripción (opcional)</label><input id="ldm-desc" placeholder="Ej. versión con tela azul / acabado lavado"></div>
        <div class="field"><label>Cantidad que produce esta lista</label><input id="ldm-cant" value="1" style="text-align:right"></div>
        <div class="field"><div class="check" style="margin-top:24px"><input type="checkbox" id="ldm-pred"> Predeterminada del artículo <span class="warn" title="Solo una LDM por artículo puede ser la predeterminada: al marcarla, la anterior pasa a alternativa">⚠</span></div></div>
      </div>
      <p class="hint" style="margin-top:8px">El producto final es cualquier artículo apto para producción. Un artículo puede tener una lista predeterminada y otras alternativas; una sola por artículo es la predeterminada.</p>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">Detalle de la lista</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="abrirBuscarMP()">+ Artículo</button>
        <button class="btn btn-secondary btn-sm" onclick="abrirBuscarRec()">+ Recurso</button>
        <button class="btn btn-secondary btn-sm" onclick="addTextoLDM()">+ Texto</button>
      </div>
      <div class="tbl-wrap" style="margin-top:12px">
      <table class="grid subtable">
        <thead><tr><th style="width:36px">#</th><th style="width:90px">Tipo</th><th style="width:100px">Código</th><th>Componente / Descripción</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:64px">Unidad</th><th style="width:120px">Almacén</th><th style="width:130px">Método emisión</th><th style="width:70px"></th></tr></thead>
        <tbody id="ldm-items"></tbody>
      </table>
      </div>
      <p class="hint" style="margin-top:8px">El detalle usa el mismo indicador <b>Tipo</b> que la Orden de Fabricación: <b>Artículo</b> (materia prima o producto intermedio), <b>Recurso</b> (mano de obra / máquina) o <b>Texto</b> (instrucción, sin consumo de stock). <b>Almacén</b> = de dónde se toma el componente. <b>Método de emisión</b>: <b>Notificación</b> (se descuenta automáticamente al notificar la producción · backflush) o <b>Manual</b> (se registra la salida a mano). Cantidad necesaria para producir la cantidad indicada de la lista.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-17a Buscar materia prima -->
<div class="overlay" id="m-gi17a">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar componente</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-17a</span><span class="x" onclick="closeModal('m-gi17a')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>Código / nombre</label><input id="gi17a-q" placeholder="Buscar…" oninput="renderBuscarMP()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="gi17a-g" onchange="renderBuscarMP()"></select></div>
        <div class="field"><label>Atributo</label><select id="gi17a-atr" onchange="fillMPVal();renderBuscarMP()"></select></div>
        <div class="field"><label>Valor del atributo</label><select id="gi17a-val" onchange="renderBuscarMP()"></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Componente</th><th>Unidad</th><th>Categoría</th><th style="width:90px"></th></tr></thead>
        <tbody id="gi17a-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Materia prima o productos intermedios aptos como componente.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi17a')">Cerrar</button></div>
  </div>
</div>

<!-- GI-17b · Agregar recurso a la LDM -->
<div class="overlay" id="m-ldm-rec">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar recurso</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-17b</span><span class="x" onclick="closeModal('m-ldm-rec')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>Código / nombre</label><input id="ldmrec-q" placeholder="Buscar recurso…" oninput="renderBuscarRec()"></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Recurso</th><th>Unidad</th><th style="width:90px"></th></tr></thead>
        <tbody id="ldmrec-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Mano de obra, máquina o servicio consumido por la lista.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-ldm-rec')">Cerrar</button></div>
  </div>
</div>
`);
