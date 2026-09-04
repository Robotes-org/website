/* Hero star field.
 *
 * The 26 stars in the markup are the base field and keep twinkling on their own
 * with CSS: this file only adds the particles that appear around the pointer.
 * With scripting off the hero still has a star field, it just does not follow
 * the mouse.
 *
 * The spawn position is biased, not snapped: about seven of every ten particles
 * land on a gaussian around the pointer and the rest anywhere in the frame, so
 * the field stays alive away from the cursor instead of collapsing onto it.
 */
(function () {
  var art = document.querySelector('.hero-art svg');
  var header = document.querySelector('header');
  if (!art || !header) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var VB_W = 380, VB_H = 320;
  var MAX = 32;             // techo de partículas vivas a la vez
  var NEAR = 0.7;           // proporción que cae cerca del puntero
  var SIGMA = 46;           // dispersión de esa gaussiana, en unidades del viewBox
  var ORIG_X = 54, ORIG_Y = 286;   // el mismo centro que los arcos
  var R_LLENO = 200, R_BORDE = 330; // el campo se apaga entre estos dos radios
  var MARGEN = 44;          // franja muerta contra cada borde del viewBox
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var layer = document.createElementNS(SVG_NS, 'g');
  layer.setAttribute('class', 'art-spark');
  layer.setAttribute('fill', 'currentColor');
  layer.setAttribute('stroke', 'none');
  art.appendChild(layer);

  var pointer = null;       // posición del puntero en coordenadas del viewBox
  var lastMove = 0;

  header.addEventListener('pointermove', function (e) {
    var r = art.getBoundingClientRect();
    if (!r.width) return;
    var x = (e.clientX - r.left) / r.width * VB_W;
    var y = (e.clientY - r.top) / r.height * VB_H;
    // Fuera del cuadro con holgura no hay sesgo: el campo vuelve a ser parejo.
    pointer = (x > -160 && x < VB_W + 60 && y > -80 && y < VB_H + 80)
      ? { x: Math.max(0, Math.min(VB_W, x)), y: Math.max(0, Math.min(VB_H, y)) }
      : null;
    lastMove = e.timeStamp;
  });

  header.addEventListener('pointerleave', function () { pointer = null; });

  // Box-Muller: una normal a partir de dos uniformes.
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* Densidad, no recorte: una partícula se acepta con una probabilidad que baja
     hacia los bordes del cuadro y hacia el borde exterior del abanico. Sin esto
     el campo cubre el viewBox entero y se ve el rectángulo. */
  function cabe(x, y) {
    if (x < 2 || x > VB_W - 2 || y < 2 || y > VB_H - 2) return false;
    // La esquina de la escuela se deja libre: ahí el dibujo ya está cargado.
    if (x < 100 && y > 200) return false;

    var d = Math.sqrt((x - ORIG_X) * (x - ORIG_X) + (y - ORIG_Y) * (y - ORIG_Y));
    var p = 1 - suave(R_LLENO, R_BORDE, d);

    var borde = Math.min(x, VB_W - x, y, VB_H - y);
    if (borde < MARGEN) p *= borde / MARGEN;

    return Math.random() < p;
  }

  function suave(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function spawn() {
    if (layer.childNodes.length >= MAX) return;
    var x, y;
    if (pointer && Math.random() < NEAR) {
      x = pointer.x + gauss() * SIGMA;
      y = pointer.y + gauss() * SIGMA;
    } else {
      x = Math.random() * VB_W;
      y = Math.random() * VB_H;
    }
    if (!cabe(x, y)) return;

    var c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', x.toFixed(1));
    c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('r', (0.9 + Math.random() * 1.7).toFixed(2));
    var vida = 1500 + Math.random() * 1400;
    c.style.animationDuration = vida + 'ms';
    layer.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, vida + 60);
  }

  var timer = null;
  function tick() {
    // Más denso mientras el puntero se mueve; un goteo lento cuando no.
    var activo = pointer && (performance.now() - lastMove < 1200);
    spawn();
    timer = setTimeout(tick, activo ? 140 : 620);
  }

  // Sin trabajo mientras la pestaña está oculta.
  function arrancar() { if (!timer) tick(); }
  function parar() { clearTimeout(timer); timer = null; }
  document.addEventListener('visibilitychange', function () {
    document.hidden ? parar() : arrancar();
  });
  arrancar();
})();
