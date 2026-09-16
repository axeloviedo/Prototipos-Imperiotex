/* COMPARTIDO · arranque de Inventarios y Compras: pinta las listas iniciales y abre la pantalla de inicio o la del #hash.
   Cada index.html llama a arrancar('<pantalla de inicio>') después de cargar todos los módulos. */
function arrancar(inicio){
  renderArt();
  fillGrupoSelects();
  renderProv();
  renderOCS();
  renderStock();
  renderTRF();
  renderMov();
  renderSol();
  renderGRE();
  renderRec();
  renderNC();
  renderFac();
  fillFiltroCatSP();
  renderSP();
  showDetalle('ing513');
  fillTipos();
  fillArtFilters();
  fillStockFilters();
  fillSedes();
  fillUMSelects('UND');
  renderLDM();
  renderBarcodes();
  renderSeries();
  renderSeriesGRE();
  renderDash();
  renderRot();
  fillSaldosFiltros();
  renderSaldos();
  renderCamposUsr();
  buildCT03();
  fillCT03Filtros();
  aplicarCfgEtiqueta();
  aplicarCfgArticulo();
  renderPanelCompras();
  renderCCD();
  renderSugerido();
  /* en la vista compartida de Comercial solo se abren sus pantallas */
  go(typeof VISTA_CM!=='undefined' && VISTA_CM ? 'gi21' : inicio);
  aplicarHash();
  window.addEventListener('hashchange',aplicarHash);
}
function aplicarHash(){
  var h=(location.hash||"").replace('#','');
  if(!h)return;
  var p=h.split('=');
  if(p[0]==='co07' && p[1] && typeof OCS!=='undefined' && OCS[p[1]]){ loadOC(p[1]); return; }
  if(document.getElementById('scr-'+h)) go(h);
}
