/**
 * ============================================================================
 * [설정 영역] 유지보수 시 아래 CONFIG 객체의 값만 수정하면 됩니다.
 * ============================================================================
 */
const CONFIG = {
  // 연결할 구글 스프레드시트 고유 ID
  SPREADSHEET_ID: '연결할 구글 스프레드시트 고유 ID',
  
  // 구글 스프레드시트 탭 이름 (시트 하단 탭 이름과 정확히 일치해야 함)
  SHEETS: {
    ALL: '전체접수',
    MORNING: '오전반',
    AFTERNOON: '오후반'
  },
  
  // 시트 첫 행 헤더 (시트가 비어있을 경우 자동 생성용)
  HEADERS: ['접수일시', '이름', '전화번호', '이메일', '신청이유', '희망반'],
  
  // 한국 표준시 및 날짜 포맷
  TIMEZONE: 'Asia/Seoul',
  DATE_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  
  // 웹 앱 브라우저 탭 타이틀
  PAGE_TITLE: '독서모임 참가 신청',
  
  // 이메일 제목 템플릿 ({name}, {classType}이 실제 값으로 치환됨)
  EMAIL_SUBJECT_TEMPLATE: '[독서모임] {name}님, {classType} 신청이 정상 접수되었습니다.'
};

/**
 * [FR-06] 웹 앱 URL 접속 시 요청 형태에 따라 분기 처리합니다.
 * 1) 외부 index.html에서 JSONP(callback + payload)로 호출한 경우 -> 데이터 저장 및 JS 응답 반환
 * 2) 웹 앱 URL로 직접 접속한 경우 -> 내장 index.html 화면 렌더링
 */
function doGet(e) {
  // 1. 외부 HTML(로컬 file:// 또는 외부 서버)에서 JSONP 방식으로 데이터를 보낸 경우
  if (e && e.parameter && e.parameter.callback && e.parameter.payload) {
    try {
      const formData = JSON.parse(e.parameter.payload);
      const result = submitApplication(formData);
      const jsResponse = `${e.parameter.callback}(${JSON.stringify(result)});`;
      
      return ContentService.createTextOutput(jsResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } catch (error) {
      Logger.log('[doGet JSONP 오류] ' + error.message);
      const errResponse = `${e.parameter.callback}(${JSON.stringify({
        success: false,
        message: '요청 처리 중 오류가 발생했습니다: ' + error.message
      })});`;
      
      return ContentService.createTextOutput(errResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
  }

  // 2. 일반 브라우저에서 웹 앱 URL로 직접 접속한 경우 (내장 index.html이 있을 때)
  try {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle(CONFIG.PAGE_TITLE)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // GAS 프로젝트 내에 index.html 파일이 없는 경우 안내 메시지 출력
    return ContentService.createTextOutput('독서모임 신청 API 서버가 정상 작동 중입니다.')
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * [백업 엔드포인트] 외부에서 fetch(POST) 방식으로 JSON 데이터를 보낼 경우 처리합니다.
 */
function doPost(e) {
  try {
    const rawBody = e && e.postData ? e.postData.contents : '{}';
    const formData = JSON.parse(rawBody);
    const result = submitApplication(formData);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('[doPost 오류] ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: '요청 데이터 처리 오류: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * [FR-07 & FR-08] 프론트엔드 폼 데이터를 받아 시트 기록 및 확인 메일을 발송합니다.
 * @param {Object} formData - { name, phone, email, reason, classType }
 * @return {Object} { success: boolean, message: string }
 */
function submitApplication(formData) {
  try {
    // 1. 필수 입력값 서버 측 1차 검증
    if (!formData || !formData.name || !formData.phone || !formData.email || !formData.reason || !formData.classType) {
      throw new Error('필수 입력 항목이 누락되었습니다.');
    }

    // 2. 한국 표준시(Asia/Seoul) 기준 접수일시 생성
    const now = new Date();
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);

    // 3. 시트에 기록할 1개 행 데이터 배열 구성 (A열 ~ F열 순서)
    const rowData = [
      timestamp,                // A열: 접수일시
      formData.name.trim(),     // B열: 이름
      formData.phone.trim(),    // C열: 전화번호
      formData.email.trim(),    // D열: 이메일
      formData.reason.trim(),   // E열: 신청이유
      formData.classType.trim() // F열: 희망반 ('오전반' 또는 '오후반')
    ];

    // 4. 지정된 ID의 구글 스프레드시트 열기
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // 4-1. '전체접수' 시트에 원본 행 추가
    appendRowToSheet(ss, CONFIG.SHEETS.ALL, rowData);

    // 4-2. 희망반 조건 분기 후 해당 반 시트에 행 추가
    if (formData.classType === CONFIG.SHEETS.MORNING) {
      appendRowToSheet(ss, CONFIG.SHEETS.MORNING, rowData);
    } else if (formData.classType === CONFIG.SHEETS.AFTERNOON) {
      appendRowToSheet(ss, CONFIG.SHEETS.AFTERNOON, rowData);
    } else {
      throw new Error('올바르지 않은 희망반 선택입니다: ' + formData.classType);
    }

    // 5. 신청자에게 접수 완료 확인 이메일 발송
    sendConfirmationEmail(formData, timestamp);

    // 6. 성공 응답 반환
    return {
      success: true,
      message: '신청이 정상적으로 완료되었습니다.'
    };

  } catch (error) {
    // 에러 로그 기록 및 프론트엔드 전달용 표준 객체 반환
    Logger.log('[submitApplication 오류] ' + error.message);
    return {
      success: false,
      message: '처리 중 오류가 발생했습니다: ' + error.message
    };
  }
}

/**
 * [헬퍼 함수] 지정한 이름의 시트를 찾아 마지막 행에 데이터를 추가합니다.
 * 시트가 없거나 비어있으면 자동으로 시트/헤더를 생성해 오류를 방지합니다.
 */
function appendRowToSheet(ss, sheetName, rowData) {
  let sheet = ss.getSheetByName(sheetName);
  
  // 만약 해당 이름의 탭이 없다면 자동 생성
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // 시트가 완전히 비어있다면 1행에 헤더 자동 삽입
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(CONFIG.HEADERS);
  }

  // 데이터 행 추가 (전화번호 앞자리 '0'이 잘리지 않도록 텍스트 서식 보완)
  sheet.appendRow(rowData);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 3).setNumberFormat('@'); // C열(전화번호) 텍스트 서식 지정
}

/**
 * [헬퍼 함수] GmailApp을 통해 신청자에게 확인 메일을 발송합니다.
 */
function sendConfirmationEmail(formData, timestamp) {
  const subject = CONFIG.EMAIL_SUBJECT_TEMPLATE
    .replace('{name}', formData.name)
    .replace('{classType}', formData.classType);

  const body = 
`${formData.name}님, 안녕하세요!
독서모임 참가 신청이 정상적으로 접수되었습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 신청 내역 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 접수일시 : ${timestamp}
• 성함     : ${formData.name}
• 희망반   : ${formData.classType}
• 연락처   : ${formData.phone}
• 신청이유 :
${formData.reason}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

모임 일정 및 상세 안내는 추후 문자로 별도 안내해 드리겠습니다.
감사합니다.`;

  GmailApp.sendEmail(formData.email, subject, body);
}

/**
 * [FR-09] 수동 테스트 함수
 * 웹 배포 전 Apps Script 상단 실행 버튼으로 권한 승인 및 동작을 검증할 때 사용합니다.
 */
function testSubmit() {
  const sampleData = {
    name: '홍길동',
    phone: '010-1234-5678',
    email: Session.getActiveUser().getEmail() || 'test@example.com',
    reason: '함께 책을 읽고 다양한 시각을 나누고 싶어 신청합니다.',
    classType: '오전반'
  };

  const result = submitApplication(sampleData);
  Logger.log('테스트 실행 결과: ' + JSON.stringify(result));
}