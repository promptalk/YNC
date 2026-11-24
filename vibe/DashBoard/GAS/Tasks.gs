/**
 * Google Tasks 연동 (Apps Script 고급 서비스 'Tasks' 필요)
 *
 * - 태스크 id 는 '목록id~태스크id' 형태의 복합 id 로 프론트에 전달한다.
 *   (Tasks API 는 목록 id 없이 개별 태스크를 수정/삭제할 수 없기 때문)
 * - category 는 Task List(목록) id 에 대응한다.
 * - status: 'needsAction'(미완료) | 'completed'(완료)
 * - 수정은 get → 변경 → update(전체 교체) 방식이라 due/completed 해제가 확실하다.
 */

const TASK_ID_SEP = '~';

function listTaskLists_() {
  const out = [];
  let pageToken;
  do {
    const res = Tasks.Tasklists.list({ maxResults: 100, pageToken: pageToken });
    (res.items || []).forEach(function (l) { out.push({ id: l.id, title: l.title }); });
    pageToken = res.nextPageToken;
  } while (pageToken);
  return out;
}

function listTasks_(lists) {
  const out = [];
  lists.forEach(function (list) {
    let pageToken;
    let pages = 0;
    do {
      const res = Tasks.Tasks.list(list.id, {
        maxResults: 100,
        showCompleted: true,
        showHidden: true, // 다른 앱에서 완료 처리된 태스크도 포함
        pageToken: pageToken
      });
      (res.items || []).forEach(function (t) {
        if (t.deleted) return;
        out.push(taskToObj_(list.id, t));
      });
      pageToken = res.nextPageToken;
      pages++;
    } while (pageToken && pages < MAX_TASK_PAGES);
  });
  return out;
}

function taskToObj_(listId, t) {
  return {
    id: listId + TASK_ID_SEP + t.id,
    title: t.title || '',
    dueDate: t.due ? String(t.due).substring(0, 10) : '',
    category: listId,
    status: t.status === 'completed' ? 'completed' : 'needsAction'
  };
}

function splitTaskId_(id) {
  const s = String(id == null ? '' : id);
  const i = s.indexOf(TASK_ID_SEP);
  if (i <= 0 || i === s.length - 1) throw new Error('태스크 id 형식이 올바르지 않습니다. 새로고침 후 다시 시도하세요.');
  return { listId: s.substring(0, i), taskId: s.substring(i + 1) };
}

function cleanTaskTitle_(v) {
  const title = String(v == null ? '' : v).trim();
  if (!title) throw new Error('할 일(title)은 필수입니다.');
  if (title.length > 1024) throw new Error('할 일 제목이 너무 깁니다.');
  return title;
}

function cleanTaskDue_(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  if (!isValidYmd_(s)) throw new Error('마감일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
  return s;
}

/** Tasks API 의 due 는 RFC3339 이며 날짜 부분만 사용된다. */
function dueToRfc3339_(ymd) {
  return ymd + 'T00:00:00.000Z';
}

function taskCreate_(data) {
  const listId = String(data.category || '').trim() || '@default';
  const resource = { title: cleanTaskTitle_(data.title) };
  const due = cleanTaskDue_(data.dueDate);
  if (due) resource.due = dueToRfc3339_(due);
  const created = Tasks.Tasks.insert(resource, listId);
  // '@default' 로 만든 경우 실제 목록 id 를 알 수 없어 기본 목록 id 를 조회한다.
  const realListId = listId === '@default' ? Tasks.Tasklists.get('@default').id : listId;
  return taskToObj_(realListId, created);
}

function taskUpdate_(data) {
  const ids = splitTaskId_(data.id);
  const t = Tasks.Tasks.get(ids.listId, ids.taskId);

  if (data.title !== undefined && data.title !== null) t.title = cleanTaskTitle_(data.title);
  if (data.dueDate !== undefined && data.dueDate !== null) {
    const due = cleanTaskDue_(data.dueDate);
    if (due) t.due = dueToRfc3339_(due);
    else delete t.due;
  }
  if (data.status !== undefined && data.status !== null) {
    if (data.status === 'completed') {
      t.status = 'completed';
    } else if (data.status === 'needsAction') {
      t.status = 'needsAction';
      delete t.completed; // 미완료로 되돌릴 때 완료 시각 제거
    } else {
      throw new Error('status 값이 올바르지 않습니다.');
    }
  }

  const newList = String(data.category || '').trim();
  if (newList && newList !== ids.listId) {
    // 목록 이동: 새 목록에 생성 후 기존 태스크 삭제
    const moved = {
      title: t.title,
      notes: t.notes,
      status: t.status
    };
    if (t.due) moved.due = t.due;
    if (t.status === 'completed' && t.completed) moved.completed = t.completed;
    const created = Tasks.Tasks.insert(moved, newList);
    Tasks.Tasks.remove(ids.listId, ids.taskId);
    return taskToObj_(newList, created);
  }

  const updated = Tasks.Tasks.update(t, ids.listId, ids.taskId);
  return taskToObj_(ids.listId, updated);
}

function taskDelete_(data) {
  const ids = splitTaskId_(data.id);
  Tasks.Tasks.remove(ids.listId, ids.taskId);
  return { id: String(data.id) };
}
