/**
 * Feito de Nós — Backend (Google Apps Script)
 *
 * COMO USAR:
 * 1. Crie uma planilha nova no Google Drive (pode chamar "Feito de Nós — Dados")
 * 2. Em Extensões > Apps Script, cole TODO este código
 * 3. Deploy > Nova implantação
 *    - Tipo: Aplicativo da Web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 4. Copie a URL gerada e cole no site (aba Ajustes > Backend)
 */

const SHEET_NAME = 'DB';

function doGet() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = loadData_();
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse(e.postData.contents);
    saveData_(body.data);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.hideSheet();
  }
  return sh;
}

function loadData_() {
  const sh = getSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow < 1) return null;
  const values = sh.getRange(1, 1, lastRow, 2).getValues();
  let json = '';
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === 'chunk') json += values[i][1];
  }
  return json ? JSON.parse(json) : null;
}

function saveData_(data) {
  const json = JSON.stringify(data);
  const sh = getSheet_();
  sh.clear();
  const CHUNK = 45000;
  const rows = [];
  for (let i = 0; i < json.length; i += CHUNK) {
    rows.push(['chunk', json.slice(i, i + CHUNK)]);
  }
  if (rows.length) {
    sh.getRange(1, 1, rows.length, 2).setValues(rows);
  }
}

/**
 * Teste manual: roda esta função no editor pra ver se está tudo OK.
 */
function testar() {
  const r = loadData_();
  Logger.log(r ? 'Dados encontrados: ' + Object.keys(r).join(', ') : 'Planilha vazia');
}
