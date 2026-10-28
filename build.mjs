// Empaqueta el juego en un único HTML (dist/index.html) listo para PC y móvil.
// Uso: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const ORDER = ['util', 'audio', 'input', 'data', 'items_db', 'chars', 'rooms', 'gen', 'entities', 'enemies', 'items', 'render', 'game'];
const js = ORDER.map(f => `/* ---- ${f}.js ---- */\n` + readFileSync(join(root, 'src', f + '.js'), 'utf8')).join('\n');
if (js.includes('</script')) throw new Error('El código contiene </script>');

const TITLE = 'Lágrimas del Sótano';

const style = `<style>
:root { --bg: #0b0705; --fg: #e9dcc0; color-scheme: dark; }
html, body { margin: 0; height: 100%; background: var(--bg); color: var(--fg); overflow: hidden;
  touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  overscroll-behavior: none; -webkit-tap-highlight-color: transparent; }
#game { position: fixed; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; outline: none; }
#safe { position: fixed; left: 0; top: 0; visibility: hidden; pointer-events: none;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
</style>`;

const head = hosted => [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">',
  `<title>${TITLE}</title>`,
  '<meta name="description" content="Fan-game roguelike de sótanos, lágrimas y monstruos. Juega en PC o móvil.">',
  '<meta name="theme-color" content="#0b0705">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Lágrimas">',
  hosted ? '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon.svg" type="image/svg+xml">' : '',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Rubik+Wet+Paint&display=swap">',
  style,
].filter(Boolean).join('\n');

const boot = hosted => `<script>
(function () {
  // Icono para "Añadir a pantalla de inicio" en iPhone/iPad, dibujado al vuelo
  try {
    var cv = document.createElement('canvas'); cv.width = cv.height = 180;
    var c = cv.getContext('2d');
    var g = c.createRadialGradient(90, 90, 10, 90, 90, 120);
    g.addColorStop(0, '#6e4e37'); g.addColorStop(1, '#1a0f0a');
    c.fillStyle = g; c.fillRect(0, 0, 180, 180);
    var fake = { char: CHARS[0], vx: 0, vy: 0, walkT: 0, shootAnim: 1, faceDir: 'down', flags: {}, costume: {}, holdT: 0, shield: 0 };
    drawPlayer(c, fake, 90, 112, 3.6);
    var l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = cv.toDataURL('image/png');
    document.head.appendChild(l);
  } catch (e) {}
  ${hosted ? `try {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && window.top === window.self)
      navigator.serviceWorker.register('sw.js').catch(function () {});
  } catch (e) {}` : ''}
})();
</script>`;

const body = hosted => `<canvas id="game" tabindex="0" aria-label="${TITLE}"></canvas>
<div id="safe"></div>
<script>
${js}
</script>
${boot(hosted)}`;

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'index.html'), `<!doctype html>\n<html lang="es">\n<head>\n${head(true)}\n</head>\n<body>\n${body(true)}\n</body>\n</html>\n`);
// Variante sin <html>/<head>/<body> para publicarla como Artifact
writeFileSync(join(root, 'dist', 'artifact.html'), `${head(false)}\n${body(false)}\n`);

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#2a1a12"/>
<circle cx="256" cy="230" r="150" fill="#f0d2c2" stroke="#3a2418" stroke-width="14"/>
<ellipse cx="196" cy="222" rx="30" ry="40" fill="#120a08"/><ellipse cx="316" cy="222" rx="30" ry="40" fill="#120a08"/>
<circle cx="186" cy="206" r="11" fill="#fff"/><circle cx="306" cy="206" r="11" fill="#fff"/>
<ellipse cx="196" cy="300" rx="16" ry="28" fill="#7ec0ff"/><ellipse cx="316" cy="300" rx="16" ry="28" fill="#7ec0ff"/>
<path d="M226 336 Q256 316 286 336" fill="none" stroke="#3a1a10" stroke-width="12" stroke-linecap="round"/>
<ellipse cx="256" cy="440" rx="90" ry="40" fill="#f0d2c2" stroke="#3a2418" stroke-width="12"/>
</svg>`;
writeFileSync(join(root, 'dist', 'icon.svg'), icon);

writeFileSync(join(root, 'dist', 'manifest.webmanifest'), JSON.stringify({
  name: TITLE, short_name: 'Lágrimas', lang: 'es', start_url: './', scope: './', display: 'fullscreen',
  orientation: 'any', background_color: '#0b0705', theme_color: '#0b0705',
  icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
}, null, 2));

writeFileSync(join(root, 'dist', 'sw.js'), `// Caché sencilla para jugar sin conexión
const CACHE = 'lagrimas-v${Date.now()}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
`);

console.log('OK  dist/index.html (' + Math.round(readFileSync(join(root, 'dist', 'index.html')).length / 1024) + ' KB)');
