// src/components/ReferenceProvider.jsx
// 로그인 뒤 한 번만 설정 목록과 사용자 목록을 받아 화면 전체에 넘겨준다.
// 설정이 바뀌면 reload() 로 다시 받아온다.

import { itemCategoryApi, processResultApi, reportStatusApi } from "../api/settings";
import { getMe, getUsers } from "../api/auth";
import { ReferenceContext } from "../referenceContext";
import { useAsync } from "../useAsync";
import { LoadingBox, ErrorBox } from "./StatusBox";

/** 기준 정보를 한 번에 받아온다. 사용자 목록은 권한이 없으면 빈 배열이 온다. */
async function loadReference() {
  const [categories, results, statuses, me, users] = await Promise.all([
    itemCategoryApi.list(),
    processResultApi.list(),
    reportStatusApi.list(),
    getMe(),
    getUsers(),
  ]);
  return { categories, results, statuses, me, users };
}

export default function ReferenceProvider({ children }) {
  const { data, loading, error, reload } = useAsync(loadReference, []);

  if (loading) return <LoadingBox />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  // 확인자 선택 목록: 사용자 목록을 못 받는 권한이면 최소한 본인은 고를 수 있게 한다.
  const users = data.users.length > 0 ? data.users : [data.me];

  return (
    <ReferenceContext.Provider value={{ ...data, users, reload }}>
      {children}
    </ReferenceContext.Provider>
  );
}
