# -*- coding: utf-8 -*-
"""화면 시안 HTML 생성기. 실제 src/index.css 를 그대로 써서 색·글꼴·간격을 맞춘다."""
import pathlib, html

OUT = pathlib.Path("/Users/pyoe/Desktop/이은표/project/lost-found/docs/ui")
OUT.mkdir(parents=True, exist_ok=True)

MOCK_CSS = """
html, body { height: 100%; }
.app { display: flex; min-height: 100%; }
/* 왼쪽 메뉴 (메인 컬러를 어둡게 쓴 색) */
.side { flex: 0 0 220px; background: #004567; color: #fff; padding: 22px 0 0; }
.brand { padding: 0 22px 20px; border-bottom: 1px solid rgba(255,255,255,.16); }
.brand b { display: block; font-size: 17px; font-weight: 600; }
.brand span { display: block; margin-top: 4px; font-size: 13px; color: #a9c6d8; }
.nav { padding-top: 14px; }
.nav div { display: flex; align-items: center; gap: 10px; padding: 13px 22px; font-size: 15px; color: #cfe0ea; }
.nav div.on { background: #006eaa; color: #fff; font-weight: 600; }
.nav i { display: inline-block; width: 16px; height: 16px; border-radius: 4px; background: currentColor; opacity: .75; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.top { display: flex; align-items: center; justify-content: flex-end; gap: 14px;
       height: 62px; padding: 0 28px; background: #fff; border-bottom: 1px solid var(--sub-gray); }
.who { font-size: 14px; color: var(--text-sub); }
.content { flex: 1; padding: 26px 28px 36px; }
.content .page-title { margin-top: 0; }
.content .page-header { align-items: center; margin-bottom: 18px; }
.sub { margin-left: 10px; font-size: 14px; color: var(--text-muted); font-weight: 500; }
.req { color: #c0473f; }
/* 사진 여러 장 */
.photo-card { align-items: stretch; }
.shots { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.shot { aspect-ratio: 1/1; border-radius: 8px; background: var(--thumb); }
.shot.add { background: var(--bg-page); border: 1px dashed #c3c9d2; display: flex;
            align-items: center; justify-content: center; color: var(--text-muted); font-size: 22px; }
.photo-main { width: 100%; height: 210px; border-radius: var(--radius-lg); background: var(--thumb); margin-bottom: 8px; }
/* 표 안의 작은 버튼 묶음 */
.pick { display: inline-flex; align-items: center; gap: 6px; }
.note-row td { background: var(--sub-blue); }
.linkline { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.linkline b { color: var(--primary); }
.tagline { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 13px;
           background: var(--sub-blue); color: var(--primary); font-size: 13px; font-weight: 600; }
"""

def shell(title, body, active, with_chrome=True, height=1024):
    nav = ["분실물 대장", "분실신고 대장", "설정값 변경"]
    items = "".join(
        f'<div class="{"on" if n == active else ""}"><i></i>{n}</div>' for n in nav)
    chrome_open = f"""<div class="app"><aside class="side">
      <div class="brand"><b>동양미래대학교</b><span>유실물 관리</span></div>
      <div class="nav">{items}</div></aside>
      <div class="main"><div class="top"><span class="who">학생처 김남진 님</span>
      <button class="btn">로그아웃</button></div><div class="content">"""
    chrome_close = "</div></div></div>"
    inner = (chrome_open + body + chrome_close) if with_chrome else body
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<link rel="stylesheet" href="../../node_modules/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css">
<link rel="stylesheet" href="../../src/index.css">
<style>{MOCK_CSS}
body {{ min-height: {height}px; }}</style></head>
<body>{inner}</body></html>"""

def header(title, sub="", buttons=()):
    btns = "".join(buttons)
    s = f'<span class="sub">{sub}</span>' if sub else ""
    return (f'<div class="page-header"><h1 class="page-title">{title}{s}</h1>'
            f'<div class="header-buttons">{btns}</div></div>')

def btn(label, kind=""):
    return f'<button class="btn {kind}">{label}</button>'

def field(label, value="", req=False, kind="text", full=False, ph="", locked=False):
    mark = ' <span class="req">*</span>' if req else ""
    cls = "field full" if full else "field"
    if kind == "view":
        inner = f'<div class="input value-box">{value}</div>'
    elif kind == "computed":
        inner = f'<div class="input value-box computed">{value or f"<span class=placeholder>{ph}</span>"}</div>'
    elif kind == "select":
        inner = f'<select class="input"><option>{value or ph}</option></select>'
    elif kind == "date":
        inner = f'<input class="input" type="date" value="{value}">'
    else:
        dis = " disabled" if locked else ""
        v = f' value="{value}"' if value else ""
        p = f' placeholder="{ph}"' if ph else ""
        inner = f'<input class="input"{v}{p}{dis}>'
    return f'<div class="{cls}"><label class="field-label">{label}{mark}</label>{inner}</div>'

def card(title, fields, cols=3):
    return (f'<section class="card"><h2 class="card-title">{title}</h2>'
            f'<div class="field-grid cols-{cols}">{"".join(fields)}</div></section>')

def manage_no(no):
    return (f'<div class="manage-no"><span class="manage-no-label">관리번호</span>'
            f'<span class="manage-no-value">{no}</span></div>')

def action_bar(buttons):
    return f'<div class="action-bar">{"".join(buttons)}</div>'

def table(cols, rows, widths=None):
    cg = ""
    if widths:
        cg = "<colgroup>" + "".join(f'<col style="width:{w}%">' for w in widths) + "</colgroup>"
    head = "".join(f"<th>{c}</th>" for c in cols)
    body = ""
    for r in rows:
        body += "<tr class='clickable'>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>"
    return f'<table class="data-table">{cg}<thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'

def toolbar(add_label=None):
    add_btn = ("" if not add_label else
        f'<button class="btn primary toolbar-btn"><svg width="18" height="18" viewBox="0 0 24 24" '
        f'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
        f'<path d="M12 5v14M5 12h14"/></svg> {add_label}</button>')
    return f"""<div class="list-toolbar">
      <label class="search-box"><input class="search-input" placeholder="관리번호, 물품명, 특징, 소유자명 등 검색해보세요.">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg></label>
      {add_btn}
      <div class="filter-wrap"><button class="btn toolbar-btn filter-btn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h18"/><path d="M15 5v4M8 10v4M13 15v4"/></svg> 필터
      <span class="filter-badge">1</span></button></div></div>"""

def pagination():
    return """<nav class="pagination">
      <button class="page-arrow">&lsaquo;</button>
      <button class="page-btn current">1</button><button class="page-btn">2</button>
      <button class="page-btn">3</button><button class="page-arrow">&rsaquo;</button></nav>"""

pages = {}

# ---------------------------------------------------------------- 1. 로그인
pages["01-login"] = (shell("로그인", """
<div class="login-page"><form class="login-box">
  <h1 class="login-title">유실물 관리 프로그램</h1>
  <div class="login-fields">
    <input class="login-input" placeholder="아이디">
    <input class="login-input" type="password" placeholder="비밀번호">
  </div>
  <button class="login-btn">로그인</button>
</form></div>""", active=None, with_chrome=False), 1024)

# ---------------------------------------------------------------- 2. 분실물 대장
thumb = '<div class="thumb"></div>'
found_rows = [
    ["20260001", thumb,
     '<div class="item-name">AirPods Pro</div><div class="item-sub">3호관 2층 복도</div>',
     "전자기기", "2026-10-01", "2026-10-01", "보관중", "김남진"],
    ["20260002", thumb,
     '<div class="item-name">검은색 카드지갑</div><div class="item-sub">본관 1층 로비</div>',
     "일반 귀중품", "2026-09-28", "2026-09-27", "본인반환", "이은표"],
    ["20260003", thumb,
     '<div class="item-name">텀블러</div><div class="item-sub">도서관 3층 열람실</div>',
     "일반 물품", "2026-09-25", "2026-09-25", "보관중", "김유은"],
]
pages["02-found-list"] = (shell("분실물 대장",
    header("분실물 대장", "습득한 물건을 등록하고 관리합니다", [btn("엑셀 내보내기")]) +
    '<div class="list-panel">' + toolbar("분실물 접수") +
    '<p class="list-count">전체 <b>3건</b></p>' +
    table(["관리번호", "사진", "물품명", "물품구분", "접수일", "습득일", "처리상태", "접수담당자"],
          found_rows, [11, 11, 20, 12, 12, 12, 11, 11]) +
    "</div>" + pagination(), active="분실물 대장"), 1024)

# ---------------------------------------------------------------- 공통: 분실물 카드들
def found_cards(mode):
    """mode: new | edit | view"""
    k = "view" if mode == "view" else "text"
    ks = "view" if mode == "view" else "select"
    kd = "view" if mode == "view" else "date"
    v = (lambda a, b="": a if mode != "new" else b)
    return (
        card("기본 정보", [
            field("접수일", v("2026-10-01"), req=True, kind=kd if mode != "view" else "view"),
            field("접수담당자", "김남진 (학생처)", kind="view"),
        ], cols=3) +
        card("물품 정보", [
            field("물품 구분", v("전자기기"), req=True, kind=ks, ph="선택하세요"),
            field("물품명", v("AirPods Pro"), req=True, kind=k, ph="예) 신분증, 카드지갑, 텀블러"),
            field("특징", v("흰색 케이스, 케이스에 작은 스크래치 있음"), kind=k, ph="입력해주세요", full=True),
        ], cols=2) +
        card("습득 정보", [
            field("습득일", v("2026-10-01"), req=True, kind=kd if mode != "view" else "view"),
            field("습득장소", v("3호관"), req=True, kind=ks, ph="건물 선택"),
            field("습득장소 상세", v("2층 복도 자판기 앞"), kind=k, ph="입력해주세요"),
        ]) +
        card("보관 정보", [
            field("보관장소", v("학생처 분실물 보관함"), req=True, kind=ks, ph="보관장소 선택"),
            field("보관 세부", v("A-03"), kind=k, ph="예) A-03"),
            field("보관만료일", v("2027-01-01"), kind="computed", ph="자동 계산"),
        ]) +
        card("습득자 정보", [
            field("습득자 구분", v("학생"), req=True, kind=ks, ph="선택하세요"),
            field("학번", v("20250113"), kind=k, ph="학번을 입력하세요"),
            field("성명", v("박서연"), kind=k, ph="이름을 입력하세요"),
            field("연락처", v("010-1234-5678"), kind=k, ph="010-0000-0000"),
        ]) +
        card("분실자 정보", [
            field("분실자", v("홍길동"), kind=k, ph="이름을 입력하세요"),
            field("연락처", v("010-0000-0000"), kind=k, ph="010-0000-0000"),
            field("연락 여부", v("O"), kind=ks, ph="X"),
        ]) +
        card("관리 정보", [
            field("처리상태", v("보관중", "미처리"), req=True, kind=ks),
            field("만료 시 조치 방법", v("관할서인계"), kind="computed", ph="물품 구분 선택 시 표시"),
            field("처리일", v("", ""), kind=("computed" if mode == "new" else kd), ph="처리 시 입력"),
            field("비고", v("케이스만 있고 본체 없음"), kind=k, ph="특이사항이 있으면 입력하세요", full=True),
        ])
    )

def photo_card(mode):
    if mode == "view":
        slots = '<div class="shots">' + '<div class="shot"></div>' * 3 + '</div>'
        title = "사진 (3장)"
    else:
        slots = ('<div class="shots">' + '<div class="shot"></div>' * 3 +
                 '<div class="shot add">+</div><div class="shot add">+</div></div>')
        title = "사진 등록 (최대 5장)"
    return (f'<section class="card photo-card"><h2 class="card-title">{title}</h2>'
            f'<div class="photo-main"></div>{slots}</section>')

def found_page(mode, title, buttons, no):
    return (header(title) + manage_no(no) +
            '<div class="record-layout">' + photo_card(mode) +
            '<div class="record-sections">' + found_cards(mode) + "</div></div>" +
            action_bar(buttons))

pages["03-found-new"] = (shell("분실물 접수",
    found_page("new", "분실물 접수", [btn("취소"), btn("등록", "primary")], "20260004"),
    active="분실물 대장", height=1600), 1600)

pages["04-found-detail"] = (shell("분실물 상세",
    found_page("view", "분실물 상세",
               [btn("목록"), btn("반환 처리"), btn("수정", "primary")], "20260001"),
    active="분실물 대장", height=1600), 1600)

pages["05-found-edit"] = (shell("분실물 수정",
    found_page("edit", "분실물 수정",
               [btn("취소"), btn("삭제", "danger"), btn("저장", "primary")], "20260001"),
    active="분실물 대장", height=1600), 1600)

# ---------------------------------------------------------------- 6. 반환 처리
pages["06-found-return"] = (shell("반환 처리",
    header("반환 처리", "물건을 돌려줄 때 수령자를 기록합니다") + manage_no("20260001") +
    '<div class="record-sections" style="max-width:900px">' +
    card("반환할 물건", [
        field("물품명", "AirPods Pro", kind="view"),
        field("물품 구분", "전자기기", kind="view"),
        field("보관장소", "학생처 분실물 보관함 A-03", kind="view"),
    ]) +
    card("수령자 정보", [
        field("수령자 학번", "", req=False, ph="학번 또는 교직원번호"),
        field("수령자 이름", "", ph="이름을 입력하세요"),
        field("수령일", "2026-10-02", kind="date"),
    ]) +
    card("확인 정보", [
        field("확인 방법", "", ph="예) 학생증 확인, 본인 진술", full=True),
        field("확인담당자", "김남진 (학생처)", kind="select"),
    ], cols=2) +
    '<p class="list-count" style="font-size:14px;color:var(--text-muted);margin-left:2px">'
    '반환 처리를 하면 처리상태가 <b>본인반환</b> 으로 바뀌고 처리일에 수령일이 들어갑니다.</p>' +
    "</div>" +
    action_bar([btn("취소"), btn("반환 처리", "primary")]),
    active="분실물 대장"), 1024)

# ---------------------------------------------------------------- 7. 분실신고 대장
lost_rows = [
    ["20261001", "전자기기", "아이폰 15", "김유은", "010-3333-4444", "2026-10-01", "2026-09-30", "미처리", "김남진"],
    ["20261002", "신분증", "학생증", "조가빈", "010-5555-6666", "2026-09-29", "2026-09-29", "처리완료", "이은표"],
]
pages["07-lost-list"] = (shell("분실신고 대장",
    header("분실신고 대장", "잃어버린 물건 신고를 접수합니다", [btn("엑셀 내보내기")]) +
    '<div class="list-panel">' + toolbar("분실 신고") +
    '<p class="list-count">전체 <b>2건</b></p>' +
    table(["관리번호", "물품구분", "물품명", "신고자", "연락처", "접수일", "분실일", "처리상태", "접수담당자"],
          lost_rows, [11, 11, 13, 10, 13, 12, 12, 10, 8]) +
    "</div>" + pagination(), active="분실신고 대장"), 1024)

# ---------------------------------------------------------------- 분실신고 카드
def lost_cards(mode):
    k = "view" if mode == "view" else "text"
    ks = "view" if mode == "view" else "select"
    kd = "view" if mode == "view" else "date"
    v = (lambda a, b="": a if mode != "new" else b)
    return (
        card("기본 정보", [
            field("접수일", v("2026-10-01"), req=True, kind=kd),
            field("접수담당자", "김남진 (학생처)", kind="view"),
        ]) +
        card("물품 정보", [
            field("물품 구분", v("전자기기"), req=True, kind=ks, ph="선택하세요"),
            field("물품명", v("아이폰 15"), req=True, kind=k, ph="예) 신분증, 카드지갑, 텀블러"),
            field("특징", v("검정색 케이스, 뒷면에 스티커"), kind=k, ph="입력해주세요", full=True),
        ]) +
        card("분실 정보", [
            field("분실일", v("2026-09-30"), req=True, kind=kd),
            field("분실장소", v("도서관"), req=True, kind=ks, ph="건물 선택"),
            field("분실장소 상세", v("3층 열람실"), kind=k, ph="입력해주세요"),
        ]) +
        card("신고자 정보", [
            field("신고자 구분", v("학생"), req=True, kind=ks, ph="선택하세요"),
            field("학번", v("20240077"), kind=k, ph="학번을 입력하세요"),
            field("성명", v("김유은"), req=True, kind=k, ph="이름을 입력하세요"),
            field("연락처", v("010-3333-4444"), req=True, kind=k, ph="010-0000-0000"),
        ]) +
        card("관리 정보", [
            field("처리상태", v("미처리"), req=True, kind=ks),
            field("처리일", v(""), kind=kd),
            field("비고", v(""), kind=k, ph="특이사항이 있으면 입력하세요", full=True),
        ])
    )

def lost_page(mode, title, buttons, no, extra=""):
    return (header(title) + manage_no(no) +
            '<div class="record-sections">' + extra + lost_cards(mode) + "</div>" +
            action_bar(buttons))

pages["08-lost-new"] = (shell("분실 신고 접수",
    lost_page("new", "분실 신고", [btn("취소"), btn("등록", "primary")], "20261003"),
    active="분실신고 대장", height=1320), 1320)

matched = ('<section class="card"><h2 class="card-title">찾은 분실물</h2>'
           '<div class="linkline"><span class="tagline">연결됨</span>'
           '<b>20260001</b> AirPods Pro · 전자기기 · 보관중'
           '<button class="btn small" style="margin-left:auto">연결 해제</button></div></section>')

pages["09-lost-detail"] = (shell("분실 신고 상세",
    lost_page("view", "분실 신고 상세",
              [btn("목록"), btn("분실물 찾기"), btn("수정", "primary")], "20261001", extra=matched),
    active="분실신고 대장", height=1450), 1450)

pages["10-lost-edit"] = (shell("분실 신고 수정",
    lost_page("edit", "분실 신고 수정",
              [btn("취소"), btn("삭제", "danger"), btn("저장", "primary")], "20261001"),
    active="분실신고 대장", height=1320), 1320)

# ---------------------------------------------------------------- 11. 분실물 찾아 연결
match_rows = [
    ['<span class="pick"><input type="radio" checked> 선택</span>', "20260001", thumb,
     '<div class="item-name">AirPods Pro</div><div class="item-sub">3호관 2층 복도</div>',
     "전자기기", "2026-10-01", "보관중"],
    ['<span class="pick"><input type="radio"> 선택</span>', "20260007", thumb,
     '<div class="item-name">무선 이어폰</div><div class="item-sub">도서관 3층</div>',
     "전자기기", "2026-09-30", "보관중"],
]
pages["11-lost-match"] = (shell("분실물 찾아 연결",
    header("분실물 찾아 연결", "신고 내용과 맞는 분실물을 고릅니다") + manage_no("20261001") +
    '<section class="card"><h2 class="card-title">신고 내용</h2>'
    '<div class="field-grid cols-3">' +
    field("물품 구분", "전자기기", kind="view") +
    field("물품명", "아이폰 15", kind="view") +
    field("분실일", "2026-09-30", kind="view") +
    field("분실장소", "도서관 3층 열람실", kind="view", full=True) +
    "</div></section>" +
    '<div class="list-panel" style="min-height:auto;margin-top:18px">' + toolbar() +
    '<p class="list-count">물품 구분과 분실일로 걸러진 <b>2건</b></p>' +
    table(["", "관리번호", "사진", "물품명", "물품구분", "습득일", "처리상태"],
          match_rows, [8, 12, 12, 28, 14, 14, 12]) +
    "</div>" +
    action_bar([btn("취소"), btn("연결", "primary")]),
    active="분실신고 대장"), 1024)

# ---------------------------------------------------------------- 12. 설정값 변경
def setting_table(cols, rows, widths):
    head = "".join(f"<th>{c}</th>" for c in cols)
    cg = "<colgroup>" + "".join(f'<col style="width:{w}%">' for w in widths) + "</colgroup>"
    body = ""
    for r in rows:
        tds = "".join(f"<td>{c}</td>" for c in r[:-1])
        body += f"<tr>{tds}<td><div class='settings-actions'>{r[-1]}</div></td></tr>"
    return f'<table class="data-table settings-table">{cg}<thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'

acts = btn("저장", "small primary") + btn("사용중지", "small")
acts_off = btn("저장", "small primary") + btn("사용재개", "small")
add = btn("추가", "small primary")
inp = lambda v: f'<input class="input" value="{v}">'
sel = lambda v: f'<select class="input"><option>{v}</option></select>'

cat_rows = [
    ["1", inp("신분증"), inp("1"), sel("관할서인계"), inp("1"), "사용중", acts],
    ["2", inp("전자기기"), inp("3"), sel("관할서인계"), inp("2"), "사용중", acts],
    ["3", inp("일반 물품"), inp("1"), sel("폐기"), inp("3"), "사용중", acts],
    ["새 항목", inp(""), inp("1"), sel("관할서인계"), inp(""), "-", add],
]
name_rows = lambda a, b, c: [
    ["1", inp(a), inp("1"), "사용중", acts],
    ["2", inp(b), inp("2"), "사용중", acts],
    ["3", inp(c), inp("3"), "사용중지", acts_off],
    ["새 항목", inp(""), inp(""), "-", add],
]
pages["12-settings"] = (shell("설정값 변경",
    header("설정값 변경", "목록에서 고르는 값을 추가하거나 사용중지합니다", [btn("목록으로")]) +
    '<p class="card settings-note">이름을 바꾸면 이미 등록된 데이터의 표시 이름도 함께 바뀝니다. '
    '사용중지한 항목은 새로 등록할 때 선택 목록에 나오지 않지만, 과거 데이터에는 그대로 남습니다.</p>' +
    '<section class="card settings-section"><h2 class="card-title">물품 구분</h2>' +
    setting_table(["ID", "이름", "보관기간(개월)", "기간 만료 시 조치 방법", "순서", "상태", "작업"],
                  cat_rows, [6, 30, 12, 18, 8, 10, 16]) + "</section>" +
    '<section class="card settings-section"><h2 class="card-title">분실물 처리상태</h2>' +
    setting_table(["ID", "이름", "순서", "상태", "작업"],
                  name_rows("보관중", "본인반환", "폐기"), [6, 50, 10, 12, 22]) + "</section>" +
    '<section class="card settings-section"><h2 class="card-title">분실신고 처리상태</h2>' +
    setting_table(["ID", "이름", "순서", "상태", "작업"],
                  name_rows("미처리", "처리완료", "취소"), [6, 50, 10, 12, 22]) + "</section>" +
    '<section class="card settings-section"><h2 class="card-title">건물</h2>' +
    setting_table(["ID", "이름", "순서", "상태", "작업"],
                  name_rows("본관", "3호관", "도서관"), [6, 50, 10, 12, 22]) + "</section>" +
    '<section class="card settings-section"><h2 class="card-title">보관장소</h2>' +
    setting_table(["ID", "이름", "순서", "상태", "작업"],
                  name_rows("학생처 분실물 보관함", "경비실", "도서관 안내데스크"), [6, 50, 10, 12, 22]) +
    "</section>",
    active="설정값 변경", height=2100), 2100)

sizes = {}
for name, (doc, h) in pages.items():
    (OUT / f"{name}.html").write_text(doc, encoding="utf-8")
    sizes[name] = h
print("생성:", len(pages), "쪽")
for k, v in sizes.items():
    print(f"  {k}.html  높이 {v}")
import json
(OUT / "_sizes.json").write_text(json.dumps(sizes, ensure_ascii=False), encoding="utf-8")
