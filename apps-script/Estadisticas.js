/**
 * SOL STORE — Estadísticas anónimas
 *
 * Qué se guarda por evento: fecha, tipo, producto (id interno), un detalle
 * (canal de origen, categoría o texto buscado), dispositivo y un número.
 * NO se guarda: IP, nombre, navegador completo, cookies ni ningún identificador
 * de la persona. Los registros con más de 13 meses se borran solos.
 */

const HOJA_ESTADISTICAS = 'Estadisticas';
const COLUMNAS_ESTADISTICAS = ['fecha', 'tipo', 'producto', 'detalle', 'dispositivo', 'valor'];
const TIPOS_EVENTO = ['visita', 'vista', 'wa', 'wa_general', 'busqueda', 'categoria', 'compartir'];
const CANALES = ['instagram', 'facebook', 'whatsapp', 'google', 'tiktok', 'otro', 'directo'];
const DISPOSITIVOS = ['celular', 'tablet', 'computadora'];
const MESES_RETENCION = 13;
const MAX_EVENTOS_POR_MINUTO = 1500; // freno contra abusos del endpoint público

const esFecha_ = v => Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v);

function hojaEstadisticas_() {
  const ss = SpreadsheetApp.getActive();
  let h = ss.getSheetByName(HOJA_ESTADISTICAS);
  if (!h) h = crearHoja_(ss, HOJA_ESTADISTICAS, COLUMNAS_ESTADISTICAS);
  return h;
}

/** Recibe un lote de eventos desde la tienda (acción pública, sin sesión). */
function registrarEventos_(lista) {
  if (!Array.isArray(lista) || !lista.length) return { ok: true, n: 0 };
  lista = lista.slice(0, 30);

  // Freno global por minuto
  const cache = CacheService.getScriptCache();
  const clave = 'ev_' + Math.floor(Date.now() / 60000);
  const usados = Number(cache.get(clave) || 0);
  if (usados >= MAX_EVENTOS_POR_MINUTO) return { ok: true, n: 0 };
  cache.put(clave, String(usados + lista.length), 120);

  const limpiar = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
  const ahora = new Date();
  const filas = [];
  lista.forEach(e => {
    if (!e || TIPOS_EVENTO.indexOf(e.t) < 0) return;
    let detalle = '';
    if (e.t === 'visita') detalle = CANALES.indexOf(e.d) >= 0 ? e.d : 'otro';
    else if (e.t === 'busqueda') detalle = limpiar(e.d, 40).toLowerCase();
    else if (e.t === 'categoria') detalle = limpiar(e.d, 40);
    if (e.t === 'busqueda' && detalle.length < 2) return;
    filas.push([
      ahora,
      e.t,
      limpiar(e.p, 20),
      // Una cadena que empieza con = + - @ se guarda como texto, no como fórmula
      /^[=+\-@]/.test(detalle) ? "'" + detalle : detalle,
      DISPOSITIVOS.indexOf(e.x) >= 0 ? e.x : '',
      Math.max(0, Math.min(9999, Number(e.v) || 0))
    ]);
  });
  if (!filas.length) return { ok: true, n: 0 };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: true, n: 0 }; // si está muy ocupado, se descarta sin error
  try {
    const h = hojaEstadisticas_();
    h.getRange(h.getLastRow() + 1, 1, filas.length, COLUMNAS_ESTADISTICAS.length).setValues(filas);
  } finally { lock.releaseLock(); }
  return { ok: true, n: filas.length };
}

/** Borra los registros con más de 13 meses (como mucho una vez por día). */
function podarEstadisticas_() {
  const cache = CacheService.getScriptCache();
  if (cache.get('poda_est')) return;
  cache.put('poda_est', '1', 21600);
  const h = hojaEstadisticas_();
  const n = h.getLastRow() - 1;
  if (n < 1) return;
  const limite = new Date();
  limite.setMonth(limite.getMonth() - MESES_RETENCION);
  const fechas = h.getRange(2, 1, n, 1).getValues();
  let viejas = 0;
  while (viejas < n && esFecha_(fechas[viejas][0]) && fechas[viejas][0] < limite) viejas++;
  if (viejas > 0) h.deleteRows(2, viejas);
}

/** Resumen para el panel. dias: 7, 30 o 90. */
function resumenEstadisticas_(dias) {
  dias = [7, 30, 90].indexOf(Number(dias)) >= 0 ? Number(dias) : 30;
  podarEstadisticas_();
  const h = hojaEstadisticas_();
  const tz = Session.getScriptTimeZone() || 'America/Asuncion';
  const hoy = new Date();
  const desde = new Date(hoy.getTime() - (dias - 1) * 86400000);
  const claveDia = d => Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  const inicio = claveDia(desde);

  // Serie diaria vacía
  const porDia = {};
  for (let i = 0; i < dias; i++) {
    const k = claveDia(new Date(desde.getTime() + i * 86400000));
    porDia[k] = { dia: k, visitas: 0, vistas: 0, consultas: 0 };
  }

  const r = {
    dias: dias, visitas: 0, vistas: 0, consultas: 0, consultasGenerales: 0, compartidos: 0,
    porDia: [], horas: Array(24).fill(0), canales: {}, dispositivos: {},
    productos: {}, busquedas: {}, sinResultado: {}, categorias: {}
  };

  const n = h.getLastRow() - 1;
  if (n > 0) {
    // Los eventos están en orden cronológico: se busca desde abajo dónde empieza el período
    const fechas = h.getRange(2, 1, n, 1).getValues();
    let desdeFila = n;
    while (desdeFila > 0 && esFecha_(fechas[desdeFila - 1][0]) && claveDia(fechas[desdeFila - 1][0]) >= inicio) desdeFila--;
    const cant = n - desdeFila;
    if (cant > 0) {
      const datos = h.getRange(2 + desdeFila, 1, cant, COLUMNAS_ESTADISTICAS.length).getValues();
      datos.forEach(f => {
        const fecha = f[0], tipo = f[1], prod = String(f[2]), det = String(f[3]), disp = String(f[4]), val = Number(f[5]) || 0;
        if (!esFecha_(fecha)) return;
        const k = claveDia(fecha);
        const d = porDia[k];
        const prodObj = () => (r.productos[prod] = r.productos[prod] || { vistas: 0, consultas: 0 });
        switch (tipo) {
          case 'visita':
            r.visitas++; if (d) d.visitas++;
            r.horas[Number(Utilities.formatDate(fecha, tz, 'H'))]++;
            r.canales[det || 'otro'] = (r.canales[det || 'otro'] || 0) + 1;
            if (disp) r.dispositivos[disp] = (r.dispositivos[disp] || 0) + 1;
            break;
          case 'vista': r.vistas++; if (d) d.vistas++; if (prod) prodObj().vistas++; break;
          case 'wa': r.consultas++; if (d) d.consultas++; if (prod) prodObj().consultas++; break;
          case 'wa_general': r.consultasGenerales++; if (d) d.consultas++; break;
          case 'compartir': r.compartidos++; break;
          case 'categoria': r.categorias[det] = (r.categorias[det] || 0) + 1; break;
          case 'busqueda':
            r.busquedas[det] = (r.busquedas[det] || 0) + 1;
            if (val === 0) r.sinResultado[det] = (r.sinResultado[det] || 0) + 1;
            break;
        }
      });
    }
  }

  // Nombres de productos (por id) para el ranking
  const nombres = {};
  leerProductos_(false).forEach(p => { nombres[p.id] = { nombre: p.nombre, codigo: p.codigo }; });
  const top = (obj, lim) => Object.keys(obj).map(k => ({ k: k, n: obj[k] })).sort((a, b) => b.n - a.n).slice(0, lim);

  r.porDia = Object.keys(porDia).map(k => porDia[k]);
  r.productos = Object.keys(r.productos).map(id => {
    const p = r.productos[id], info = nombres[id] || { nombre: '(producto eliminado)', codigo: '' };
    return { id: id, nombre: info.nombre, codigo: info.codigo, vistas: p.vistas, consultas: p.consultas };
  }).sort((a, b) => (b.consultas - a.consultas) || (b.vistas - a.vistas)).slice(0, 15);
  r.busquedas = top(r.busquedas, 10);
  r.sinResultado = top(r.sinResultado, 10);
  r.categorias = top(r.categorias, 10);
  r.canales = top(r.canales, 10);
  r.dispositivos = top(r.dispositivos, 5);
  return r;
}

/** Ejecutar desde el editor para aceptar permisos nuevos antes de publicar. */
function autorizar() {
  hojaEstadisticas_();
  Logger.log('Permisos OK. Ya podés publicar con actualizar.ps1');
}
