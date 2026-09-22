// src/useStickyState.js
// useState와 똑같이 쓰지만, 값이 sessionStorage에 저장되어
// 페이지를 벗어났다 돌아와도 유지된다.
import { useState, useEffect } from "react";

export function useStickyState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 실패는 무시 (기능에 지장 없음)
    }
  }, [key, value]);

  return [value, setValue];
}