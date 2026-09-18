/* INVENTARIOS · GI-17 Listas de Materiales — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-17 · Listas de Materiales -->
  <section class="screen" id="scr-gi17">
    <div class="screen-head">
      <h1>Listas de Materiales</h1><span class="code">GI-17</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaLDM()">+ Nueva Lista de Materiales</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar</label><input id="f-ldm-q" placeholder="LDM, artículo o nombre…" oninput="renderLDM()"></div>
        <div class="field"><label>Grupo del producto</label><select id="f-ldm-g" onchange="renderLDM()"></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Código</th><th>Producto</th><th>Nombre / descripción</th><th style="width:130px">Predeterminada</th><th style="text-align:right">Cantidad base</th><th style="text-align:right">Líneas</th><th style="text-align:right">Fase</th><th style="width:70px"></th></tr></thead>
        <tbody id="ldm-body"></tbody>
      </table>
      <div class="pager"><span id="ldm-count"></span></div>
    </div>
    <p class="hint">Un artículo puede tener varias listas (p. ej. LDM-0013, alternativa de PT-0001 sin parche): una sola es la Predeterminada, que usan GI-23 y Producción por defecto. Si un componente también tiene lista es <b>fabricable</b> y tiene su propia orden; la <b>fase</b> sale de esa cadena (piezas cortadas 1 → crudo 2 → lavado 3 → producto final 4). Producción (PR-10) lee estas mismas listas.</p>
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
        <div class="field req"><label>Producto</label>
          <select id="ldm-prod" onchange="ldmProdChange()"><option value="">Seleccionar…</option></select></div>
        <div class="field"><label>Nombre de la lista</label><input id="ldm-nom" placeholder="Ej. Zuleika terminado azul talla 28"></div>
        <div class="field full"><label>Descripción (opcional)</label><input id="ldm-desc" placeholder="Ej. versión sin parche"></div>
        <div class="field"><label>Cantidad base <span class="hint">(las cantidades de las líneas son para esta cantidad)</span></label><input id="ldm-cant" value="1" style="text-align:right"></div>
        <div class="field"><div class="check" style="margin-top:24px"><input type="checkbox" id="ldm-pred"> Predeterminada del artículo <span class="warn" title="Solo una LDM por artículo puede ser la predeterminada: al marcarla, la anterior pasa a alternativa">⚠</span></div></div>
        <div class="field"><label>Almacén donde entra lo producido (opcional) <span class="hint">(Producción lo propone al crear la orden)</span></label><select id="ldm-almprod"></select></div>
        <div class="field full"><label>Observación (opcional)</label><input id="ldm-obs" placeholder="Ej. el lavado se terceriza con Lavandería Landeo; el crudo va al almacén en tránsito"></div>
      </div>
      <p class="hint" style="margin-top:8px" id="ldm-otras"></p>
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
      <p class="hint" style="margin-top:8px">El detalle usa el mismo indicador <b>Tipo</b> que la Orden de Fabricación: <b>Artículo</b> (materia prima o producto intermedio), <b>Recurso</b> (mano de obra / máquina) o <b>Texto</b> (instrucción, sin consumo de stock). <b>Almacén</b> = de dónde se toma el componente (p. ej. la tela desde SB-ZARATE-MP, el crudo para lavar desde SB-TRANSITO). <b>Método de emisión</b>: <b>Notificación</b> (se descuenta al registrar el recibo · backflush) o <b>Manual</b> (Producción registra la emisión). Un recurso que es servicio de terceros (SRV-xxxx) usa el mismo código que el artículo de servicio que se compra.</p>
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
        <thead><tr><th>Código</th><th>Recurso</th><th>Unidad</th><th style="text-align:right">Costo estándar</th><th style="width:90px"></th></tr></thead>
        <tbody id="ldmrec-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Maestro de Recursos de Producción (PR-11): mano de obra, máquinas y servicios de terceros.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-ldm-rec')">Cerrar</button></div>
  </div>
</div>
`);
