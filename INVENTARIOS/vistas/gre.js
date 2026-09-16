/* INVENTARIOS · GI-14/15/16 Guías de Remisión Electrónicas — HTML */
Vistas.pantallas(String.raw`
  <section class="screen" id="scr-gi14">
    <div class="screen-head">
      <h1>Guías de Remisión Electrónicas</h1><span class="code">GI-14</span>
      <div class="spacer"></div>
      <button class="btn btn-primary" onclick="nuevaGRE()">+ Nueva GRE</button>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Desde</label><input type="date" value="2026-05-01"></div>
        <div class="field"><label>Hasta</label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Buscar (cliente / número)</label><input id="f-gre-q" placeholder="Ej. T005, SERRATO…" oninput="renderGRE()"></div>
        <div class="field"><label>Estado SUNAT</label><select id="f-gre-e" onchange="renderGRE()"><option value="">Todos</option><option>Enviado</option><option>Aceptado</option><option>Aceptado c/ observaciones</option><option>Rechazado</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th style="width:44px">#</th><th>Fecha Emisión</th><th>Cliente</th><th>Número</th><th>Estado</th><th>Fecha Envío</th><th>Fecha Entrega</th><th>N° Comprobante</th><th>Descargas</th><th style="width:130px">Acciones</th></tr></thead>
        <tbody id="gre-body"></tbody>
      </table>
      <div class="pager"><span id="gre-count"></span></div>
    </div>
    <div class="card" style="border-left:4px solid var(--gre-rechazado)"><b style="font-size:12.5px">La anulación de una GRE se realiza desde el portal de SUNAT.</b> <span class="hint">La baja no se gestiona en este sistema.</span></div>
  </section>

  <!-- ==================================================== GI-15 · Crear GRE -->
  <section class="screen" id="scr-gi15">
    <div class="screen-head">
      <h1>NUEVA GUÍA DE REMISIÓN</h1><span class="code">GI-15</span>
      <span class="badge" style="background:var(--borrador)">Borrador</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('gi14')">Cancelar</button>
      <button class="btn btn-primary" onclick="enviarGRE()">Enviar a SUNAT</button>
    </div>

    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Establecimiento / Sede <span style="color:var(--cancelada)">*</span></label>
          <select id="gre-sede" onchange="greSede()"><option value="">Seleccionar…</option><option>Local Principal - Gamarra</option><option>Taller Zárate</option><option>Tienda Gamarra 1</option><option>Tienda Gamarra 2</option></select></div>
        <div class="field"><label>Almacén (de la sede) <span style="color:var(--cancelada)">*</span></label>
          <select id="gre-alm" onchange="greAlm()"><option value="">Seleccione primero la sede</option></select></div>
        <div class="field"><label>Serie (única por almacén) <span style="color:var(--cancelada)">*</span></label><input id="gre-serie" value="" readonly placeholder="Se asigna al elegir el almacén"></div>
        <div class="field"><label>Motivo de traslado <span style="color:var(--cancelada)">*</span></label>
          <select id="gre-motivo"><option>Venta</option><option>Compra</option><option selected>Traslado entre establecimientos de la misma empresa</option><option>Traslado a zona primaria</option><option>Importación</option><option>Exportación</option><option>Venta sujeta a confirmación del comprador</option><option>Venta con entrega a terceros</option><option>Traslado de bienes para transformación</option><option>Recojo de bienes transformados</option><option>Traslado emisor itinerante de comprobantes de pago</option><option>Devolución</option><option>Otros</option></select></div>
        <div class="field"><label>Fecha de emisión <span style="color:var(--cancelada)">*</span></label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Fecha de traslado <span style="color:var(--cancelada)">*</span></label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Fecha de entrega <span style="color:var(--cancelada)">*</span></label><input type="date" value="2026-07-19"></div>
        <div class="field"><label>Modo de traslado <span style="color:var(--cancelada)">*</span></label>
          <select id="gre-modo" onchange="greModo()"><option>Transporte público</option><option>Transporte privado</option></select></div>
        <div class="field full"><label>Descripción de motivo de traslado</label><input placeholder="Descripción de motivo de traslado…"></div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Destinatario</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field full"><label>Cliente <span style="color:var(--cancelada)">*</span> <button class="btn-link" onclick="toast('Alta rápida de cliente (fuera del módulo GI)')">+ Nuevo</button></label>
          <input id="gre-cliente" placeholder="Escriba el nombre o número de documento del cliente"></div>
        <div class="field"><label>Unidad de medida <span style="color:var(--cancelada)">*</span></label><select><option>Kilos</option><option>Unidades</option></select></div>
        <div class="field"><label>Peso total <span style="color:var(--cancelada)">*</span></label><input value="1.00" style="text-align:right"></div>
        <div class="field"><label>N° paquetes</label><input value="0" style="text-align:right"></div>
        <div class="field"><label>Factura a adjuntar</label><input placeholder="Ingrese número de factura (opcional)"></div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Datos de envío</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field full"><label style="color:var(--primario);font-weight:600">Dirección de partida (auto según sede)</label></div>
        <div class="field"><label>País <span style="color:var(--cancelada)">*</span></label><input value="PERU" readonly></div>
        <div class="field"><label>Ubigeo <span style="color:var(--cancelada)">*</span></label><input id="gre-ubi-p" value="" readonly placeholder="Se asigna al elegir la sede"></div>
        <div class="field full"><label>Dirección <span style="color:var(--cancelada)">*</span></label><input id="gre-dir-p" value="" readonly placeholder="Se asigna al elegir la sede"></div>
        <div class="field full"><label style="color:var(--primario);font-weight:600;margin-top:6px">Dirección de llegada</label></div>
        <div class="field"><label>País <span style="color:var(--cancelada)">*</span></label><input value="PERU" readonly></div>
        <div class="field"><label>Ubigeo <span style="color:var(--cancelada)">*</span></label>
          <select id="gre-ubi-l"><option value="">Seleccionar…</option><option>LIMA / Lima / 150115 - La Victoria</option><option>LIMA / Lima / 150132 - San Juan de Lurigancho</option><option>LIMA / Lima / 150101 - Lima</option><option>LAMBAYEQUE / Chiclayo / 140101 - Chiclayo</option></select></div>
        <div class="field full"><label>Dirección <span style="color:var(--cancelada)">*</span></label><input id="gre-dir-l" placeholder="Dirección…"></div>
      </div>
    </div>

    <div class="card">
      <b style="font-size:13px">Transporte</b>
      <div class="formgrid" style="margin-top:12px" id="gre-transp-pub">
        <div class="field full"><label>Transportista <span style="color:var(--cancelada)">*</span> <button class="btn-link" onclick="toast('Alta rápida de transportista')">+ Nuevo</button></label>
          <select id="gre-transp"><option value="">Seleccionar…</option><option>TRANSPORTES GAMARRA EXPRESS SAC · RUC 20456789123</option><option>LOGISTICA ANDINA SAC · RUC 20321654987</option></select></div>
      </div>
      <div class="formgrid" style="margin-top:12px;display:none" id="gre-transp-priv">
        <div class="field"><label>Conductor <button class="btn-link" onclick="toast('Alta rápida de conductor')">+ Nuevo</button></label><select><option value="">Seleccionar…</option><option>PEREZ QUISPE, JUAN · DNI 45678912</option></select></div>
        <div class="field"><label>Licencia del conductor</label><input placeholder="Ej. Q45678912"></div>
        <div class="field"><label>N° placa del vehículo</label><input placeholder="Ej. ABC-123"></div>
        <div class="field"><label>N° placa semirremolque</label><input placeholder="Opcional"></div>
      </div>
      <p class="hint" style="margin-top:8px">Transporte público: solo se requiere el transportista (los datos de conductor y vehículo los declara el transportista). Transporte privado: conductor, licencia y placa.</p>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <b style="font-size:13px">Listado de artículos</b>
        <div style="flex:1"></div>
        <button class="btn btn-secondary btn-sm" onclick="openBuscador('gre')">+ Agregar artículo</button>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:40px">#</th><th>Producto</th><th>Descripción</th><th style="width:110px">Unidades</th><th style="width:110px;text-align:right">Cantidad</th><th style="width:60px"></th></tr></thead>
        <tbody id="gre-items">
          <tr><td>1</td><td>ART-0001-28AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 28 COLOR AZUL</td><td>UND</td><td><input value="6" style="text-align:right"></td><td><button class="btn-link">Eliminar</button></td></tr>
          <tr><td>2</td><td>ART-0001-30AZ</td><td>PANTALON WIDE LEG ZULEIKA TALLA 30 COLOR AZUL</td><td>UND</td><td><input value="6" style="text-align:right"></td><td><button class="btn-link">Eliminar</button></td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ==================================================== GI-16 · Detalle GRE -->
  <section class="screen" id="scr-gi16">
    <div class="screen-head">
      <h1 id="g16-num">GRE T005-401</h1><span class="code">GI-16</span>
      <span class="badge" id="g16-badge" style="background:var(--gre-enviado)">Enviado</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" id="g16-consultar" onclick="consultarGRE()">Consultar estado <span class="warn" title="Refresco del estado SUNAT (inferencia)">⚠</span></button>
      <button class="btn btn-secondary" onclick="toast('Descargando PDF de la GRE…')">Descargar PDF</button>
      <button class="btn btn-secondary" onclick="go('gi14')">Volver</button>
    </div>
    <div class="card" id="g16-cdr"></div>
    <div class="card">
      <b style="font-size:13px">Detalles generales</b>
      <div class="formgrid" style="margin-top:12px">
        <div class="field"><label>Número</label><input id="g16-f-num" readonly></div>
        <div class="field"><label>Cliente / Destinatario</label><input id="g16-f-cli" readonly></div>
        <div class="field"><label>Fecha de emisión</label><input id="g16-f-fem" readonly></div>
        <div class="field"><label>Fecha de traslado / entrega</label><input id="g16-f-ftr" readonly></div>
        <div class="field"><label>Motivo de traslado</label><input id="g16-f-mot" readonly></div>
        <div class="field"><label>Modo de traslado</label><input value="Transporte público" readonly></div>
        <div class="field full"><label>Partida → Llegada</label><input id="g16-f-ruta" readonly></div>
      </div>
    </div>
    <div class="card">
      <b style="font-size:13px">Listado de artículos</b>
      <table class="grid subtable" style="margin-top:12px">
        <thead><tr><th style="width:40px">#</th><th>Producto</th><th>Descripción</th><th>Unidades</th><th style="text-align:right">Cantidad</th></tr></thead>
        <tbody id="g16-items"></tbody>
      </table>
    </div>
  </section>
`);
