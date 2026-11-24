/**
 * GAS 로직 검증용 로컬 테스트 (구글 서비스는 메모리 모킹)
 * 실행: node tools/test_gas.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

/* ---------------- 모킹 ---------------- */
function makeSheet(name, ss) {
  const rows = [];
  const sh = {
    name, rows,
    getLastRow: () => rows.length,
    setFrozenRows() {},
    deleteRow: n => rows.splice(n - 1, 1),
    getParent: () => ss,
    getRange(r, c, nr = 1, nc = 1) {
      return {
        getValues: () => Array.from({ length: nr }, (_, i) =>
          Array.from({ length: nc }, (_, j) => (rows[r - 1 + i] || [])[c - 1 + j] ?? '')),
        setValues: v => v.forEach((row, i) => {
          rows[r - 1 + i] = rows[r - 1 + i] || [];
          row.forEach((x, j) => { rows[r - 1 + i][c - 1 + j] = x; });
        }),
        setNumberFormats() {}
      };
    }
  };
  return sh;
}
const sheets = {};
const ss = {
  getSheetByName: n => sheets[n] || null,
  insertSheet: n => (sheets[n] = makeSheet(n, ss)),
  getSpreadsheetTimeZone: () => 'Asia/Seoul'
};
const props = { API_TOKEN: 'secret' };

const taskLists = [{ id: 'L1', title: '내 할 일' }, { id: 'L2', title: '업무' }];
const taskStore = { L1: [], L2: [] };
let tseq = 0;
const Tasks = {
  Tasklists: {
    list: () => ({ items: taskLists }),
    get: () => taskLists[0]
  },
  Tasks: {
    list: id => ({ items: taskStore[id].map(t => ({ ...t })) }),
    get: (l, id) => ({ ...taskStore[l].find(t => t.id === id) }),
    insert(res, l) {
      const list = l === '@default' ? 'L1' : l;
      const t = { id: 'T' + (++tseq), status: 'needsAction', ...res };
      taskStore[list].push(t); return { ...t };
    },
    update(t, l, id) {
      const i = taskStore[l].findIndex(x => x.id === id);
      taskStore[l][i] = { ...t }; return { ...t };
    },
    remove(l, id) { taskStore[l] = taskStore[l].filter(t => t.id !== id); }
  }
};

const ctx = {
  console,
  Tasks,
  SpreadsheetApp: { openById: () => ss },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput: s => ({ s, setMimeType() { return this; } })
  },
  Utilities: {
    getUuid: () => 'xxxx-' + Math.random().toString(16).slice(2),
    formatDate: (d, tz, f) => d.toISOString().slice(0, 10)
  },
  Logger: { log() {} }
};
vm.createContext(ctx);
['Config.gs', 'Code.gs', 'Sheets.gs', 'Tasks.gs'].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'GAS', f), 'utf8'), ctx, { filename: f }));

const post = body => JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify({ token: 'secret', ...body }) } }).s);
const get = p => JSON.parse(vm.runInContext('doGet', ctx)({ parameter: { token: 'secret', ...p } }).s);
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('  ✓', name); };

console.log('인증');
ok('토큰 없으면 거부', () => {
  const r = JSON.parse(vm.runInContext('doGet', ctx)({ parameter: { action: 'list' } }).s);
  assert(r.error && r.error.includes('토큰'));
});
ok('토큰 불일치 거부 (POST)', () => {
  const r = JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: JSON.stringify({ token: 'x', action: 'create', module: 'sales', data: {} }) } }).s);
  assert(r.error);
});
ok('서버 토큰 미설정 시 모두 거부', () => {
  const t = props.API_TOKEN; delete props.API_TOKEN;
  assert(get({ action: 'ping' }).error); props.API_TOKEN = t;
});
ok('잘못된 JSON 본문', () => {
  const r = JSON.parse(vm.runInContext('doPost', ctx)({ postData: { contents: '{bad' } }).s);
  assert(r.error.includes('JSON'));
});

console.log('시트 CRUD');
let prj;
ok('빈 목록 조회 + 탭 자동 생성', () => {
  const r = get({ action: 'list' });
  assert.deepStrictEqual(r.projects, []);
  assert(sheets['프로젝트'] && sheets['중요메모'] && sheets['영업메모']);
  assert.deepStrictEqual(sheets['영업메모'].rows[0], ['id', 'title', 'content', 'priority', 'amount']);
  assert.strictEqual(r.tasks.length, 0);
});
ok('프로젝트 생성 (클라이언트 id 사용)', () => {
  const r = post({ action: 'create', module: 'projects', data: { id: 'PRJ_1795301', title: ' 웹 리뉴얼 ', content: '시안', startDate: '2026-11-01', endDate: '2026-11-30' } });
  prj = r.data; assert.strictEqual(prj.id, 'PRJ_1795301'); assert.strictEqual(prj.title, '웹 리뉴얼');
});
ok('잘못된 id 는 서버가 새로 발급', () => {
  const r = post({ action: 'create', module: 'memos', data: { id: '=HYPERLINK()', title: 'm', content: 'c' } });
  assert(/^MEM_\d{6,}$/.test(r.data.id));
});
ok('중복 id 는 재발급', () => {
  const r = post({ action: 'create', module: 'projects', data: { id: 'PRJ_1795301', title: 'dup', endDate: '2026-12-01' } });
  assert.notStrictEqual(r.data.id, 'PRJ_1795301');
});
ok('조회: 시트의 Date 객체도 YYYY-MM-DD 로 변환', () => {
  sheets['프로젝트'].rows.push(['PRJ_9999999', 'dateobj', '', new Date('2026-05-06T00:00:00Z'), '2026-06-01']);
  const p = get({ action: 'list' }).projects.find(x => x.id === 'PRJ_9999999');
  assert.strictEqual(p.startDate, '2026-05-06');
});
ok('빈 행(id 없음)은 무시', () => {
  sheets['프로젝트'].rows.push(['', '', '', '', '']);
  assert(!get({ action: 'list' }).projects.some(x => x.id === ''));
});
ok('부분 수정 (전달 필드만 변경)', () => {
  const r = post({ action: 'update', module: 'projects', data: { id: prj.id, content: '최종' } });
  assert.strictEqual(r.data.content, '최종'); assert.strictEqual(r.data.endDate, '2026-11-30'); assert.strictEqual(r.data.title, '웹 리뉴얼');
});
ok('없는 id 수정/삭제는 오류', () => {
  assert(post({ action: 'update', module: 'projects', data: { id: 'PRJ_0000000', title: 'x' } }).error);
  assert(post({ action: 'delete', module: 'projects', data: { id: 'PRJ_0000000' } }).error);
});
ok('삭제', () => {
  const before = sheets['프로젝트'].rows.length;
  const r = post({ action: 'delete', module: 'projects', data: { id: prj.id } });
  assert.strictEqual(r.data.id, prj.id); assert.strictEqual(sheets['프로젝트'].rows.length, before - 1);
});

console.log('입력 검증');
ok('제목 필수', () => assert(post({ action: 'create', module: 'memos', data: { title: '  ' } }).error));
ok('날짜 형식/존재 여부', () => {
  assert(post({ action: 'create', module: 'projects', data: { title: 'a', endDate: '2026-13-40' } }).error);
  assert(post({ action: 'create', module: 'projects', data: { title: 'a', endDate: '26-1-1' } }).error);
});
ok('시작일 > 마감일 거부', () => assert(post({ action: 'create', module: 'projects', data: { title: 'a', startDate: '2026-12-01', endDate: '2026-11-01' } }).error));
ok('프로젝트 마감일 필수', () => assert(post({ action: 'create', module: 'projects', data: { title: 'a' } }).error));
ok('영업: 중요도/금액 검증', () => {
  assert(post({ action: 'create', module: 'sales', data: { title: 's', priority: '최상', amount: 1 } }).error);
  assert(post({ action: 'create', module: 'sales', data: { title: 's', priority: '상', amount: -5 } }).error);
  assert(post({ action: 'create', module: 'sales', data: { title: 's', priority: '상', amount: 'abc' } }).error);
});
ok('영업 생성: 금액 숫자 저장 + 합계 가능', () => {
  const r = post({ action: 'create', module: 'sales', data: { title: 's', priority: '상', amount: '15000000' } });
  assert.strictEqual(r.data.amount, 15000000);
  const list = get({ action: 'list' }).sales;
  assert.strictEqual(list.reduce((s, x) => s + x.amount, 0), 15000000);
});
ok('알 수 없는 action/module', () => {
  assert(post({ action: 'drop', module: 'sales', data: {} }).error);
  assert(post({ action: 'create', module: 'nope', data: {} }).error);
});
ok('헤더 불일치 시 명확한 오류', () => {
  const bad = sheets['영업메모'].rows[0]; sheets['영업메모'].rows[0] = ['a', 'b', 'c', 'd', 'e'];
  assert(get({ action: 'list' }).error.includes('헤더')); sheets['영업메모'].rows[0] = bad;
});

console.log('구글 태스크');
let t1;
ok('생성: 복합 id, category=목록 id', () => {
  const r = post({ action: 'create', module: 'tasks', data: { title: '보고서', dueDate: '2026-11-25', category: 'L2' } });
  t1 = r.data; assert.strictEqual(t1.id, 'L2~T1'); assert.strictEqual(t1.category, 'L2'); assert.strictEqual(t1.dueDate, '2026-11-25');
});
ok('카테고리 미지정 시 기본 목록', () => {
  const r = post({ action: 'create', module: 'tasks', data: { title: '기본' } });
  assert.strictEqual(r.data.category, 'L1'); assert.strictEqual(r.data.dueDate, '');
});
ok('목록 조회에 태스크/목록 포함', () => {
  const r = get({ action: 'list' }); assert.strictEqual(r.tasks.length, 2); assert.strictEqual(r.taskLists.length, 2);
});
ok('완료 토글 → 미완료 복귀 시 completed 제거', () => {
  assert.strictEqual(post({ action: 'update', module: 'tasks', data: { id: t1.id, status: 'completed' } }).data.status, 'completed');
  taskStore.L2[0].completed = '2026-11-21T00:00:00Z';
  const r = post({ action: 'update', module: 'tasks', data: { id: t1.id, status: 'needsAction' } });
  assert.strictEqual(r.data.status, 'needsAction'); assert.strictEqual(taskStore.L2[0].completed, undefined);
});
ok('마감일 제거', () => {
  const r = post({ action: 'update', module: 'tasks', data: { id: t1.id, dueDate: '' } });
  assert.strictEqual(r.data.dueDate, ''); assert.strictEqual(taskStore.L2[0].due, undefined);
});
ok('목록 이동 시 새 id 반환 + 기존 삭제', () => {
  const r = post({ action: 'update', module: 'tasks', data: { id: t1.id, category: 'L1' } });
  assert(r.data.id.startsWith('L1~')); assert.strictEqual(taskStore.L2.length, 0);
  t1 = r.data;
});
ok('잘못된 태스크 id / status', () => {
  assert(post({ action: 'update', module: 'tasks', data: { id: 'bad', status: 'completed' } }).error);
  assert(post({ action: 'update', module: 'tasks', data: { id: t1.id, status: 'zzz' } }).error);
});
ok('삭제', () => {
  post({ action: 'delete', module: 'tasks', data: { id: t1.id } });
  assert(!taskStore.L1.some(t => 'L1~' + t.id === t1.id));
});
ok('태스크 API 장애 시 나머지 데이터는 유지 + warnings', () => {
  const orig = Tasks.Tasklists.list; Tasks.Tasklists.list = () => { throw new Error('API disabled'); };
  const r = get({ action: 'list' });
  assert(Array.isArray(r.projects) && r.warnings.length === 1 && r.tasks.length === 0);
  Tasks.Tasklists.list = orig;
});

console.log(`\n${n}개 테스트 통과`);


