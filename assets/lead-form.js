/* Envío del formulario de correo sin salir de la página.
 *
 * Es una mejora progresiva: el <form> es nativo y funciona igual sin esto —
 * manda un POST normal y Apps Script devuelve al visitante a gracias.html,
 * que tiene el link de descarga de la guía.
 * Con el script cargado no hay navegación: el correo se manda en segundo plano
 * y el link de descarga aparece en el mismo lugar del formulario.
 *
 * Apps Script no responde con cabeceras CORS, así que la petición va en
 * `no-cors` y el navegador no deja leer el resultado. Por eso el link aparece
 * sin esperar la respuesta. El respaldo de verdad es la planilla.
 */
(function () {
  if (!window.fetch || !window.FormData || !window.URLSearchParams) return;
  /* ruta-robot.html has two: the one in #profesor and the one inside the
     «Jugar ahora» dialog. Each carries the guide's URL in data-download. */
  Array.prototype.forEach.call(document.querySelectorAll('form.lead'), enhance);

  function enhance(form) {
    var action = form.getAttribute('action') || '';
    /* Sin endpoint configurado, dejamos el envío nativo tal cual. */
    if (action.indexOf('https://') !== 0) return;

    var row = form.querySelector('.lead-row');
    var email = form.querySelector('input[type="email"]');

    form.addEventListener('submit', function (e) {
      if (!email.checkValidity()) return;   // el navegador muestra su propio aviso
      e.preventDefault();

      fetch(action, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams(new FormData(form))
      }).catch(function () {});

      entregar();
    });

    function entregar() {
      var ok = document.createElement('div');
      ok.className = 'lead-ok';
      ok.setAttribute('role', 'status');

      var text = document.createElement('p');
      text.textContent = 'Listo. Aquí está la guía.';

      var link = document.createElement('a');
      link.className = 'btn btn-primary';
      link.href = form.getAttribute('data-download');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Descargar la guía (PDF)';

      ok.appendChild(text);
      ok.appendChild(link);
      row.insertAdjacentElement('afterend', ok);
      row.hidden = true;
      link.focus();
    }
  }
})();
