/* INVENTARIOS · Grupo de Artículo: ficha con pestaña Finanzas — HTML */
Vistas.pantallas(String.raw`
  <!-- ==================================================== Grupo de Artículo · Ficha (General + Finanzas) -->
  <section class="screen" id="scr-grupo">
    <div class="screen-head">
      <h1 id="grupo-title">Nuevo Grupo de Artículo</h1><span class="code">MST</span>
      <div class="spacer"></div>
      <button class="btn btn-secondary" onclick="go('mtipos')">Cancelar</button>
      <button class="btn btn-primary" onclick="grupoSave()">Guardar</button>
    </div>
    <div class="card">
      <p class="leyenda-req"><i></i> Los campos resaltados son obligatorios.</p>
      <div class="tabs" id="grupo-tabs">
        <div class="tab active" data-t="general" onclick="grupoTab(this)">General</div>
        <div class="tab" data-t="fin" onclick="grupoTab(this)">Finanzas</div>
      </div>
      <!-- General -->
      <div class="gtabpane active" id="gpane-general">
        <div class="formgrid">
          <div class="field req"><label>Código</label><input id="gru-cod" placeholder="Ej. MP"></div>
          <div class="field req"><label>Nombre</label><input id="gru-nom" placeholder="Ej. MATERIA PRIMA"></div>
          <div class="field"><label>Prefijo del código de artículo</label><input id="gru-pref" placeholder="Ej. MP-"></div>
          <div class="field"><label>Asignación de código</label>
            <select id="gru-asig"><option>Interna</option><option>Externa</option></select></div>
          <div class="field"><div class="check" style="margin-top:22px"><input type="checkbox" id="gru-inv" checked> Inventariable <span class="hint">(los artículos del grupo manejan stock)</span></div></div>
        </div>
        <p class="hint" style="margin-top:8px">El prefijo arma el código del artículo. La asignación define si el sistema autogenera (Interna) o el usuario ingresa un código único (Externa).</p>
      </div>
      <!-- Finanzas -->
      <div class="gtabpane" id="gpane-fin">
        <p class="hint" style="margin-bottom:10px">Determinación de cuentas por grupo (referencia SAP B1). Cada concepto contable se vincula a una cuenta. Todos los artículos de este grupo usan estas cuentas. El código numérico identifica de forma estable cada concepto.</p>
        <table class="grid subtable">
          <thead><tr><th style="width:70px">Código</th><th>Concepto contable</th><th style="width:280px">Cuenta contable</th></tr></thead>
          <tbody id="grupo-fin-body"></tbody>
        </table>
      </div>
    </div>
  </section>
`);
