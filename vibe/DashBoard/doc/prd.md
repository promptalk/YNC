# [PRD] 업무용 통합 대시보드 (Workspace Dashboard)

---

## 1. 프로젝트 개요 (Overview)
* **프로젝트명:** 단일 파일 기반 업무용 통합 대시보드
* **목적:** 개인 및 업무용 프로젝트, 영업 기회, 메모, 구글 캘린더 및 구글 태스크(Google Tasks)를 한눈에 파악하고 관리할 수 있는 가볍고 직관적인 대시보드 구축
* **주요 타겟 사용자:** Google Workspace 계정을 활용하는 직장인 / 1인 사업가
* **개발 형태:** 단일 HTML/JS 파일 (프론트엔드) + Google Apps Script & Google Sheets (백엔드/DB)

---

## 2. 목표 및 핵심 가치 (Goals & Key Value)
1. **생산성 극대화:** 파편화된 업무 지표(일정, 할 일, 영업 실적, 프로젝트 마감일)를 한 화면에서 3초 내 파악
2. **비용 및 공수 최소화:** 별도 서버 및 DB 결제 없이 Google Workspace 생태계(Sheets, Apps Script, Tasks, Calendar) 내에서 100% 무료 구현
3. **사용 편의성:** 설치나 빌드 과정 없이 `dashboard.html` 파일 단독 실행 및 다크모드 지원으로 눈의 피로도 절감

---

## 3. 시스템 아키텍처 및 기술 스택 (System Architecture)

### 3.1 기술 스택 (Tech Stack)
* **프론트엔드:** HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (CDN)
* **백엔드 (API Server):** Google Apps Script (GAS Web App)
* **데이터베이스 (DB):** Google Spreadsheet (구글 시트)
* **외부 연동:** Google Calendar (iframe Embed), Google Tasks API (GAS Advanced Service)

### 3.2 데이터 흐름 (Data Flow)
```
[사용자 브라우저 (dashboard.html)]
   │
   ├─► (1) 데이터 조회 / C·R·U·D 요청 ──► [Google Apps Script (Web App)]
   │                                              │
   │                                              ├─► [Google Spreadsheet (3개 탭)]
   │                                              └─► [Google Tasks API]
   │
   └─► (2) 실시간 일정 동기화 ─────────────────► [Google Calendar (iframe)]
```

---

## 4. 상세 기능 명세 (Detailed Requirements)

### 4.1 시스템 공통 기능
* **다크모드 (Dark Mode):**
  * 헤더 상단 토글 버튼 제공 (Light / Dark)
  * 사용자 테마 선택값을 브라우저 `localStorage`에 저장하여 재방문 시 자동 유지
  * 구글 캘린더 iframe 영역에 대한 다크모드 반전 CSS 필터 처리
* **전체 CRUD 지원:**
  * 모든 데이터 항목별 `id` (타임스탬프 기반 고유값) 생성 및 관리
  * 각 카드 및 항목별 수정(Modal/Inline) 및 삭제(Confirm 팝업) 기능 제공

### 4.2 모듈별 세부 기능 명세

| 모듈 | 주요 요구사항 | 데이터 필드 및 로직 |
| :--- | :--- | :--- |
| **1. 진행중인 프로젝트** | • 프로젝트 관리 카드 리스트<br>• 마감 D-Day 자동 계산 및 **임박순 오름차순 정렬**<br>• D-3 이내 항목 붉은색 배지 강조 | • `id`: 고유 식별자<br>• `title`: 프로젝트 제목<br>• `content`: 간단 설명<br>• `startDate`: 시작일 (`YYYY-MM-DD`)<br>• `endDate`: 마감일 (`YYYY-MM-DD`) |
| **2. 중요 메모** | • 주요 업무 지침 및 공지용 핀(Pin) 카드<br>• 적용 기간 표시 | • `id`: 고유 식별자<br>• `title`: 메모 제목<br>• `content`: 메모 내용<br>• `startDate` / `endDate`: 메모 유효 기간 |
| **3. 캘린더** | • Google Workspace 캘린더 실시간 뷰어<br>• 대시보드 내 주간/일정 뷰 제공 | • 구글 캘린더 비공개/공개 HTML 임베드 `iframe` 연결<br>• 외부 캘린더 바로가기 버튼 제공 |
| **4. 구글 태스크 (Tasks)** | • 구글 태스크 실시간 읽기/쓰기<br>• 할 일 빠른 입력 폼 (날짜, 카테고리 지정)<br>• **[구글 태스크 바로가기]** 버튼 제공 | • `id`: 태스크 ID<br>• `title`: 할 일 명칭<br>• `dueDate`: 마감일<br>• `category`: 태스크 목록(Task List) 구분<br>• `status`: 완료 여부 (체크박스 토글) |
| **5. 영업 메모** | • 영업 기회 관리 및 **총 예상매출액 자동 합산 표시**<br>• 중요도별 컬러 배지 표시 | • `id`: 고유 식별자<br>• `title`: 영업 건명<br>• `content`: 고객사/딜 상세 내용<br>• `priority`: 중요도 (`상`, `중`, `하`)<br>• `amount`: 예상 매출액 (원화 포맷팅) |

---

## 5. 데이터베이스 스키마 명세 (Google Sheets)

스프레드시트 ID: `1IJ4EqYpOI_6aj02jsyinTqEydPooS369ggHsSLMWOzU`

### 5.1 `프로젝트` 탭
| A열 (id) | B열 (title) | C열 (content) | D열 (startDate) | E열 (endDate) |
| :--- | :--- | :--- | :--- | :--- |
| `PRJ_1795241` | 충남 웰니스 관광 | 사업계획서 제출 | 2026-11-01 | 2026-11-30 |

### 5.2 `중요메모` 탭
| A열 (id) | B열 (title) | C열 (content) | D열 (startDate) | E열 (endDate) |
| :--- | :--- | :--- | :--- | :--- |
| `MEM_1795242` | 4분기 예산안 | 사업비 정산 마감 | 2026-11-15 | 2026-12-05 |

### 5.3 `영업메모` 탭
| A열 (id) | B열 (title) | C열 (content) | D열 (priority) | E열 (amount) |
| :--- | :--- | :--- | :--- | :--- |
| `SAL_1795243` | OO 지자체 컨설팅 | 2차 미팅 완료 | 상 | 15000000 |

---

## 6. 개발 단계 및 마일스톤 (Development Steps)

### Step 1: 프론트엔드 UI/UX 프로토타입 개발
* [ ] Tailwind CSS 기반 3단 그리드 반응형 레이아웃 구축
* [ ] 다크모드 토글 및 `localStorage` 저장 로직 구현
* [ ] 5개 모듈 UI 컴포넌트 제작 (D-Day 자동 정렬, 영업매출 합계 로직 포함)
* [ ] 모달 창을 통한 C·R·U·D 인터페이스 시뮬레이션 (`localStorage` 기반)

### Step 2: Google Apps Script (GAS) 백엔드 구축
* [ ] Google Sheets ID 연동 및 `LockService` 기반 동시성 제어 적용
* [ ] `doGet` (전체 데이터 불러오기) 및 `doPost` (`action`: `create`/`update`/`delete`) 구현
* [ ] Apps Script 고급 서비스 `Tasks API` 활성화 및 태스크 연동 로직 작성

### Step 3: 프론트엔드 ↔ 백엔드 통합 연동
* [ ] `dashboard.html` 내 `fetch` 통신 함수 작성 (GAS Web App URL 연동)
* [ ] 구글 캘린더 `iframe` 주소 바인딩 및 다크모드 CSS 필터링 적용
* [ ] 비동기 로딩 스피너 및 알림(Toast) UI 적용

### Step 4: 검증 및 배포
* [ ] Google Workspace 계정 권한 및 CORS 이슈 최종 점검
* [ ] 수정/삭제 및 태스크 동기화 정상 동작 테스트
* [ ] 실사용 문서 제공

---

## 7. 위험 요소 및 대응 방안 (Risk & Mitigation)

1. **Google Workspace 내부 정책에 따른 웹 앱 접근 제한**
   * *위험:* 기업 관리자 설정에 의해 GAS 배포 시 '외부 공개' 옵션이 차단될 수 있음.
   * *대응:* 배포 옵션을 '조직 내 모든 사용자'로 설정하고, 사용자가 로그인된 브라우저 상태에서 대시보드에 접근하도록 안내.
2. **구글 태스크 OAuth 인증 복잡성**
   * *위험:* 클라이언트 단에서 직접 Google API 로그인 구현 시 인증 토큰 갱신 관리 부담.
   * *대응:* Google Apps Script 내 'Google Tasks' 고급 서비스를 켜서 GAS 백엔드가 인증을 대행하는 방식을 사용.