/**
 * SOL STORE — Datos de ejemplo para probar el sitio
 *
 * cargarEjemplos()  → agrega 80 productos (20 por categoría) con fotos de Unsplash
 * borrarEjemplos()  → quita SOLO esos productos (id que empieza con "ej-")
 *
 * Fotos: Unsplash (licencia libre, uso comercial permitido). Se usan por URL,
 * no se copian a Drive, así que borrarlos no deja archivos sueltos.
 * Precios: estimados para una boutique de Asunción (Gs.), oct. 2026.
 */

const PREFIJO_EJEMPLO = 'ej-';

// [nombre, condición, precio, precio anterior, talles, colores, stock, destacado, descripción, foto Unsplash]
// condición: N = Nuevo, U = Segunda mano · stock '' = sin control
const EJEMPLOS = {
  'Ropa': [
    ['Vestido floral de verano', 'N', 229000, 269000, 'S, M, L', 'Floreado', 5, true, 'Vestido fresco de viscosa con estampa floral y breteles regulables.\nLargo midi, ideal para el calor.', '1762154057377-cc9d3dd6900c'],
    ['Vestido midi estampado', 'N', 249000, 0, 'S, M, L', 'Negro con rojo', 4, false, 'Vestido de gasa estampado con forro, escote en V y cintura marcada.', '1602010069450-0a62034f235c'],
    ['Vestido manga larga flores', 'N', 259000, 0, 'S, M', 'Negro y blanco', 3, false, 'Manga larga con puño elastizado y falda con vuelo. Tela liviana que no se transparenta.', '1616313253719-c46514cddee1'],
    ['Vestido largo azul floral', 'N', 279000, 0, 'M, L', 'Azul y blanco', 3, true, 'Vestido largo de algodón con botones al frente. Perfecto para eventos de día.', '1614098097306-c67b8020c04e'],
    ['Vestido negro manga larga', 'N', 239000, 0, 'S, M, L', 'Negro', 6, false, 'Clásico vestido negro de punto suave, corte recto. Va con todo.', '1599662875272-64de8289f6d8'],
    ['Kaftán estampado azul', 'N', 199000, 0, 'Único', 'Azul', 4, false, 'Kaftán amplio de viscosa, ideal como salida de playa o para estar en casa con estilo.', '1753192108606-b4a2bc9e5661'],
    ['Vestido blanco de lino', 'N', 289000, 329000, 'S, M, L', 'Blanco', 2, true, 'Lino natural con tiras finas y espalda descubierta. Fresco y elegante.', '1753192104240-209f3fb568ef'],
    ['Blusa floral manga corta', 'N', 119000, 0, 'S, M, L, XL', 'Blanco floreado', 8, false, 'Blusa de crepé con estampa floral y cuello redondo. Fácil de planchar.', '1564257631407-4deb1f99d992'],
    ['Blusa campesina floreada', 'N', 129000, 0, 'S, M, L', 'Blanco floreado', 6, false, 'Manga larga con frunce en puños y escote con lazo. Romántica y cómoda.', '1561052623-76bca41705fe'],
    ['Blusa roja de satén', 'N', 139000, 159000, 'S, M, L', 'Rojo', 5, false, 'Satén con caída suave y botones forrados. Ideal para la noche o la oficina.', '1761117228880-df2425bd70da'],
    ['Camisa blanca oversize', 'N', 149000, 0, 'S, M, L', 'Blanco', 7, false, 'Camisa de algodón oversize, se usa abierta o anudada. Un básico infaltable.', '1608234807905-4466023792f5'],
    ['Jean recto tiro alto', 'N', 199000, 0, '36, 38, 40, 42', 'Azul medio', 9, true, 'Denim rígido de tiro alto y pierna recta. Calce cómodo que estiliza.', '1602293589930-45aad59ba3ab'],
    ['Jean mom fit clásico', 'N', 189000, 0, '36, 38, 40', 'Celeste', 7, false, 'Mom fit con lavado claro y bolsillos clásicos. Combina con todo.', '1714143136372-ddaf8b606da7'],
    ['Pollera cuadrillé amarilla', 'N', 139000, 0, 'S, M', 'Amarillo y blanco', 4, false, 'Pollera midi tableada con estampa cuadrillé y cintura elastizada atrás.', '1509182469511-7f0b50bfa63e'],
    ['Pollera larga roja', 'N', 159000, 0, 'S, M, L', 'Rojo', 3, false, 'Pollera larga de gasa con vuelo y forro corto. Muy fresca.', '1547116180-3872338a567b'],
    ['Sweater tejido gris', 'N', 169000, 0, 'S, M, L', 'Gris', 5, false, 'Tejido grueso de punto trenzado, abrigado y suave. Para las mañanas frescas.', '1574201635302-388dd92a4c3f'],
    ['Blazer gris sastrero', 'U', 120000, 0, 'M', 'Gris', 1, true, 'Usado pocas veces, impecable. Corte sastrero entallado con forro completo.', '1608234808654-2a8875faa7fd'],
    ['Saco cuadrillé', 'U', 95000, 0, 'L', 'Gris y blanco', 1, false, 'Muy buen estado, sin detalles. Tela gruesa ideal para invierno.', '1598915850252-fb07ad1e6768'],
    ['Minifalda blanca', 'U', 55000, 0, 'S', 'Blanco', 1, false, 'Usada una vez. Algodón con elastano, cierre lateral invisible.', '1594633313515-7ad9334a2349'],
    ['Pack 3 jeans', 'U', 150000, 0, '38, 40', 'Azul, negro, celeste', 1, false, 'Lote de tres jeans en buen estado (talles 38 y 40). Precio por el pack completo.', '1542272604-787c3835535d']
  ],
  'Accesorios': [
    ['Cartera de cuero marrón', 'N', 289000, 0, '', 'Marrón', 3, true, 'Cuero ecológico de alta calidad, cierre con cremallera y bolsillo interno.', '1598532163257-ae3c6b2524b6'],
    ['Cartera roja estructurada', 'N', 259000, 299000, '', 'Rojo', 2, false, 'Cartera rígida con asa corta y correa larga desmontable.', '1584917865442-de89df76afd3'],
    ['Bolso negro con herrajes', 'N', 279000, 0, '', 'Negro', 4, false, 'Bolso amplio con herrajes plateados, entra la notebook de 13".', '1614179689702-355944cd0918'],
    ['Bandolera de cuero', 'N', 179000, 0, '', 'Marrón', 5, false, 'Bandolera compacta con correa regulable. Para el día a día.', '1600857062241-98e5dba7f214'],
    ['Cartera matelassé beige', 'N', 229000, 0, '', 'Beige', 3, true, 'Diseño acolchado con cadena dorada y colgante decorativo.', '1758171692659-024183c2c272'],
    ['Cartera blanca mini', 'N', 189000, 0, '', 'Blanco', 4, false, 'Mini cartera de mano con correa cruzada. Ideal para salir de noche.', '1682745230951-8a5aa9a474a0'],
    ['Maletín gris con hebillas', 'U', 140000, 0, '', 'Gris', 1, false, 'Usado, en muy buen estado. Cuero con hebillas doradas y doble compartimento.', '1605733513597-a8f8341084e6'],
    ['Cartera marrón de mano', 'U', 120000, 0, '', 'Marrón', 1, false, 'Excelente estado, pequeño desgaste en una esquina (ver foto).', '1590874103328-eac38a683ce7'],
    ['Argollas doradas trenzadas', 'N', 59000, 0, '', 'Dorado', 12, true, 'Acero quirúrgico bañado en oro. No se oscurecen ni dan alergia.', '1617038220319-276d3cfab638'],
    ['Collar doble con dijes', 'N', 89000, 0, '', 'Dorado', 8, false, 'Dos cadenas con dije de piedra azul y medialuna. Acero bañado en oro.', '1599643478518-a784e5dc4c8f'],
    ['Aros plateados con piedra', 'N', 69000, 0, '', 'Plateado y azul', 6, false, 'Aros colgantes de plata 925 con piedra azul.', '1535632066927-ab7c9ab60908'],
    ['Pulsera cadena dorada', 'N', 49000, 0, '', 'Dorado', 10, false, 'Pulsera de eslabones con cierre mosquetón. Acero bañado en oro.', '1602173574767-37ac01994b2a'],
    ['Set de 3 anillos', 'N', 65000, 79000, '14, 16, 18', 'Dorado', 9, false, 'Tres anillos combinables con detalle de cristales. Se pueden usar juntos o por separado.', '1543294001-f7cd5d7fb516'],
    ['Aros de perla', 'N', 45000, 0, '', 'Blanco perla', 15, false, 'Aros abridores de perla sintética. Delicados para todos los días.', '1590166223826-12dee1677420'],
    ['Anillos dorados lisos', 'N', 55000, 0, '14, 16, 18', 'Dorado', 7, false, 'Set de anillos lisos de distintos grosores, vienen en cajita para regalo.', '1631982690223-8aa4be0a2497'],
    ['Lentes de sol retro dorados', 'N', 99000, 0, '', 'Dorado', 6, false, 'Marco metálico redondo con protección UV400. Incluye estuche.', '1511499767150-a48a237f0083'],
    ['Lentes de sol marco blanco', 'N', 89000, 0, '', 'Blanco y marrón', 5, false, 'Lentes con marco de acetato blanco y cristales marrones UV400.', '1577803645773-f96470509666'],
    ['Lentes de sol cat eye', 'N', 99000, 0, '', 'Blanco y gris', 0, false, 'Forma cat eye que estiliza el rostro. Protección UV400.', '1508296695146-257a814070b4'],
    ['Reloj oro rosa', 'N', 219000, 0, '', 'Oro rosa', 3, true, 'Reloj analógico con malla de acero oro rosa ajustable. Resistente al agua.', '1751437774882-deeea4352018'],
    ['Reloj clásico de malla', 'U', 110000, 0, '', 'Plateado', 1, false, 'Usado, funcionando perfecto con pila nueva. Cristal sin rayas.', '1524592094714-0f0654e20314']
  ],
  'Lencería': [
    ['Corpiño de encaje negro', 'N', 99000, 0, '85, 90, 95, 100', 'Negro', 8, true, 'Encaje elastizado con aro y taza soft. Breteles regulables.', '1584061554353-f8c337f5dbb9'],
    ['Bralette bordó', 'N', 79000, 0, 'S, M, L', 'Bordó', 6, false, 'Bralette sin aro de encaje suave, ideal para usar con blazer abierto.', '1572109754335-3807540beef2'],
    ['Corpiño encaje con flores', 'N', 109000, 0, '85, 90, 95', 'Negro', 5, false, 'Encaje floral de primera calidad, con aro y espalda en V.', '1599836641623-a596a2c44abc'],
    ['Corpiño blanco básico', 'N', 85000, 0, '85, 90, 95, 100', 'Blanco', 10, false, 'Microfibra sin costuras, invisible bajo la ropa clara.', '1587631550085-2d4bed859ea9'],
    ['Corpiño blanco de encaje', 'N', 95000, 0, '85, 90, 95', 'Blanco', 7, false, 'Taza preformada con detalle de encaje en el escote.', '1594631775771-890a902ae42d'],
    ['Pack 3 bombachas + top', 'N', 119000, 139000, 'S, M, L', 'Surtido', 9, true, 'Pack de algodón con top deportivo y tres bombachas en colores surtidos.', '1568441556126-f36ae0900180'],
    ['Corpiño de encaje nude', 'N', 99000, 0, '85, 90, 95, 100', 'Nude', 6, false, 'Tono piel que no se marca. Aro suave y breteles anchos.', '1694290340663-65804773ce7a'],
    ['Corpiño rayado', 'N', 89000, 0, '85, 90, 95', 'Negro y blanco', 4, false, 'Estampa rayada moderna, taza soft con aro.', '1584061634739-88035e420618'],
    ['Pack 3 corpiños', 'N', 199000, 239000, '85, 90, 95', 'Surtido', 4, false, 'Tres corpiños con aro en colores combinables. Ahorrás comprando el pack.', '1494698852314-652666555934'],
    ['Corpiño floral blanco', 'N', 105000, 0, '85, 90, 95', 'Blanco floreado', 5, false, 'Encaje bordado con flores y taza sin relleno.', '1594616091971-bf856a77b57d'],
    ['Bralette encaje negro', 'N', 75000, 0, 'S, M, L', 'Negro', 8, false, 'Bralette triangular sin aro, con espalda cruzada.', '1631242362679-d1d4d2d52af1'],
    ['Conjunto acanalado celeste', 'N', 129000, 0, 'S, M, L', 'Celeste', 5, true, 'Top y culotte de algodón acanalado, suaves para todo el día.', '1657753023885-7e30e39bf039'],
    ['Corpiño floral rosa', 'N', 95000, 0, '85, 90, 95', 'Rosa', 0, false, 'Estampa floral en tonos rosa, con aro y taza soft.', '1541182311535-f31f1aa15d12'],
    ['Pijama celeste con vivos', 'N', 179000, 0, 'S, M, L', 'Celeste', 6, true, 'Pijama de satén de camisa y pantalón largo con vivos blancos.', '1768696082915-bdc6774f94c7'],
    ['Bata de satén celeste', 'N', 189000, 0, 'Único', 'Celeste', 4, false, 'Bata corta de satén con cinto y ribete blanco.', '1770294759006-356f25f4f156'],
    ['Bata de terciopelo negra', 'N', 219000, 249000, 'Único', 'Negro', 3, false, 'Terciopelo suave y abrigado, largo midi con bolsillos.', '1759229874871-1dd3fb8c4619'],
    ['Bata de seda marfil', 'N', 199000, 0, 'Único', 'Marfil', 3, false, 'Bata larga de seda sintética con caída fluida.', '1766056278976-87f269e3b69c'],
    ['Top deportivo blanco', 'N', 79000, 0, 'S, M, L', 'Blanco', 7, false, 'Top de sostén medio con taza removible. Para gym o uso diario.', '1544838447-e08c8c6006ce'],
    ['Conjunto de encaje azul', 'N', 139000, 0, 'S, M, L', 'Azul', 4, false, 'Corpiño con aro y bombacha de encaje a juego.', '1526404746352-668ded9b50ab'],
    ['Corpiño negro clásico', 'N', 89000, 0, '85, 90, 95, 100', 'Negro', 9, false, 'Corpiño básico con aro y taza soft. El de todos los días.', '1572358764342-612d02e2d2d2']
  ],
  'Perfumes': [
    ['Eau de parfum Noir Oud 100 ml', 'N', 269000, 0, '', '', 5, true, 'Fragancia oriental intensa: oud, ámbar y vainilla. Ideal para la noche.', '1594035910387-fea47794261f'],
    ['Eau de parfum Cristal 100 ml', 'N', 239000, 0, '', '', 6, false, 'Floral fresco con notas de jazmín, pera y almizcle blanco.', '1458538977777-0549b2370168'],
    ['Set perfume + cremas', 'N', 289000, 329000, '', '', 3, true, 'Perfume de 50 ml y dos cremas corporales de la misma línea. Ideal para regalar.', '1622618991746-fe6004db3a47'],
    ['Eau de toilette Brisa 100 ml', 'N', 189000, 0, '', '', 8, false, 'Cítrico y acuático, liviano para el calor paraguayo.', '1590736704728-f4730bb30770'],
    ['Perfume Floral Intenso 90 ml', 'N', 219000, 0, '', '', 5, false, 'Rosa, peonía y pachulí. Alta duración en piel.', '1784183972601-17a1b00ea05e'],
    ['Eau de parfum Plata 100 ml', 'N', 249000, 0, '', '', 4, false, 'Floral almizclado con salida de bergamota. Elegante para la oficina.', '1761659760494-32b921a2449f'],
    ['Eau de parfum Ébano 100 ml', 'N', 259000, 0, '', '', 4, false, 'Amaderado con notas de cedro, cuero suave y haba tonka.', '1760920250029-36af9369a0bb'],
    ['Perfume Agua Fresca 100 ml', 'N', 179000, 0, '', '', 7, false, 'Notas verdes y de pepino. Para uso diario.', '1615634260167-c8cdede054de'],
    ['Eau de parfum Dorado 100 ml', 'N', 279000, 0, '', '', 3, false, 'Gourmand con caramelo, vainilla y almendra. Muy envolvente.', '1585218334450-afcf929da36e'],
    ['Perfume Cuero y Ámbar 100 ml', 'N', 259000, 0, '', '', 0, false, 'Estuche de cuero, aroma cálido de ámbar y especias.', '1594631756462-1cc44a5fa1d8'],
    ['Set de 5 miniaturas', 'N', 159000, 0, '', '', 6, true, 'Cinco perfumes de 10 ml para probar distintas fragancias o llevar en la cartera.', '1784924247174-e8e52265a013'],
    ['Eau de parfum Vintage 75 ml', 'N', 229000, 0, '', '', 4, false, 'Frasco estilo antiguo, aroma de violeta y polvo de arroz.', '1543422655-ac1c6ca993ed'],
    ['Eau de parfum Ámbar 100 ml', 'N', 249000, 0, '', '', 5, false, 'Oriental suave con ámbar, sándalo y flor de azahar.', '1723391962154-8a2b6299bc09'],
    ['Perfume Pétalos 100 ml', 'N', 199000, 229000, '', '', 6, false, 'Rosa fresca y lichi, femenino y alegre.', '1595425959632-34f2822322ce'],
    ['Eau de parfum Rosé 80 ml', 'N', 219000, 0, '', '', 5, false, 'Frutal floral con frambuesa y rosa. Frasco de regalo.', '1613521140785-e85e427f8002'],
    ['Perfume Algodón 100 ml', 'N', 169000, 0, '', '', 8, false, 'Aroma a ropa limpia y almizcle. Suave y duradero.', '1594125311687-3b1b3eafa9f4'],
    ['Eau de parfum Aurora 100 ml', 'N', 229000, 0, '', '', 4, false, 'Floral luminoso con flor de naranjo y miel.', '1608721279136-cd41b752fa41'],
    ['Body splash Vainilla 250 ml', 'N', 69000, 0, '', '', 12, false, 'Bruma corporal de vainilla y coco. Fresca para después del baño.', '1613521076081-2820f9746a2d'],
    ['Body splash Océano 250 ml', 'N', 65000, 0, '', '', 10, false, 'Notas marinas y cítricas, sensación de frescura inmediata.', '1615160460366-2c9a41771b51'],
    ['Perfume usado Oriental 100 ml', 'U', 120000, 0, '', '', 1, false, 'Frasco al 80 %, original, con caja. Vendo porque me regalaron otro.', '1720423514789-15a33e59fc81']
  ]
};

/** URL de Unsplash recortada en cuadrado (la tienda ajusta el ancho según el uso) */
function urlEjemplo_(id) {
  return 'https://images.unsplash.com/photo-' + id + '?w=900&h=900&fit=crop&q=80&auto=format';
}

/** Verifica todas las fotos en paralelo; devuelve las que no responden */
function fotosRotas_(urls) {
  const pedidos = urls.map(u => ({ url: u.replace('w=900', 'w=40').replace('h=900', 'h=40'), muteHttpExceptions: true, followRedirects: true }));
  const rotas = {};
  for (let i = 0; i < pedidos.length; i += 40) {
    const lote = pedidos.slice(i, i + 40);
    UrlFetchApp.fetchAll(lote).forEach((r, j) => { if (r.getResponseCode() !== 200) rotas[urls[i + j]] = true; });
  }
  return rotas;
}

/** Carga los 80 productos de ejemplo. Ejecutar UNA vez desde el editor. */
function cargarEjemplos() {
  const ss = SpreadsheetApp.getActive();
  const hoja = ss.getSheetByName(HOJA_PRODUCTOS);
  asegurarColumnas_(hoja);

  const existentes = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues() : [];
  if (existentes.some(r => String(r[0]).indexOf(PREFIJO_EJEMPLO) === 0)) {
    throw new Error('Los ejemplos ya están cargados. Para volver a cargarlos, ejecutá primero borrarEjemplos().');
  }

  // Asegura que existan las 4 categorías
  const nombres = nombresCategorias_();
  Object.keys(EJEMPLOS).forEach((cat, i) => {
    if (nombres.indexOf(cat) < 0) guardarCategoria_({ nombre: cat, icono: ['ropa', 'acc', 'lenc', 'perf'][i], activo: true });
  });

  const todas = [];
  Object.keys(EJEMPLOS).forEach(cat => EJEMPLOS[cat].forEach(e => todas.push(urlEjemplo_(e[9]))));
  const rotas = fotosRotas_(todas);

  const ahora = Date.now();
  const filas = [];
  let n = 0;
  Object.keys(EJEMPLOS).forEach(cat => {
    EJEMPLOS[cat].forEach(e => {
      n++;
      const url = urlEjemplo_(e[9]);
      const fecha = new Date(ahora - n * 3600 * 1000); // fechas escalonadas para "Más nuevos"
      const fila = {
        id: PREFIJO_EJEMPLO + Utilities.getUuid().slice(0, 6),
        nombre: e[0],
        categoria: cat,
        condicion: e[1] === 'U' ? 'Segunda mano' : 'Nuevo',
        precio: e[2],
        precio_anterior: e[3] || '',
        talles: e[4],
        colores: e[5],
        descripcion: e[8],
        imagenes: rotas[url] ? '' : url,
        stock: e[6],
        destacado: e[7],
        activo: true,
        orden: '',
        creado: fecha,
        actualizado: fecha,
        codigo: ''
      };
      filas.push(COLUMNAS_PRODUCTOS.map(c => fila[c]));
    });
  });

  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, COLUMNAS_PRODUCTOS.length).setValues(filas);
  SpreadsheetApp.flush();
  asignarCodigosFaltantes_();
  limpiarCache_();

  const sinFoto = Object.keys(rotas).length;
  Logger.log('Listo: ' + filas.length + ' productos de ejemplo cargados' +
    (sinFoto ? ' (' + sinFoto + ' sin foto porque la imagen no respondió).' : ' con foto.'));
}

/** Borra SOLO los productos de ejemplo (id que empieza con "ej-"). */
function borrarEjemplos() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PRODUCTOS);
  if (hoja.getLastRow() < 2) return Logger.log('No hay productos.');
  const ids = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues();
  let borrados = 0;
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]).indexOf(PREFIJO_EJEMPLO) === 0) { hoja.deleteRow(i + 2); borrados++; }
  }
  limpiarCache_();
  Logger.log('Se borraron ' + borrados + ' productos de ejemplo.');
}
