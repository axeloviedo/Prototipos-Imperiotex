/* COMPARTIDO · inserta el HTML de pantallas y modales.
   Cada archivo de vistas/ llama a Vistas.pantallas(...) y Vistas.modales(...) al cargarse,
   así el HTML ya existe cuando corre la lógica de js/. Funciona abriendo el index.html sin servidor. */
const Vistas = {
  pantallas(html) { document.getElementById('content').insertAdjacentHTML('beforeend', html); },
  modales(html) { document.getElementById('modales').insertAdjacentHTML('beforeend', html); }
};
