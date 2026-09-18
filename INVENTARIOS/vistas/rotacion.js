/* INVENTARIOS · GI-18 Rotación de Artículos — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== GI-18 · Rotación de Artículos -->
  <section class="screen" id="scr-gi18">
    <div class="screen-head">
      <h1>Rotación de Artículos</h1><span class="code">GI-18</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="toast('Exportar a Excel (prototipo)')">Exportar <span class="warn" title="Formato de exportación a definir">⚠</span></button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:16px">
      <div class="card" style="margin:0"><span class="hint">Valor del inventario inmovilizado (>90 días)</span><div id="rot-valor" style="font-size:22px;font-weight:700;color:var(--cancelada);margin-top:6px"></div></div>
      <div class="card" style="margin:0"><span class="hint">Artículos sin movimiento >90 días</span><div id="rot-count90" style="font-size:22px;font-weight:700;margin-top:6px"></div></div>
      <div class="card" style="margin:0"><span class="hint">Antigüedad promedio del stock</span><div id="rot-edad" style="font-size:22px;font-weight:700;margin-top:6px"></div></div>
    </div>
    <div class="card">
      <div class="filters">
        <div class="field"><label>Almacén</label><select id="f-rot-alm" data-todos="Todos" onchange="renderRot()"><option value="">Todos</option></select></div>
        <div class="field"><label>Artículo</label><input id="f-rot-q" placeholder="Buscar artículo…" oninput="renderRot()"></div>
        <div class="field"><label>Grupo de Artículo</label><select id="f-rot-g" data-todos="Todos" onchange="renderRot()"><option value="">Todos</option></select></div>
        <div class="field"><label>Categoría</label><select id="f-rot-sg" data-todos="Todas" onchange="renderRot()"><option value="">Todas</option></select></div>
        <div class="field"><label>Sin movimiento hace más de</label><select id="f-rot-d" onchange="renderRot()"><option value="">Cualquier antigüedad</option><option value="30">30 días</option><option value="60">60 días</option><option value="90">90 días</option><option value="180">180 días</option></select></div>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="grid">
        <thead><tr><th>Producto</th><th>Almacén</th><th style="text-align:right">Stock</th><th style="text-align:right">Valor S/.</th><th>Último ingreso</th><th>Última salida</th><th style="text-align:right">Días sin movimiento</th><th style="width:130px">Estado</th></tr></thead>
        <tbody id="rot-body"></tbody>
      </table>
      <div class="pager"><span id="rot-count"></span></div>
    </div>
    <div class="card" style="display:flex;gap:22px;align-items:center;font-size:12.5px;flex-wrap:wrap">
      <b>Semáforo de rotación:</b>
      <span class="dotled"><span class="dot" style="background:var(--confirmado)"></span> Rota bien (hasta 30 días)</span>
      <span class="dotled"><span class="dot" style="background:var(--pendiente)"></span> Vigilar (31 - 90 días)</span>
      <span class="dotled"><span class="dot" style="background:#C2410C"></span> Inmovilizado (91 - 180 días)</span>
      <span class="dotled"><span class="dot" style="background:var(--cancelada)"></span> Crítico (más de 180 días)</span>
    </div>
    <p class="hint">Los días se cuentan desde el último movimiento del artículo en ese almacén (lo que ocurra último: ingreso o salida). Un artículo en rojo lleva capital detenido: candidato a promoción, transferencia a otra tienda o liquidación. Umbrales referenciales <span class="warn" title="Umbrales de antigüedad a validar con Logística">⚠</span>.</p>
  </section>
`);
