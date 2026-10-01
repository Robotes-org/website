/* Endpoint del formulario de Ruta Robot.
 *
 * Recibe el correo y, si lo escribe, el nombre que deja un profesor en
 * ruta-robot.html, los guarda en la planilla y devuelve al visitante a
 * robotes.org/gracias.html.
 *
 * El nombre va en la cuarta columna y no en la segunda para que las filas que
 * ya estaban en la planilla, que no lo tienen, sigan calzando con sus títulos.
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

  /* Optativo y de texto libre: se guarda tal como viene, recortado. */
  var name = String(p.nombre || '').trim().slice(0, 120);

  var sheet = sheetFor(SHEET_NAME);

  /* Un profesor que manda el formulario dos veces no debe aparecer dos veces.
     Si la segunda vez trae un nombre y la primera no, se completa esa fila. */
  var seen = sheet.getLastRow() > 1
    ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().map(function (r) {
        return String(r[0]).trim().toLowerCase();
      })
    : [];
  var at = seen.indexOf(email);
  if (at === -1) {
    sheet.appendRow([new Date(), email, String(p.origen || ''), name]);
  } else if (name) {
    var cell = sheet.getRange(at + 2, 4);
    if (!String(cell.getValue()).trim()) cell.setValue(name);
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
    sheet.appendRow(['fecha', 'correo', 'origen', 'nombre']);
    sheet.setFrozenRows(1);
  } else if (!String(sheet.getRange(1, 4).getValue()).trim()) {
    // Planillas creadas antes de que existiera el nombre: se agrega el título.
    sheet.getRange(1, 4).setValue('nombre');
  }
  return sheet;
}

function redirect(url) {
  return HtmlService
    .createHtmlOutput('<meta http-equiv="refresh" content="0;url=' + url + '">')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
