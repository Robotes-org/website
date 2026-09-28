/* «Jugar ahora» on ruta-robot.html: asks whether a student or a teacher is
 * playing before opening the game.
 *
 * Progressive enhancement. Without this script, or without <dialog> support,
 * the button stays a plain link to rovi.robotes.org and nobody is asked
 * anything.
 */
(function () {
  var trigger = document.querySelector('[data-play-choice]');
  var dialog = document.getElementById('play-choice');
  if (!trigger || !dialog || typeof dialog.showModal !== 'function') return;

  var teacherToggle = dialog.querySelector('button[aria-controls="play-teacher"]');
  var teacherForm = document.getElementById('play-teacher');

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    dialog.showModal();
  });

  teacherToggle.addEventListener('click', function () {
    var open = teacherForm.hidden;
    teacherForm.hidden = !open;
    teacherToggle.setAttribute('aria-expanded', String(open));
    if (open) teacherForm.querySelector('input[type="email"]').focus();
  });

  /* The links open the game in a new tab; the dialog closes behind them. */
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) {
      /* The dialog's own padding is also e.target === dialog, so only a
         click outside its box counts as the backdrop. */
      var r = dialog.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
      return;
    }
    if (e.target.closest('.play-close, [data-close]')) dialog.close();
  });
})();
