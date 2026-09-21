/* INVENTARIOS · GI-25 Modelos y GI-26 ficha del modelo (decisiones U1–U7) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-25 · Modelos -->
  <section class="screen" id="scr-gi25">
    <div class="screen-head">
      <h1>Modelos</h1><span class="code">GI-25</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="abrirModelo('')">+ Nuevo Modelo</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (código / nombre)</label><input id="f-mod-q" placeholder="Ej. ZULEIKA" oninput="renderModelos()"></div>
        <div class="field"><label>Estado</label><select id="f-mod-e" onchange="renderModelos()"><option value="">Todos</option><option>Activo</option><option>Inactivo</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Código</th><th>Nombre</th><th>Plantilla (orden de los atributos)</th><th style="text-align:right">Artículos</th><th>Preseleccionado</th><th>Estado</th><th style="width:150px">Acciones</th></tr></thead>
        <tbody id="tbl-mod"></tbody>
      </table>
    </div>
    <p class="hint">Un <b>modelo</b> agrupa artículos que solo se diferencian por sus atributos (p. ej. ZULEIKA en azul y negro, tallas 28 y 30) y fija en qué orden se muestran esos atributos. Es <b>opcional</b> y sirve para cualquier grupo de artículo. El modelo <b>no se vende ni se mueve</b>: no tiene stock, precio, lista de materiales ni documentos; todo eso sigue en cada artículo. El nombre de cada artículo se respeta tal como está.</p>
  </section>

  <!-- ==================================================== GI-26 · Modelo -->
  <section class="screen" id="scr-gi26">
    <div class="screen-head">
      <h1 id="gi26-title">Nuevo Modelo</h1><span class="code">GI-26</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="gi26-b-est" onclick="alternarEstadoModelo()">Desactivar</button>
      <button class="btn btn-secondary" onclick="go('gi25')">Cancelar</button>
      <button class="btn btn-primary" onclick="guardarModelo()">Guardar</button>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field req"><label>Código (auto)</label><input id="mod-cod" readonly></div>
        <div class="field req"><label>Nombre <span class="hint">(único)</span></label><input id="mod-nom" oninput="MOD_SUCIO=true" placeholder="Ej. PANTALON WIDE LEG ZULEIKA"></div>
        <div class="field full"><label>Descripción</label><input id="mod-desc" oninput="MOD_SUCIO=true"></div>
        <div class="field"><label>Artículo preseleccionado <span class="hint">(opcional · el que aparece elegido primero)</span></label><select id="mod-pred" onchange="MOD_SUCIO=true"></select></div>
        <div class="field"><label>Estado</label><input id="mod-est" readonly></div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px">
        <b style="font-size:13px">Plantilla · atributos del modelo y su orden</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="abrirAgregarAtributo()">+ Agregar atributo</button>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:50px">Orden</th><th>Atributo</th><th style="width:170px"></th></tr></thead>
        <tbody id="mod-plantilla"></tbody>
      </table>
      <p class="hint" id="mod-plantilla-nota" style="margin-top:6px"></p>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin:0 0 8px">
        <b style="font-size:13px">Artículos del modelo</b><span class="hint" id="mod-arts-count"></span>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="abrirAgregarArtModelo()">+ Agregar artículo existente</button>
        <button class="btn btn-primary btn-sm" onclick="abrirGenerarCombinaciones()">⚙ Generar combinaciones</button>
      </div>
      <div class="tbl-wrap"><table class="grid subtable">
        <thead id="mod-arts-h"></thead>
        <tbody id="mod-arts-b"></tbody>
      </table></div>
      <p class="hint" style="margin-top:6px">Cada artículo lleva <b>todos</b> los atributos de la plantilla, con un solo valor cada uno y sin repetir la combinación. Los valores se editan aquí o en la ficha del artículo (GI-02). Quitar un artículo del modelo no lo borra: conserva sus atributos y sigue como artículo suelto.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<div class="overlay" id="m-gi26a">
  <div class="modal" style="max-width:760px">
    <div class="modal-h"><b>Agregar artículos existentes al modelo</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-26</span><span class="x" onclick="closeModal('m-gi26a')">✕</span></div>
    <div class="modal-b">
      <input id="gi26a-q" placeholder="Buscar por código, nombre o atributo" oninput="renderAgregarArtModelo()" style="width:100%;border:1px solid var(--borde);border-radius:6px;padding:7px 10px;font-size:13px;margin-bottom:10px">
      <div class="tbl-wrap" style="max-height:360px;overflow:auto"><table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre y atributos</th><th style="width:90px"></th></tr></thead>
        <tbody id="gi26a-body"></tbody>
      </table></div>
      <p class="hint" style="margin-top:6px">Solo se listan artículos sin modelo. Al agregarlos se completan sus valores en la tabla del modelo y se validan al Guardar.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi26a')">Cerrar</button></div>
  </div>
</div>

<div class="overlay" id="m-gi26t">
  <div class="modal" style="max-width:380px">
    <div class="modal-h"><b>Agregar atributos a la plantilla</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-26</span><span class="x" onclick="closeModal('m-gi26t')">✕</span></div>
    <div class="modal-b">
      <div id="gi26t-lista"></div>
      <p class="hint" id="gi26t-nota" style="margin-top:8px"></p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi26t')">Cancelar</button><button class="btn btn-primary" id="gi26t-ok" onclick="agregarAtributosModelo()">Agregar</button></div>
  </div>
</div>

<div class="overlay" id="m-gi26g">
  <div class="modal" style="max-width:900px">
    <div class="modal-h"><b>Generar combinaciones</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-26</span><span class="x" onclick="closeModal('m-gi26g')">✕</span></div>
    <div class="modal-b">
      <div class="field full" style="margin-bottom:10px"><label>Artículo base <span class="hint">(se copian grupo, categoría, UM, precios, impuestos y usos; no se copian códigos de barras ni listas de materiales)</span></label>
        <select id="gi26g-base" onchange="renderGenerar()" style="width:100%;border:1px solid var(--borde);border-radius:6px;padding:7px 10px;font-size:13px"></select></div>
      <div id="gi26g-vals"></div>
      <div class="tbl-wrap" style="max-height:300px;overflow:auto;margin-top:10px"><table class="grid subtable">
        <thead id="gi26g-h"></thead>
        <tbody id="gi26g-b"></tbody>
      </table></div>
      <p class="hint" id="gi26g-nota" style="margin-top:6px"></p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-gi26g')">Cancelar</button><button class="btn btn-primary" onclick="crearCombinaciones()">Crear artículos</button></div>
  </div>
</div>
`);
