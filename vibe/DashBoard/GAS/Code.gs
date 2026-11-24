/**
 * 웹 앱 진입점 (Workspace Dashboard API)
 *
 *  GET  ?action=list&token=...          → 전체 데이터 조회
 *  GET  ?action=ping&token=...          → 연결 확인
 *  POST (text/plain, JSON 본문)         → { action, module, data, token }
 *       action : create | update | delete
 *       module : projects | memos | sales | tasks
 *
 *  응답은 항상 JSON. 오류는 { error: '메시지' } 로 반환한다. (HTTP 200)
 *  ※ CORS preflight 회피를 위해 프론트는 Content-Type: text/plain 으로 POST 한다.
 */

function doGet(e) {
  return handle_(function () {
    const p = (e && e.parameter) || {};
    checkToken_(p.token);
    const action = p.action || 'list';
    if (action === 'list') return listAll_();
    if (action === 'ping') return { ok: true, time: new Date().toISOString() };
    throw new Error('지원하지 않는 action 입니다: ' + action);
  });
}

function doPost(e) {
  return handle_(function () {
    const req = parseBody_(e);
    checkToken_(req.token);
    return dispatch_(req);
  });
}

/* ---------------------------------------------------------------
 * 내부 처리
 * ------------------------------------------------------------- */

function handle_(fn) {
  try {
    return json_(fn());
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ error: (err && err.message) || String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) throw new Error('요청 본문이 비어 있습니다.');
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') throw new Error('invalid');
    return obj;
  } catch (err) {
    throw new Error('요청 본문이 올바른 JSON 형식이 아닙니다.');
  }
}

/** 공유 토큰 검증. 토큰이 설정되지 않았으면 모든 요청을 거부한다 (기본 안전). */
function checkToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
  if (!expected) {
    throw new Error('API 토큰이 설정되지 않았습니다. Apps Script 편집기에서 setupToken() 을 먼저 실행하세요.');
  }
  if (String(token || '') !== expected) {
    throw new Error('인증 토큰이 올바르지 않습니다.');
  }
}

/** 전체 데이터 조회. 태스크 조회 실패는 전체 실패로 보지 않고 warnings 로 알린다. */
function listAll_() {
  const result = {
    projects: readRows_('projects'),
    memos: readRows_('memos'),
    sales: readRows_('sales'),
    tasks: [],
    taskLists: [],
    warnings: []
  };
  try {
    const lists = listTaskLists_();
    result.taskLists = lists;
    result.tasks = listTasks_(lists);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    result.warnings.push('구글 태스크를 불러오지 못했습니다: ' + ((err && err.message) || err));
  }
  return result;
}

function dispatch_(req) {
  const action = req.action;
  const mod = req.module;
  const data = req.data || {};
  if (['create', 'update', 'delete'].indexOf(action) < 0) {
    throw new Error('지원하지 않는 action 입니다: ' + action);
  }
  if (mod === 'tasks') {
    return withLock_(function () {
      if (action === 'create') return { data: taskCreate_(data) };
      if (action === 'update') return { data: taskUpdate_(data) };
      return { data: taskDelete_(data) };
    });
  }
  if (!MODULES[mod]) throw new Error('지원하지 않는 module 입니다: ' + mod);
  return withLock_(function () {
    if (action === 'create') return { data: rowCreate_(mod, data) };
    if (action === 'update') return { data: rowUpdate_(mod, data) };
    return { data: rowDelete_(mod, data) };
  });
}

/** 동시 쓰기 충돌 방지 (LockService) */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    throw new Error('다른 요청을 처리 중입니다. 잠시 후 다시 시도하세요.');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------------------------------------------------
 * 최초 1회 실행용 설정 함수 (Apps Script 편집기에서 직접 실행)
 * ------------------------------------------------------------- */

/**
 * [1단계] API 토큰 생성 + 권한 승인.
 * 실행 후 '실행 로그'에 출력되는 토큰을 대시보드 설정 화면에 입력한다.
 * 이미 토큰이 있으면 새로 만들지 않는다. 교체하려면 resetToken() 을 실행한다.
 */
function setupToken() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('API_TOKEN');
  if (!token) {
    token = generateToken_();
    props.setProperty('API_TOKEN', token);
  }
  // 시트/태스크 권한 승인 팝업을 한 번에 띄우기 위해 실제로 호출해 본다.
  setupSheets();
  listTaskLists_();
  Logger.log('API 토큰: ' + token);
  return token;
}

/** 토큰 재발급. 기존 토큰은 즉시 무효화된다. */
function resetToken() {
  const token = generateToken_();
  PropertiesService.getScriptProperties().setProperty('API_TOKEN', token);
  Logger.log('새 API 토큰: ' + token);
  return token;
}

/** [2단계] 시트 탭이 없으면 생성하고 헤더를 검증한다. */
function setupSheets() {
  Object.keys(MODULES).forEach(function (mod) {
    getSheet_(mod);
  });
  Logger.log('시트 확인 완료: ' + Object.keys(MODULES).map(function (m) { return MODULES[m].sheet; }).join(', '));
}

function generateToken_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

