// src/components/PhotoCard.jsx
// 분실물 화면 왼쪽의 사진 카드. (분실신고에는 사진을 붙이지 않는다.)
// onPick 을 넘기면 회색 칸을 눌러 사진을 고를 수 있고, 없으면 보기 전용이다.

import { useRef } from "react";

/**
 * @param {string} image        사진 Base64 문자열
 * @param {function} [onPick]   파일을 골랐을 때 처리
 * @param {function} [onRemove] 사진 삭제 처리
 */
export default function PhotoCard({ image, onPick, onRemove }) {
  const fileRef = useRef(null);
  const editable = Boolean(onPick);

  /** 고른 뒤 값을 비워 같은 파일을 다시 골라도 동작하게 한다. */
  async function handlePick(e) {
    await onPick(e);
    e.target.value = "";
  }

  const photo = image
    ? <img src={image} alt="물품 사진" />
    : editable && <span className="photo-hint">눌러서 사진 등록</span>;

  return (
    <section className="card photo-card">
      <h2 className="card-title">{editable ? "사진 등록" : "사진"}</h2>
      {editable ? (
        <button type="button" className="photo-box editable" onClick={() => fileRef.current?.click()}>
          {photo}
        </button>
      ) : (
        <div className="photo-box">{photo}</div>
      )}
      {editable && (
        <>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePick} />
          {image && <button type="button" className="text-btn" onClick={onRemove}>사진 삭제</button>}
        </>
      )}
    </section>
  );
}
