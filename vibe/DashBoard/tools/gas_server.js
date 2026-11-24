/**
 * 실제 GAS/*.gs 코드를 로컬 HTTP 서버로 구동 (구글 서비스는 메모리 모킹)
 * - GET  /exec?action=list&token=...  → doGet
 * - POST /exec (text/plain JSON)      → doPost
 * - 실제 GAS 웹 앱처럼 모든 응답에 Access-Control-Allow-Origin: * 를 붙이고,
 *   OPTIONS(preflight)는 처리하지 않는다. (브라우저가 preflight 를 보내면 실패해야 정상)
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const vm = require('vm');

function createRuntime(token) {
  const sheets = {};
  const ss = {
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => (sheets[n] = makeSheet(n)),
    getSpreadsheetTimeZone: () => 'Asia/Seoul'
  };
  function makeSheet(name) {
    const rows = [];
    return {
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
  }

  const props = { API_TOKEN: token };
  const taskLists = [{ id: 'L1', title: '내 할 일' }, { id: 'L2', title: '업무' }];
  const taskStore = { L1: [], L2: [] };
  let seq = 0;
  const Tasks = {
    Tasklists: { list: () => ({ items: taskLists }), get: () => taskLists[0] },
    Tasks: {
      list: id => ({ items: taskStore[id].map(t => ({ ...t })) }),
      get: (l, id) => ({ ...taskStore[l].find(t => t.id === id) }),
      insert(res, l) {
        const list = l === '@default' ? 'L1' : l;
        const t = { id: 'T' + (++seq), status: 'needsAction', ...res };
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
    console: { log() {}, error() {} },
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
      formatDate: d => d.toISOString().slice(0, 10)
    },
    Logger: { log() {} }
  };
  vm.createContext(ctx);
  ['Config.gs', 'Code.gs', 'Sheets.gs', 'Tasks.gs'].forEach(f =>
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'GAS', f), 'utf8'), ctx, { filename: f }));
  return { ctx, sheets, taskStore, props };
}

function startServer(runtime, port, opts = {}) {
  const log = [];
  const delay = opts.delay || 0;
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };
    log.push(req.method + ' ' + u.pathname + u.search.replace(/token=[^&]*/, 'token=***'));
    if (req.method === 'OPTIONS') { res.writeHead(405); res.end(); return; } // GAS 는 preflight 미지원
    if (opts.down) { res.writeHead(500, headers); res.end('boom'); return; }
    const done = out => setTimeout(() => { res.writeHead(200, headers); res.end(out.s); }, delay);
    if (req.method === 'GET') {
      const parameter = Object.fromEntries(u.searchParams.entries());
      return done(runtime.ctx.doGet({ parameter }));
    }
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => done(runtime.ctx.doPost({ postData: { contents: body } })));
  });
  return new Promise(r => server.listen(port, () => r({ server, log })));
}

module.exports = { createRuntime, startServer };
