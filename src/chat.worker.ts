// 定义类型
type MessageRecord = {
  id: number;
  text: string;
  from: string;
  date: string;
};

type ChatRecord = {
  id:string;
  name: string;
  messages: MessageRecord[];
};

let chatRecord: ChatRecord | null = null;

// 定义接收的消息类型
type WorkerMessage = 
  | { type: 'load-from-string'; payload: string } // 从字符串加载（用于文件和localStorage）
  | { type: 'search'; payload: string };

// 通用的加载逻辑
const processAndLoadData = (dataString: string) => {
  try {
    const json = JSON.parse(dataString);
    const messages: MessageRecord[] = (json.messages || [])
      .filter((m: any) => typeof m.text === "string" && m.text.length > 0)
      .map((m: any) => ({
        id: m.id,
        text: m.text,
        from: m.from || "Unknown",
        date: m.date || new Date().toISOString(),
      }));

    chatRecord = {
      id: "default",
      name: json.name || "Unnamed Chat",
      messages,
    };

    // 将完整的、处理好的对象发回主线程
    // 主线程将决定是否将其存入 localStorage
    postMessage({ 
      type: 'load-complete', 
      payload: { 
        chatRecord: chatRecord, 
        info: { name: chatRecord.name, messageCount: chatRecord.messages.length }
      } 
    });

  } catch (error) {
    postMessage({ type: 'error', payload: '数据解析失败，请检查文件格式或本地缓存。' });
  }
};


// 监听消息
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  switch (type) {
    case 'load-from-string':
      processAndLoadData(payload);
      break;

    case 'search':
      if (!chatRecord || !payload) {
        postMessage({ type: 'search-results', payload: [] });
        return;
      }
      const results = chatRecord.messages.filter(m => m.text.includes(payload));
      results.reverse();
      postMessage({ type: 'search-results', payload: results });
      break;
  }
};

export {};