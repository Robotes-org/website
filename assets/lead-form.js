/* Envío del formulario de correo sin salir de la página.
 *
 * Es una mejora progresiva: el <form> es nativo y funciona igual sin esto —
 * manda un POST normal y Apps Script devuelve al visitante a gracias.html.
 * Con el script cargado no hay navegación y la confirmación aparece en línea.
 *
 * Apps Script no responde con cabeceras CORS, así que la petición va en
 * `no-cors` y el navegador no deja leer el resultado. Por eso el éxito y el
 * fallo llegan al mismo lugar y la confirmación es optimista. El respaldo de
 * verdad es la planilla.
 */
(function () {
  var form = document.querySelector('.lead');
  if (!form || !window.fetch || !window.FormData || !window.URLSearchParams) return;

  var action = form.getAttribute('action') || '';
  /* Sin endpoint configurado, dejamos el envío nativo tal cual. */
  if (action.indexOf('https://') !== 0) return;

  var row = form.querySelector('.lead-row');
  var email = form.querySelector('input[type="email"]');
  var button = form.querySelector('button');

  form.addEventListener('submit', function (e) {
    if (!email.checkValidity()) return;   // el navegador muestra su propio aviso
    e.preventDefault();

    button.disabled = true;
    button.textContent = 'Enviando…';

    fetch(action, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(new FormData(form))
    }).then(confirmar, confirmar);
  });

  function confirmar() {
    var ok = document.createElement('p');
    ok.className = 'lead-ok';
    ok.setAttribute('role', 'status');
    ok.textContent = 'Listo. Te escribimos a ' + email.value + ' con el material.';
    row.insertAdjacentElement('afterend', ok);
    row.hidden = true;
  }
})();
