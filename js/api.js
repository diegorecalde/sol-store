/* Utilidades compartidas entre catálogo y panel */
(function () {
  const CFG = window.SOL_CONFIG || {};
  const DEMO = !CFG.API_URL;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const precio = n => (CFG.MONEDA || 'Gs.') + ' ' + Math.round(Number(n) || 0).toLocaleString('es-PY');

  /** Convierte un ID de Drive (o URL) en URL de imagen */
  function imgUrl(ref, ancho = 800) {
    if (!ref) return '';
    // Fotos de Unsplash: pedir el ancho justo para cada uso
    if (/^https:\/\/images\.unsplash\.com\//.test(ref)) {
      try {
        const u = new URL(ref);
        u.searchParams.set('w', ancho); u.searchParams.set('h', ancho);
        u.searchParams.set('fit', 'crop'); u.searchParams.set('auto', 'format');
        return u.toString();
      } catch (e) { return ref; }
    }
    if (/^(https?:|data:)/.test(ref)) return ref;
    return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(ref) + '=w' + ancho;
  }
  /** Si lh3 falla, prueba con el miniaturizador de Drive */
  function imgFallback(el) {
    const m = el.src.match(/\/d\/([^=]+)=w(\d+)/);
    if (m && !el.dataset.fb) {
      el.dataset.fb = '1';
      el.src = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w' + m[2];
    } else {
      el.replaceWith(Object.assign(document.createElement('div'), { className: 'ph', textContent: 'S' }));
    }
  }

  /** Íconos disponibles para las categorías (trazo fino, monocromo) */
  const ICONOS = {
    ropa: { n: 'Ropa', d: '<path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3c-1 1.5-2.4 2-4 2S9 4.5 8 3Z"/>' },
    acc: { n: 'Bolso', d: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>' },
    lenc: { n: 'Corazón', d: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>' },
    perf: { n: 'Perfume', d: '<path d="M9 3h6v3H9zM10 6v2M14 6v2"/><rect x="6" y="8" width="12" height="13" rx="3"/>' },
    zapato: { n: 'Calzado', d: '<path d="M3 17h18v3H3zM3 17l1-9 5 2 3 3h6a3 3 0 0 1 3 3v1"/>' },
    joya: { n: 'Joyas', d: '<path d="M6 4h12l3 5-9 11L3 9l3-5Z"/><path d="M3 9h18"/>' },
    belleza: { n: 'Belleza', d: '<path d="M9 21h6V11H9zM10 11V6l4-3v8"/>' },
    gafas: { n: 'Lentes', d: '<circle cx="6" cy="14" r="3.5"/><circle cx="18" cy="14" r="3.5"/><path d="M9.5 14h5M2.5 14 4 7M21.5 14 20 7"/>' },
    ninos: { n: 'Niños', d: '<circle cx="12" cy="6" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5"/>' },
    hogar: { n: 'Hogar', d: '<path d="M3 11 12 4l9 7v9H3z"/><path d="M9 20v-6h6v6"/>' },
    estrella: { n: 'Estrella', d: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>' },
    etiqueta: { n: 'Etiqueta', d: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="7.5" r="1.5"/>' }
  };
  const ICONOS_SISTEMA = {
    todo: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    usada: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"/>'
  };
  const icono = (k, tam = 16) => `<svg class="icon" viewBox="0 0 24 24" style="width:${tam}px;height:${tam}px" aria-hidden="true">${
    ICONOS_SISTEMA[k] || (ICONOS[k] || ICONOS.etiqueta).d}</svg>`;

  async function get(params = {}) {
    if (DEMO) return demoGet();
    const url = CFG.API_URL + '?' + new URLSearchParams(params);
    const r = await fetch(url, { redirect: 'follow' });
    return r.json();
  }

  async function post(body) {
    if (DEMO) return demoPost(body);
    // Sin Content-Type explícito -> text/plain: evita el preflight CORS con Apps Script
    const r = await fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' });
    return r.json();
  }

  function toast(msg, err) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ================= MODO DEMO =================
  const demoProductos = [
    { id: 'd1', codigo: 'R001', nombre: 'Vestido midi de lino', categoria: 'Ropa', condicion: 'Nuevo', precio: 245000, precio_anterior: 290000, talles: ['S', 'M', 'L'], colores: ['Arena', 'Blanco'], descripcion: 'Vestido fresco de lino, ideal para el verano.\nLargo midi, con cinto.', imagenes: [], stock: 4, destacado: true, activo: true },
    { id: 'd2', codigo: 'R002', nombre: 'Blazer oversize beige', categoria: 'Ropa', condicion: 'Segunda mano', precio: 120000, precio_anterior: 0, talles: ['M'], colores: ['Beige'], descripcion: 'Excelente estado, usado dos veces.', imagenes: [], stock: 1, destacado: true, activo: true },
    { id: 'd3', codigo: 'A003', nombre: 'Cartera de cuero tejida', categoria: 'Accesorios', condicion: 'Nuevo', precio: 180000, precio_anterior: 0, talles: [], colores: ['Camel', 'Negro'], descripcion: 'Cuero genuino, cierre magnético.', imagenes: [], stock: 3, destacado: true, activo: true },
    { id: 'd4', codigo: 'L004', nombre: 'Conjunto de encaje', categoria: 'Lencería', condicion: 'Nuevo', precio: 95000, precio_anterior: 0, talles: ['S', 'M', 'L'], colores: ['Nude', 'Negro'], descripcion: 'Conjunto de encaje suave, con aro.', imagenes: [], stock: 6, destacado: false, activo: true },
    { id: 'd5', codigo: 'P005', nombre: 'Perfume floral 100 ml', categoria: 'Perfumes', condicion: 'Nuevo', precio: 210000, precio_anterior: 250000, talles: [], colores: [], descripcion: 'Notas de jazmín, vainilla y almizcle.', imagenes: [], stock: 5, destacado: true, activo: true },
    { id: 'd6', codigo: 'R006', nombre: 'Jean mom fit', categoria: 'Ropa', condicion: 'Segunda mano', precio: 85000, precio_anterior: 0, talles: ['38'], colores: ['Celeste'], descripcion: 'Muy buen estado.', imagenes: [], stock: 1, destacado: false, activo: true },
    { id: 'd7', codigo: 'A007', nombre: 'Aros dorados argolla', categoria: 'Accesorios', condicion: 'Nuevo', precio: 45000, precio_anterior: 0, talles: [], colores: ['Dorado'], descripcion: 'Acero quirúrgico bañado en oro.', imagenes: [], stock: 10, destacado: false, activo: true },
    { id: 'd8', codigo: 'R008', nombre: 'Camisa de seda', categoria: 'Ropa', condicion: 'Nuevo', precio: 160000, precio_anterior: 0, talles: ['S', 'M'], colores: ['Marfil'], descripcion: 'Seda satinada, corte recto.', imagenes: [], stock: 0, destacado: false, activo: true },
    { id: 'd9', codigo: 'L009', nombre: 'Body de microfibra', categoria: 'Lencería', condicion: 'Nuevo', precio: 75000, precio_anterior: 0, talles: ['S', 'M', 'L', 'XL'], colores: ['Negro', 'Piel'], descripcion: 'Sin costuras, efecto segunda piel.', imagenes: [], stock: 8, destacado: false, activo: true },
    { id: 'd10', codigo: 'P010', nombre: 'Body splash vainilla', categoria: 'Perfumes', condicion: 'Nuevo', precio: 60000, precio_anterior: 0, talles: [], colores: [], descripcion: '250 ml, fragancia dulce y suave.', imagenes: [], stock: 7, destacado: false, activo: true }
  ];
  let demoConfig = { nombre_tienda: 'Sol Store', whatsapp: CFG.WHATSAPP_POR_DEFECTO || '', instagram: 'solstore', mensaje_bienvenida: 'Ropa nueva y de segunda mano, accesorios, lencería y perfumes.', direccion: 'Asunción, Paraguay' };
  let demoCategorias = [
    { nombre: 'Ropa', icono: 'ropa', orden: 1, activo: true },
    { nombre: 'Accesorios', icono: 'acc', orden: 2, activo: true },
    { nombre: 'Lencería', icono: 'lenc', orden: 3, activo: true },
    { nombre: 'Perfumes', icono: 'perf', orden: 4, activo: true }
  ];
  let demoUsuarios = [{ usuario: 'admin', nombre: 'Administrador', rol: 'admin', activo: true }];

  function demoGet() {
    return Promise.resolve({ ok: true, demo: true, config: demoConfig, categorias: demoCategorias.filter(c => c.activo), productos: demoProductos.filter(p => p.activo) });
  }
  function demoPost(b) {
    const r = (x) => Promise.resolve(Object.assign({ ok: true }, x));
    switch (b.action) {
      case 'login': return b.usuario === 'admin' && b.clave === 'demo1234'
        ? r({ token: 'demo-token-'.padEnd(48, 'x'), usuario: { usuario: 'admin', nombre: 'Administrador', rol: 'admin' } })
        : Promise.resolve({ ok: false, error: 'En modo demo usá admin / demo1234' });
      case 'yo': return r({ usuario: { usuario: 'admin', nombre: 'Administrador', rol: 'admin' } });
      case 'logout': return r();
      case 'listarProductos': return r({ productos: demoProductos });
      case 'guardarProducto': {
        const p = Object.assign({}, b.producto);
        const i = demoProductos.findIndex(x => x.id === p.id);
        p.codigo = String(p.codigo || '').trim().toUpperCase();
        if (p.codigo && demoProductos.some(x => x.codigo === p.codigo && x.id !== p.id))
          return Promise.resolve({ ok: false, error: 'El código ' + p.codigo + ' ya lo usa otro producto' });
        if (!p.codigo) p.codigo = (i >= 0 && demoProductos[i].codigo) || ((p.categoria || 'P').normalize('NFD').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() + String(demoProductos.length + 1).padStart(3, '0'));
        if (i >= 0) demoProductos[i] = p; else { p.id = 'd' + Date.now(); demoProductos.unshift(p); }
        return r({ id: p.id, codigo: p.codigo });
      }
      case 'eliminarProducto': { const i = demoProductos.findIndex(x => x.id === b.id); if (i >= 0) demoProductos.splice(i, 1); return r(); }
      case 'subirImagen': return r({ id: 'data:' + b.mime + ';base64,' + b.base64 });
      case 'leerConfig': return r({ config: demoConfig });
      case 'guardarConfig': demoConfig = Object.assign({}, demoConfig, b.config); return r();
      case 'listarCategorias': return r({ categorias: demoCategorias.slice().sort((a, b) => a.orden - b.orden) });
      case 'guardarCategoria': {
        const c = b.categoria, ig = (x, y) => String(x).toLowerCase() === String(y).toLowerCase();
        if (demoCategorias.some(x => ig(x.nombre, c.nombre) && !ig(x.nombre, c.nombreOriginal || ''))) return Promise.resolve({ ok: false, error: 'Ya existe una categoría con ese nombre' });
        const ex = demoCategorias.find(x => ig(x.nombre, c.nombreOriginal || ''));
        if (ex) {
          if (ex.nombre !== c.nombre) demoProductos.forEach(p => { if (p.categoria === ex.nombre) p.categoria = c.nombre; });
          Object.assign(ex, { nombre: c.nombre, icono: c.icono, activo: c.activo !== false });
        } else demoCategorias.push({ nombre: c.nombre, icono: c.icono, orden: demoCategorias.length + 1, activo: c.activo !== false });
        return r();
      }
      case 'eliminarCategoria': {
        const n = demoProductos.filter(p => p.categoria === b.nombre).length;
        if (n) return Promise.resolve({ ok: false, error: `No se puede eliminar: tiene ${n} producto(s). Pasalos a otra categoría primero.` });
        demoCategorias = demoCategorias.filter(c => c.nombre !== b.nombre); return r();
      }
      case 'ordenarCategorias': demoCategorias.forEach(c => { c.orden = b.nombres.indexOf(c.nombre) + 1; }); return r();
      case 'listarUsuarios': return r({ usuarios: demoUsuarios });
      case 'crearUsuario': demoUsuarios.push({ usuario: b.usuario, nombre: b.nombre, rol: b.rol, activo: true }); return r();
      case 'estadoUsuario': demoUsuarios.forEach(u => { if (u.usuario === b.usuario) u.activo = b.activo; }); return r();
      case 'resetClave': case 'cambiarClave': return r();
      default: return Promise.resolve({ ok: false, error: 'Acción no válida' });
    }
  }

  window.SOL = { DEMO, esc, precio, imgUrl, imgFallback, get, post, toast, ICONOS, icono };
})();
