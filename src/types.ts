// src/types.ts

// ===Global Data===
export type AppContext = {
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

// ===Tab===
export type Tab = "search" | "manage" | "statistic";


// ===Data Structure===
// 对应多个聊天（目前只有一个）
export type MainData = {
  [key: string]: ChatRecord;
};
// 每个聊天：存储相关信息，以及一个消息列表
export type ChatRecord = {
  id: string;
  name: string;
  count: number;
  messages: MessageRecord[];
};
// 每个消息：相关信息
export type MessageRecord = {
  id: number;
  text: string;
  from: string;
  date: string;
};


// ===Worker Typing===

//these two are used internally, no export needed.
interface TypedWorker<TMessage, TResponse> extends Omit<Worker, 'postMessage' | 'onmessage'> {
  onmessage: (event: MessageEvent<TResponse>) => any;
  postMessage: (message: TMessage) => any;
}
interface TypedWorkerSelf<TMessage, TResponse> {
  onmessage: (event: MessageEvent<TMessage>) => void;
  postMessage: (msg: TResponse) => void;
}

export namespace SearchWorker {
  export type Message = {
    chatRecord: ChatRecord;
    query: string;
  };
  export type Response = {
    searchResults: MessageRecord[];
  };
  export type WorkerInterface = TypedWorker<Message, Response>;
  export type WorkerSelf = TypedWorkerSelf<Message, Response>;
};

export namespace ThemeRiverChartWorker {
  export type Message = {
    messages: MessageRecord[];
    groupmode: 'month' | 'day';
  };
  export type Response = {
    allSenders: Set<string>;
    chartData: [date: string, count: number, sender: string][];
    startDate: string,
    endDate: string
  };
  export type WorkerInterface = TypedWorker<Message, Response>;
  export type WorkerSelf = TypedWorkerSelf<Message, Response>;
}