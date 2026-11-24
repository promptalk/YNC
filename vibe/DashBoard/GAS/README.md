# GAS 백엔드 설치·배포 가이드

대시보드(`dashboard.html`)와 구글 스프레드시트·구글 태스크를 연결하는 Google Apps Script 웹 앱입니다.

## 파일 구성

| 파일 | 역할 |
| :--- | :--- |
| `Config.gs` | 시트 ID, 탭/열 스키마(PRD 5절), 상수 |
| `Code.gs` | `doGet` / `doPost` 진입점, 토큰 인증, `LockService`, 최초 설정 함수 |
| `Sheets.gs` | 프로젝트·중요메모·영업메모 시트 CRUD 및 입력 검증 |
| `Tasks.gs` | Google Tasks 고급 서비스 연동 |
| `appsscript.json` | Tasks 고급 서비스, OAuth 권한, 웹 앱 설정 |

## 설치 순서

1. **스프레드시트 준비**
   - `../dashboard_data.xlsx`를 Drive에 올려 *Google Sheets로 저장*하거나, 기존 시트(`1IJ4EqYpOI_6aj02jsyinTqEydPooS369ggHsSLMWOzU`)에 `프로젝트` / `중요메모` / `영업메모` 탭을 만듭니다.
   - 시트 ID를 바꿨다면 `Config.gs`의 `DEFAULT_SHEET_ID`를 수정하거나, 프로젝트 설정 → 스크립트 속성에 `SHEET_ID`를 추가합니다.
   - 탭이 없으면 `setupSheets()`가 헤더와 함께 자동으로 만듭니다.
2. **Apps Script 프로젝트 생성**
   - 스프레드시트의 *확장 프로그램 → Apps Script*(또는 script.google.com에서 새 프로젝트)로 엽니다.
   - 이 폴더의 `.gs` 파일 4개를 같은 이름으로 만들어 붙여넣습니다.
   - *프로젝트 설정 → "appsscript.json" 매니페스트 파일 표시*를 켜고 `appsscript.json` 내용을 덮어씁니다. (고급 서비스 Tasks가 함께 활성화됩니다.)
   - 또는 편집기 좌측 *서비스 +* → **Google Tasks API** → 추가로 직접 켤 수도 있습니다.
3. **권한 승인 + 토큰 발급**
   - 함수 선택 드롭다운에서 `setupToken` → *실행* → 권한 승인(시트, 태스크)
   - *실행 로그*에 출력된 **API 토큰**을 복사합니다.
4. **웹 앱 배포**
   - *배포 → 새 배포 → 유형: 웹 앱*
   - 실행 사용자: **나**, 액세스 권한: **모든 사용자**
   - 배포 후 `https://script.google.com/macros/s/.../exec` URL을 복사합니다.
5. **대시보드 연결**
   - `dashboard.html` → 헤더 **⚙️ 설정**에 *GAS Web App URL*과 *API 토큰*을 입력하고 저장합니다.
   - 헤더 배지가 `☁️ Google 연동`으로 바뀌면 성공입니다.

> 코드를 수정한 뒤에는 **배포 관리 → 수정 → 새 버전**으로 다시 배포해야 반영됩니다. (URL은 유지됩니다.)

## API 규약

모든 응답은 JSON이며 오류는 HTTP 200과 함께 `{ "error": "메시지" }`로 돌아옵니다.

```
GET  <exec URL>?action=list&token=TOKEN
  → { projects, memos, sales, tasks, taskLists, warnings }

POST <exec URL>   (Content-Type: text/plain, 본문은 JSON 문자열)
  { token, action: 'create'|'update'|'delete', module: 'projects'|'memos'|'sales'|'tasks', data: {...} }
  → { data: {...} }
```

- `update`는 전달한 필드만 바꿉니다. (예: 태스크 체크 토글은 `{ id, status }`만 전송)
- `tasks`의 `id`는 `목록id~태스크id` 형식이며, `category`는 Task List id입니다.
  태스크를 다른 목록으로 옮기면 id가 바뀌어 새 id가 응답으로 돌아옵니다.
- 태스크 조회에 실패해도 시트 데이터는 정상 반환하고 `warnings`에 사유를 담습니다.

## 보안 안내

- 웹 앱을 *모든 사용자*로 배포하면 URL을 아는 누구나 요청할 수 있으므로, **API 토큰이 없으면 모든 요청을 거부**하도록 만들었습니다. 토큰이 설정되지 않은 상태에서도 거부됩니다.
- 토큰은 스크립트 속성에 저장되며 코드에 포함되지 않습니다. 유출이 의심되면 `resetToken()`을 실행해 교체하고 대시보드 설정에도 새 토큰을 입력하세요.
- 토큰은 대시보드를 연 브라우저의 `localStorage`에 저장됩니다. 공용 PC에서는 사용하지 마세요.
- 웹 앱은 **배포한 사용자 권한**으로 실행되므로, 토큰을 아는 사람은 그 계정의 해당 시트와 태스크를 읽고 쓸 수 있습니다. 토큰을 공유하지 마세요.
- 기업 정책으로 *모든 사용자* 배포가 막혀 있으면 *조직 내 모든 사용자*로 배포하세요. 이 경우 브라우저가 구글 계정에 로그인되어 있어야 하며, `file://`로 연 HTML은 인증 쿠키 문제로 호출이 실패할 수 있습니다.

## 동작 메모

- 쓰기 요청은 `LockService`로 직렬화되어 동시 수정 충돌을 막습니다. (대기 최대 30초)
- 날짜는 `YYYY-MM-DD` 문자열로 저장·반환하며, 시트의 날짜 서식(Date 객체)도 같은 형식으로 변환해 읽습니다.
- 제목·내용 칸은 일반 텍스트 서식으로 저장해 `=`로 시작하는 입력이 수식으로 실행되지 않습니다.
- 서버가 알려주는 id 규칙(`PRJ_`/`MEM_`/`SAL_` + 숫자)에 맞지 않거나 중복된 id는 서버가 새로 발급합니다.
- 시트의 헤더(1행)는 `Config.gs`의 스키마와 정확히 같아야 합니다. 다르면 명확한 오류로 알려줍니다.

## 로컬 검증

구글 서비스를 메모리로 모킹한 테스트로 인증, CRUD, 검증, 태스크 동작을 확인할 수 있습니다.

```bash
node tools/test_gas.js
```

실제 구글 서비스와의 통신은 이 테스트로 확인할 수 없으므로, 배포 후 대시보드에서 직접 확인해야 합니다.
