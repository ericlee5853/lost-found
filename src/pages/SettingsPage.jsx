import { useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  itemCategoryTable, processResultTable, EXPIRE_ACTIONS,
} from "../settings";
import PageHeader from "../components/PageHeader";
import { countCategoryUses, countResultUses } from "../storage";

/**
 * 설정값 변경 페이지.
 * 물품구분(item_category)과 처리결과(process_result) 설정 테이블을 관리한다.
 *
 * - 이름을 수정하면 id 를 참조하는 기존 유실물 데이터의 표시 이름도 함께 바뀐다.
 * - "사용중지"는 실제 삭제가 아니라 is_active = false 로 바꾸는 것이다.
 *   신규 등록 선택지에서는 빠지지만 과거 데이터는 이름이 그대로 보인다.
 * - 보관기간을 바꿔도 이미 등록된 건의 보관기한은 등록 시점 값으로 유지된다.
 */
export default function SettingsPage() {
  const navigate = useNavigate();

  // 설정을 바꾼 뒤 localStorage 를 다시 읽도록 화면을 새로 그리는 장치
  const [, reload] = useReducer((n) => n + 1, 0);

  const categories = itemCategoryTable.all();
  const results = processResultTable.all();

  return (
    <div className="page form-page">
      <PageHeader title="설정값 변경">
        <button className="btn" onClick={() => navigate("/")}>목록으로</button>
      </PageHeader>

      <p className="card settings-note">
        이름을 바꾸면 이미 등록된 데이터의 표시 이름도 함께 바뀝니다.
        사용중지한 항목은 새로 등록할 때 선택 목록에 나오지 않지만, 과거 데이터에는 그대로 남습니다.
        보관기간을 바꿔도 이미 등록된 건의 보관기한은 등록 시점 값 그대로 유지됩니다.
        삭제는 그 항목을 쓰는 데이터가 한 건도 없을 때만 됩니다. 쓰는 데이터가 있으면 사용중지를 이용하세요.
      <br></br><br></br>
        * 물품 구분 항목: 삭제 주의 - 이미 등록된 데이터가 쓰고 있으면 삭제할 수 없습니다. 사용중지를 이용하세요.
      </p>

      <SettingTable
        title="물품 구분"
        table={itemCategoryTable}
        rows={categories}
        countUses={countCategoryUses}
        onChanged={reload}
        columns={CATEGORY_COLUMNS}
        newRowTemplate={{ name: "", storage_months: 1, expire_action: EXPIRE_ACTIONS[0], sort_order: "" }}
      />

      <SettingTable
        title="처리 결과"
        table={processResultTable}
        rows={results}
        countUses={countResultUses}
        onChanged={reload}
        columns={RESULT_COLUMNS}
        newRowTemplate={{ name: "", sort_order: "" }}
      />
    </div>
  );
}

// 컬럼 정의: key(컬럼명) / label(표 머리글) / type(입력 방식) / width
const CATEGORY_COLUMNS = [
  { key: "name", label: "이름", type: "text" },
  { key: "storage_months", label: "보관기간(개월)", type: "number", width: 120 },
  { key: "expire_action", label: "기간 만료 시 조치 방법", type: "select", options: EXPIRE_ACTIONS, width: 170 },
  { key: "sort_order", label: "순서", type: "number", width: 70 },
];

const RESULT_COLUMNS = [
  { key: "name", label: "이름", type: "text" },
  { key: "sort_order", label: "순서", type: "number", width: 80 },
];

/** 컬럼 정의 한 칸을 실제 입력 요소로 그린다. */
function CellInput({ column, value, onChange }) {
  if (column.type === "select") {
    return (
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {column.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input
      className="input"
      type={column.type}
      min={column.type === "number" ? 0 : undefined}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * 설정 테이블 한 개(물품구분 또는 처리결과)를 그리는 공통 컴포넌트.
 * @param {object} table   settings.js 의 설정 테이블 API
 * @param {object[]} rows  화면에 표시할 행 목록
 * @param {object[]} columns 편집 가능한 컬럼 정의
 * @param {object} newRowTemplate 새 항목 입력칸의 초기값
 * @param {function} countUses 이 항목을 쓰고 있는 데이터 건수를 세는 함수
 * @param {function} onChanged 저장·추가·상태변경 후 목록 새로고침 콜백
 */
function SettingTable({ title, table, rows, columns, newRowTemplate, countUses, onChanged }) {
  // 행별 수정 중인 값 { [id]: {컬럼: 값} }
  const [drafts, setDrafts] = useState({});
  const [newRow, setNewRow] = useState(newRowTemplate);
  const [error, setError] = useState("");

  /** 행의 현재 표시값: 수정 중이면 수정값, 아니면 저장된 값 */
  const valueOf = (row, key) => drafts[row.id]?.[key] ?? row[key];

  function editDraft(row, key, value) {
    setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], [key]: value } }));
  }

  /** 이름이 비었는지 / 다른 항목과 겹치는지 확인 */
  function validate(name, excludeId) {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return "이름을 입력하세요.";
    const duplicated = table.all().some(
      (r) => r.id !== excludeId && r.name === trimmed
    );
    if (duplicated) return `"${trimmed}" 은(는) 이미 있는 이름입니다.`;
    return "";
  }

  /** 컬럼 정의에 맞게 값 형식을 맞춘다 (숫자 컬럼은 숫자로 저장) */
  function normalize(source) {
    const data = {};
    for (const column of columns) {
      const raw = source[column.key];
      data[column.key] = column.type === "number" ? Number(raw) || 0 : String(raw ?? "").trim();
    }
    return data;
  }

  function saveRow(row) {
    const data = normalize({ ...row, ...drafts[row.id] });
    const message = validate(data.name, row.id);
    if (message) return setError(message);
    table.update(row.id, data);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    setError("");
    onChanged();
  }

  function addRow() {
    const data = normalize(newRow);
    const message = validate(data.name, null);
    if (message) return setError(message);
    table.add(data);
    setNewRow(newRowTemplate);
    setError("");
    onChanged();
  }

  function toggleActive(row) {
    // 실제 삭제가 아니라 is_active 전환 (과거 데이터 보호)
    if (row.is_active && !window.confirm(
      `"${row.name}" 을(를) 사용중지하시겠습니까?\n새로 등록할 때 선택 목록에서 빠지며, 기존 데이터는 그대로 유지됩니다.`
    )) return;
    table.setActive(row.id, !row.is_active);
    onChanged();
  }

  /**
   * 행을 완전히 삭제한다.
   * 이 항목을 쓰는 데이터가 있으면 막고 사용중지를 안내한다(규칙 2).
   * 잘못 추가한 항목을 정리할 때만 쓰인다.
   */
  function removeRow(row) {
    const used = countUses(row.id);
    if (used > 0) {
      setError(`"${row.name}" 은(는) 이미 등록된 데이터 ${used}건이 쓰고 있어 삭제할 수 없습니다. 사용중지를 이용하세요.`);
      return;
    }
    if (!window.confirm(`"${row.name}" 을(를) 완전히 삭제하시겠습니까?\n되돌릴 수 없습니다.`)) return;
    table.remove(row.id);
    setError("");
    onChanged();
  }

  return (
    <section className="card settings-section">
      <h2 className="card-title">{title}</h2>
      <table className="data-table settings-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>ID</th>
            {columns.map((c) => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}
            <th style={{ width: 90 }}>상태</th>
            <th style={{ width: 230 }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.is_active ? "" : "row-inactive"}>
              <td>{row.id}</td>
              {columns.map((c) => (
                <td key={c.key}>
                  <CellInput column={c} value={valueOf(row, c.key)}
                    onChange={(v) => editDraft(row, c.key, v)} />
                </td>
              ))}
              <td>{row.is_active ? "사용중" : "사용중지"}</td>
              <td>
                <div className="settings-actions">
                  <button className="btn small primary" onClick={() => saveRow(row)}>저장</button>
                  <button className="btn small" onClick={() => toggleActive(row)}>
                    {row.is_active ? "사용중지" : "사용재개"}
                  </button>
                  <button className="btn small danger" onClick={() => removeRow(row)}>삭제</button>
                </div>
              </td>
            </tr>
          ))}

          {/* 새 항목 추가 줄 */}
          <tr className="row-new">
            <td>새 항목</td>
            {columns.map((c) => (
              <td key={c.key}>
                <CellInput column={c} value={newRow[c.key]}
                  onChange={(v) => setNewRow((prev) => ({ ...prev, [c.key]: v }))} />
              </td>
            ))}
            <td>-</td>
            <td>
              <div className="settings-actions">
                <button className="btn small primary" onClick={addRow}>추가</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
