/* INVENTARIOS · GI-23 Alertas de stock y requerimientos de materia prima por línea — HTML */
Vistas.modales(String.raw`
<!-- GI-23e · Buscador de material para agregar manualmente (Especial) -->
<div class="overlay" id="m-spmpreq">
  <div class="modal lg">
    <div class="modal-h"><b>Agregar material (manual · Especial)</b><span class="code" style="font-size:11px;color:var(--texto-sec)">GI-23e</span><span class="x" onclick="closeModal('m-spmpreq')">✕</span></div>
    <div class="modal-b">
      <div class="filters" style="margin-bottom:10px">
        <div class="field"><label>Código / nombre</label><input id="spmpreq-q" placeholder="Buscar material…" oninput="renderBuscarMPreq()"></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th style="width:110px">Código</th><th>Material</th><th style="width:70px">Unidad</th><th style="width:90px"></th></tr></thead>
        <tbody id="spmpreq-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Material extra para <b>este</b> artículo (queda como origen <b>Manual</b>). Solo artículos inventariables activos.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-spmpreq')">Cerrar</button></div>
  </div>
</div>
`);
