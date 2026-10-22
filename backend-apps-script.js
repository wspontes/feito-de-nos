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
 * 4. Copie a URL gerada e cole no site (aba Ajustes > Banco de dados compartilhado)
 *
 * OPCIONAL — chave de acesso:
 * Preencha SECRET_KEY com uma senha e repita o mesmo valor no site
 * (Ajustes > Chave de acesso). Quem não souber a chave não lê nem
 * escreve no banco, mesmo que a URL vaze.
 *
 * Onde os dados ficam:
 * tudo é guardado na aba oculta "DB", um pedaço por linha (coluna A = "chunk",
 * coluna B = o texto). A linha "meta" guarda a data da última gravação.
 */

const SHEET_NAME = 'DB';
const SECRET_KEY = '';

function doGet(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (!autorizado_(e && e.parameter ? e.parameter.key : '')) {
      return json_({ ok: false, error: 'Chave de acesso invalida' });
    }
    const r = loadData_();
    return json_({ ok: true, data: r.data, updatedAt: r.updatedAt });
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
    if (!autorizado_(body.key)) {
      return json_({ ok: false, error: 'Chave de acesso invalida' });
    }
    const ts = Number(body.updatedAt) || Date.now();
    saveData_(body.data, ts);
    return json_({ ok: true, updatedAt: ts });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function autorizado_(key) {
  if (!SECRET_KEY) return true;
  return String(key || '') === String(SECRET_KEY);
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
  if (lastRow < 1) return { data: null, updatedAt: 0 };
  const values = sh.getRange(1, 1, lastRow, 2).getValues();
  let json = '';
  let updatedAt = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === 'chunk') json += values[i][1];
    else if (values[i][0] === 'meta') {
      try { updatedAt = Number(JSON.parse(values[i][1]).updatedAt || 0); } catch (err) {}
    }
  }
  return { data: json ? JSON.parse(json) : null, updatedAt: updatedAt };
}

function saveData_(data, updatedAt) {
  const json = JSON.stringify(data);
  const sh = getSheet_();
  sh.clear();
  const CHUNK = 45000;
  const rows = [];
  for (let i = 0; i < json.length; i += CHUNK) {
    rows.push(['chunk', json.slice(i, i + CHUNK)]);
  }
  rows.push(['meta', JSON.stringify({ updatedAt: updatedAt || Date.now() })]);
  sh.getRange(1, 1, rows.length, 2).setValues(rows);
}

/**
 * Teste manual: roda esta função no editor pra ver se está tudo OK.
 */
function testar() {
  const r = loadData_();
  Logger.log(r.data ? 'Dados encontrados: ' + Object.keys(r.data).join(', ') : 'Planilha vazia');
  Logger.log('Ultima gravacao: ' + new Date(r.updatedAt).toLocaleString('pt-BR'));
}
