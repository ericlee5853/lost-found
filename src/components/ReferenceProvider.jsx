// src/components/ReferenceProvider.jsx
// 설정과 담당자 목록을 읽어 화면 전체에 넘겨준다.
// 설정을 고치면 reload() 로 다시 읽는다.

import { useCallback, useState } from "react";
import { read } from "../data/db";
import { SETTING_APIS } from "../data/settings";
import { currentUser } from "../data/auth";
import { ReferenceContext } from "../referenceContext";

function load() {
  const db = read();
  return {
    categories: SETTING_APIS.categories.list(),
    results: SETTING_APIS.results.list(),
    statuses: SETTING_APIS.statuses.list(),
    buildings: SETTING_APIS.buildings.list(),
    storagePlaces: SETTING_APIS.storagePlaces.list(),
    users: db.users,
    me: currentUser(),
  };
}

export default function ReferenceProvider({ children }) {
  const [data, setData] = useState(load);
  const reload = useCallback(() => setData(load()), []);

  return (
    <ReferenceContext.Provider value={{ ...data, reload }}>
      {children}
    </ReferenceContext.Provider>
  );
}
