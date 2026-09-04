/* Campo de estrellas de la portada.
 *
 * Dibuja partículas sobre todo el fondo de la portada, no sólo sobre la caja
 * de la ilustración. Las 13 estrellas del marcado siguen siendo el respaldo:
 * con el JavaScript desactivado la portada conserva un cielo, sólo que quieto.
 *
 * La posición se sesga, no se pega al puntero: cerca de siete de cada diez
 * caen en una gaussiana alrededor del mouse y el resto en cualquier parte, así
 * el cielo sigue vivo lejos del cursor en vez de amontonarse encima.
 */
(function () {
  var header = document.querySelector('header');
  if (!header) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var MAX = 46;        // techo de partículas vivas
  var NEAR = 0.7;      // proporción que cae cerca del puntero
  var SIGMA = 90;      // dispersión de esa gaussiana, en píxeles
  var MARGEN_Y = 46;   // franja muerta contra el borde superior e inferior

  var capa = document.createElementNS(SVG_NS, 'svg');
  capa.setAttribute('class', 'hero-field');
  capa.setAttribute('aria-hidden', 'true');
  capa.setAttribute('fill', 'currentColor');
  header.insertBefore(capa, header.firstChild);

  var W = 0, H = 0, zonaTexto = null;

  function medir() {
    var r = header.getBoundingClientRect();
    W = Math.round(r.width);
    H = Math.round(r.height);
    capa.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    // El bloque de texto se marca para bajar ahí la densidad y el brillo: una
    // estrella a pleno brillo detrás de una letra le come contraste.
    var texto = header.querySelector('.hero > div');
    if (texto) {
      var t = texto.getBoundingClientRect();
      zonaTexto = { x1: t.left - r.left - 16, y1: t.top - r.top - 16,
                    x2: t.right - r.left + 16, y2: t.bottom - r.top + 16 };
    }
  }

  var pointer = null, lastMove = 0;

  header.addEventListener('pointermove', function (e) {
    var r = header.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    lastMove = e.timeStamp;
  });
  header.addEventListener('pointerleave', function () { pointer = null; });

  // Box-Muller: una normal a partir de dos uniformes.
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function enTexto(x, y) {
    var z = zonaTexto;
    return !!z && x > z.x1 && x < z.x2 && y > z.y1 && y < z.y2;
  }

  function spawn() {
    if (!W || capa.childNodes.length >= MAX) return;
    var x, y;
    if (pointer && Math.random() < NEAR) {
      x = pointer.x + gauss() * SIGMA;
      y = pointer.y + gauss() * SIGMA;
    } else {
      x = Math.random() * W;
      y = Math.random() * H;
    }
    if (x < 4 || x > W - 4 || y < 4 || y > H - 4) return;

    // Densidad, no recorte: se apaga contra el borde superior e inferior, que
    // es donde la banda oscura termina y el corte se notaría.
    var borde = Math.min(y, H - y);
    if (borde < MARGEN_Y && Math.random() > borde / MARGEN_Y) return;

    var tenue = enTexto(x, y);
    if (tenue && Math.random() > 0.45) return;

    var c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', x.toFixed(1));
    c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('r', (0.9 + Math.random() * 1.6).toFixed(2));
    if (tenue) c.setAttribute('class', 'dim');
    var vida = 1600 + Math.random() * 1500;
    c.style.animationDuration = vida + 'ms';
    capa.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, vida + 60);
  }

  var timer = null;
  function tick() {
    var activo = pointer && (performance.now() - lastMove < 1200);
    spawn();
    if (activo) spawn();
    timer = setTimeout(tick, activo ? 120 : 480);
  }
  function arrancar() { if (!timer) { medir(); tick(); } }
  function parar() { clearTimeout(timer); timer = null; }

  document.addEventListener('visibilitychange', function () {
    document.hidden ? parar() : arrancar();
  });
  window.addEventListener('resize', medir);
  arrancar();
})();
