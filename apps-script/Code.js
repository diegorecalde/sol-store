/**
 * SOL STORE — Backend en Google Apps Script
 * Base de datos: Google Sheets | Imágenes: Google Drive
 *
 * Publicar como: Implementar > Nueva implementación > Aplicación web
 *   - Ejecutar como: Yo
 *   - Quién tiene acceso: Cualquier usuario
 *
 * Este script solo devuelve JSON (ContentService), por eso no muestra
 * el aviso de "Aplicación creada por un usuario de Apps Script".
 */

// ===================== CONFIGURACIÓN =====================
const HOJA_PRODUCTOS = 'Productos';
const HOJA_USUARIOS = 'Usuarios';
const HOJA_CONFIG = 'Config';
const HOJA_CATEGORIAS = 'Categorias';
const CARPETA_IMAGENES = 'Sol Store - Imagenes';
const DURACION_SESION = 6 * 60 * 60; // 6 horas (segundos)
const MAX_INTENTOS_LOGIN = 5;          // bloqueo temporal tras 5 intentos fallidos

const COLUMNAS_PRODUCTOS = [
  'id', 'nombre', 'categoria', 'condicion', 'precio', 'precio_anterior',
  'talles', 'colores', 'descripcion', 'imagenes', 'stock',
  'destacado', 'activo', 'orden', 'creado', 'actualizado'
];
const COLUMNAS_USUARIOS = ['usuario', 'nombre', 'hash', 'salt', 'rol', 'activo', 'creado'];

// Categorías iniciales (después se editan desde el panel)
const CATEGORIAS_INICIALES = [['Ropa', 'ropa'], ['Accesorios', 'acc'], ['Lencería', 'lenc'], ['Perfumes', 'perf']];
const CONDICIONES = ['Nuevo', 'Segunda mano'];

// ===================== INSTALACIÓN =====================
/**
 * Ejecutar UNA VEZ desde el editor (botón ▶ Ejecutar con "setup" seleccionado).
 * Crea las hojas, la carpeta de imágenes y la configuración inicial.
 */
function setup() {
  const ss = SpreadsheetApp.getActive();

  crearHoja_(ss, HOJA_PRODUCTOS, COLUMNAS_PRODUCTOS);
  crearHoja_(ss, HOJA_USUARIOS, COLUMNAS_USUARIOS);
  const cfg = crearHoja_(ss, HOJA_CONFIG, ['clave', 'valor']);

  if (cfg.getLastRow() < 2) {
    cfg.getRange(2, 1, 5, 2).setValues([
      ['nombre_tienda', 'Sol Store'],
      ['whatsapp', '595981000000'],
      ['instagram', ''],
      ['mensaje_bienvenida', 'Ropa nueva y de segunda mano, accesorios, lencería y perfumes.'],
      ['direccion', 'Asunción, Paraguay']
    ]);
  }

  // Carpeta de imágenes en Drive
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('CARPETA_ID')) {
    const carpeta = DriveApp.createFolder(CARPETA_IMAGENES);
    carpeta.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    props.setProperty('CARPETA_ID', carpeta.getId());
  }

  // Validaciones de datos en la hoja (desplegables)
  const hp = ss.getSheetByName(HOJA_PRODUCTOS);
  const col = n => COLUMNAS_PRODUCTOS.indexOf(n) + 1;
  hojaCategorias_();
  validacionCategorias_();
  hp.getRange(2, col('condicion'), 1000).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONDICIONES).build());
  hp.getRange(2, col('destacado'), 1000).insertCheckboxes();
  hp.getRange(2, col('activo'), 1000).insertCheckboxes();

  Logger.log('Listo. Ahora ejecutá crearAdminInicial() después de editar usuario y clave.');
}

/**
 * Editá usuario, nombre y clave, y ejecutá esta función UNA VEZ.
 * Después borrá la clave de este código.
 */
function crearAdminInicial() {
  crearUsuario_('admin', 'Administrador', 'xxxxxxxx', 'admin');
  Logger.log('Usuario admin creado.');
}

function crearHoja_(ss, nombre, columnas) {
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) hoja = ss.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, columnas.length).setValues([columnas])
      .setFontWeight('bold').setBackground('#f4ede3');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

// ===================== ENTRADA HTTP =====================
function doGet(e) {
  const accion = (e && e.parameter && e.parameter.action) || 'catalogo';
  try {
    if (accion === 'catalogo') return json_(catalogoPublico_());
    if (accion === 'ping') return json_({ ok: true, hora: new Date().toISOString() });
    return json_({ ok: false, error: 'Acción no válida' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let datos = {};
  try {
    datos = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON inválido' });
  }

  try {
    const accion = datos.action;
    if (accion === 'login') return json_(login_(datos.usuario, datos.clave));

    // A partir de aquí, todo requiere sesión válida
    const sesion = validarSesion_(datos.token);
    if (!sesion) return json_({ ok: false, error: 'SESION_EXPIRADA' });

    switch (accion) {
      case 'logout': return json_(logout_(datos.token));
      case 'yo': return json_({ ok: true, usuario: sesion });
      case 'listarProductos': return json_({ ok: true, productos: leerProductos_(false) });
      case 'guardarProducto': return json_(conLock_(() => guardarProducto_(datos.producto, sesion)));
      case 'eliminarProducto': return json_(conLock_(() => eliminarProducto_(datos.id)));
      case 'subirImagen': return json_(subirImagen_(datos));
      case 'leerConfig': return json_({ ok: true, config: leerConfig_() });
      case 'listarCategorias': return json_({ ok: true, categorias: leerCategorias_(false) });
      case 'guardarCategoria': soloAdmin_(sesion); return json_(conLock_(() => guardarCategoria_(datos.categoria)));
      case 'eliminarCategoria': soloAdmin_(sesion); return json_(conLock_(() => eliminarCategoria_(datos.nombre)));
      case 'ordenarCategorias': soloAdmin_(sesion); return json_(conLock_(() => ordenarCategorias_(datos.nombres)));
      case 'guardarConfig': return json_(conLock_(() => guardarConfig_(datos.config, sesion)));
      case 'cambiarClave': return json_(cambiarClave_(sesion, datos.actual, datos.nueva));
      case 'listarUsuarios': soloAdmin_(sesion); return json_({ ok: true, usuarios: listarUsuarios_() });
      case 'crearUsuario':
        soloAdmin_(sesion);
        return json_(conLock_(() => {
          crearUsuario_(datos.usuario, datos.nombre, datos.clave, datos.rol);
          return { ok: true };
        }));
      case 'estadoUsuario': soloAdmin_(sesion); return json_(conLock_(() => estadoUsuario_(sesion, datos.usuario, datos.activo)));
      case 'resetClave': soloAdmin_(sesion); return json_(conLock_(() => resetClave_(datos.usuario, datos.clave)));
      default: return json_({ ok: false, error: 'Acción no válida' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function conLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

// ===================== CATÁLOGO PÚBLICO =====================
function catalogoPublico_() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get('catalogo');
  if (enCache) return JSON.parse(enCache);

  const productos = leerProductos_(true).map(p => {
    // No exponer campos internos
    delete p.creado; delete p.actualizado;
    return p;
  });
  const cfg = leerConfig_();
  const respuesta = { ok: true, config: cfg, categorias: leerCategorias_(true), productos: productos, generado: new Date().toISOString() };

  const texto = JSON.stringify(respuesta);
  if (texto.length < 95000) cache.put('catalogo', texto, 120); // 2 min
  return respuesta;
}

function limpiarCache_() {
  CacheService.getScriptCache().remove('catalogo');
}

// ===================== PRODUCTOS =====================
function leerProductos_(soloActivos) {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
  const valores = hoja.getDataRange().getValues();
  const enc = valores.shift();
  const lista = valores
    .filter(f => f[0] !== '' && f[0] !== null)
    .map(f => {
      const o = {};
      enc.forEach((c, i) => o[c] = f[i]);
      return normalizar_(o);
    });
  const res = soloActivos ? lista.filter(p => p.activo) : lista;
  return res.sort((a, b) => (a.orden || 9999) - (b.orden || 9999) || String(b.creado).localeCompare(String(a.creado)));
}

function normalizar_(p) {
  const aLista = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
  return {
    id: String(p.id),
    nombre: String(p.nombre || ''),
    categoria: String(p.categoria || ''),
    condicion: String(p.condicion || 'Nuevo'),
    precio: Number(p.precio) || 0,
    precio_anterior: Number(p.precio_anterior) || 0,
    talles: aLista(p.talles),
    colores: aLista(p.colores),
    descripcion: String(p.descripcion || ''),
    imagenes: aLista(p.imagenes),
    stock: p.stock === '' ? null : Number(p.stock),
    destacado: p.destacado === true || String(p.destacado).toUpperCase() === 'TRUE',
    activo: p.activo === true || String(p.activo).toUpperCase() === 'TRUE',
    orden: Number(p.orden) || 0,
    creado: p.creado instanceof Date ? p.creado.toISOString() : String(p.creado || ''),
    actualizado: p.actualizado instanceof Date ? p.actualizado.toISOString() : String(p.actualizado || '')
  };
}

function guardarProducto_(p, sesion) {
  if (!p || !String(p.nombre || '').trim()) throw new Error('El nombre es obligatorio');
  if (nombresCategorias_().indexOf(p.categoria) < 0) throw new Error('Categoría no válida');
  if (CONDICIONES.indexOf(p.condicion) < 0) throw new Error('Condición no válida');

  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
  const ahora = new Date();
  const unir = v => Array.isArray(v) ? v.map(s => String(s).trim()).filter(Boolean).join(', ') : String(v || '');

  const fila = {
    id: p.id || Utilities.getUuid().slice(0, 8),
    nombre: String(p.nombre).trim().slice(0, 120),
    categoria: p.categoria,
    condicion: p.condicion,
    precio: Math.max(0, Number(p.precio) || 0),
    precio_anterior: Math.max(0, Number(p.precio_anterior) || 0) || '',
    talles: unir(p.talles),
    colores: unir(p.colores),
    descripcion: String(p.descripcion || '').slice(0, 2000),
    imagenes: unir(p.imagenes),
    stock: p.stock === '' || p.stock === null || p.stock === undefined ? '' : Number(p.stock),
    destacado: !!p.destacado,
    activo: p.activo !== false,
    orden: Number(p.orden) || '',
    creado: ahora,
    actualizado: ahora
  };

  const ids = hoja.getRange(1, 1, hoja.getLastRow(), 1).getValues().map(r => String(r[0]));
  const idx = p.id ? ids.indexOf(String(p.id)) : -1;

  if (idx > 0) {
    const nroFila = idx + 1;
    fila.creado = hoja.getRange(nroFila, COLUMNAS_PRODUCTOS.indexOf('creado') + 1).getValue() || ahora;
    hoja.getRange(nroFila, 1, 1, COLUMNAS_PRODUCTOS.length).setValues([COLUMNAS_PRODUCTOS.map(c => fila[c])]);
  } else {
    hoja.appendRow(COLUMNAS_PRODUCTOS.map(c => fila[c]));
  }
  limpiarCache_();
  return { ok: true, id: fila.id };
}

function eliminarProducto_(id) {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
  const datos = hoja.getRange(1, 1, hoja.getLastRow(), COLUMNAS_PRODUCTOS.length).getValues();
  const colImg = COLUMNAS_PRODUCTOS.indexOf('imagenes');
  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(id)) {
      // Las imágenes se mueven a la papelera de Drive (recuperables 30 días)
      String(datos[i][colImg] || '').split(',').map(s => s.trim()).filter(Boolean).forEach(fid => {
        try { DriveApp.getFileById(fid).setTrashed(true); } catch (e) { }
      });
      hoja.deleteRow(i + 1);
      limpiarCache_();
      return { ok: true };
    }
  }
  throw new Error('Producto no encontrado');
}

// ===================== CATEGORÍAS =====================
/** Devuelve la hoja de categorías; si no existe la crea con las iniciales */
function hojaCategorias_() {
  const ss = SpreadsheetApp.getActive();
  let h = ss.getSheetByName(HOJA_CATEGORIAS);
  if (!h) {
    h = crearHoja_(ss, HOJA_CATEGORIAS, ['nombre', 'icono', 'orden', 'activo']);
    h.getRange(2, 1, CATEGORIAS_INICIALES.length, 4)
      .setValues(CATEGORIAS_INICIALES.map((c, i) => [c[0], c[1], i + 1, true]));
    h.getRange(2, 4, 200).insertCheckboxes();
    validacionCategorias_();
  }
  return h;
}

/** El desplegable de la columna "categoria" en Productos toma los valores de la hoja Categorias */
function validacionCategorias_() {
  const ss = SpreadsheetApp.getActive();
  const hp = ss.getSheetByName(HOJA_PRODUCTOS);
  const hc = ss.getSheetByName(HOJA_CATEGORIAS);
  if (!hp || !hc) return;
  const col = COLUMNAS_PRODUCTOS.indexOf('categoria') + 1;
  hp.getRange(2, col, 1000).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(hc.getRange('A2:A'), true).setAllowInvalid(true).build());
}

function leerCategorias_(soloActivas) {
  const filas = hojaCategorias_().getDataRange().getValues().slice(1);
  const lista = filas
    .filter(r => String(r[0]).trim())
    .map(r => ({
      nombre: String(r[0]).trim(),
      icono: String(r[1] || 'etiqueta'),
      orden: Number(r[2]) || 999,
      activo: r[3] === true || String(r[3]).toUpperCase() === 'TRUE'
    }))
    .sort((a, b) => a.orden - b.orden);
  return soloActivas ? lista.filter(c => c.activo) : lista;
}

function nombresCategorias_() {
  return leerCategorias_(false).map(c => c.nombre);
}

function guardarCategoria_(c) {
  const nombre = String((c && c.nombre) || '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 2 || nombre.length > 40) throw new Error('El nombre debe tener entre 2 y 40 caracteres');
  if (/[,]/.test(nombre)) throw new Error('El nombre no puede tener comas');
  const icono = /^[a-z]{2,12}$/.test(String(c.icono || '')) ? c.icono : 'etiqueta';
  const original = String(c.nombreOriginal || '').trim();

  const h = hojaCategorias_();
  const filas = h.getDataRange().getValues();
  const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  const idx = original ? filas.findIndex((r, i) => i > 0 && igual(r[0], original)) : -1;
  if (original && idx < 1) throw new Error('Categoría no encontrada');
  if (filas.some((r, i) => i > 0 && i !== idx && igual(r[0], nombre))) throw new Error('Ya existe una categoría con ese nombre');

  if (idx > 0) {
    h.getRange(idx + 1, 1, 1, 2).setValues([[nombre, icono]]);
    h.getRange(idx + 1, 4).setValue(c.activo !== false);
    if (original !== nombre) renombrarEnProductos_(original, nombre);
  } else {
    const maxOrden = filas.slice(1).reduce((m, r) => Math.max(m, Number(r[2]) || 0), 0);
    h.appendRow([nombre, icono, maxOrden + 1, c.activo !== false]);
    h.getRange(h.getLastRow(), 4).insertCheckboxes().setValue(c.activo !== false);
  }
  limpiarCache_();
  return { ok: true };
}

function renombrarEnProductos_(viejo, nuevo) {
  const hp = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
  if (hp.getLastRow() < 2) return;
  const col = COLUMNAS_PRODUCTOS.indexOf('categoria') + 1;
  const rango = hp.getRange(2, col, hp.getLastRow() - 1, 1);
  const vals = rango.getValues().map(r => [String(r[0]).trim() === viejo ? nuevo : r[0]]);
  rango.setValues(vals);
}

function contarProductosEn_(nombre) {
  const hp = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
  if (hp.getLastRow() < 2) return 0;
  const col = COLUMNAS_PRODUCTOS.indexOf('categoria') + 1;
  return hp.getRange(2, col, hp.getLastRow() - 1, 1).getValues().filter(r => String(r[0]).trim() === nombre).length;
}

function eliminarCategoria_(nombre) {
  nombre = String(nombre || '').trim();
  const n = contarProductosEn_(nombre);
  if (n > 0) throw new Error('No se puede eliminar: tiene ' + n + ' producto(s). Pasalos a otra categoría primero.');
  const h = hojaCategorias_();
  const filas = h.getDataRange().getValues();
  const idx = filas.findIndex((r, i) => i > 0 && String(r[0]).trim() === nombre);
  if (idx < 1) throw new Error('Categoría no encontrada');
  h.deleteRow(idx + 1);
  limpiarCache_();
  return { ok: true };
}

function ordenarCategorias_(nombres) {
  if (!Array.isArray(nombres)) throw new Error('Orden inválido');
  const h = hojaCategorias_();
  const filas = h.getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    const pos = nombres.indexOf(String(filas[i][0]).trim());
    if (pos >= 0) h.getRange(i + 1, 3).setValue(pos + 1);
  }
  limpiarCache_();
  return { ok: true };
}

// ===================== IMÁGENES (DRIVE) =====================
function subirImagen_(d) {
  const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (permitidos.indexOf(d.mime) < 0) throw new Error('Formato no permitido (JPG, PNG o WEBP)');
  const bytes = Utilities.base64Decode(d.base64);
  if (bytes.length > 4 * 1024 * 1024) throw new Error('Imagen demasiado grande (máx. 4 MB)');

  const carpeta = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('CARPETA_ID'));
  const nombre = (String(d.nombre || 'imagen').replace(/[^\w.\-]/g, '_')).slice(0, 80);
  const archivo = carpeta.createFile(Utilities.newBlob(bytes, d.mime, Date.now() + '_' + nombre));
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, id: archivo.getId() };
}

// ===================== CONFIGURACIÓN =====================
function leerConfig_() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_CONFIG);
  const cfg = {};
  hoja.getDataRange().getValues().slice(1).forEach(r => { if (r[0]) cfg[r[0]] = String(r[1]); });
  return cfg;
}

function guardarConfig_(nueva, sesion) {
  soloAdmin_(sesion);
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_CONFIG);
  const filas = hoja.getDataRange().getValues();
  Object.keys(nueva || {}).forEach(clave => {
    const valor = String(nueva[clave] || '').slice(0, 500);
    const i = filas.findIndex((r, n) => n > 0 && r[0] === clave);
    if (i > 0) hoja.getRange(i + 1, 2).setValue(valor);
    else hoja.appendRow([clave, valor]);
  });
  limpiarCache_();
  return { ok: true };
}

// ===================== USUARIOS Y SESIONES =====================
function hash_(clave, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + clave, Utilities.Charset.UTF_8);
  let h = Utilities.base64Encode(bytes);
  // Reforzar con varias rondas
  for (let i = 0; i < 300; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt, Utilities.Charset.UTF_8));
  }
  return h;
}

function filasUsuarios_() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_USUARIOS);
  return { hoja: hoja, datos: hoja.getDataRange().getValues() };
}

function crearUsuario_(usuario, nombre, clave, rol) {
  usuario = String(usuario || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) throw new Error('Usuario inválido (3-30 caracteres: letras, números, . _ -)');
  if (String(clave || '').length < 8) throw new Error('La clave debe tener al menos 8 caracteres');
  rol = rol === 'admin' ? 'admin' : 'editor';

  const u = filasUsuarios_();
  if (u.datos.some((r, i) => i > 0 && String(r[0]).toLowerCase() === usuario)) throw new Error('Ese usuario ya existe');

  const salt = Utilities.getUuid();
  u.hoja.appendRow([usuario, String(nombre || usuario), hash_(clave, salt), salt, rol, true, new Date()]);
}

function login_(usuario, clave) {
  usuario = String(usuario || '').trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  const claveIntentos = 'intentos_' + usuario;
  const intentos = Number(cache.get(claveIntentos) || 0);
  if (intentos >= MAX_INTENTOS_LOGIN) return { ok: false, error: 'Demasiados intentos. Esperá 15 minutos.' };

  const u = filasUsuarios_();
  const fila = u.datos.find((r, i) => i > 0 && String(r[0]).toLowerCase() === usuario);
  const activo = fila && (fila[5] === true || String(fila[5]).toUpperCase() === 'TRUE');

  if (!fila || !activo || hash_(clave, fila[3]) !== fila[2]) {
    cache.put(claveIntentos, String(intentos + 1), 900);
    Utilities.sleep(800);
    return { ok: false, error: 'Usuario o clave incorrectos' };
  }

  cache.remove(claveIntentos);
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const sesion = { usuario: fila[0], nombre: fila[1], rol: fila[4] };
  cache.put('sesion_' + token, JSON.stringify(sesion), DURACION_SESION);
  return { ok: true, token: token, usuario: sesion };
}

function validarSesion_(token) {
  if (!token || String(token).length < 40) return null;
  const cache = CacheService.getScriptCache();
  const s = cache.get('sesion_' + token);
  if (!s) return null;
  cache.put('sesion_' + token, s, DURACION_SESION); // renovar
  return JSON.parse(s);
}

function logout_(token) {
  CacheService.getScriptCache().remove('sesion_' + token);
  return { ok: true };
}

function soloAdmin_(sesion) {
  if (!sesion || sesion.rol !== 'admin') throw new Error('Solo un administrador puede hacer esto');
}

function listarUsuarios_() {
  return filasUsuarios_().datos.slice(1).filter(r => r[0]).map(r => ({
    usuario: r[0], nombre: r[1], rol: r[4],
    activo: r[5] === true || String(r[5]).toUpperCase() === 'TRUE'
  }));
}

function estadoUsuario_(sesion, usuario, activo) {
  if (String(usuario).toLowerCase() === sesion.usuario && !activo) throw new Error('No podés desactivar tu propio usuario');
  const u = filasUsuarios_();
  const i = u.datos.findIndex((r, n) => n > 0 && String(r[0]).toLowerCase() === String(usuario).toLowerCase());
  if (i < 1) throw new Error('Usuario no encontrado');
  u.hoja.getRange(i + 1, 6).setValue(!!activo);
  return { ok: true };
}

function resetClave_(usuario, clave) {
  if (String(clave || '').length < 8) throw new Error('La clave debe tener al menos 8 caracteres');
  const u = filasUsuarios_();
  const i = u.datos.findIndex((r, n) => n > 0 && String(r[0]).toLowerCase() === String(usuario).toLowerCase());
  if (i < 1) throw new Error('Usuario no encontrado');
  const salt = Utilities.getUuid();
  u.hoja.getRange(i + 1, 3, 1, 2).setValues([[hash_(clave, salt), salt]]);
  return { ok: true };
}

function cambiarClave_(sesion, actual, nueva) {
  const u = filasUsuarios_();
  const i = u.datos.findIndex((r, n) => n > 0 && String(r[0]).toLowerCase() === sesion.usuario);
  if (i < 1) throw new Error('Usuario no encontrado');
  if (hash_(actual, u.datos[i][3]) !== u.datos[i][2]) throw new Error('La clave actual no es correcta');
  return resetClave_(sesion.usuario, nueva);
}
