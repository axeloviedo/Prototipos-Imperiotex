/* INVENTARIOS · GI-21/22/23 Solicitudes de Fabricación (BD.d.sfs con Docs.sf): bandeja, alta, revisión y buscador de artículos — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-21 · Solicitudes de Fabricación (Bandeja) -->
  <section class="screen" id="scr-gi21">
    <div class="screen-head">
      <h1>Solicitudes de Fabricación</h1><span class="code">GI-21</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaSP()">+ Nueva Solicitud de Fabricación</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Estado</label><select id="f-sp-e" onchange="renderSP()"><option value="">Todos</option><option>Borrador</option><option>Pendiente Aprobar</option><option>Aprobada</option><option>Rechazada</option><option>Convertida en Orden</option><option>Fabricada</option></select></div>
        <div class="field"><label>Mes requerido</label><select id="f-sp-m" onchange="renderSP()"><option value="">Todos</option></select></div>
        <div class="field"><label>Buscar artículo</label><input id="f-sp-q" placeholder="Código o nombre del artículo…" oninput="renderSP()"></div>
        <div class="field"><label>Categoría</label><select id="f-sp-b" onchange="renderSP()"><option value="">Todas</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>N° Sol.</th><th>Fecha</th><th>Fecha requerida</th><th>Artículos</th><th style="text-align:right">Cant. total</th><th>Almacén destino</th><th>Estado</th><th>Aprobaciones</th><th>Creado por</th><th>Órdenes</th></tr></thead>
        <tbody id="sp-body"></tbody>
      </table>
      <div class="pager"><span id="sp-count"></span></div>
    </div>
    <p class="hint">Pantalla <b>compartida por Logística y Comercial</b> (Comercial la abre desde su módulo): ambos crean, editan, envían y aprueban las mismas solicitudes de la base. Se edita en Borrador, Pendiente Aprobar y Rechazada. Con el <b>V°B° de Logística</b> y la <b>aprobación de Gerencia</b> queda Aprobada y <b>compromete la materia prima</b>; <b>Producción</b> crea las órdenes desde PR-03 y la solicitud pasa a Convertida en Orden.</p>
  </section>

  <!-- ==================================================== GI-22 · Nueva Solicitud de Fabricación -->
  <section class="screen" id="scr-gi22">
    <div class="screen-head">
      <h1>Nueva Solicitud de Fabricación</h1><span class="code">GI-22</span>
      <span class="badge" style="background:var(--borrador)">Nuevo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi21')">Cancelar</button>
      <button class="btn btn-secondary" onclick="guardarSP(false)">Guardar borrador</button>
      <button class="btn btn-primary" onclick="guardarSP(true)">Enviar a revisión</button>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>N° de solicitud</label><input id="n-sp-id" readonly value="(se asigna al guardar)"></div>
        <div class="field"><label>Fecha de creación</label><input id="n-sp-fecha" readonly></div>
        <div class="field req"><label>Fecha requerida <span class="hint">(cuándo debe estar el producto)</span></label><input type="date" id="n-sp-freq"></div>
        <div class="field req"><label>Almacén destino <span class="hint">(donde entra el producto terminado)</span></label><select id="n-sp-almdest"></select></div>
        <div class="field"><label>Solicitante</label><input id="n-sp-solic" readonly></div>
        <div class="field"><label>Cantidad total (suma del detalle)</label><input id="n-sp-total" readonly style="text-align:right;font-weight:600" value="0 UND"></div>
        <div class="field full"><label>Observaciones generales</label><input id="n-sp-obs" placeholder="Ej. proyección acordada con Comercial…"></div>
      </div>
      <p class="leyenda-req" style="margin-top:8px"><i></i> Los campos resaltados son obligatorios.</p>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <b style="font-size:13px">Detalle del pedido</b>
        <div class="spacer"></div>
        <button class="btn btn-secondary btn-sm" onclick="abrirBuscadorArt('nuevo')">+ Agregar artículos</button>
      </div>
      <p class="hint" style="margin-top:5px">Una línea por artículo fabricable (con lista de materiales). Cada talla y color es un artículo con su propio código. La lista predeterminada se puede cambiar por una alternativa en la revisión (GI-23).</p>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th style="width:34px">#</th><th style="width:100px">Código</th><th>Artículo</th><th style="width:80px">Color</th><th style="width:60px">Talla</th><th style="width:210px">Lista de materiales</th><th style="width:120px;text-align:right">Cantidad</th><th style="width:70px"></th></tr></thead>
        <tbody id="n-sp-items"></tbody>
        <tfoot id="n-sp-items-foot"></tfoot>
      </table>
    </div>
  </section>

  <!-- ==================================================== GI-23 · Solicitud de Fabricación -->
  <section class="screen" id="scr-gi23">
    <div class="screen-head">
      <h1 id="sp-titulo">Solicitud de Fabricación</h1><span class="code" id="sp-code">GI-23</span>
      <span class="badge" id="sp-badge" style="background:var(--pendiente)">Pendiente Aprobar</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="sp-b-volver" onclick="go('gi21')">Volver</button>
      <button class="btn btn-secondary" id="sp-b-guardar" onclick="guardarCambiosSP()">Guardar cambios</button>
      <button class="btn btn-primary" id="sp-b-enviar" onclick="enviarSPrev()">Enviar a revisión</button>
      <button class="btn btn-secondary" id="sp-b-mod" onclick="openModal('m-gi23d')">Solicitar modificación</button>
      <button class="btn btn-danger" id="sp-b-rech" onclick="openModal('m-gi23c')">Rechazar</button>
      <button class="btn btn-secondary" id="sp-b-verif" onclick="verificarStock()">Verificar stock</button>
      <button class="btn btn-secondary" id="sp-b-vb" onclick="preVB()">Dar V°B° (Logística)</button>
      <button class="btn btn-primary" id="sp-b-ap" onclick="openModal('m-gi23b')">Aprobar (Gerencia)</button>
      <button class="btn btn-primary" id="sp-b-prod" onclick="irProduccion('pr03')">Ver en Producción</button>
    </div>

    <div id="sp-aviso" class="card" style="display:none;border-left:4px solid var(--pendiente);background:#FFFBEB"></div>

    <div class="gp2col">
      <div>
        <div class="card">
          <b style="font-size:13px">Resumen</b>
          <div class="formgrid" style="margin-top:12px">
            <div class="field"><label>N° de solicitud</label><input id="sp-id" readonly></div>
            <div class="field"><label>Artículos solicitados</label><input id="sp-resumen" readonly></div>
            <div class="field req"><label>Fecha requerida</label><input type="date" id="sp-freq"></div>
            <div class="field"><label>Almacén destino <span class="hint">(producto terminado)</span></label><select id="sp-almdest"></select></div>
            <div class="field"><label>Solicitante</label><input id="sp-solic" readonly></div>
            <div class="field"><label>Cantidad total</label><input id="sp-total" readonly style="text-align:right;font-weight:600"></div>
            <div class="field"><label>Órdenes / N° Referencia</label><div id="sp-ofs" style="padding:6px 0"></div></div>
            <div class="field full"><label>Observaciones generales</label><input id="sp-obs"></div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;gap:10px">
            <b style="font-size:13px">Detalle del pedido</b>
            <div class="spacer"></div>
            <button class="btn btn-secondary btn-sm" id="sp-b-adddet" onclick="abrirBuscadorArt('rev')">+ Agregar artículos</button>
          </div>
          <p class="hint" style="margin-top:5px">Mientras la solicitud es editable, cambiar la cantidad o la lista recalcula los requerimientos al instante (use <b>Guardar cambios</b> para dejarlo en la base). <b>Estándar</b> usa la lista predeterminada; <b>Especial</b> permite elegir otra lista del artículo.</p>
          <div class="tbl-wrap">
          <table class="grid subtable" style="margin-top:12px">
            <thead><tr><th style="width:34px">#</th><th style="width:90px">Código</th><th>Artículo</th><th style="width:70px">Color</th><th style="width:54px">Talla</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:110px">Tipo fabricación</th><th style="width:200px">Lista de materiales</th><th style="width:150px"></th></tr></thead>
            <tbody id="sp-items"></tbody>
            <tfoot id="sp-items-foot"></tfoot>
          </table>
          </div>
        </div>

        <div id="sp-paneles">
          <div class="card">
            <div style="display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap">
              <b style="font-size:13px;padding-bottom:6px">Requerimientos de Materia Prima</b>
              <div class="spacer"></div>
            </div>
            <p class="hint" style="margin-top:5px">Explosión de las listas de materiales (<b>Explosion.bruto</b>): se baja por todas las fases fabricables (producto final → lavado → crudo → piezas cortadas) hasta la materia prima, contra el almacén de cada línea de la lista. Es lo que se <b>compromete</b> al aprobar, solo hasta lo disponible (el Disponible nunca queda negativo; lo que falta se compromete cuando llega lo solicitado). <b>Disponible</b> = Actual − Comprometido por otros documentos.</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th>Material</th><th style="width:130px">Almacén</th><th style="width:56px">UM</th><th style="width:100px;text-align:right">Requerida</th><th style="width:110px;text-align:right">Disponible</th><th style="width:100px;text-align:right">Diferencia</th><th style="width:170px">Stock en otros almacenes</th><th style="width:130px">Estado</th></tr></thead>
              <tbody id="sp-mp"></tbody>
            </table>
            <div id="sp-mp-resumen" style="margin-top:10px"></div>
          </div>

          <div class="card" id="sp-srv-card">
            <b style="font-size:13px">Servicios de terceros que requiere</b>
            <p class="hint" style="margin-top:5px">Recursos de tipo servicio de terceros de las listas (p. ej. lavado SRV-0001). Producción los pide con una Solicitud de Materiales cuando llega a esa fase.</p>
            <table class="grid subtable" style="margin-top:12px"><thead><tr><th>Código</th><th>Servicio</th><th style="text-align:right">Cantidad</th><th>Proveedor habitual</th><th style="text-align:right">Costo estándar S/.</th></tr></thead><tbody id="sp-srv"></tbody></table>
          </div>

          <div class="card" id="sp-scs-card" style="display:none">
            <b style="font-size:13px">Solicitudes de Materiales generadas</b>
            <p class="hint" style="margin-top:5px">Logística define por línea si se compra o se transfiere (GI-13).</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th>N° Solicitud</th><th>Artículos</th><th style="width:140px">Destino</th><th style="width:130px">Estado</th><th style="width:150px">Documentos</th></tr></thead>
              <tbody id="sp-scs"></tbody>
            </table>
          </div>

          <div class="card">
            <b style="font-size:13px">Existencias de los artículos del pedido</b>
            <p class="hint" style="margin-top:5px">Una fila por almacén con stock del artículo. Mínimo = GI-02 Planificación. Días sin salida calculados de los movimientos.</p>
            <table class="grid subtable" style="margin-top:12px">
              <thead><tr><th style="width:90px">Código</th><th>Artículo</th><th>Almacén</th><th style="width:80px;text-align:right">Actual</th><th style="width:100px;text-align:right">Comprometido</th><th style="width:90px;text-align:right">Disponible</th><th style="width:80px;text-align:right">Mínimo</th><th style="width:110px">Última salida</th><th style="width:120px">Estado</th></tr></thead>
              <tbody id="sp-stock"></tbody>
            </table>
          </div>

          <div class="card" id="sp-comp-card" style="display:none">
            <b style="font-size:13px">Materia prima comprometida por la solicitud</b>
            <table class="grid subtable" style="margin-top:12px"><thead><tr><th>Material</th><th>Almacén</th><th style="text-align:right">Requerido</th><th style="text-align:right">Comprometido</th><th style="text-align:right">Falta comprometer</th></tr></thead><tbody id="sp-comp"></tbody></table>
          </div>
        </div>
      </div>

      <div class="card">
        <b style="font-size:13px">Historial de decisiones</b>
        <div id="sp-val" style="margin-top:10px;font-size:12.5px"></div>
        <div id="sp-hist" style="margin-top:10px;font-size:13px"></div>
      </div>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-22b Buscador de artículos para el detalle -->
<div class="overlay" id="m-gi22b">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar artículos al detalle</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-22b</span><span class="x" onclick="closeModal('m-gi22b')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>Buscar</label><input id="gi22b-q" placeholder="Código o nombre…" oninput="renderBuscadorArt()"></div>
        <div class="field"><label>Categoría</label><select id="gi22b-cat" onchange="renderBuscadorArt()"></select></div>
        <div class="field"><label>Color</label><select id="gi22b-color" onchange="renderBuscadorArt()"></select></div>
        <div class="field"><label>Talla</label><select id="gi22b-talla" onchange="renderBuscadorArt()"></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:36px"></th><th style="width:100px">Código</th><th>Artículo</th><th style="width:80px">Color</th><th style="width:60px">Talla</th><th style="width:70px">UM</th><th style="width:90px;text-align:right">Disponible</th><th style="width:70px">Listas</th></tr></thead>
        <tbody id="gi22b-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Artículos terminados activos (grupo PT) con lista de materiales. Si la combinación de color y talla no existe, créela en el <button class="btn-link" onclick="closeModal('m-gi22b');go('gi01')">maestro de artículos</button> con <b>Duplicar</b> y defina su lista en GI-17.</p>
    </div>
    <div class="modal-f">
      <button class="btn btn-secondary" onclick="closeModal('m-gi22b')">Cerrar</button>
      <button class="btn btn-primary" onclick="addArtsSeleccionados()">Agregar seleccionados</button>
    </div>
  </div>
</div>
`);
