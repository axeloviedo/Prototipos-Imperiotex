/* COMERCIAL V9 · Buscadores en modal: CL-39 artículos (con precio resuelto y disponible) y CL-38 clientes */
const BUS = {
  _cb: null, _d: null,

  /* d = documento (cotización o venta) para resolver precio y almacén; el modal queda abierto para agregar varios */
  articulo(d, cb) {
    BUS._cb = cb; BUS._d = d;
    const grupos = [...new Set(Store.arts().filter(a => Store.activo(a)).map(a => a.grupo))].map(g => ({ v: g, t: M.grupoNom(g) }));
    const cli = Store.cli(d.cli), sede = Store.sede(d.sede);
    UI.modal({
      ancho: '980px', titulo: 'Agregar artículos o servicios', code: 'CL-39',
      cuerpo: '<div class="filters" style="margin-bottom:10px">' +
        UI.campo('Código, nombre o atributo', '<input id="bus-q" placeholder="Ej. ZULEIKA 28, NEGRO, bordado…" oninput="BUS.pintarArt()" style="min-width:280px">') +
        UI.campo('Grupo de Artículo', '<select id="bus-g" onchange="BUS.pintarArt()">' + UI.opts(grupos, '', 'Todos') + '</select>') + '</div>' +
        '<div id="bus-body"></div>' +
        '<p class="hint">Precio según las listas de precios y ofertas para ' + (cli ? 'un cliente <b>' + cli.tipo + '</b>' : 'un cliente sin tipo (elija el cliente primero)') + ' en <b>' + UI.esc(sede.nom) + '</b>, en ' + d.mon + '. Disponible = Actual − Comprometido (T1) en el almacén de la tienda; lo comprometido incluye las ventas pendientes de pago.</p>',
      pie: '<button class="btn btn-primary" onclick="UI.cerrar()">Listo</button>'
    });
    BUS.pintarArt();
  },
  pintarArt() {
    const d = BUS._d, q = UI.v('bus-q').toLowerCase(), g = UI.v('bus-g'), alm = Doc.sedeAlm(d), tipo = Doc.tipoCli(d);
    const lista = Store.arts().filter(a => Store.activo(a) && (!g || a.grupo === g) &&
      (!q || (a.cod + ' ' + a.nom + ' ' + Object.keys(a.attrs || {}).map(k => a.attrs[k]).join(' ')).toLowerCase().includes(q)));
    document.getElementById('bus-body').innerHTML = UI.tabla(['Código', 'Artículo', 'Grupo', 'UM venta', ['Precio', 'num'], ['Disponible ' + alm, 'num'], ['Disponible total', 'num'], ['', '', '90px']], lista.map(a => {
      const um = Precios.umVenta(a.cod), r = Precios.resolver(a.cod, um, d.sede, tipo, d.mon);
      const attrs = BD.attrsOrdenados(a).map(([k, v]) => k + ': ' + v).join(' · ');
      const en = d.lineas.filter(l => l.art === a.cod).length;
      return '<tr><td>' + a.cod + '</td><td>' + UI.esc(a.nom) + (attrs ? '<br><span class="mini">' + UI.esc(attrs) + '</span>' : '') + '</td><td class="mini">' + UI.esc(M.grupoNom(a.grupo)) + '</td><td>' + (a.uVenta || a.u) + '</td>' +
        '<td class="num">' + (r ? '<b>' + UI.m(r.precio, d.mon) + '</b><br><span class="mini">' + r.origen + '</span>' : '<span class="err-t">Sin precio en ' + d.mon + '</span>') + '</td>' +
        '<td class="num">' + (a.inv ? UI.n(Stock.disp(alm, a.cod), 0) : '—') + '</td><td class="num">' + (a.inv ? UI.n(Stock.totalDisp(a.cod), 0) : 'Servicio') + '</td>' +
        '<td><button class="btn btn-primary btn-sm" onclick="BUS.agregar(\'' + a.cod + '\')">' + (en ? '+ Otra vez' : 'Agregar') + '</button></td></tr>';
    }), { vacio: 'Sin resultados' });
  },
  agregar(cod) { if (BUS._cb) BUS._cb(cod); if (document.getElementById('bus-body')) BUS.pintarArt(); },

  cliente(cb) {
    BUS._cb = cb;
    UI.modal({
      lg: true, titulo: 'Buscar cliente', code: 'CL-38',
      cuerpo: '<div class="filters" style="margin-bottom:10px">' +
        UI.campo('Documento, nombre o teléfono', '<input id="bus-q" placeholder="Buscar…" oninput="BUS.pintarCli()" style="min-width:260px">') +
        UI.campo('Tipo de cliente', '<select id="bus-t" onchange="BUS.pintarCli()">' + UI.opts(M.TIPOS_CLIENTE, '', 'Todos') + '</select>') +
        (Store.puede('crear_cliente') ? '<button class="btn btn-secondary btn-sm" onclick="const cb=BUS._cb;CLIQ.abrir(cb)">+ Nuevo cliente</button>' : '') + '</div><div id="bus-body"></div>' +
        '<p class="hint">Solo clientes activos. Un cliente inactivo se reactiva desde su ficha (CL-35).</p>',
      pie: '<button class="btn btn-secondary" onclick="UI.cerrar()">Cerrar</button>'
    });
    BUS.pintarCli();
  },
  pintarCli() {
    const q = UI.v('bus-q').toLowerCase(), t = UI.v('bus-t');
    const lista = Store.d.clientes.filter(c => c.activo && (!t || c.tipo === t) && (!q || (c.cod + ' ' + c.doc + ' ' + c.nom + ' ' + c.tel).toLowerCase().includes(q)));
    document.getElementById('bus-body').innerHTML = UI.tabla(['Código', 'Documento', 'Nombre / razón social', 'Teléfono', 'Tipo', 'Estado comercial', ['', '', '100px']], lista.map(c =>
      '<tr><td>' + c.cod + '</td><td>' + Cli.docTxt(c) + '</td><td>' + UI.esc(c.nom) + '</td><td>' + UI.esc(c.tel) + '</td><td class="mini">' + c.tipo + '</td><td>' + UI.estado(Cli.estadoComercial(c)) + '</td>' +
      '<td><button class="btn btn-primary btn-sm" onclick="BUS.elegir(\'' + c.cod + '\')">Seleccionar</button></td></tr>'), { vacio: 'Sin resultados' });
  },
  elegir(cod) { const cb = BUS._cb; UI.cerrar(); if (cb) cb(cod); }
};
