/* Panel de administración */
(function () {
  const { esc, precio, imgUrl, post, toast, DEMO, ICONOS, icono } = window.SOL;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const st = { token: null, user: null, productos: [], categorias: [], catsOk: true, editando: null, imgs: [], subiendo: 0, catEdit: null, catIcono: 'etiqueta' };

  // ---------- Sesión ----------
  const guardarToken = t => { try { t ? localStorage.setItem('sol_token', t) : localStorage.removeItem('sol_token'); } catch (e) { } };
  const leerToken = () => { try { return localStorage.getItem('sol_token'); } catch (e) { return null; } };

  async function api(action, datos = {}) {
    const r = await post(Object.assign({ action, token: st.token }, datos));
    if (!r.ok && r.error === 'SESION_EXPIRADA') {
      salir(true);
      throw new Error('Tu sesión expiró. Volvé a ingresar.');
    }
    if (!r.ok) throw new Error(r.error || 'Error');
    return r;
  }

  function mostrarLogin() {
    $('#vPanel').hidden = true;
    $('#vLogin').hidden = false;
    $('#lUser').focus();
  }

  function mostrarPanel() {
    $('#vLogin').hidden = true;
    $('#vPanel').hidden = false;
    $('#uNombre').textContent = st.user.nombre;
    $('#uRol').textContent = st.user.rol === 'admin' ? 'Administrador' : 'Editor';
    $$('[data-admin]').forEach(el => el.hidden = st.user.rol !== 'admin');
    $('#demoBanner').hidden = !DEMO;
    cambiarTab('productos');
    cargarCategorias();
    cargarProductos();
  }

  function salir(silencioso) {
    if (st.token && !silencioso) post({ action: 'logout', token: st.token }).catch(() => { });
    st.token = null; st.user = null;
    guardarToken(null);
    mostrarLogin();
  }

  $('#fLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#lBtn');
    btn.disabled = true; btn.textContent = 'Verificando…';
    $('#lErr').textContent = '';
    try {
      const r = await post({ action: 'login', usuario: $('#lUser').value, clave: $('#lPass').value });
      if (!r.ok) throw new Error(r.error);
      st.token = r.token; st.user = r.usuario;
      guardarToken(r.token);
      $('#lPass').value = '';
      mostrarPanel();
    } catch (err) {
      $('#lErr').textContent = err.message || 'No se pudo ingresar';
    } finally {
      btn.disabled = false; btn.textContent = 'Ingresar';
    }
  });
  $('#bSalir').addEventListener('click', () => salir());

  // ---------- Pestañas ----------
  function cambiarTab(id) {
    $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === id));
    $$('.panel').forEach(p => p.hidden = p.id !== 'tab-' + id);
    if (id === 'ajustes') cargarConfig();
    if (id === 'categorias') renderCategorias();
    if (id === 'usuarios') cargarUsuarios();
  }
  $$('.tab').forEach(t => t.addEventListener('click', () => cambiarTab(t.dataset.tab)));

  // ---------- Productos ----------
  async function cargarProductos() {
    $('#plist').innerHTML = '<div class="empty">Cargando productos…</div>';
    try {
      const r = await api('listarProductos');
      st.productos = r.productos || [];
      renderProductos();
      if (!st.catsOk) usarCategoriasDeRespaldo();
    } catch (err) {
      $('#plist').innerHTML = `<div class="empty">${esc(err.message)}</div>`;
    }
  }

  function renderProductos() {
    const q = $('#aQ').value.trim().toLowerCase();
    const cat = $('#aCat').value;
    const lista = st.productos.filter(p => (!cat || p.categoria === cat) &&
      (!q || p.nombre.toLowerCase().includes(q) || String(p.codigo || '').toLowerCase().includes(q)));

    const visibles = st.productos.filter(p => p.activo).length;
    const agotados = st.productos.filter(p => p.stock === 0).length;
    const usados = st.productos.filter(p => p.condicion === 'Segunda mano').length;
    $('#stats').innerHTML = `
      <div class="stat"><b>${st.productos.length}</b><span>Productos</span></div>
      <div class="stat"><b>${visibles}</b><span>Visibles</span></div>
      <div class="stat"><b>${usados}</b><span>Segunda mano</span></div>
      <div class="stat"><b>${agotados}</b><span>Agotados</span></div>`;

    if (!lista.length) {
      $('#plist').innerHTML = `<div class="empty"><p>${st.productos.length ? 'Sin resultados.' : 'Todavía no hay productos.'}</p>
        ${st.productos.length ? '' : '<button class="btn btn-primary" onclick="document.getElementById(\'bNuevo\').click()">Cargar el primero</button>'}</div>`;
      return;
    }
    $('#plist').innerHTML = lista.map(p => `
      <div class="pitem ${p.activo ? '' : 'off'}">
        <div class="pthumb">${p.imagenes[0]
          ? `<img src="${esc(imgUrl(p.imagenes[0], 150))}" alt="" loading="lazy" onerror="SOL.imgFallback(this)">`
          : `<div class="ph">${esc(p.nombre[0] || 'S')}</div>`}</div>
        <div class="pinfo">
          <b>${esc(p.nombre)}</b>
          <span>${p.codigo ? `<b class="pcod">${esc(p.codigo)}</b> · ` : ''}${esc(precio(p.precio))} · ${esc(p.categoria)}</span>
          <div class="pmeta">
            ${p.condicion === 'Segunda mano' ? '<i>Segunda mano</i>' : ''}
            ${p.destacado ? '<i>Destacado</i>' : ''}
            ${!p.activo ? '<i class="warn">Oculto</i>' : ''}
            ${p.stock === 0 ? '<i class="warn">Agotado</i>' : (p.stock != null ? `<i>Stock ${p.stock}</i>` : '')}
          </div>
        </div>
        <div class="pact">
          <button class="icon-btn" data-vis="${esc(p.id)}" title="${p.activo ? 'Ocultar' : 'Mostrar'}" aria-label="${p.activo ? 'Ocultar' : 'Mostrar'} ${esc(p.nombre)}">
            <svg class="icon" viewBox="0 0 24 24">${p.activo
              ? '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
              : '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>'}</svg>
          </button>
          <button class="icon-btn" data-edit="${esc(p.id)}" title="Editar" aria-label="Editar ${esc(p.nombre)}">
            <svg class="icon" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4"/></svg>
          </button>
        </div>
      </div>`).join('');
  }

  $('#aQ').addEventListener('input', renderProductos);
  $('#aCat').addEventListener('change', renderProductos);
  $('#plist').addEventListener('click', async e => {
    const ed = e.target.closest('[data-edit]');
    if (ed) return abrirEditor(st.productos.find(p => p.id === ed.dataset.edit));
    const vis = e.target.closest('[data-vis]');
    if (vis) {
      const p = st.productos.find(x => x.id === vis.dataset.vis);
      vis.disabled = true;
      try {
        await api('guardarProducto', { producto: Object.assign({}, p, { activo: !p.activo }) });
        p.activo = !p.activo;
        renderProductos();
        toast(p.activo ? 'Producto visible' : 'Producto oculto');
      } catch (err) { toast(err.message, true); vis.disabled = false; }
    }
  });

  // ---------- Editor ----------
  const num = v => { const n = String(v || '').replace(/\D/g, ''); return n === '' ? '' : Number(n); };

  function abrirEditor(p) {
    st.editando = p || null;
    st.imgs = p ? p.imagenes.slice() : [];
    $('#eTitulo').textContent = p ? 'Editar producto' : 'Nuevo producto';
    $('#eNombre').value = p ? p.nombre : '';
    $('#eCod').value = p ? (p.codigo || '') : '';
    llenarSelects(p ? p.categoria : '');
    $('#eCat').value = p ? p.categoria : ((st.categorias.find(c => c.activo) || st.categorias[0] || {}).nombre || '');
    $('#eCond').value = p ? p.condicion : 'Nuevo';
    $('#ePrecio').value = p && p.precio ? p.precio.toLocaleString('es-PY') : '';
    $('#eAnt').value = p && p.precio_anterior ? p.precio_anterior.toLocaleString('es-PY') : '';
    $('#eTalles').value = p ? p.talles.join(', ') : '';
    $('#eColores').value = p ? p.colores.join(', ') : '';
    $('#eStock').value = p && p.stock != null ? p.stock : '';
    $('#eOrden').value = p && p.orden ? p.orden : '';
    $('#eDesc').value = p ? p.descripcion : '';
    $('#eDest').checked = p ? p.destacado : false;
    $('#eAct').checked = p ? p.activo : true;
    $('#eErr').textContent = '';
    $('#eDel').hidden = !p;
    renderImgs();
    $('#mEdit').hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#eNombre').focus(), 50);
  }

  function cerrarEditor() {
    if (st.subiendo > 0 && !confirm('Hay fotos subiéndose. ¿Cerrar igual?')) return;
    $('#mEdit').hidden = true;
    document.body.style.overflow = '';
  }

  $('#bNuevo').addEventListener('click', () => abrirEditor(null));
  $('#mEdit').addEventListener('click', e => { if (e.target.closest('[data-close]')) cerrarEditor(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#mEdit').hidden) cerrarEditor(); });

  // Formato de miles mientras escribe
  ['#ePrecio', '#eAnt'].forEach(s => $(s).addEventListener('input', e => {
    const n = num(e.target.value);
    e.target.value = n === '' ? '' : n.toLocaleString('es-PY');
  }));

  function renderImgs() {
    const cont = $('#eImgs');
    cont.innerHTML = st.imgs.map((id, i) => `
      <div class="imgbox ${id.startsWith('cargando:') ? 'loading' : ''}">
        ${id.startsWith('cargando:') ? '' : `<img src="${esc(imgUrl(id, 300))}" alt="Foto ${i + 1}" onerror="SOL.imgFallback(this)">`}
        ${id.startsWith('cargando:') ? '' : `<button type="button" class="x" data-rm="${i}" aria-label="Quitar foto ${i + 1}">✕</button>`}
        ${i > 0 && !id.startsWith('cargando:') ? `<button type="button" class="mv" data-first="${i}" aria-label="Usar como principal" title="Usar como principal">★</button>` : ''}
        ${i === 0 && !id.startsWith('cargando:') ? '<span class="main">Principal</span>' : ''}
      </div>`).join('') + `
      <label class="upload" for="eFile">
        <span><svg class="icon" viewBox="0 0 24 24" style="margin:0 auto 4px"><path d="M12 5v14M5 12h14"/></svg>Agregar fotos</span>
      </label>`;
  }

  $('#eImgs').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { st.imgs.splice(Number(rm.dataset.rm), 1); return renderImgs(); }
    const f = e.target.closest('[data-first]');
    if (f) { const [x] = st.imgs.splice(Number(f.dataset.first), 1); st.imgs.unshift(x); renderImgs(); }
  });

  /** Lee un archivo como imagen; resuelve con el <img> o rechaza si el navegador no lo entiende */
  function cargarImagen(blob) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('No se pudo leer la imagen')); };
      img.src = url;
    });
  }

  const esHeic = f => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

  /** Carga el conversor de HEIC (fotos de iPhone) solo cuando hace falta.
   *  heic-to usa una versión actual de libheif, compatible con las fotos de iPhone recientes. */
  let heicLib = null;
  function cargarConversorHeic() {
    if (window.HeicTo) return Promise.resolve(window.HeicTo);
    if (heicLib) return heicLib;
    heicLib = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/heic-to@1.6.5/dist/iife/heic-to.js';
      s.onload = () => window.HeicTo ? res(window.HeicTo) : rej(new Error('No se pudo cargar el conversor de fotos HEIC'));
      s.onerror = () => { heicLib = null; rej(new Error('No se pudo cargar el conversor de fotos HEIC. Revisá la conexión.')); };
      document.head.appendChild(s);
    });
    return heicLib;
  }

  /** Reduce la imagen en el navegador antes de subirla (máx. 1600 px, JPEG). Acepta HEIC de iPhone. */
  async function reducir(file) {
    let img;
    try {
      img = await cargarImagen(file);          // Safari abre HEIC de forma nativa
    } catch (e) {
      if (!esHeic(file)) throw new Error('Formato no compatible. Usá fotos JPG, PNG, WEBP o HEIC.');
      const heicTo = await cargarConversorHeic();   // Chrome y otros: convertir primero
      let jpg;
      try {
        jpg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });
      } catch (err) {
        throw new Error('esta foto HEIC no se pudo convertir en este navegador. Probá subirla desde Safari o exportarla como JPG.');
      }
      img = await cargarImagen(jpg);
    }
    const max = 1600;
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85).split(',')[1];
  }

  $('#eFile').addEventListener('change', async e => {
    const archivos = Array.from(e.target.files || []).slice(0, 8);
    e.target.value = '';
    for (const f of archivos) {
      const marca = 'cargando:' + Math.random();
      st.imgs.push(marca);
      st.subiendo++;
      renderImgs();
      try {
        const b64 = await reducir(f);
        const r = await api('subirImagen', { nombre: f.name.replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', base64: b64 });
        const i = st.imgs.indexOf(marca);
        if (i >= 0) st.imgs[i] = r.id;
      } catch (err) {
        st.imgs = st.imgs.filter(x => x !== marca);
        toast('Error al subir ' + f.name + ': ' + err.message, true);
      } finally {
        st.subiendo--;
        renderImgs();
      }
    }
  });

  $('#fProd').addEventListener('submit', async e => {
    e.preventDefault();
    $('#eErr').textContent = '';
    if (st.subiendo > 0) return $('#eErr').textContent = 'Esperá a que terminen de subir las fotos.';
    const nombre = $('#eNombre').value.trim();
    const pr = num($('#ePrecio').value);
    if (!nombre) return $('#eErr').textContent = 'Completá el nombre.';
    if (pr === '' || pr <= 0) return $('#eErr').textContent = 'Ingresá un precio válido.';
    const cod = $('#eCod').value.trim().toUpperCase().replace(/\s+/g, '');
    if (cod && !/^[A-Z0-9-]{2,12}$/.test(cod)) return $('#eErr').textContent = 'El código debe tener de 2 a 12 letras, números o guiones.';

    const lista = s => s.split(',').map(x => x.trim()).filter(Boolean);
    const producto = {
      id: st.editando ? st.editando.id : '',
      nombre,
      codigo: $('#eCod').value.trim().toUpperCase().replace(/\s+/g, ''),
      categoria: $('#eCat').value,
      condicion: $('#eCond').value,
      precio: pr,
      precio_anterior: num($('#eAnt').value) || 0,
      talles: lista($('#eTalles').value),
      colores: lista($('#eColores').value),
      stock: $('#eStock').value.trim() === '' ? null : num($('#eStock').value),
      orden: num($('#eOrden').value) || 0,
      descripcion: $('#eDesc').value.trim(),
      imagenes: st.imgs.filter(x => !x.startsWith('cargando:')),
      destacado: $('#eDest').checked,
      activo: $('#eAct').checked
    };

    const btn = $('#eSave');
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const r = await api('guardarProducto', { producto });
      producto.id = r.id;
      if (r.codigo) producto.codigo = r.codigo;
      const i = st.productos.findIndex(p => p.id === r.id);
      if (i >= 0) st.productos[i] = producto; else st.productos.unshift(producto);
      renderProductos();
      $('#mEdit').hidden = true;
      document.body.style.overflow = '';
      toast(producto.codigo ? `Producto guardado · ${producto.codigo}` : 'Producto guardado');
    } catch (err) {
      $('#eErr').textContent = err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar';
    }
  });

  $('#eDel').addEventListener('click', async () => {
    const p = st.editando;
    if (!p || !confirm(`¿Eliminar “${p.nombre}”? Sus fotos se enviarán a la papelera de Drive.`)) return;
    try {
      await api('eliminarProducto', { id: p.id });
      st.productos = st.productos.filter(x => x.id !== p.id);
      renderProductos();
      $('#mEdit').hidden = true;
      document.body.style.overflow = '';
      toast('Producto eliminado');
    } catch (err) { $('#eErr').textContent = err.message; }
  });

  // ---------- Categorías ----------
  const DEFECTO = [['Ropa', 'ropa'], ['Accesorios', 'acc'], ['Lencería', 'lenc'], ['Perfumes', 'perf']];

  async function cargarCategorias() {
    try {
      const r = await api('listarCategorias');
      st.categorias = r.categorias || [];
      st.catsOk = true;
    } catch (err) {
      // Backend sin actualizar: se usan las categorías de siempre
      st.catsOk = false;
      usarCategoriasDeRespaldo();
    }
    llenarSelects();
    if (!$('#tab-categorias').hidden) renderCategorias();
  }

  function usarCategoriasDeRespaldo() {
    const nombres = DEFECTO.map(d => d[0]);
    st.productos.forEach(p => { if (p.categoria && !nombres.includes(p.categoria)) nombres.push(p.categoria); });
    st.categorias = nombres.map((n, i) => ({ nombre: n, icono: (DEFECTO.find(d => d[0] === n) || [, 'etiqueta'])[1], orden: i + 1, activo: true }));
    llenarSelects();
  }

  /** Completa los desplegables de categoría (filtro del listado y editor) */
  function llenarSelects(incluir) {
    const filtro = $('#aCat'), actual = filtro.value;
    filtro.innerHTML = '<option value="">Todas</option>' +
      st.categorias.map(c => `<option value="${esc(c.nombre)}">${esc(c.nombre)}</option>`).join('');
    filtro.value = st.categorias.some(c => c.nombre === actual) ? actual : '';

    const visibles = st.categorias.filter(c => c.activo || c.nombre === incluir);
    $('#eCat').innerHTML = visibles.map(c =>
      `<option value="${esc(c.nombre)}">${esc(c.nombre)}${c.activo ? '' : ' (oculta)'}</option>`).join('');
  }

  const cuenta = n => st.productos.filter(p => p.categoria === n).length;

  function renderCategorias() {
    if (!st.catsOk) {
      $('#clist').innerHTML = `<div class="empty" style="padding:24px 8px">Para editar categorías falta actualizar el backend.<br>
        Ejecutá <code>clasp push</code> y <code>clasp deploy</code> en la carpeta <code>apps-script</code>.</div>`;
      $('#fCat').hidden = true;
      return;
    }
    $('#fCat').hidden = false;
    const n = st.categorias.length;
    $('#clist').innerHTML = n ? st.categorias.map((c, i) => `
      <div class="uitem ${c.activo ? '' : 'off'}">
        <span class="cdot">${icono(c.icono, 18)}</span>
        <div class="grow"><b>${esc(c.nombre)}</b><br><span>${cuenta(c.nombre)} producto(s)${c.activo ? '' : ' · Oculta'}</span></div>
        <div class="cact">
          <button class="icon-btn" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${esc(c.nombre)}" title="Subir">
            <svg class="icon" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button>
          <button class="icon-btn" data-down="${i}" ${i === n - 1 ? 'disabled' : ''} aria-label="Bajar ${esc(c.nombre)}" title="Bajar">
            <svg class="icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
          <button class="icon-btn" data-cedit="${i}" aria-label="Editar ${esc(c.nombre)}" title="Editar">
            <svg class="icon" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4"/></svg></button>
          <button class="icon-btn" data-cdel="${i}" aria-label="Eliminar ${esc(c.nombre)}" title="Eliminar">
            <svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
        </div>
      </div>`).join('') : '<p class="hint">Todavía no hay categorías.</p>';
    renderIconos();
  }

  function renderIconos() {
    $('#cIconos').innerHTML = Object.keys(ICONOS).map(k => `
      <button type="button" role="radio" data-ic="${k}" aria-checked="${k === st.catIcono}">
        ${icono(k, 22)}<span>${esc(ICONOS[k].n)}</span></button>`).join('');
  }
  $('#cIconos').addEventListener('click', e => {
    const b = e.target.closest('[data-ic]'); if (!b) return;
    st.catIcono = b.dataset.ic;
    renderIconos();
  });

  function formCategoria(c) {
    st.catEdit = c || null;
    st.catIcono = c ? c.icono : 'etiqueta';
    $('#cTit').textContent = c ? `Editar “${c.nombre}”` : 'Nueva categoría';
    $('#cNom').value = c ? c.nombre : '';
    $('#cAct').checked = c ? c.activo : true;
    $('#cSave').textContent = c ? 'Guardar cambios' : 'Agregar categoría';
    $('#cCancel').hidden = !c;
    $('#cErr').textContent = '';
    renderIconos();
    if (c) { $('#fCat').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#cNom').focus(); }
  }
  $('#cCancel').addEventListener('click', () => formCategoria(null));

  async function guardarOrden(lista) {
    const previo = st.categorias;
    st.categorias = lista.map((c, i) => Object.assign({}, c, { orden: i + 1 }));
    renderCategorias(); llenarSelects();
    try { await api('ordenarCategorias', { nombres: st.categorias.map(c => c.nombre) }); }
    catch (err) { st.categorias = previo; renderCategorias(); llenarSelects(); toast(err.message, true); }
  }

  $('#clist').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const lista = st.categorias.slice();
    if (b.dataset.up) { const i = +b.dataset.up; [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]]; return guardarOrden(lista); }
    if (b.dataset.down) { const i = +b.dataset.down; [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]]; return guardarOrden(lista); }
    if (b.dataset.cedit) return formCategoria(st.categorias[+b.dataset.cedit]);
    if (b.dataset.cdel) {
      const c = st.categorias[+b.dataset.cdel];
      const n = cuenta(c.nombre);
      if (n) return toast(`“${c.nombre}” tiene ${n} producto(s). Pasalos a otra categoría antes de eliminarla.`, true);
      if (!confirm(`¿Eliminar la categoría “${c.nombre}”?`)) return;
      try {
        await api('eliminarCategoria', { nombre: c.nombre });
        st.categorias = st.categorias.filter(x => x !== c);
        if (st.catEdit === c) formCategoria(null);
        renderCategorias(); llenarSelects();
        toast('Categoría eliminada');
      } catch (err) { toast(err.message, true); }
    }
  });

  $('#fCat').addEventListener('submit', async e => {
    e.preventDefault();
    const nombre = $('#cNom').value.trim().replace(/\s+/g, ' ');
    $('#cErr').textContent = '';
    if (nombre.length < 2) return $('#cErr').textContent = 'Escribí un nombre de al menos 2 letras.';
    if (nombre.includes(',')) return $('#cErr').textContent = 'El nombre no puede tener comas.';
    const original = st.catEdit ? st.catEdit.nombre : '';
    const btn = $('#cSave'); btn.disabled = true;
    try {
      await api('guardarCategoria', { categoria: { nombre, nombreOriginal: original, icono: st.catIcono, activo: $('#cAct').checked } });
      if (original && original !== nombre) st.productos.forEach(p => { if (p.categoria === original) p.categoria = nombre; });
      const r = await api('listarCategorias');
      st.categorias = r.categorias || [];
      formCategoria(null);
      renderCategorias(); llenarSelects(); renderProductos();
      toast(original ? 'Categoría actualizada' : 'Categoría agregada');
    } catch (err) {
      $('#cErr').textContent = err.message;
    } finally { btn.disabled = false; }
  });

  // ---------- Ajustes ----------
  async function cargarConfig() {
    try {
      const r = await api('leerConfig');
      $$('#fCfg [data-k]').forEach(el => el.value = r.config[el.dataset.k] || '');
    } catch (err) { toast(err.message, true); }
  }
  $('#fCfg').addEventListener('submit', async e => {
    e.preventDefault();
    const config = {};
    $$('#fCfg [data-k]').forEach(el => config[el.dataset.k] = el.value.trim());
    config.whatsapp = config.whatsapp.replace(/\D/g, '');
    try { await api('guardarConfig', { config }); toast('Datos guardados'); }
    catch (err) { toast(err.message, true); }
  });

  // ---------- Usuarios ----------
  async function cargarUsuarios() {
    $('#ulist').innerHTML = 'Cargando…';
    try {
      const r = await api('listarUsuarios');
      $('#ulist').innerHTML = r.usuarios.map(u => `
        <div class="uitem">
          <div class="grow"><b>${esc(u.nombre)}</b><br><span>@${esc(u.usuario)} · ${u.rol === 'admin' ? 'Administrador' : 'Editor'}${u.activo ? '' : ' · <b style="color:var(--danger)">Desactivado</b>'}</span></div>
          <button class="btn mini" data-reset="${esc(u.usuario)}">Nueva clave</button>
          ${u.usuario !== st.user.usuario ? `<button class="btn mini" data-toggle="${esc(u.usuario)}" data-on="${u.activo}">${u.activo ? 'Desactivar' : 'Activar'}</button>` : ''}
        </div>`).join('');
    } catch (err) { $('#ulist').textContent = err.message; }
  }
  $('#ulist').addEventListener('click', async e => {
    const t = e.target.closest('[data-toggle]');
    const rs = e.target.closest('[data-reset]');
    try {
      if (t) {
        await api('estadoUsuario', { usuario: t.dataset.toggle, activo: t.dataset.on !== 'true' });
        toast('Usuario actualizado'); cargarUsuarios();
      }
      if (rs) {
        const clave = prompt(`Nueva clave para @${rs.dataset.reset} (mínimo 8 caracteres):`);
        if (!clave) return;
        await api('resetClave', { usuario: rs.dataset.reset, clave });
        toast('Clave actualizada');
      }
    } catch (err) { toast(err.message, true); }
  });
  $('#fUser').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api('crearUsuario', { usuario: $('#nuUser').value.trim(), nombre: $('#nuNombre').value.trim(), clave: $('#nuClave').value, rol: $('#nuRol').value });
      e.target.reset();
      toast('Usuario creado');
      cargarUsuarios();
    } catch (err) { toast(err.message, true); }
  });

  // ---------- Mi cuenta ----------
  $('#fClave').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api('cambiarClave', { actual: $('#kAct').value, nueva: $('#kNue').value });
      e.target.reset();
      toast('Clave actualizada');
    } catch (err) { toast(err.message, true); }
  });

  // ---------- Inicio ----------
  (async function iniciar() {
    st.token = leerToken();
    if (!st.token) return mostrarLogin();
    try {
      const r = await post({ action: 'yo', token: st.token });
      if (!r.ok) throw new Error();
      st.user = r.usuario;
      mostrarPanel();
    } catch (e) {
      guardarToken(null);
      mostrarLogin();
    }
  })();
})();
