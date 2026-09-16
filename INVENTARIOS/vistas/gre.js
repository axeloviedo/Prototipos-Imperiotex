/* INVENTARIOS · GI-14/15/16 Guías de Remisión Electrónicas (BD.d.gres con Docs.gre) — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-gi14">
    <div class="screen-head">
      <h1>Guías de Remisión Electrónicas</h1><span class="code">GI-14</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaGRE()">+ Nueva GRE</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Buscar (número, destinatario, movimiento, OF)</label><input id="f-gre-q" placeholder="Ej. T001-000001, TRF-000001…" oninput="renderGRE()"></div>
        <div class="field"><label>Motivo de traslado</label><select id="f-gre-m" onchange="renderGRE()"></select></div>
        <div class="field"><label>Almacén de partida</label><select id="f-gre-a" onchange="renderGRE()"></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Número</th><th>Fecha emisión</th><th>Motivo</th><th>Partida → Llegada</th><th>Destinatario</th><th>Movimiento</th><th>Orden</th><th style="text-align:right">Líneas</th><th>Estado</th></tr></thead>
        <tbody id="gre-body"></tbody>
      </table>
      <div class="pager"><span id="gre-count"></span></div>
    </div>
    <div class="card" style="border-left:4px solid var(--gre-rechazado)"><b style="font-size:12.5px">La anulación de una GRE se realiza desde el portal de SUNAT.</b> <span class="hint">En el prototipo la emisión se simula como «Aceptada SUNAT». Las guías del envío a servicio de terceros las emite Producción (PR-02) y aparecen aquí.</span></div>
  </section>

  <!-- ==================================================== GI-15 · Crear GRE -->
  <section class="screen" id="scr-gi15">
    <div class="screen-head">
      <h1>NUEVA GUÍA DE REMISIÓN</h1><span class="code">GI-15</span>
      <span class="badge" style="background:var(--borrador)">Nuevo</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi14')">Cancelar</button>
      <button class="btn btn-primary" onclick="enviarGRE()">Emitir y enviar a SUNAT</button>
    </div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Movimiento vinculado <span class="hint">(opcional: precarga partida, llegada y artículos)</span></label><select id="gre-mov" onchange="greDesdeMovSel()"></select></div>
        <div class="field req"><label>Motivo de traslado</label><select id="gre-motivo"></select></div>
        <div class="field req"><label>Almacén de partida</label><select id="gre-alm" onchange="greAlm()"></select></div>
        <div class="field"><label>Serie</label><input id="gre-serie" readonly value="T001"></div>
        <div class="field"><label>Almacén de llegada <span class="hint">(si es de la empresa)</span></label><select id="gre-destino"></select></div>
        <div class="field"><label>Proveedor / destinatario</label><select id="gre-prov"></select></div>
        <div class="field"><label>Orden de fabricación</label><input id="gre-of" placeholder="Ej. OF-000001"></div>
        <div class="field"><label>Modo de traslado</label><select id="gre-modo" onchange="greModo()"><option>Transporte público</option><option>Transporte privado</option></select></div>
        <div class="field full"><label>Descripción / observaciones</label><input id="gre-obs" placeholder="Descripción del motivo de traslado…"></div>
      </div>
    </div>
    <div class="card">
      <b style="font-size:13px">Datos de envío</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Ubigeo de partida</label><input id="gre-ubi-p" readonly placeholder="Según la sede del almacén"></div>
        <div class="field"><label>Dirección de partida</label><input id="gre-dir-p" readonly placeholder="Según la sede del almacén"></div>
        <div class="field"><label>Ubigeo de llegada</label><select id="gre-ubi-l"></select></div>
        <div class="field"><label>Dirección de llegada</label><input id="gre-dir-l" placeholder="Dirección…"></div>
      </div>
      <div class="formgrid" style="margin-top:12px" id="gre-transp-pub">
        <div class="field full"><label>Transportista</label><select id="gre-transp"></select></div>
      </div>
      <div class="formgrid" style="margin-top:12px;display:none" id="gre-transp-priv">
        <div class="field"><label>Conductor</label><input id="gre-cond" placeholder="Nombre y DNI"></div>
        <div class="field"><label>N° placa del vehículo</label><input id="gre-placa" placeholder="Ej. ABC-123"></div>
      </div>
    </div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="openBuscador('gre')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead id="gre-head"></thead><tbody id="gre-items"></tbody><tfoot id="gre-foot"></tfoot>
      </table>
      <p class="hint" style="margin-top:8px">La guía sustenta el traslado físico; no mueve stock (el stock lo mueve el movimiento vinculado).</p>
    </div>
  </section>

  <!-- ==================================================== GI-16 · Detalle GRE -->
  <section class="screen" id="scr-gi16">
    <div class="screen-head">
      <h1 id="g16-num">GRE</h1><span class="code">GI-16</span>
      <span class="badge" id="g16-badge" style="background:var(--gre-aceptado)">Aceptada SUNAT</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="toast('Descargando PDF de la GRE (prototipo)')">Descargar PDF</button>
      <button class="btn btn-secondary" onclick="go('gi14')">Volver</button>
    </div>
    <div class="card" id="g16-cdr" style="border-left:4px solid var(--gre-aceptado)"></div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px" id="g16-campos"></div>
    </div>
    <div class="card">
      <b style="font-size:13px">Listado de artículos</b>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th style="width:40px">#</th><th>Código</th><th>Descripción</th><th>UM</th><th style="text-align:right">Cantidad</th></tr></thead>
        <tbody id="g16-items"></tbody>
      </table>
    </div>
  </section>
`);
