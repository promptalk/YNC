/**
 * Google Sheets 데이터 계층 (프로젝트 / 중요메모 / 영업메모)
 * - 모든 쓰기 함수는 Code.gs 의 withLock_() 안에서 호출된다.
 * - 날짜 열은 'YYYY-MM-DD' 문자열로 읽고 쓴다. (시트의 Date 자동 변환 방지)
 * - 텍스트 열은 서식을 '@'(일반 텍스트)로 지정해 '=' 등으로 시작하는 입력이
 *   수식으로 실행되는 것을 막는다.
 */

const TITLE_MAX = 200;
const CONTENT_MAX = 5000;

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || DEFAULT_SHEET_ID;
  return SpreadsheetApp.openById(id);
}

/** 탭을 가져온다. 없으면 만들고, 헤더가 스키마와 다르면 오류를 낸다. */
function getSheet_(mod) {
  const def = MODULES[mod];
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(def.sheet);
  if (!sh) sh = ss.insertSheet(def.sheet);

  const n = def.headers.length;
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, n).setValues([def.headers]);
    sh.setFrozenRows(1);
    return sh;
  }
  const head = sh.getRange(1, 1, 1, n).getValues()[0].map(function (v) { return String(v).trim(); });
  if (head.join('|') !== def.headers.join('|')) {
    throw new Error("'" + def.sheet + "' 탭의 헤더가 올바르지 않습니다. (기대값: " + def.headers.join(', ') + ')');
  }
  return sh;
}

/* ---------------- 조회 ---------------- */

function readRows_(mod) {
  const def = MODULES[mod];
  const sh = getSheet_(mod);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const tz = sh.getParent().getSpreadsheetTimeZone() || DEFAULT_TZ;
  const values = sh.getRange(2, 1, last - 1, def.headers.length).getValues();
  const rows = [];
  values.forEach(function (row) {
    if (String(row[0]).trim() === '') return; // id 가 없는 빈 행은 건너뜀
    rows.push(rowToObj_(def, row, tz));
  });
  return rows;
}

function rowToObj_(def, row, tz) {
  const obj = {};
  def.headers.forEach(function (key, i) {
    obj[key] = cellValue_(def, key, row[i], tz);
  });
  return obj;
}

function cellValue_(def, key, v, tz) {
  if (def.dateCols.indexOf(key) >= 0) {
    if (Object.prototype.toString.call(v) === '[object Date]') {
      return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, tz, 'yyyy-MM-dd');
    }
    return String(v == null ? '' : v).trim().substring(0, 10);
  }
  if (key === 'amount') {
    if (typeof v === 'number') return v;
    const n = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }
  return String(v == null ? '' : v);
}

/* ---------------- 쓰기 ---------------- */

function rowCreate_(mod, data) {
  const def = MODULES[mod];
  const sh = getSheet_(mod);
  const obj = normalize_(mod, data, {});
  obj.id = newId_(mod, data.id, sh);
  writeRow_(sh, sh.getLastRow() + 1, def, obj);
  return obj;
}

function rowUpdate_(mod, data) {
  const def = MODULES[mod];
  const sh = getSheet_(mod);
  const rowNum = findRow_(sh, data.id);
  if (!rowNum) throw new Error('수정할 항목을 찾을 수 없습니다. (id: ' + data.id + ')');
  const tz = sh.getParent().getSpreadsheetTimeZone() || DEFAULT_TZ;
  const current = rowToObj_(def, sh.getRange(rowNum, 1, 1, def.headers.length).getValues()[0], tz);
  const obj = normalize_(mod, data, current); // 전달된 필드만 덮어쓰는 부분 수정
  obj.id = current.id;
  writeRow_(sh, rowNum, def, obj);
  return obj;
}

function rowDelete_(mod, data) {
  const sh = getSheet_(mod);
  const rowNum = findRow_(sh, data.id);
  if (!rowNum) throw new Error('삭제할 항목을 찾을 수 없습니다. (id: ' + data.id + ')');
  sh.deleteRow(rowNum);
  return { id: String(data.id) };
}

function findRow_(sh, id) {
  const key = String(id == null ? '' : id).trim();
  if (!key) throw new Error('id 가 필요합니다.');
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === key) return i + 2;
  }
  return 0;
}

function writeRow_(sh, rowNum, def, obj) {
  const range = sh.getRange(rowNum, 1, 1, def.headers.length);
  // amount 외에는 일반 텍스트 서식 → 날짜 자동 변환/수식 실행 방지
  range.setNumberFormats([def.headers.map(function (k) { return k === 'amount' ? '#,##0' : '@'; })]);
  range.setValues([def.headers.map(function (k) { return obj[k]; })]);
}

/** 클라이언트가 보낸 id 가 규칙에 맞고 중복이 아니면 사용하고, 아니면 새로 만든다. */
function newId_(mod, requested, sh) {
  const prefix = MODULES[mod].prefix;
  const req = String(requested == null ? '' : requested).trim();
  if (new RegExp('^' + prefix + '\\d{6,}$').test(req) && !findRow_(sh, req)) return req;
  let id;
  do {
    id = prefix + Date.now() + Math.floor(Math.random() * 100);
  } while (findRow_(sh, id));
  return id;
}

/* ---------------- 입력 검증 ---------------- */

function normalize_(mod, data, base) {
  const def = MODULES[mod];
  const out = Object.assign({}, base);
  def.headers.forEach(function (k) {
    if (k === 'id') return;
    if (data[k] !== undefined && data[k] !== null) out[k] = data[k];
  });

  out.title = String(out.title == null ? '' : out.title).trim();
  if (!out.title) throw new Error('제목(title)은 필수입니다.');
  if (out.title.length > TITLE_MAX) throw new Error('제목은 ' + TITLE_MAX + '자 이하여야 합니다.');

  out.content = String(out.content == null ? '' : out.content).trim();
  if (out.content.length > CONTENT_MAX) throw new Error('내용은 ' + CONTENT_MAX + '자 이하여야 합니다.');

  def.dateCols.forEach(function (k) {
    out[k] = String(out[k] == null ? '' : out[k]).trim();
    if (out[k] && !isValidYmd_(out[k])) throw new Error(k + ' 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
  });
  if (def.dateCols.length === 2 && out.startDate && out.endDate && out.startDate > out.endDate) {
    throw new Error('시작일은 마감일보다 늦을 수 없습니다.');
  }
  if (mod === 'projects' && !out.endDate) throw new Error('프로젝트 마감일(endDate)은 필수입니다.');

  if (mod === 'sales') {
    if (PRIORITIES.indexOf(out.priority) < 0) throw new Error('중요도(priority)는 상/중/하 중 하나여야 합니다.');
    const amt = Number(out.amount);
    if (!isFinite(amt) || amt < 0) throw new Error('예상 매출액(amount)은 0 이상의 숫자여야 합니다.');
    out.amount = Math.round(amt);
  }
  return out;
}

function isValidYmd_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
}

