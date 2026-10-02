// src/components/PhotoCard.jsx
// 분실물 화면 왼쪽의 사진 카드.
// 수정·접수 화면에서는 회색 칸을 눌러 사진을 고르고, 상세 화면에서는 보여주기만 한다.

import { useRef } from "react";
import { IMAGE_ACCEPT } from "../imageFile";

/**
 * @param {string} imageSrc    보여줄 사진 주소 (없으면 빈 회색 칸)
 * @param {function} [onPick]  고른 파일을 넘겨준다. 없으면 보기 전용
 * @param {function} [onRemove] 사진 지우기
 * @param {boolean} [uploading] 올리는 중 표시
 * @param {string} [error]     사진 관련 안내 문구
 */
export default function PhotoCard({ imageSrc, onPick, onRemove, uploading, error }) {
  const fileRef = useRef(null);
  const editable = Boolean(onPick);

  function handleChange(e) {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 동작하도록 값을 비운다.
    e.target.value = "";
    if (file) onPick(file);
  }

  const inside = uploading
    ? <span className="photo-hint always">올리는 중...</span>
    : imageSrc
      ? <img src={imageSrc} alt="물품 사진" />
      : editable && <span className="photo-hint">눌러서 사진 등록</span>;

  return (
    <section className="card photo-card">
      <h2 className="card-title">{editable ? "사진 등록" : "사진"}</h2>

      {editable ? (
        <button type="button" className="photo-box editable" disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          {inside}
        </button>
      ) : (
        <div className="photo-box">{inside}</div>
      )}

      {editable && (
        <>
          <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} hidden onChange={handleChange} />
          {imageSrc && !uploading && (
            <button type="button" className="text-btn" onClick={onRemove}>사진 삭제</button>
          )}
        </>
      )}

      {error && <p className="form-error photo-message">{error}</p>}
    </section>
  );
}
