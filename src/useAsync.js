// src/useAsync.js
// API 호출 한 번을 "불러오는 중 / 오류 / 결과" 세 가지 상태로 다루는 도우미.

import { useCallback, useEffect, useState } from "react";
import { toMessage } from "./api/client";

/**
 * @param {function} load 자료를 받아오는 async 함수
 * @param {any[]} deps    이 값들이 바뀌면 다시 불러온다
 */
export function useAsync(load, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await run());
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}
