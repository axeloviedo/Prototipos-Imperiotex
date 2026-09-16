/* INVENTARIOS · GI-03 Almacenes y GI-04 ficha del almacén — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-03 · Almacenes Lista -->
  <section class="screen" id="scr-gi03">
    <div class="screen-head">
      <h1>Almacenes</h1><span class="code">GI-03</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="go('gi04')">+ Nuevo Almacén</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (ID / nombre)</label><input placeholder="Ej. SB-ALM…"></div>
        <div class="field"><label>Estado</label><select><option>Todos</option><option>Activo</option><option>Inactivo</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th style="width:130px">ID</th><th style="width:260px">Nombre</th><th>Descripción</th><th style="width:150px">Acciones</th></tr></thead>
        <tbody>
          <tr class="clickable" onclick="go('gi04')"><td>SB-ALM-MPT</td><td>Almacén MP Telas</td><td>Materia prima: telas</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
          <tr class="clickable" onclick="go('gi04')"><td>SB-ALM-MPA</td><td>Almacén MP Avíos</td><td>Materia prima: avíos</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
          <tr class="clickable" onclick="go('gi04')"><td>SB-ALM-PPT</td><td>Almacén Producto en Proceso</td><td>Producto en proceso (solo cantidades, sin Kardex valorizado)</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
          <tr class="clickable" onclick="go('gi04')"><td>SB-ALM-PT</td><td>Almacén Central Mercadería Gamarra</td><td>Producto terminado para venta</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
          <tr class="clickable" onclick="go('gi04')"><td>SB-TDA-01</td><td>Tienda Gamarra 1</td><td>Punto de venta / tienda</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
          <tr class="clickable" onclick="go('gi04')"><td>SB-TRF-01</td><td>Almacén de Tránsito SB</td><td>Almacén en tránsito: traslados y material en poder de terceros (servicio de terceros)</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
          <tr class="clickable" onclick="go('gi04')"><td>SB-ALM-DVL</td><td>Almacén Devoluciones</td><td>Devoluciones (inactivo)</td><td><button class="btn-link" onclick="event.stopPropagation();go('gi04')">Editar</button> <button class="btn-link" onclick="event.stopPropagation();openModal('m-gi04a')">Desactivar</button></td></tr>
        </tbody>
      </table>
      <div class="pager"><span>7 de 14 almacenes (SB)</span><div class="pg"><button>‹</button><button class="cur">1</button><button>2</button><button>›</button></div></div>
    </div>
    <p class="hint">El listado muestra solo <b>ID, Nombre y Descripción</b>. El comportamiento del almacén se define en su ficha con indicadores: <b>en tránsito</b> (material en traslado o en poder de terceros, no vende), <b>involucra Kardex valorizado</b>, e <b>interviene en el recosteo</b>. Los permisos son por <b>rol</b>.</p>
  </section>

  <!-- ==================================================== GI-04 · Almacén Formulario -->
  <section class="screen" id="scr-gi04">
    <div class="screen-head">
      <h1>Almacén - SB-ALM-PPT</h1><span class="code">GI-04</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" onclick="openModal('m-gi04a')">Desactivar</button>
      <button class="btn btn-secondary" onclick="go('gi03')">Cancelar</button>
      <button class="btn btn-primary" onclick="toast('Almacén guardado');go('gi03')">Guardar</button>
    </div>
    <div class="card">
      <div class="formgrid">
        <div class="field"><label>ID / Código</label><input value="SB-ALM-PPT" readonly></div>
        <div class="field"><label>Nombre</label><input value="Almacén Producto en Proceso"></div>
        <div class="field full"><label>Descripción</label><input id="gi04-desc" value="Producto en proceso (solo cantidades, sin Kardex valorizado)" placeholder="Describa el uso del almacén"></div>
        <div class="field"><label>Estado</label><select><option>Activo</option><option>Inactivo</option></select></div>
        <div class="field"><label>Sede</label><select id="gi04-sede"></select></div>
      </div>

      <div style="margin-top:16px;border-top:1px solid var(--borde);padding-top:14px">
        <b style="font-size:13px">Indicadores del almacén</b>
        <p class="hint" style="margin-top:4px">Definen cómo se comporta el almacén en las operaciones y en el cálculo de costos.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;margin-top:10px">
          <div class="check"><input type="checkbox" id="alm-transito"> Almacén en tránsito <span class="hint">(material en traslado o en poder de terceros; no vende desde aquí)</span></div>
          <div class="check"><input type="checkbox" id="alm-recosteo" checked> Interviene en el recosteo</div>
          <div class="check"><input type="checkbox" id="alm-kardex"> Involucra Kardex valorizado <span class="hint">(si se desmarca, el almacén trabaja solo cantidades)</span></div>
        </div>
      </div>
      <div class="formgrid" style="margin-top:14px">
        <div class="field full"><div class="check"><input type="checkbox" id="chk-permisos-alm" onchange="togglePermisosAlm(this.checked)"> Permisos por almacén <span class="hint">(si se activa, solo los roles listados abajo pueden ver y operar este almacén)</span></div></div>
      </div>
    </div>
    <div class="card" id="gi04-permisos-card" style="display:none">
      <b style="font-size:13px">Acceso al almacén — roles habilitados</b>
      <table class="grid subtable" style="margin-top:10px">
        <thead><tr><th>Rol</th><th style="width:150px;text-align:center">Acceso al almacén</th><th style="width:70px"></th></tr></thead>
        <tbody id="gi04-permisos-body">
          <tr><td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"><option>Logística</option><option>Producción</option><option>Gerencia</option><option>Comercial</option><option>Vendedor Tienda</option></select></td><td style="text-align:center"><input type="checkbox" checked></td><td><button class="btn-link" onclick="this.closest('tr').remove()">Quitar</button></td></tr>
          <tr><td><select style="width:100%;border:1px solid var(--borde);border-radius:5px;padding:5px 8px;font-size:12.5px"><option>Producción</option><option>Logística</option><option>Gerencia</option><option>Comercial</option><option>Vendedor Tienda</option></select></td><td style="text-align:center"><input type="checkbox" checked></td><td><button class="btn-link" onclick="this.closest('tr').remove()">Quitar</button></td></tr>
        </tbody>
      </table>
      <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="addPermiso(this)">+ Agregar rol</button>
      <p class="hint" style="margin-top:10px">Los permisos son <b>por rol</b>. Con permisos por almacén activo, esta lista filtra el buscador de almacenes (CT-04), Existencias (GI-05), Kardex (GI-06) y Movimientos (GI-07). Si está desactivado, el almacén lo ven todos los roles con permiso general de almacenes o movimientos.</p>
    </div>
  </section>
`);

Vistas.modales(String.raw`
<!-- GI-04a eliminar/desactivar almacén -->
<div class="overlay" id="m-gi04a">
  <div class="modal">
    <div class="modal-h"><b>Desactivar / eliminar almacén</b><span class="x" onclick="closeModal('m-gi04a')">✕</span></div>
    <div class="modal-b">
      <p style="margin-bottom:10px">El almacén seleccionado tiene <b>stock y/o movimientos registrados</b>.</p>
      <p class="hint">No es posible eliminarlo ni desactivarlo mientras mantenga existencias o movimientos asociados.</p>
    </div>
    <div class="modal-f"><button class="btn btn-primary" onclick="closeModal('m-gi04a')">Entendido</button></div>
  </div>
</div>
`);
