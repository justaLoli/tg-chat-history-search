// src/components/SearchPage.tsx

import { useState, useEffect, useRef } from "react";
import { SearchBar, Toast } from "antd-mobile";
import ResultsList from "./ResultsList";
import type { MessageRecord, ChatRecord, SearchWorker } from "../types";
import _SearchWorker from '../worker/chat.worker?worker';


interface SearchPageProps {
  chatRecord: ChatRecord | null;
}

export default function SearchPage({
  chatRecord,
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const workerRef = useRef<SearchWorker.WorkerInterface>();
  const debounceTimerRef = useRef<number | null>(null);

  //初始化Worker（尚不调用）
  useEffect(() => {
    workerRef.current?.terminate(); // terminate existing worker (idk if this is necessary, just in case)
    workerRef.current = new _SearchWorker as SearchWorker.WorkerInterface;
    workerRef.current.onmessage = ({ data }) => {
      setSearchResults(data.searchResults);
      setIsSearching(false);
    }
    workerRef.current.onerror = (error) => {
      setIsSearching(false);
      Toast.show({ icon: 'fail', content: error.toString() });
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (q.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceTimerRef.current = window.setTimeout(() => {
      if (!chatRecord) { return; }
      workerRef.current?.postMessage({ chatRecord, query: q });
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