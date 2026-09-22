
// src/imageUtil.js
// 업로드한 이미지를 적당한 크기로 줄여 Base64 문자열로 변환

export function fileToResizedDataUrl(file, maxSize = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // 긴 변을 maxSize에 맞춰 비율 유지 축소
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
// 전화번호 하이픈 자동 삽입: 01012345678 → 010-1234-5678
export function formatPhone(value) {
  const n = value.replace(/[^0-9]/g, "").slice(0, 11); // 숫자만, 최대 11자리
  if (n.length < 4) return n;
  if (n.length < 8) return `${n.slice(0, 3)}-${n.slice(3)}`;
  // 010 등 3자리 국번: 3-4-4
  if (n.length <= 10) return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
  return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
}