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
export namespace SearchWorker {
  export type Message = {
    chatRecord: ChatRecord;
    query: string;
  };
  export type Response = {
    searchResults: MessageRecord[];
  };
  export interface WorkerInterface extends Omit<Worker, 'postMessage' | 'onmessage'> {
    onmessage: (event: MessageEvent<Response>) => any;
    postMessage: (message: Message) => any;
  };
  export interface WorkerSelf {
    onmessage: (event: MessageEvent<Message>) => void;
    postMessage: (msg: Response) => void;
  }
};

export namespace ThemeRiverChartWorker {
  export type Message = {
    messages: MessageRecord[];
    groupmode: 'month' | 'day';
  };
  export type Response = {
    allSenders: Set<string>;
    chartData: [date: string, count: number, sender: string][];
    start_date: string,
    end_date: string
  };
  export interface WorkerInterface extends Omit<Worker, 'postMessage' | 'onmessage'> {
    onmessage: (event: MessageEvent<Response>) => any;
    postMessage: (message: Message) => any;
  };
  export interface WorkerSelf {
    onmessage: (event: MessageEvent<Message>) => void;
    postMessage: (msg: Response) => void;
  }
}