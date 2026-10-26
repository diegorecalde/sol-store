/* Estadísticas anónimas de la tienda.
 * Se envía: tipo de evento, producto, canal de origen (Instagram, Google…),
 * tipo de dispositivo y textos buscados. NO se envía ni guarda: IP, cookies,
 * identificadores personales ni el navegador completo.
 * No se registra nada si el navegador pide "no rastrear" (GPC / Do Not Track)
 * ni cuando quien navega tiene sesión abierta en el panel. */
(function () {
  const CFG = window.SOL_CONFIG || {};
  const SOL = window.SOL || {};
  let esAdmin = false;
  try { esAdmin = !!localStorage.getItem('sol_token'); } catch (e) { }
  const noRastrear = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const apagado = !CFG.API_URL || noRastrear || esAdmin;

  function dispositivo() {
    const tactil = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const lado = Math.min(screen.width, screen.height);
    if (tactil && lado < 600) return 'celular';
    if (tactil) return 'tablet';
    return 'computadora';
  }

  function canal() {
    const utm = (new URLSearchParams(location.search).get('utm_source') || '').toLowerCase();
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (e) { }
    const fuente = utm || ref;
    if (!fuente || ref === location.hostname) return 'directo';
    if (/instagram|^ig$/.test(fuente)) return 'instagram';
    if (/facebook|fb\.|^fb$|messenger/.test(fuente)) return 'facebook';
    if (/whatsapp|wa\.me|^wa$/.test(fuente)) return 'whatsapp';
    if (/google\./.test(fuente) || fuente === 'google') return 'google';
    if (/tiktok/.test(fuente)) return 'tiktok';
    return 'otro';
  }

  const disp = dispositivo();
  const cola = [];
  let timer = null;

  function enviar(salida) {
    clearTimeout(timer);
    while (cola.length) {
      const cuerpo = JSON.stringify({ action: 'eventos', e: cola.splice(0, 30) });
      // text/plain: pedido simple, sin preflight CORS
      if (salida && navigator.sendBeacon) navigator.sendBeacon(CFG.API_URL, new Blob([cuerpo], { type: 'text/plain' }));
      else fetch(CFG.API_URL, { method: 'POST', body: cuerpo, keepalive: true, redirect: 'follow' }).catch(() => { });
    }
  }

  /** evento('vista', idProducto) · evento('busqueda', '', 'texto', cantidadResultados) */
  function evento(tipo, producto, detalle, valor) {
    if (apagado) return;
    cola.push({ t: tipo, p: producto || '', d: detalle || '', x: disp, v: valor || 0 });
    clearTimeout(timer);
    timer = setTimeout(() => enviar(false), cola.length >= 20 ? 0 : 4000);
  }

  if (!apagado) {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') enviar(true); });
    window.addEventListener('pagehide', () => enviar(true));
    // Una "visita" por pestaña (sesión): no se usa ningún identificador
    let nueva = true;
    try { nueva = !sessionStorage.getItem('sol_vis'); sessionStorage.setItem('sol_vis', '1'); } catch (e) { }
    if (nueva) evento('visita', '', canal());
  }

  // Cloudflare Web Analytics (opcional, sin cookies)
  if (CFG.CF_ANALYTICS_TOKEN && !esAdmin && !noRastrear) {
    const s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: CFG.CF_ANALYTICS_TOKEN }));
    document.head.appendChild(s);
  }

  SOL.evento = evento;
  window.SOL = SOL;
})();
