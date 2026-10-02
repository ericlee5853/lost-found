import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemCategoryApi, processResultApi, reportStatusApi } from "../api/settings";
import { toMessage } from "../api/client";
import { useReference } from "../referenceContext";
import { EXPIRE_ACTIONS } from "../constants";
import PageHeader from "../components/PageHeader";

// 컬럼 정의: key(서버 필드명) / label(표 머리글) / type(입력 방식) / width
const CATEGORY_COLUMNS = [
  { key: "name", label: "이름", type: "text" },
  { key: "storage_months", label: "보관기간(개월)", type: "number", width: 120 },
  { key: "expire_action", label: "기간 만료 시 조치 방법", type: "select", options: EXPIRE_ACTIONS, width: 170 },
  { key: "sort_order", label: "순서", type: "number", width: 70 },
];
const NAME_ONLY_COLUMNS = [
  { key: "name", label: "이름", type: "text" },
  { key: "sort_order", label: "순서", type: "number", width: 80 },
];

/**
 * 설정값 변경 페이지.
 * 물품 구분 · 분실물 처리결과 · 분실신고 처리상태 세 가지 설정을 서버에서 관리한다.
 *
 * - 이름을 수정하면 id 를 참조하는 기존 대장 데이터의 표시 이름도 함께 바뀐다.
 * - "사용중지"는 실제 삭제가 아니라 is_active 를 false 로 바꾸는 것이다.
 *   신규 등록 선택지에서는 빠지지만 과거 데이터는 이름이 그대로 보인다.
 * - 보관기간을 바꿔도 이미 등록된 건의 보관기한은 등록 시점 값으로 유지된다.
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const { categories, results, statuses, reload } = useReference();

  return (
    <div className="page form-page">
      <PageHeader title="설정값 변경">
        <button className="btn" onClick={() => navigate("/")}>목록으로</button>
      </PageHeader>

      <p className="card settings-note">
        이름을 바꾸면 이미 등록된 데이터의 표시 이름도 함께 바뀝니다.
        사용중지한 항목은 새로 등록할 때 선택 목록에 나오지 않지만, 과거 데이터에는 그대로 남습니다.
        보관기간을 바꿔도 이미 등록된 건의 보관기한은 등록 시점 값 그대로 유지됩니다.
        <br /><br />
        * 설정은 지우지 않고 사용중지만 할 수 있습니다. 과거 데이터의 이름을 지키기 위해서입니다.
      </p>

      <SettingTable title="물품 구분" rows={categories} settingApi={itemCategoryApi}
        columns={CATEGORY_COLUMNS} onChanged={reload}
        newRowTemplate={{ name: "", storage_months: 1, expire_action: EXPIRE_ACTIONS[0], sort_order: "" }} />

      <SettingTable title="분실물 처리결과" rows={results} settingApi={processResultApi}
        columns={NAME_ONLY_COLUMNS} onChanged={reload}
        newRowTemplate={{ name: "", sort_order: "" }} />

      <SettingTable title="분실신고 처리상태" rows={statuses} settingApi={reportStatusApi}
        columns={NAME_ONLY_COLUMNS} onChanged={reload}
        newRowTemplate={{ name: "", sort_order: "" }} />
    </div>
  );
}

/** 컬럼 정의 한 칸을 실제 입력 요소로 그린다. */
function CellInput({ column, value, onChange, disabled }) {
  if (column.type === "select") {
    // 서버에 다른 값이 저장돼 있으면 그 값도 선택지에 넣어 준다.
    const options = column.options.includes(value) || !value
      ? column.options
      : [value, ...column.options];
    return (
      <select className="input" value={value ?? ""} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input className="input" type={column.type} disabled={disabled}
      min={column.type === "number" ? 0 : undefined}
      value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  );
}

/**
 * 설정 한 가지를 그리는 공통 컴포넌트. (세 설정의 동작이 같다)
 * @param {object[]} rows       화면에 표시할 행 목록 (기준 정보에서 온다)
 * @param {object} settingApi   해당 설정의 API 묶음
 * @param {object[]} columns    편집 가능한 컬럼 정의
 * @param {object} newRowTemplate 새 항목 입력칸의 초기값
 * @param {function} onChanged  저장·추가·사용중지 뒤 목록을 다시 받아오는 콜백
 */
function SettingTable({ title, rows, settingApi, columns, newRowTemplate, onChanged }) {
  const [drafts, setDrafts] = useState({});   // 행별 수정 중인 값 { [id]: {컬럼: 값} }
  const [newRow, setNewRow] = useState(newRowTemplate);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null); // 서버에 보내는 중인 행

  /** 행의 현재 표시값: 수정 중이면 수정값, 아니면 저장된 값 */
  const valueOf = (row, key) => drafts[row.id]?.[key] ?? row[key];

  function editDraft(row, key, value) {
    setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], [key]: value } }));
  }

  /** 이름이 비었는지 확인 (중복은 서버가 409 로 알려 준다) */
  function validate(name) {
    return String(name ?? "").trim() ? "" : "이름을 입력하세요.";
  }

  /** 컬럼 정의에 맞게 값 형식을 맞춘다 (숫자 컬럼은 숫자로 보낸다) */
  function normalize(source) {
    const body = {};
    for (const column of columns) {
      const raw = source[column.key];
      body[column.key] = column.type === "number" ? Number(raw) || 0 : String(raw ?? "").trim();
    }
    return body;
  }

  /** 서버 호출을 감싸 오류 문구와 진행 표시를 처리한다. */
  async function run(id, action, fallback) {
    setBusyId(id);
    setError("");
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(toMessage(err, fallback));
    } finally {
      setBusyId(null);
    }
  }

  function saveRow(row) {
    const body = normalize({ ...row, ...drafts[row.id] });
    const message = validate(body.name);
    if (message) return setError(message);
    run(row.id, async () => {
      await settingApi.update(row.id, body);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }, "저장하지 못했습니다.");
  }

  function addRow() {
    const body = normalize(newRow);
    const message = validate(body.name);
    if (message) return setError(message);
    run("new", async () => {
      await settingApi.create(body);
      setNewRow(newRowTemplate);
    }, "추가하지 못했습니다.");
  }

  function toggleActive(row) {
    // 실제 삭제가 아니라 is_active 전환 (과거 데이터 보호)
    if (row.is_active && !window.confirm(
      `"${row.name}" 을(를) 사용중지하시겠습니까?\n새로 등록할 때 선택 목록에서 빠지며, 기존 데이터는 그대로 유지됩니다.`
    )) return;
    run(row.id, () => (row.is_active ? settingApi.deactivate(row.id) : settingApi.activate(row.id)),
      "상태를 바꾸지 못했습니다.");
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
            <th style={{ width: 170 }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.is_active ? "" : "row-inactive"}>
              <td>{row.id}</td>
              {columns.map((c) => (
                <td key={c.key}>
                  <CellInput column={c} value={valueOf(row, c.key)} disabled={busyId === row.id}
                    onChange={(v) => editDraft(row, c.key, v)} />
                </td>
              ))}
              <td>{row.is_active ? "사용중" : "사용중지"}</td>
              <td>
                <div className="settings-actions">
                  <button className="btn small primary" disabled={busyId === row.id}
                    onClick={() => saveRow(row)}>저장</button>
                  <button className="btn small" disabled={busyId === row.id}
                    onClick={() => toggleActive(row)}>
                    {row.is_active ? "사용중지" : "사용재개"}
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {/* 새 항목 추가 줄 */}
          <tr className="row-new">
            <td>새 항목</td>
            {columns.map((c) => (
              <td key={c.key}>
                <CellInput column={c} value={newRow[c.key]} disabled={busyId === "new"}
                  onChange={(v) => setNewRow((prev) => ({ ...prev, [c.key]: v }))} />
              </td>
            ))}
            <td>-</td>
            <td>
              <div className="settings-actions">
                <button className="btn small primary" disabled={busyId === "new"}
                  onClick={addRow}>추가</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
