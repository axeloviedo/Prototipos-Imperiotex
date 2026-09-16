/* INVENTARIOS · CT-03 Buscador de artículos con contexto y almacén — HTML */
Vistas.modales(String.raw`
<!-- CT-03 Modal Buscar Artículo -->
<div class="overlay" id="m-ct03">
  <div class="modal lg">
    <div class="modal-h"><b>Buscar artículo</b><span class="code" style="font-size:11px;color:var(--texto-sec)">CT-03</span><span class="x" onclick="closeModal('m-ct03')">✕</span></div>
    <div class="modal-b">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#EEF2F7;border:1px solid var(--borde);border-radius:14px;padding:5px 13px;font-size:12px;margin-bottom:12px">
        <span class="dot" style="background:var(--primario-claro)"></span><b>Stock disponible en:</b> <span id="ct03-chip">-</span>
      </div>
      <div class="filters" style="margin-bottom:12px">
        <div class="field"><label>Código / nombre</label><input id="ct03-q" placeholder="Buscar…" oninput="renderCT03()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="ct03-g" onchange="fillCT03Cat();renderCT03()"></select></div>
        <div class="field"><label>Categoría</label><select id="ct03-c" onchange="renderCT03()"></select></div>
        <div class="field"><label>Atributo</label><select id="ct03-atr" onchange="fillCT03Val();renderCT03()"></select></div>
        <div class="field"><label>Valor del atributo</label><select id="ct03-val" onchange="renderCT03()"></select></div>
      </div>
      <table class="grid subtable">
        <thead><tr><th>Código</th><th>Nombre</th><th>Unidad</th><th>Lotes</th><th style="text-align:right" id="ct03-colstock">Disponible</th><th style="width:90px"></th></tr></thead>
        <tbody id="ct03-body"></tbody>
      </table>
      <p class="hint" style="margin-top:10px">Solo artículos inventariables cuando el documento mueve stock. Cada artículo es un código concreto: talla y color son atributos suyos, no de un producto padre. El stock mostrado corresponde al almacén del documento que abrió el buscador.</p>
    </div>
    <div class="modal-f"><button class="btn btn-secondary" onclick="closeModal('m-ct03')">Cerrar</button></div>
  </div>
</div>
`);
