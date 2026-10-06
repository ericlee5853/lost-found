// src/imageFile.js
// 사진 파일을 확인하고, 올리기 전에 크기를 줄인다.
// 크기·형식 제한 안내는 화면에서 한다.

/**
 * 올릴 수 있는 사진 확장자.
 * 아이폰(HEIC·HEIF)과 안드로이드에서 찍은 형식을 모두 넣었다.
 * 브라우저가 띄우지 못하는 형식(RAW·SVG)은 넣지 않는다.
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "jpe", "jfif",
  "png", "gif", "bmp", "webp",
  "heic", "heif", "hif", "avif",
  "tif", "tiff",
];

/** 파일 고르기 창에 넘길 값. image/* 를 같이 줘야 휴대폰에서 카메라·앨범이 바로 열린다. */
export const IMAGE_ACCEPT =
  ["image/*", ...ALLOWED_IMAGE_EXTENSIONS.map((ext) => `.${ext}`)].join(",");

/** 한 건에 올릴 수 있는 사진 수 */
export const MAX_PHOTOS = 5;

/** 고를 수 있는 최대 용량 (줄이기 전 원본 기준) */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const MAX_SIDE = 1000;   // 줄인 뒤 긴 변 길이
const QUALITY = 0.72;

function sizeText(bytes) {
  return bytes >= 1024 * 1024
    ? `${Math.round(bytes / (1024 * 1024))}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

/**
 * 고른 파일이 올릴 수 있는 사진인지 확인한다.
 * @returns {string} 문제가 없으면 빈 문자열, 있으면 안내 문구
 */
export function checkImageFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return `사진 파일만 올릴 수 있습니다. (${ALLOWED_IMAGE_EXTENSIONS.join(", ")})`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `사진이 너무 큽니다. ${sizeText(MAX_IMAGE_BYTES)} 이하만 올릴 수 있습니다. (고른 파일 ${sizeText(file.size)})`;
  }
  return "";
}

/**
 * 사진을 줄여 올릴 파일로 바꾼다.
 * 브라우저가 열지 못하는 형식(예: 크롬의 HEIC)이면 null 을 돌려주며,
 * 그때는 원본을 그대로 올린다.
 * @returns {Promise<File|null>}
 */
export function shrinkImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > height && width > MAX_SIDE) {
        height = Math.round((height * MAX_SIDE) / width);
        width = MAX_SIDE;
      } else if (height > MAX_SIDE) {
        width = Math.round((width * MAX_SIDE) / height);
        height = MAX_SIDE;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], toJpgName(file.name), { type: "image/jpeg" }) : null),
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/** 줄인 사진은 JPEG 이므로 확장자도 바꾼다. */
function toJpgName(name) {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}
