// src/worker/chat.worker.ts

// 从共享的类型文件中导入类型
import type { MessageRecord, ChatRecord, WorkerMessage } from '../types';

// 通用的加载逻辑 (保持不变)
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

    const chatRecord:ChatRecord = {
      id: "default",
      name: json.name || "Unnamed Chat",
      count: messages.length,
      messages,
    };

    postMessage({
      type: 'load-complete',
      payload: chatRecord
    });

  } catch (error) {
    postMessage({ type: 'error', payload: '数据解析失败，请检查文件格式或本地缓存。' });
  }
};


// 监听消息 (保持不变)
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  switch (type) {
    case 'load-from-string':
      processAndLoadData(payload);
      break;

    case 'search':
      if (!payload.chatRecord || !payload.query) {
        postMessage({ type: 'search-results', payload: [] });
        return;
      }
      const results = payload.chatRecord.messages.filter(m => m.text.includes(payload.query));
      results.reverse();
      postMessage({ type: 'search-results', payload: results });
      break;
  }
};

// 只是为了让 TypeScript 认为这是一个模块
export {};