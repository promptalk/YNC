/**
 * 공통 설정 / 스키마 정의
 * - 시트 스키마는 doc/prd.md 5절과 동일하다. (열 순서 고정: A~E)
 * - 스프레드시트 ID는 스크립트 속성 'SHEET_ID' 로 덮어쓸 수 있다.
 */
const DEFAULT_SHEET_ID = '1IJ4EqYpOI_6aj02jsyinTqEydPooS369ggHsSLMWOzU';
const DEFAULT_TZ = 'Asia/Seoul';
const PRIORITIES = ['상', '중', '하'];

/** 모듈(= 프론트엔드의 module 값) → 시트 탭 정의 */
const MODULES = {
  projects: {
    sheet: '프로젝트',
    prefix: 'PRJ_',
    headers: ['id', 'title', 'content', 'startDate', 'endDate'],
    dateCols: ['startDate', 'endDate']
  },
  memos: {
    sheet: '중요메모',
    prefix: 'MEM_',
    headers: ['id', 'title', 'content', 'startDate', 'endDate'],
    dateCols: ['startDate', 'endDate']
  },
  sales: {
    sheet: '영업메모',
    prefix: 'SAL_',
    headers: ['id', 'title', 'content', 'priority', 'amount'],
    dateCols: []
  }
};

/** 태스크 조회 시 목록당 최대 페이지 수 (페이지당 100건) */
const MAX_TASK_PAGES = 5;
/** 요청 처리 시 락 대기 시간(ms) */
const LOCK_WAIT_MS = 30000;
