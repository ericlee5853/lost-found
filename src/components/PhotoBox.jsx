// src/components/PhotoBox.jsx
// 사진 등록 칸.
// 큰 사진을 좌우 화살표로 넘겨 보고, 아래 작은 사진으로 바로 고를 수 있다.
// 접수·수정 화면에서는 사진 촬영과 파일 업로드로 사진을 더할 수 있다.

import { useState } from "react";
import { IMAGE_ACCEPT, MAX_PHOTOS, checkImageFile, shrinkToDataUrl } from "../imageFile";
import { CameraIcon, UploadIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * @param {string[]} photos    사진 목록 (지금은 그림 데이터, 서버 연동 뒤에는 주소)
 * @param {function} [onChange] 사진 목록이 바뀌었을 때. 없으면 보기 전용
 */
export default function PhotoBox({ photos = [], onChange }) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const editable = Boolean(onChange);

  const count = photos.length;
  const current = Math.min(index, Math.max(count - 1, 0));
  const full = count >= MAX_PHOTOS;

  /** 고른 파일들을 줄여서 목록에 더한다. */
  async function addFiles(fileList) {
    const files = fileList.slice(0, MAX_PHOTOS - count);
    if (files.length === 0) {
      setMessage(`사진은 ${MAX_PHOTOS}장까지 올릴 수 있습니다.`);
      return;
    }
    setBusy(true);
    setMessage("");
    const added = [];
    for (const file of files) {
      const problem = checkImageFile(file);
      if (problem) { setMessage(problem); continue; }
      const shrunk = await shrinkToDataUrl(file);
      if (!shrunk) {
        setMessage("이 형식은 이 브라우저에서 열 수 없습니다. 다른 사진을 올려 주세요.");
        continue;
      }
      added.push(shrunk);
    }
    if (added.length > 0) {
      onChange([...photos, ...added]);
      setIndex(count + added.length - 1);
    }
    setBusy(false);
  }

  function handlePick(e) {
    // 입력칸 값을 비우면 고른 파일 목록도 함께 비워지므로 먼저 따로 담아 둔다.
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";          // 같은 파일을 다시 골라도 동작하도록
    if (files.length) addFiles(files);
  }

  function removeCurrent() {
    onChange(photos.filter((_, i) => i !== current));
    setIndex(Math.max(current - 1, 0));
    setMessage("");
  }

  const move = (step) => setIndex((count + current + step) % count);

  return (
    <section className="card photo-card">
      <h2 className="card-title">
        {editable ? "사진 등록" : "사진"}
        <span className="card-title-sub">
          {editable ? `(최대 ${MAX_PHOTOS}장)` : count > 0 ? `(${count}장)` : ""}
        </span>
      </h2>

      {/* 큰 사진 */}
      <div className="photo-stage">
        {count === 0 ? (
          <span className="photo-empty">{busy ? "사진 넣는 중..." : "등록된 사진이 없습니다"}</span>
        ) : (
          <>
            <img src={photos[current]} alt={`물품 사진 ${current + 1}`} />
            {count > 1 && (
              <>
                <button type="button" className="photo-nav left" onClick={() => move(-1)}
                  aria-label="이전 사진"><ChevronLeftIcon /></button>
                <button type="button" className="photo-nav right" onClick={() => move(1)}
                  aria-label="다음 사진"><ChevronRightIcon /></button>
              </>
            )}
            <span className="photo-count">{current + 1} / {count}</span>
            {editable && (
              <button type="button" className="photo-del" onClick={removeCurrent}
                aria-label="이 사진 삭제"><TrashIcon /></button>
            )}
          </>
        )}
      </div>

      {/* 작은 사진 + 빈 칸 */}
      <div className="thumb-row">
        {photos.map((src, i) => (
          <button type="button" key={i} onClick={() => setIndex(i)}
            className={"thumb-item" + (i === current ? " on" : "")} aria-label={`${i + 1}번째 사진 보기`}>
            <img src={src} alt="" />
          </button>
        ))}
        {editable && Array.from({ length: MAX_PHOTOS - count }).map((_, i) => (
          <span className="thumb-item add" key={`add-${i}`}><CameraIcon /></span>
        ))}
      </div>

      {editable && (
        <>
          <div className="photo-buttons">
            <label className={"btn photo-btn" + (full || busy ? " off" : "")}>
              <CameraIcon /> 사진 촬영
              <input type="file" accept={IMAGE_ACCEPT} capture="environment" hidden
                disabled={full || busy} onChange={handlePick} />
            </label>
            <label className={"btn photo-btn" + (full || busy ? " off" : "")}>
              <UploadIcon /> 파일 업로드
              <input type="file" accept={IMAGE_ACCEPT} multiple hidden
                disabled={full || busy} onChange={handlePick} />
            </label>
          </div>
          {full && <p className="photo-message">사진 {MAX_PHOTOS}장을 모두 올렸습니다.</p>}
          {message && <p className="form-error photo-message">{message}</p>}
        </>
      )}
    </section>
  );
}
