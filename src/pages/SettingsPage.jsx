import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SETTING_APIS } from "../data/settings";
import { toMessage } from "../api/client";
import { useReference } from "../referenceContext";
import { EXPIRE_ACTIONS } from "../dateUtil";
import PageHeader from "../components/PageHeader";

// 설정마다 다루는 칸이 다르다. key 는 서버 칸 이름과 같다.
const CATEGORY_COLUMNS = [
  { key: "name", label: "이름", type: "text" },
  { key: "storage_months", label: "보관기간(개월)", type: "number", width: 120 },
  { key: "expire_action", label: "기간 만료 시 조치 방법", type: "select", options: EXPIRE_ACTIONS, width: 170 },
  { key: "sort_order", label: "순서", type: "number", width: 70 },
];
const NAME_COLUMNS = [
  { key: "name", label: "이름", type: "text" },
  { key: "sort_order", label: "순서", type: "number", width: 80 },
];

// 화면에 보여줄 차례
const TABLES = [
  { key: "categories", title: "물품 구분", columns: CATEGORY_COLUMNS,
    blank: { name: "", storage_months: 1, expire_action: EXPIRE_ACTIONS[0], sort_order: "" } },
  { key: "results", title: "분실물 처리상태", columns: NAME_COLUMNS, blank: { name: "", sort_order: "" } },
  { key: "statuses", title: "분실신고 처리상태", columns: NAME_COLUMNS, blank: { name: "", sort_order: "" } },
  { key: "buildings", title: "건물", columns: NAME_COLUMNS, blank: { name: "", sort_order: "" } },
  { key: "storagePlaces", title: "보관장소", columns: NAME_COLUMNS, blank: { name: "", sort_order: "" } },
];

/**
 * 설정값 변경 화면.
 * - 이름을 고치면 번호로 이어진 기존 자료의 표시 이름도 함께 바뀐다.
 * - 지우지 않고 사용중지만 한다. 과거 자료의 이름을 지키기 위해서다.
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const ref = useReference();


  return (
    <>
      <PageHeader title="설정값 변경" sub="목록에서 고르는 값을 더하거나 사용중지합니다">
        <button className="btn" onClick={() => navigate("/found")}>목록으로</button>
      </PageHeader>

      <p className="card settings-note">
        이름을 바꾸면 이미 등록된 자료의 표시 이름도 함께 바뀝니다.
        사용중지한 항목은 새로 등록할 때 선택 목록에 나오지 않지만, 과거 자료에는 그대로 남습니다.
        보관기간을 바꿔도 이미 등록된 건의 보관만료일은 등록 시점 값 그대로 유지됩니다.
      </p>

      {TABLES.map((table) => (
        <SettingTable key={table.key} title={table.title} rows={ref[table.key]}
          columns={table.columns} blank={table.blank}
          api={SETTING_APIS[table.key]} onChanged={ref.reload} />
      ))}

    </>
  );
}

/** 칸 하나를 입력 요소로 그린다. */
function CellInput({ column, value, onChange }) {
  if (column.type === "select") {
    const options = !value || column.options.includes(value) ? column.options : [value, ...column.options];
    return (
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input className="input" type={column.type} min={column.type === "number" ? 0 : undefined}
      value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
  );
}

/** 설정 한 가지를 그리는 표. 다섯 설정이 모두 이 표를 쓴다. */
function SettingTable({ title, rows, columns, blank, api, onChanged }) {
  const [drafts, setDrafts] = useState({});
  const [newRow, setNewRow] = useState(blank);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null); // 서버에 보내는 중인 줄

  const valueOf = (row, key) => drafts[row.id]?.[key] ?? row[key];

  function editDraft(row, key, value) {
    setDrafts((prev) => ({ ...prev, [row.id]: { ...prev[row.id], [key]: value } }));
  }

  /** 숫자 칸은 숫자로 바꾸고, 이름은 공백을 턴다. */
  function clean(source) {
    const data = {};
    for (const column of columns) {
      const raw = source[column.key];
      data[column.key] = column.type === "number" ? Number(raw) || 0 : String(raw ?? "").trim();
    }
    return data;
  }

  function check(name, excludeId) {
    if (!name) return "이름을 입력하세요.";
    if (rows.some((r) => r.id !== excludeId && r.name === name)) return `"${name}" 은(는) 이미 있습니다.`;
    return "";
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
    const data = clean({ ...row, ...drafts[row.id] });
    const message = check(data.name, row.id);
    if (message) return setError(message);
    run(row.id, async () => {
      await api.update(row.id, data);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }, "저장하지 못했습니다.");
  }

  function addRow() {
    const data = clean(newRow);
    const message = check(data.name, null);
    if (message) return setError(message);
    run("new", async () => {
      await api.create(data);
      setNewRow(blank);
    }, "추가하지 못했습니다.");
  }

  function toggleActive(row) {
    if (row.is_active && !window.confirm(
      `"${row.name}" 을(를) 사용중지하시겠습니까?\n새로 등록할 때 목록에서 빠지며, 기존 자료는 그대로 남습니다.`
    )) return;
    run(row.id, () => api.setActive(row.id, !row.is_active), "상태를 바꾸지 못했습니다.");
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
                  <CellInput column={c} value={valueOf(row, c.key)}
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
                <button className="btn small primary" disabled={busyId === "new"} onClick={addRow}>추가</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
