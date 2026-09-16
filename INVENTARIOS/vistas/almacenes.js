/* INVENTARIOS · GI-03 Almacenes y GI-04 ficha del almacén (campos de la plantilla de almacenes) — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-03 · Almacenes Lista -->
  <section class="screen" id="scr-gi03">
    <div class="screen-head">
      <h1>Almacenes</h1><span class="code">GI-03</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="abrirAlmacen('')">+ Nuevo Almacén</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (código / nombre)</label><input id="f-alm-q" placeholder="Ej. SB-ZARATE…" oninput="renderAlmacenes()"></div>
        <div class="field"><label>Categoría</label><select id="f-alm-cat" onchange="renderAlmacenes()"><option value="">Todas</option><option>Común</option><option>Transición</option><option>Tienda</option><option>Tienda Liquidación</option></select></div>
        <div class="field"><label>Sede</label><select id="f-alm-sede" onchange="renderAlmacenes()"><option value="">Todas</option></select></div>
        <div class="field"><label>Estado</label><select id="f-alm-e" onchange="renderAlmacenes()"><option value="">Todos</option><option>Activo</option><option>Inactivo</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th style="width:150px">Código</th><th>Nombre</th><th>Categoría</th><th>Sede</th><th>Físico / Virtual</th><th>Contenido</th><th>Indicadores</th><th style="text-align:right">Artículos con stock</th><th>Estado</th><th style="width:130px">Acciones</th></tr></thead>
        <tbody id="alm-body"></tbody>
      </table>
      <div class="pager"><span id="alm-count"></span></div>
    </div>
    <p class="hint">Almacenes de la empresa activa (selector Empresa de la barra superior), tomados de la plantilla de almacenes más <b>SB-ZARATE-PP</b> (producto en proceso de Zárate). El comportamiento se define con indicadores: <b>en tránsito</b> (material en traslado o en poder de terceros, p. ej. SB-TRANSITO) y <b>Kardex valorizado</b> (si no, solo cantidades, p. ej. SB-ZARATE-PP).</p>
  </section>

  <!-- ==================================================== GI-04 · Almacén Formulario -->
  <section class="screen" id="scr-gi04">
    <div class="screen-head">
      <h1 id="gi04-title">Nuevo Almacén</h1><span class="code">GI-04</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" id="gi04-b-des" onclick="desactivarAlmacen()">Desactivar</button>
      <button class="btn btn-secondary" onclick="go('gi03')">Cancelar</button>
      <button class="btn btn-primary" onclick="guardarAlmacen()">Guardar</button>
    </div>
    <div class="card">
      <p class="leyenda-req"><i></i> Los campos resaltados son obligatorios.</p>
      <div class="formgrid">
        <div class="field req"><label>Empresa</label><select id="gi04-emp"></select></div>
        <div class="field req"><label>Código</label><input id="gi04-cod" placeholder="Ej. SB-TIENDA06"></div>
        <div class="field req"><label>Nombre</label><input id="gi04-nom"></div>
        <div class="field req"><label>Categoría</label><select id="gi04-cat"><option>Común</option><option>Transición</option><option>Tienda</option><option>Tienda Liquidación</option></select></div>
        <div class="field req"><label>Sede</label><select id="gi04-sede"></select></div>
        <div class="field"><label>Físico / Virtual</label><select id="gi04-fisico"><option>Físico</option><option>Virtual</option></select></div>
        <div class="field"><label>Contenido</label><select id="gi04-cont"><option>Materia Prima</option><option>Productos en Proceso</option><option>Productos Terminados</option><option>Mercadería Liquidación</option></select></div>
        <div class="field"><label>Estado</label><select id="gi04-estado"><option>Activo</option><option>Inactivo</option></select></div>
        <div class="field full"><label>Observaciones</label><input id="gi04-obs" placeholder="Describa el uso del almacén"></div>
      </div>

      <div style="margin-top:16px;border-top:1px solid var(--borde);padding-top:14px">
        <b style="font-size:13px">Indicadores del almacén</b>
        <p class="hint" style="margin-top:4px">Definen cómo se comporta el almacén en las operaciones y en el cálculo de costos.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;margin-top:10px">
          <div class="check"><input type="checkbox" id="alm-transito"> Almacén en tránsito <span class="hint">(material en traslado o en poder de terceros; no vende desde aquí)</span></div>
          <div class="check"><input type="checkbox" id="alm-kardex"> Involucra Kardex valorizado <span class="hint">(si se desmarca, trabaja solo cantidades)</span></div>
        </div>
      </div>
      <div class="formgrid" style="margin-top:14px">
        <div class="field full"><div class="check"><input type="checkbox" id="chk-permisos-alm" onchange="togglePermisosAlm(this.checked)"> Permisos por almacén <span class="hint">(si se activa, solo los roles listados pueden ver y operar este almacén)</span></div></div>
      </div>
    </div>
    <div class="card" id="gi04-permisos-card" style="display:none">
      <b style="font-size:13px">Acceso al almacén — roles habilitados</b>
      <table class="grid subtable" style="margin-top:10px">
        <thead><tr><th>Rol</th><th style="width:70px"></th></tr></thead>
        <tbody id="gi04-permisos-body"></tbody>
      </table>
      <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="addPermiso()">+ Agregar rol</button>
      <p class="hint" style="margin-top:10px">Los permisos son <b>por rol</b> y se guardan con el almacén. En el prototipo no filtran las pantallas.</p>
    </div>
    <div class="card" id="gi04-stock-card">
      <b style="font-size:13px">Existencias del almacén</b>
      <table class="grid subtable" style="margin-top:10px">
        <thead><tr><th>Artículo</th><th style="text-align:right">Actual</th><th style="text-align:right">Comprometido</th><th style="text-align:right">Disponible</th><th style="text-align:right">Valorizado S/.</th></tr></thead>
        <tbody id="gi04-stock"></tbody>
      </table>
    </div>
  </section>
`);
