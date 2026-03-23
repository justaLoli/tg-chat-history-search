// src/worker/chat.worker.ts

// 从共享的类型文件中导入类型
import type { SearchWorker } from '../types';


// A little magic to add .ts typing 
const _self = self as unknown as SearchWorker.WorkerSelf

// 监听消息 (保持不变)
_self.onmessage = (event) => {
  const { chatRecord, query } = event.data;
  if ( !chatRecord || query.trim() === '') {
    _self.postMessage({ searchResults: [] });
    return;
  }

  // this itself is a heavy method
  const searchResults = chatRecord.messages.filter(m => m.text.includes(query));
  searchResults.reverse();

  _self.postMessage({searchResults});
};

// 只是为了让 TypeScript 认为这是一个模块
export {};