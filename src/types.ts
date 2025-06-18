// src/types.ts

export type AppContext_t = {
  tabKey: Tab;
  setTabKey: React.Dispatch<React.SetStateAction<Tab>>;
  switchTab: (tab: Tab) => void;
  chatKey: string;
  setChatKey: React.Dispatch<React.SetStateAction<string>>;
  mainDataHelper: MainDataHelper;
}

export type MainDataHelper = {
  loadMainDataFromLocalStorage: () => void;
  importChatHistory: (dataString: string, key: string) => void;
  getChatHistory: (key: string) => ChatRecord | null;
  clearLocalStorage: () => void;
}

export type Tab = "search" | "manage" | "statistic";


/** 消息记录 */
export type MessageRecord = {
  id: number;
  text: string;
  from: string;
  date: string;
};

export type MainData = {
  [key: string]: ChatRecord;
};

/** 聊天记录文件整体结构 */
export type ChatRecord = {
  id: string;
  name: string;
  count: number;
  messages: MessageRecord[];
};

/** Worker 发送给主线程的消息类型 */
export type WorkerResponse =
  | { type: 'load-complete'; payload: ChatRecord }
  | { type: 'search-results'; payload: MessageRecord[] }
  | { type: 'error'; payload: string };

/** 主线程发送给 Worker 的消息类型 */
export type WorkerMessage =
  | { type: 'load-from-string'; payload: string }
  | { type: 'search'; payload: { chatRecord: ChatRecord, query: string } };
