/* COMERCIAL V9 · CL-45 Configuración: parámetros comerciales, categorías de caja, tiendas/cajas/series, medios de pago y permisos */
const CM10 = {
  PERMISOS: [
    ['ver_cotizacion', 'Ver cotizaciones'], ['crear_cotizacion', 'Crear cotizaciones'], ['editar_cotizacion', 'Editar cotizaciones (línea por línea)'], ['eliminar_cotizacion', 'Anular cotizaciones'],
    ['ver_venta', 'Ver ventas, listas y artículos de venta'], ['crear_venta', 'Registrar ventas y pagos'], ['anular_venta', 'Anular ventas'], ['asignar_vendedor', 'Asignar el vendedor'],
    ['ver_devolucion_venta', 'Ver devoluciones'], ['crear_devolucion_venta', 'Registrar y anular devoluciones'], ['editar_devolucion_venta', 'Finalizar devoluciones'],
    ['ver_caja', 'Ver caja e historial'], ['crear_caja', 'Abrir caja, ingresos, egresos y devolver dinero'], ['editar_caja', 'Cerrar caja y editar o anular movimientos'], ['valid_payments', 'Validar o rechazar pagos (validar el que completa el total saca el stock de la venta)'],
    ['ver_cliente', 'Ver clientes'], ['crear_cliente', 'Crear clientes'], ['editar_cliente', 'Editar y desactivar clientes'],
    ['ver_existencias', 'Ver existencias y movimientos'], ['editar_precios', 'Editar listas de precios y datos de venta'], ['configurar_comercial', 'Configuración comercial (ve costos y efectivo esperado)'],
    ['ver_solicitud_fabricacion', 'Solicitudes de Fabricación: ver, crear, editar y enviar (pantalla compartida GI-21/GI-22/GI-23 de Inventarios)'], ['crear_solicitud_materiales', 'Solicitudes de Materiales: crear y consultar (pantalla compartida GI-13 de Inventarios)']
  ],
  render() {
    const c = Store.cfg(), ed = Store.puede('configurar_comercial');
    const dis = ed ? '' : ' disabled';
    let html = '<div class="screen-head"><h1>Configuración comercial</h1><span class="code">CL-45</span><div class="spacer"></div>' + (ed ? '<button class="btn btn-primary" onclick="CM10.guardar()">Guardar parámetros</button>' : '') + '</div>';
    if (!ed) html += UI.aviso('Solo lectura: los parámetros los cambia un perfil con configurar_comercial.', 'info');
    html += '<div class="card"><div class="sec">Parámetros de la empresa</div><div class="formgrid c3">' +
      UI.campo('IGV (%)', '<input id="cf-igv" type="number" min="0" max="30" step="any" value="' + c.igv + '"' + dis + '>', { hint: 'Los precios de venta lo incluyen; cada documento guarda la tasa con la que se emitió' }) +
      UI.campo('Tipo de cambio (S/ por US$)', '<input id="cf-tc" type="number" min="0" step="0.0001" value="' + c.tc + '"' + dis + '>', { hint: 'Para comparar precios en dólares con el precio mínimo en soles' }) +
      UI.campo('Validez de la cotización (días)', '<input id="cf-dv" type="number" min="1" max="90" value="' + c.diasValidez + '"' + dis + '>') +
      UI.campo('Plazo para anular una venta (días)', '<input id="cf-da" type="number" min="0" max="30" value="' + c.diasAnulacion + '"' + dis + '>', { hint: 'Se congela en cada venta al registrarla; pasado el plazo se corrige con una devolución' }) +
      UI.campo('Almacén para devoluciones en mal estado', '<select id="cf-alm"' + dis + '>' + UI.opts(M.ALMACENES.map(a => ({ v: a.cod, t: a.cod + ' · ' + a.nom })), c.almMalEstado) + '</select>') +
      UI.dato('Verificar el precio mínimo en toda la empresa', ((BD.d.maestros.configLogistica || {}).precioMinGlobal ? 'Sí' : 'No'), { hint: 'Se define en Inventarios · Configuración General (el precio mínimo vive en el artículo)' }) +
      '</div></div>';

    const cat = (tipo, lista) => '<div style="flex:1;min-width:280px"><div class="sec">Categorías de ' + tipo.toLowerCase() + '</div>' +
      UI.tabla(['Categoría', ['', '', '40px']], lista.map(x => '<tr><td>' + UI.esc(x) + '</td><td>' + (ed ? '<button class="btn-link" onclick="CM10.quitarCat(\'' + tipo + '\',\'' + UI.esc(x).replace(/'/g, "\\'") + '\')">✕</button>' : '') + '</td></tr>'), { sub: true }) +
      (ed ? '<div class="filters"><input id="cat-' + tipo + '" placeholder="Nueva categoría" style="border:1px solid var(--borde);border-radius:6px;padding:6px 9px"><button class="btn btn-secondary btn-sm" onclick="CM10.agregarCat(\'' + tipo + '\')">Agregar</button></div>' : '') + '</div>';
    html += '<div class="card"><div style="display:flex;gap:22px;flex-wrap:wrap">' + cat('Ingreso', c.catIngreso) + cat('Egreso', c.catEgreso) + '</div></div>';

    html += '<div class="sec">Tiendas, almacenes, cajas y series</div>' +
      UI.tabla(['Tienda', 'Dirección', 'Canal', 'Vende desde', 'Cajas', 'Series (nota de venta · boleta · factura)'], M.SEDES.map(s =>
        '<tr><td><b>' + s.cod + '</b> · ' + UI.esc(s.nom) + '</td><td class="mini">' + UI.esc(s.dir) + '</td><td class="mini">' + s.canal + '</td><td>' + s.alm + '<br><span class="mini">' + UI.esc(M.almNom(s.alm)) + '</span></td>' +
        '<td class="mini">' + M.CAJAS.filter(k => k.sede === s.cod).map(k => k.cod + (Caja.abierta(s.cod, k.mon) ? ' (abierta)' : '')).join('<br>') + '</td>' +
        '<td>' + ['NV', 'BV', 'FA'].map(k => M.SERIES[s.cod][k]).join(' · ') + '</td></tr>'));
    html += '<div style="display:flex;gap:18px;flex-wrap:wrap"><div style="flex:1;min-width:360px"><div class="sec">Medios de pago</div>' +
      UI.tabla(['Medio', 'Cuenta en el arqueo', 'Bancos / procesadores', 'Monedas'], M.METODOS.map(m => '<tr><td>' + m.nom + '</td><td class="mini">' + (m.efectivo ? 'Efectivo: se cuenta' : 'Se valida con voucher o abono') + '</td><td class="mini">' + (m.bancos.join(', ') || '—') + '</td><td>' + m.monedas.join(', ') + '</td></tr>')) + '</div>' +
      '<div style="flex:1;min-width:300px"><div class="sec">Comprobantes · lugares de entrega</div>' +
      UI.tabla(['Comprobante', 'Exige'], M.COMPROBANTES.map(x => '<tr><td>' + x.nom + '</td><td class="mini">' + (x.ruc ? 'Cliente con RUC' : '—') + '</td></tr>')) +
      UI.tabla(['Lugar de entrega', 'Pide'], M.LUGARES_ENTREGA.map(x => '<tr><td>' + x.nom + '</td><td class="mini">' + (x.propio ? 'Nada más' : 'Ubigeo, dirección y quién recibe' + (x.agencia ? ', agencia' : '')) + '</td></tr>')) + '</div></div>';

    const perfiles = Object.keys(M.PERFILES);
    html += '<div class="sec">Perfiles y permisos (por acción)</div>' +
      UI.tabla(['Permiso', 'Qué permite'].concat(perfiles), CM10.PERMISOS.map(p => '<tr><td class="mini">' + p[0] + '</td><td>' + p[1] + '</td>' + perfiles.map(k => '<td style="text-align:center">' + (M.PERFILES[k].indexOf(p[0]) >= 0 ? '<b class="ok-t">✓</b>' : '') + '</td>').join('') + '</tr>'), { clase: 'matriz' }) +
      '<div class="sec">Usuarios de la demo</div>' +
      UI.tabla(['Usuario', 'Perfil', 'Tienda asignada', ''], M.USUARIOS.map(u => '<tr><td>' + u.cod + ' · ' + UI.esc(u.nom) + '</td><td>' + u.perfil + '</td><td>' + UI.esc(Store.sede(u.sede).nom) + '</td><td>' + (u.cod === Store.usuario().cod ? '<b>en uso</b>' : '<button class="btn-link" onclick="App.cambiarUsuario(\'' + u.cod + '\')">Usar</button>') + '</td></tr>')) +
      '<p class="hint">Cada usuario tiene una tienda asignada: abre, cobra y cierra la caja de esa tienda. Los permisos se exigen en cada acción (no solo se ocultan botones). El selector «Usuario» de la barra superior cambia de perfil para recorrer la demo.</p>';
    return html;
  },
  guardar() {
    const x = { igv: UI.v('cf-igv'), tc: UI.v('cf-tc'), diasValidez: UI.v('cf-dv'), diasAnulacion: UI.v('cf-da'), almMalEstado: UI.v('cf-alm') };
    if (App.accion(() => Cfg.guardar(x), 'Parámetros guardados')) App.refrescar();
  },
  agregarCat(tipo) { if (App.accion(() => Cfg.agregarCat(tipo, UI.v('cat-' + tipo)), 'Categoría agregada')) App.refrescar(); },
  quitarCat(tipo, nombre) { if (App.accion(() => Cfg.quitarCat(tipo, nombre), 'Categoría quitada')) App.refrescar(); }
};
App.pantalla('cm10', { titulo: 'Configuración', permiso: 'ver_venta', render: CM10.render });
