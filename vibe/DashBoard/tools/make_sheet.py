#!/usr/bin/env python3
"""구글 스프레드시트 업로드용 엑셀 파일 생성 스크립트.

PRD 5절 스키마(프로젝트 / 중요메모 / 영업메모 3개 탭)를 그대로 생성한다.
실행: python3 tools/make_sheet.py  ->  dashboard_data.xlsx 생성
"""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = Path(__file__).resolve().parent.parent / "dashboard_data.xlsx"

HEADER_FILL = PatternFill("solid", fgColor="4F46E5")
HEADER_FONT = Font(bold=True, color="FFFFFF", name="Malgun Gothic")
BODY_FONT = Font(name="Malgun Gothic")
THIN = Side(style="thin", color="D1D5DB")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

# 탭별 정의: (탭 이름, 헤더(JSON 키와 동일), 열 너비, 샘플 데이터)
SHEETS = [
    {
        "name": "프로젝트",
        "headers": ["id", "title", "content", "startDate", "endDate"],
        "widths": [18, 28, 40, 14, 14],
        "text_cols": ["D", "E"],  # 날짜: Date 자동 변환 방지를 위해 텍스트 서식
        "rows": [
            ["PRJ_1795241", "충남 웰니스 관광", "사업계획서 제출", "2026-11-01", "2026-11-30"],
        ],
    },
    {
        "name": "중요메모",
        "headers": ["id", "title", "content", "startDate", "endDate"],
        "widths": [18, 28, 40, 14, 14],
        "text_cols": ["D", "E"],
        "rows": [
            ["MEM_1795242", "4분기 예산안", "사업비 정산 마감", "2026-11-15", "2026-12-05"],
        ],
    },
    {
        "name": "영업메모",
        "headers": ["id", "title", "content", "priority", "amount"],
        "widths": [18, 28, 40, 10, 16],
        "text_cols": [],
        "rows": [
            ["SAL_1795243", "OO 지자체 컨설팅", "2차 미팅 완료", "상", 15000000],
        ],
    },
]

# 데이터 입력 가능 영역(서식을 미리 적용할 행 수)
FORMAT_ROWS = 500


def build_sheet(ws, spec):
    ws.append(spec["headers"])
    for row in spec["rows"]:
        ws.append(row)

    # 헤더 스타일 + 틀 고정
    for cell in ws[1]:
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = BORDER
    ws.row_dimensions[1].height = 24
    ws.freeze_panes = "A2"

    # 열 너비
    for idx, width in enumerate(spec["widths"]):
        ws.column_dimensions[chr(ord("A") + idx)].width = width

    # 날짜 열은 텍스트 서식으로 지정 (미리 FORMAT_ROWS 행까지 적용)
    for col in spec["text_cols"]:
        for r in range(2, FORMAT_ROWS + 2):
            ws[f"{col}{r}"].number_format = "@"

    # 본문 폰트/테두리 (샘플 행)
    for row in ws.iter_rows(min_row=2, max_row=1 + len(spec["rows"])):
        for cell in row:
            cell.font = BODY_FONT
            cell.border = BORDER
            cell.alignment = Alignment(vertical="center", wrap_text=True)


def main():
    wb = Workbook()
    wb.remove(wb.active)

    for spec in SHEETS:
        ws = wb.create_sheet(spec["name"])
        build_sheet(ws, spec)

    # 영업메모: 중요도 드롭다운(상/중/하), 금액 숫자 서식
    sales = wb["영업메모"]
    dv = DataValidation(type="list", formula1='"상,중,하"', allow_blank=True,
                        showErrorMessage=True, errorTitle="입력 오류",
                        error="상, 중, 하 중에서 선택하세요.")
    sales.add_data_validation(dv)
    dv.add(f"D2:D{FORMAT_ROWS + 1}")
    for r in range(2, FORMAT_ROWS + 2):
        sales[f"E{r}"].number_format = "#,##0"
        sales[f"D{r}"].alignment = Alignment(horizontal="center", vertical="center")

    wb.save(OUT)
    print(f"생성 완료: {OUT}")


if __name__ == "__main__":
    main()
