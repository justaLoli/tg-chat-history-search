import { useState, useEffect, useRef } from "react";
import { List, NavBar, SearchBar, Space, SpinLoading, Toast, Empty, Button } from "antd-mobile";

// ... 类型定义保持不变 ...
type MessageRecord = { id: number; text: string; from: string; date: string; };
type ChatRecord = { id: string; name: string; messages: MessageRecord[]; };

// 定义从 Worker 接收的消息类型
type WorkerResponse = 
  | { type: 'load-complete'; payload: { chatRecord: ChatRecord, info: { name: string; messageCount: number } } }
  | { type: 'search-results'; payload: MessageRecord[] }
  | { type: 'error'; payload: string };

const STORAGE_KEY = 'chat-history-data'; // 在主线程定义 Key

export default function App() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageRecord[]>([]);
  const [isImporting, setIsImporting] = useState(true); // 初始为 true，表示正在检查缓存
  const [isSearching, setIsSearching] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  // const [isDataFromCached, setIsDataFromCached] = useState(false);
  const [chatInfo, setChatInfo] = useState<{name: string, count: number} | null>(null);

  const workerRef = useRef<Worker>();
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./chat.worker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'load-complete':
          // 主线程负责写入 localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.chatRecord));
          
          setIsImporting(false);
          setIsDataLoaded(true);
          setSearchResults([]);
          setQuery('');
          setChatInfo({name: payload.info.name, count: payload.info.messageCount});
          // Toast.show({
          //   icon: 'success',
          //   content: `加载成功: ${payload.info.name} (${payload.info.messageCount}条)`,
          // });
          break;
        
        case 'search-results':
          setSearchResults(payload);
          setIsSearching(false);
          break;
        
        case 'error':
          setIsImporting(false);
          setIsSearching(false);
          // 如果出错，也尝试清除可能已损坏的本地缓存
          localStorage.removeItem(STORAGE_KEY);
          Toast.show({ icon: 'fail', content: payload });
          break;
      }
    };

    // --- 应用启动时的核心逻辑 ---
    // 1. 主线程检查 localStorage
    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (cachedData) {
      // 2. 如果有缓存，发送给 Worker 去加载
      // setIsDataFromCached(true);
      workerRef.current?.postMessage({ type: 'load-from-string', payload: cachedData });
    } else {
      // 3. 如果没有缓存，直接结束初始加载状态
      setIsImporting(false);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceTimerRef.current = window.setTimeout(() => {
      workerRef.current?.postMessage({ type: 'search', payload: q });
    }, 300);
  };

  const handleImport = async (_: any) => {
    const input = document.createElement('input');
    input.type = "file";
    input.addEventListener('change', async ()=> {
      const file = input.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setIsDataLoaded(false);
      setChatInfo(null);
      const text = await file.text();
      // 统一使用 'load-from-string' 指令
      workerRef.current?.postMessage({ type: 'load-from-string', payload: text });
    })
    input.click();
  };


  // 渲染列表内容
  const renderListContent = () => {
    if (isImporting) {
      return <List.Item>
        <Space align="center" justify="center" style={{ width: '100%', padding: '20px 0' }}>
          <SpinLoading style={{ '--size': '24px' }} />
          <span>正在导入和解析数据...</span>
        </Space>
      </List.Item>;
    }
    if (!isDataLoaded) {
      return <Empty description="请先导入聊天记录文件" style={{ padding: '40px 0' }} />;
    }
    if (isSearching) {
      return <List.Item>
        <Space align="center" justify="center" style={{ width: '100%', padding: '20px 0' }}>
          <SpinLoading style={{ '--size': '24px' }} />
          <span>正在搜索...</span>
        </Space>
      </List.Item>;
    }
    if (query && searchResults.length === 0) {
      return <Empty description="没有找到匹配的结果" style={{ padding: '40px 0' }} />;
    }
    if (!query) {
      // return <Empty description={`请输入关键词开始搜索`} style={{ padding: '40px 0' }} />;
      return <></>
    }
    return searchResults.map((m) => (
      <List.Item
        key={m.id}
        onClick={() => {
          navigator.clipboard.writeText(m.text);
          Toast.show({ content: '已复制到剪贴板', position: 'bottom' });
        }}
      >
        <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{m.from} @ {m.date}</div>
      </List.Item>
    ));
  };

  return (
    <div>
      <NavBar back={null}>聊天记录检索工具</NavBar>
      <div style={{ padding: '0 16px' }}>
        <Space direction="vertical" block style={{ '--gap': '12px', marginTop: '12px' }}>
          {/*<input
            type="file"
            accept="application/json"
            onChange={handleImport}
            disabled={isImporting}
          />*/}
          <Button 
            color="primary"
            size="small"
            fill="solid"
            onClick={handleImport} 
            disabled={isImporting}>导入新文件</Button>
          <SearchBar
            placeholder="输入文字搜索"
            value={query}
            onChange={handleSearch}
            clearable
          />
        </Space>
        <List header={`搜索结果 (${searchResults.length}/${chatInfo?.count ?? 0})`} style={{marginTop: '12px'}}>
          {renderListContent()}
        </List>
      </div>
    </div>
  );
}