/* Catálogo público */
(function () {
  const { esc, precio, imgUrl, imgFallback, get, toast } = window.SOL;
  const $ = s => document.querySelector(s);

  const ICONOS = {
    todo: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    nueva: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-1 1.5-2.4 2-4 2S9 4.5 8 3Z"/>',
    usada: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>',
    acc: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    lenc: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    perf: '<path d="M9 3h6v3H9zM10 6v2M14 6v2"/><rect x="6" y="8" width="12" height="13" rx="3"/>'
  };
  const FILTROS = [
    { id: 'todo', label: 'Todo', icon: 'todo', fn: () => true },
    { id: 'nueva', label: 'Ropa nueva', icon: 'nueva', fn: p => p.categoria === 'Ropa' && p.condicion === 'Nuevo' },
    { id: 'usada', label: 'Segunda mano', icon: 'usada', fn: p => p.condicion === 'Segunda mano' },
    { id: 'acc', label: 'Accesorios', icon: 'acc', fn: p => p.categoria === 'Accesorios' },
    { id: 'lenc', label: 'Lencería', icon: 'lenc', fn: p => p.categoria === 'Lencería' },
    { id: 'perf', label: 'Perfumes', icon: 'perf', fn: p => p.categoria === 'Perfumes' }
  ];

  const estado = { productos: [], config: {}, filtro: 'todo', q: '', orden: 'rel' };

  // ---------- Render de chips ----------
  function renderChips() {
    $('#chips').innerHTML = FILTROS.map(f => `
      <button class="chip" type="button" data-f="${f.id}" aria-pressed="${f.id === estado.filtro}">
        <span class="dot"><svg class="icon" viewBox="0 0 24 24" style="width:16px;height:16px">${ICONOS[f.icon]}</svg></span>${f.label}
      </button>`).join('');
    $('#footCats').innerHTML = FILTROS.slice(1).map(f => `<a href="#catalogo" data-f="${f.id}">${f.label}</a>`).join('');
  }

  function aplicarFiltro(id) {
    estado.filtro = id;
    document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.f === id));
    renderLista();
  }

  // ---------- Tarjeta ----------
  function tarjeta(p) {
    const img = p.imagenes && p.imagenes[0];
    const media = img
      ? `<img src="${esc(imgUrl(img, 600))}" alt="${esc(p.nombre)}" loading="lazy" onerror="SOL.imgFallback(this)">`
      : `<div class="ph">${esc((p.nombre || 'S')[0])}</div>`;
    const agotado = p.stock === 0;
    return `
      <button class="card" type="button" data-id="${esc(p.id)}" aria-label="${esc(p.nombre)}, ${esc(precio(p.precio))}">
        <div class="card-media">
          ${media}
          ${p.condicion === 'Segunda mano' ? '<span class="badge used">Segunda mano</span>' : (p.precio_anterior > p.precio ? '<span class="badge">Oferta</span>' : '')}
          ${agotado ? '<span class="badge sold">Agotado</span>' : ''}
        </div>
        <div class="card-body">
          <span class="card-cat">${esc(p.categoria)}</span>
          <span class="card-name">${esc(p.nombre)}</span>
          <span class="price"><b>${esc(precio(p.precio))}</b>${p.precio_anterior > p.precio ? `<s>${esc(precio(p.precio_anterior))}</s>` : ''}</span>
        </div>
      </button>`;
  }

  // ---------- Lista ----------
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function renderLista() {
    const f = FILTROS.find(x => x.id === estado.filtro) || FILTROS[0];
    const q = norm(estado.q);
    let lista = estado.productos.filter(f.fn).filter(p =>
      !q || norm([p.nombre, p.categoria, p.condicion, p.descripcion, (p.colores || []).join(' ')].join(' ')).includes(q));

    if (estado.orden === 'menor') lista.sort((a, b) => a.precio - b.precio);
    else if (estado.orden === 'mayor') lista.sort((a, b) => b.precio - a.precio);
    else if (estado.orden === 'nuevos') lista.sort((a, b) => String(b.creado || b.id).localeCompare(String(a.creado || a.id)));
    else lista.sort((a, b) => (a.stock === 0) - (b.stock === 0)); // agotados al final

    $('#tituloLista').textContent = estado.q ? `Resultados para “${estado.q}”` : (f.id === 'todo' ? 'Todo el catálogo' : f.label);
    $('#contador').textContent = lista.length === 1 ? '1 producto' : `${lista.length} productos`;
    $('#grid').innerHTML = lista.map(tarjeta).join('');
    $('#vacio').hidden = lista.length > 0;
  }

  function renderDestacados() {
    const d = estado.productos.filter(p => p.destacado && p.stock !== 0).slice(0, 12);
    $('#destacadosSec').hidden = d.length === 0;
    $('#destacados').innerHTML = d.map(tarjeta).join('');
  }

  function skeleton() {
    $('#grid').innerHTML = Array.from({ length: 8 }, () =>
      '<div class="skel"><div class="s-img"></div><div class="s-l1"></div><div class="s-l2"></div></div>').join('');
  }

  // ---------- WhatsApp ----------
  function waLink(texto) {
    const num = String(estado.config.whatsapp || (window.SOL_CONFIG || {}).WHATSAPP_POR_DEFECTO || '').replace(/\D/g, '');
    return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
  }

  function aplicarConfig() {
    const c = estado.config;
    if (c.mensaje_bienvenida) $('#bienvenida').textContent = c.mensaje_bienvenida;
    $('#footDir').textContent = c.direccion || '';
    const general = waLink(`¡Hola ${c.nombre_tienda || 'Sol Store'}! Quisiera hacer una consulta.`);
    ['#fabWa', '#topWa', '#footWa'].forEach(s => $(s).href = general);
    if (c.instagram) {
      const ig = $('#footIg');
      ig.hidden = false;
      ig.href = 'https://instagram.com/' + c.instagram.replace(/^@/, '');
      ig.textContent = 'Instagram @' + c.instagram.replace(/^@/, '');
    }
  }

  // ---------- Detalle ----------
  function abrirDetalle(id, desdeHash) {
    const p = estado.productos.find(x => String(x.id) === String(id));
    if (!p) return;
    const sel = { talle: p.talles.length === 1 ? p.talles[0] : '', color: p.colores.length === 1 ? p.colores[0] : '' };
    const imgs = p.imagenes || [];
    const agotado = p.stock === 0;

    const opciones = (titulo, lista, clave) => lista.length ? `
      <div><div class="opt-label">${titulo}</div>
        <div class="opts" data-k="${clave}">${lista.map(v => `<button type="button" class="opt" aria-pressed="${sel[clave] === v}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>
      </div>` : '';

    $('#mContenido').innerHTML = `
      <div class="detail">
        <div>
          <div class="gallery-main" id="gMain">${imgs[0]
            ? `<img src="${esc(imgUrl(imgs[0], 1200))}" alt="${esc(p.nombre)}" onerror="SOL.imgFallback(this)">`
            : `<div class="ph" style="font-size:80px">${esc(p.nombre[0] || 'S')}</div>`}</div>
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((im, i) => `
            <button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="Foto ${i + 1}">
              <img src="${esc(imgUrl(im, 150))}" alt="" loading="lazy" onerror="SOL.imgFallback(this)"></button>`).join('')}</div>` : ''}
        </div>
        <div class="detail-info">
          <div class="tags">
            <span class="tag">${esc(p.categoria)}</span>
            <span class="tag">${esc(p.condicion)}</span>
            ${agotado ? '<span class="tag" style="background:#f6dcd6;color:#8d2f20">Agotado</span>' : ''}
          </div>
          <h3 id="mTitulo">${esc(p.nombre)}</h3>
          <div class="price"><b>${esc(precio(p.precio))}</b>${p.precio_anterior > p.precio ? `<s>${esc(precio(p.precio_anterior))}</s>` : ''}</div>
          ${opciones('Talle', p.talles, 'talle')}
          ${opciones('Color', p.colores, 'color')}
          ${p.descripcion ? `<p class="desc">${esc(p.descripcion)}</p>` : ''}
          <a class="btn btn-block wa-btn" id="mWa" target="_blank" rel="noopener" href="#">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z"/></svg>
            ${agotado ? 'Consultar disponibilidad' : 'Pedir por WhatsApp'}
          </a>
          <button class="btn btn-block btn-ghost" id="mShare" type="button">
            <svg class="icon" viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>Compartir
          </button>
          <p class="note">Te respondemos por WhatsApp para coordinar pago y entrega.</p>
        </div>
      </div>`;

    const actualizarWa = () => {
      const partes = [`¡Hola! Me interesa este producto:`, `• ${p.nombre}`, `• Precio: ${precio(p.precio)}`];
      if (sel.talle) partes.push(`• Talle: ${sel.talle}`);
      if (sel.color) partes.push(`• Color: ${sel.color}`);
      partes.push('', location.origin + location.pathname + '#p=' + encodeURIComponent(p.id));
      $('#mWa').href = waLink(partes.join('\n'));
    };
    actualizarWa();

    $('#mContenido').querySelectorAll('.opts').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.opt'); if (!b) return;
      const k = g.dataset.k;
      sel[k] = sel[k] === b.dataset.v ? '' : b.dataset.v;
      g.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-pressed', o.dataset.v === sel[k]));
      actualizarWa();
    }));

    const th = $('#mContenido .thumbs');
    if (th) th.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      th.querySelectorAll('button').forEach(x => x.setAttribute('aria-current', x === b));
      $('#gMain').innerHTML = `<img src="${esc(imgUrl(imgs[b.dataset.i], 1200))}" alt="${esc(p.nombre)}" onerror="SOL.imgFallback(this)">`;
    });

    $('#mShare').addEventListener('click', async () => {
      const url = location.origin + location.pathname + '#p=' + encodeURIComponent(p.id);
      try {
        if (navigator.share) await navigator.share({ title: p.nombre, text: `${p.nombre} - ${precio(p.precio)}`, url });
        else { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
      } catch (e) { }
    });

    const m = $('#modal');
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!desdeHash) history.replaceState(null, '', '#p=' + encodeURIComponent(p.id));
    m.querySelector('.modal-close').focus();
  }

  function cerrarDetalle() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    if (location.hash.startsWith('#p=')) history.replaceState(null, '', location.pathname);
  }

  // ---------- Eventos ----------
  document.addEventListener('click', e => {
    const card = e.target.closest('.card[data-id]');
    if (card) return abrirDetalle(card.dataset.id);
    const chip = e.target.closest('[data-f]');
    if (chip) {
      aplicarFiltro(chip.dataset.f);
      if (chip.tagName === 'A') return;
      return;
    }
    if (e.target.closest('[data-close]')) cerrarDetalle();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) cerrarDetalle(); });

  let tBusqueda;
  $('#q').addEventListener('input', e => {
    clearTimeout(tBusqueda);
    tBusqueda = setTimeout(() => { estado.q = e.target.value.trim(); renderLista(); }, 200);
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    estado.q = $('#q').value.trim();
    renderLista();
    $('#catalogo').scrollIntoView({ behavior: 'smooth' });
  });
  $('#orden').addEventListener('change', e => { estado.orden = e.target.value; renderLista(); });
  $('#limpiar').addEventListener('click', () => { estado.q = ''; $('#q').value = ''; aplicarFiltro('todo'); });

  // ---------- Carga ----------
  function cargarDatos(d) {
    estado.productos = d.productos || [];
    estado.config = d.config || {};
    aplicarConfig();
    renderDestacados();
    renderLista();
    const m = location.hash.match(/^#p=(.+)$/);
    if (m) abrirDetalle(decodeURIComponent(m[1]), true);
  }

  async function iniciar() {
    $('#anio').textContent = new Date().getFullYear();
    renderChips();
    if (window.SOL.DEMO) $('#demoBanner').hidden = false;

    let enCache = null;
    try { enCache = JSON.parse(localStorage.getItem('sol_catalogo') || 'null'); } catch (e) { }
    if (enCache && !window.SOL.DEMO) cargarDatos(enCache); else skeleton();

    try {
      const d = await get({ action: 'catalogo' });
      if (!d.ok) throw new Error(d.error || 'Error');
      const abierto = !$('#modal').hidden;
      if (!abierto) cargarDatos(d); else { estado.productos = d.productos; estado.config = d.config; renderLista(); renderDestacados(); }
      try { if (!d.demo) localStorage.setItem('sol_catalogo', JSON.stringify(d)); } catch (e) { }
    } catch (err) {
      if (!enCache) {
        $('#grid').innerHTML = '';
        $('#vacio').hidden = false;
        $('#vacio p').textContent = 'No pudimos cargar el catálogo. Revisá tu conexión e intentá de nuevo.';
      }
    }
  }
  iniciar();
})();
