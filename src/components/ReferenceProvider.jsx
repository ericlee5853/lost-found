// src/components/ReferenceProvider.jsx
// 로그인 뒤 설정 다섯 가지와 담당자 목록을 한 번 받아 화면 전체에 넘겨준다.
// 설정을 고치면 reload() 로 다시 받아온다.

import { SETTING_APIS } from "../data/settings";
import { getMe, getUsers } from "../data/auth";
import { ReferenceContext } from "../referenceContext";
import { useAsync } from "../useAsync";
import { LoadingBox, ErrorBox } from "./StatusBox";

async function loadReference() {
  const [categories, results, statuses, buildings, storagePlaces, me, users] = await Promise.all([
    SETTING_APIS.categories.list(),
    SETTING_APIS.results.list(),
    SETTING_APIS.statuses.list(),
    SETTING_APIS.buildings.list(),
    SETTING_APIS.storagePlaces.list(),
    getMe(),
    getUsers(),
  ]);
  return { categories, results, statuses, buildings, storagePlaces, me, users };
}

export default function ReferenceProvider({ children }) {
  const { data, loading, error, reload } = useAsync(loadReference, []);

  // 처음 받아올 때만 화면을 가린다. 설정을 고쳐 다시 받을 때는 보던 화면을 그대로 둔다.
  if (loading && !data) return <LoadingBox />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;

  // 담당자 목록을 못 받는 권한이면 최소한 본인은 고를 수 있게 한다.
  const users = data.users.length > 0 ? data.users : [data.me];

  return (
    <ReferenceContext.Provider value={{ ...data, users, reload }}>
      {children}
    </ReferenceContext.Provider>
  );
}
