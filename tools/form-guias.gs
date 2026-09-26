/* Endpoint del formulario de Ruta Robot.
 *
 * Recibe el correo que deja un profesor en ruta-robot.html, lo guarda en la
 * planilla y devuelve al visitante a robotes.org/gracias.html.
 *
 * Cómo se instala:
 *   1. Crear una planilla nueva en Google Sheets.
 *   2. Extensiones -> Apps Script, y pegar este archivo completo.
 *   3. Implementar -> Nueva implementación -> Aplicación web.
 *        Ejecutar como:        Yo
 *        Quién tiene acceso:   Cualquier persona
 *   4. Copiar la URL que entrega y pegarla en el `action` del <form>
 *      de ruta-robot.html, donde dice PEGAR_AQUI_LA_URL_DEL_APPS_SCRIPT.
 *
 * Cada cambio en este archivo necesita una implementación nueva para salir en
 * vivo: editar el script no basta.
 */

var SHEET_NAME = 'correos';
var REDIRECT = 'https://robotes.org/gracias.html';

function doPost(e) {
  var p = (e && e.parameter) || {};

  /* La trampa de bots viaja vacía desde el formulario. Si trae algo, se
     descarta en silencio: contestarle al bot le enseña a reintentar. */
  if (p.website) return redirect(REDIRECT);

  var email = String(p.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return redirect(REDIRECT + '?estado=revisa');
  }

  var sheet = sheetFor(SHEET_NAME);

  /* Un profesor que manda el formulario dos veces no debe aparecer dos veces. */
  var seen = sheet.getLastRow() > 1
    ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().map(function (r) {
        return String(r[0]).trim().toLowerCase();
      })
    : [];
  if (seen.indexOf(email) === -1) {
    sheet.appendRow([new Date(), email, String(p.origen || '')]);
  }

  return redirect(REDIRECT);
}

/* Abrir la URL en el navegador sirve para comprobar que la implementación vive. */
function doGet() {
  return ContentService.createTextOutput('ok');
}

function sheetFor(name) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['fecha', 'correo', 'origen']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function redirect(url) {
  return HtmlService
    .createHtmlOutput('<meta http-equiv="refresh" content="0;url=' + url + '">')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
