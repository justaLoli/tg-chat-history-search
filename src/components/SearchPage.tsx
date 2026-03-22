// src/components/SearchPage.tsx

import { useState, useEffect, useRef } from "react";
import { SearchBar, Toast } from "antd-mobile";
import ResultsList from "./ResultsList"; // 导入新的列表组件
import type { MessageRecord, WorkerResponse, ChatRecord } from "../types";

const STORAGE_KEY = 'chat-history-data';

interface SearchPageProps {
  chatRecord: ChatRecord | null;
}

export default function SearchPage({
  chatRecord,
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const workerRef = useRef<Worker>();
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../worker/chat.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'search-results':
          setSearchResults(payload);
          setIsSearching(false);
          break;

        case 'error':
          setIsSearching(false);
          localStorage.removeItem(STORAGE_KEY);
          Toast.show({ icon: 'fail', content: payload });
          break;
      }
    };
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
      workerRef.current?.postMessage({ type: 'search', payload: { chatRecord: chatRecord, query: q } });
    }, 300);
  };

  return (
    <>
      <SearchBar
        placeholder="输入文字搜索"
        value={query}
        onChange={handleSearch}
        clearable
        style={{ marginBottom: '12px' }}
      />
      <div style={{
        maxHeight: 'calc(100vh - 200px)',
        overflow: "scroll"
      }}>
        <ResultsList
          isImporting={false}
          isDataLoaded={chatRecord !== null}
          isSearching={isSearching}
          query={query}
          searchResults={searchResults}
          messageCount={chatRecord?.count}
        />
      </div>
    </>
  );
}