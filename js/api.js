/* Utilidades compartidas entre catálogo y panel */
(function () {
  const CFG = window.SOL_CONFIG || {};
  const DEMO = !CFG.API_URL;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const precio = n => (CFG.MONEDA || 'Gs.') + ' ' + Math.round(Number(n) || 0).toLocaleString('es-PY');

  /** Convierte un ID de Drive (o URL) en URL de imagen */
  function imgUrl(ref, ancho = 800) {
    if (!ref) return '';
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
    { id: 'd1', nombre: 'Vestido midi de lino', categoria: 'Ropa', condicion: 'Nuevo', precio: 245000, precio_anterior: 290000, talles: ['S', 'M', 'L'], colores: ['Arena', 'Blanco'], descripcion: 'Vestido fresco de lino, ideal para el verano.\nLargo midi, con cinto.', imagenes: [], stock: 4, destacado: true, activo: true },
    { id: 'd2', nombre: 'Blazer oversize beige', categoria: 'Ropa', condicion: 'Segunda mano', precio: 120000, precio_anterior: 0, talles: ['M'], colores: ['Beige'], descripcion: 'Excelente estado, usado dos veces.', imagenes: [], stock: 1, destacado: true, activo: true },
    { id: 'd3', nombre: 'Cartera de cuero tejida', categoria: 'Accesorios', condicion: 'Nuevo', precio: 180000, precio_anterior: 0, talles: [], colores: ['Camel', 'Negro'], descripcion: 'Cuero genuino, cierre magnético.', imagenes: [], stock: 3, destacado: true, activo: true },
    { id: 'd4', nombre: 'Conjunto de encaje', categoria: 'Lencería', condicion: 'Nuevo', precio: 95000, precio_anterior: 0, talles: ['S', 'M', 'L'], colores: ['Nude', 'Negro'], descripcion: 'Conjunto de encaje suave, con aro.', imagenes: [], stock: 6, destacado: false, activo: true },
    { id: 'd5', nombre: 'Perfume floral 100 ml', categoria: 'Perfumes', condicion: 'Nuevo', precio: 210000, precio_anterior: 250000, talles: [], colores: [], descripcion: 'Notas de jazmín, vainilla y almizcle.', imagenes: [], stock: 5, destacado: true, activo: true },
    { id: 'd6', nombre: 'Jean mom fit', categoria: 'Ropa', condicion: 'Segunda mano', precio: 85000, precio_anterior: 0, talles: ['38'], colores: ['Celeste'], descripcion: 'Muy buen estado.', imagenes: [], stock: 1, destacado: false, activo: true },
    { id: 'd7', nombre: 'Aros dorados argolla', categoria: 'Accesorios', condicion: 'Nuevo', precio: 45000, precio_anterior: 0, talles: [], colores: ['Dorado'], descripcion: 'Acero quirúrgico bañado en oro.', imagenes: [], stock: 10, destacado: false, activo: true },
    { id: 'd8', nombre: 'Camisa de seda', categoria: 'Ropa', condicion: 'Nuevo', precio: 160000, precio_anterior: 0, talles: ['S', 'M'], colores: ['Marfil'], descripcion: 'Seda satinada, corte recto.', imagenes: [], stock: 0, destacado: false, activo: true },
    { id: 'd9', nombre: 'Body de microfibra', categoria: 'Lencería', condicion: 'Nuevo', precio: 75000, precio_anterior: 0, talles: ['S', 'M', 'L', 'XL'], colores: ['Negro', 'Piel'], descripcion: 'Sin costuras, efecto segunda piel.', imagenes: [], stock: 8, destacado: false, activo: true },
    { id: 'd10', nombre: 'Body splash vainilla', categoria: 'Perfumes', condicion: 'Nuevo', precio: 60000, precio_anterior: 0, talles: [], colores: [], descripcion: '250 ml, fragancia dulce y suave.', imagenes: [], stock: 7, destacado: false, activo: true }
  ];
  let demoConfig = { nombre_tienda: 'Sol Store', whatsapp: CFG.WHATSAPP_POR_DEFECTO || '', instagram: 'solstore', mensaje_bienvenida: 'Ropa nueva y de segunda mano, accesorios, lencería y perfumes.', direccion: 'Asunción, Paraguay' };
  let demoUsuarios = [{ usuario: 'admin', nombre: 'Administrador', rol: 'admin', activo: true }];

  function demoGet() {
    return Promise.resolve({ ok: true, demo: true, config: demoConfig, productos: demoProductos.filter(p => p.activo) });
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
        if (i >= 0) demoProductos[i] = p; else { p.id = 'd' + Date.now(); demoProductos.unshift(p); }
        return r({ id: p.id });
      }
      case 'eliminarProducto': { const i = demoProductos.findIndex(x => x.id === b.id); if (i >= 0) demoProductos.splice(i, 1); return r(); }
      case 'subirImagen': return r({ id: 'data:' + b.mime + ';base64,' + b.base64 });
      case 'leerConfig': return r({ config: demoConfig });
      case 'guardarConfig': demoConfig = Object.assign({}, demoConfig, b.config); return r();
      case 'listarUsuarios': return r({ usuarios: demoUsuarios });
      case 'crearUsuario': demoUsuarios.push({ usuario: b.usuario, nombre: b.nombre, rol: b.rol, activo: true }); return r();
      case 'estadoUsuario': demoUsuarios.forEach(u => { if (u.usuario === b.usuario) u.activo = b.activo; }); return r();
      case 'resetClave': case 'cambiarClave': return r();
      default: return Promise.resolve({ ok: false, error: 'Acción no válida' });
    }
  }

  window.SOL = { DEMO, esc, precio, imgUrl, imgFallback, get, post, toast };
})();
