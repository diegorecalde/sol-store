# Sol Store — Catálogo online + Panel de administración

Sitio estático (Netlify) + backend en Google Apps Script, con productos en **Google Sheets** y fotos en **Google Drive**.

```
sol-store/
├── index.html          → Catálogo público
├── admin/index.html    → Panel con login (/admin)
├── css/                → Estilos (catálogo y panel)
├── js/config.js        → ⚙️ URL del backend (lo único que hay que editar)
├── js/api.js           → Conexión con el backend + modo demo
├── js/catalogo.js      → Lógica del catálogo
├── js/admin.js         → Lógica del panel
├── img/                → Logo e ícono
├── apps-script/Code.js → Backend (se sube con clasp, NO se publica)
├── apps-script/Ejemplos.js → 80 productos de ejemplo (cargar / borrar)
└── netlify.toml        → Cabeceras de seguridad
```

Sin configurar nada, el sitio funciona en **modo demo** (productos de ejemplo; panel con `admin` / `demo1234`).

---

## Paso 1 — Planilla y backend (con la cuenta de Google de la tienda)

1. Crear una planilla nueva en Google Sheets llamada **Sol Store**.
2. Menú **Extensiones → Apps Script**. Borrar el contenido y pegar todo `apps-script/Code.js`. Guardar.
3. Elegir la función **`setup`** y presionar **▶ Ejecutar**. Aceptar los permisos (Sheets y Drive).
   Crea las hojas `Productos`, `Usuarios`, `Config` y la carpeta de Drive **Sol Store - Imagenes**.
4. En `crearAdminInicial()` cambiar usuario, nombre y clave (mín. 8 caracteres). Ejecutarla **una vez** y después borrar la clave del código.
5. **Implementar → Nueva implementación → tipo: Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copiar la URL que termina en **`/exec`**.

> Si cambiás el backend más adelante: **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión**. Así la URL no cambia.

## Paso 2 — Conectar el sitio

Abrir `js/config.js` y pegar la URL:

```js
API_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
```

## Paso 3 — Subir a GitHub

Desde la carpeta `sol-store`, uno por uno:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Sol Store: catálogo y panel"
```

```bash
git branch -M main
```

Crear un repositorio vacío en github.com (por ejemplo `sol-store`, puede ser **privado**) y conectarlo:

```bash
git remote add origin https://github.com/TU_USUARIO/sol-store.git
```

```bash
git push -u origin main
```

## Paso 4 — Publicar en Netlify

1. app.netlify.com → **Add new site → Import an existing project → GitHub**.
2. Elegir el repositorio `sol-store`.
3. Build command: *(vacío)* · Publish directory: `.`
4. **Deploy**. En **Site configuration → Change site name** poné, por ejemplo, `solstore` → `https://solstore.netlify.app`.

Cada `git push` vuelve a publicar el sitio automáticamente.

## Uso diario

- **Tienda:** `https://solstore.netlify.app`
- **Panel:** `https://solstore.netlify.app/admin`
  - **Productos:** cargar, editar, ocultar, marcar destacado, subir fotos (se reducen solas antes de subir).
  - **Tienda** (solo admin): WhatsApp, Instagram, mensaje de bienvenida, dirección.
  - **Usuarios** (solo admin): crear usuarios *Editor* (solo productos) o *Administrador*, desactivarlos o cambiarles la clave.
- También se puede editar directo en la planilla; los cambios se ven en ~2 minutos.

## Seguridad

- Las claves se guardan con hash + salt, nunca en texto plano.
- Bloqueo de 15 min tras 5 intentos fallidos. Sesiones de 6 horas.
- El panel no se indexa en Google (`noindex`).
- La planilla y el script quedan privados en la cuenta de Google; el público solo recibe productos visibles.

## Notas

- **Fotos:** se guardan en Drive compartidas como "cualquiera con el enlace". No subas ahí nada privado.
- **Límites gratuitos** de Apps Script: holgados para una tienda chica (miles de visitas por día).
- **Dominio propio:** en Netlify → **Domain management → Add a domain**.

## Datos de ejemplo

En el editor de Apps Script:

- **`cargarEjemplos`** → agrega 80 productos (20 por categoría) con fotos de Unsplash y precios en Gs.
- **`borrarEjemplos`** → quita solo esos productos (su id empieza con `ej-`); los reales no se tocan.
