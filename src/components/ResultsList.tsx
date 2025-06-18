// src/components/ResultsList.tsx

import { List, Space, SpinLoading, Empty, Toast } from 'antd-mobile';
import type { MessageRecord } from '../types';
import { useGlobal } from './GlobalProvider';

interface ResultsListProps {
  isImporting: boolean;
  isDataLoaded: boolean;
  isSearching: boolean;
  query: string;
  searchResults: MessageRecord[];
  messageCount: number | undefined;
}

export default function ResultsList({
  isImporting,
  isDataLoaded,
  isSearching,
  query,
  searchResults,
  messageCount
}: ResultsListProps) {

  const { switchTab } = useGlobal();

  // 渲染列表的内部内容
  const renderContent = () => {
    if (isImporting) {
      return (
        <List.Item>
          <Space align="center" justify="center" style={{ width: '100%', padding: '20px 0' }}>
            <SpinLoading style={{ '--size': '24px' }} />
            <span>正在导入和解析数据...</span>
          </Space>
        </List.Item>
      );
    }
    if (!isDataLoaded) {
      return (
        <Empty
          description={
            <span>
              请先在
              <span
                style={{ color: 'var(--adm-color-primary)', cursor: 'pointer' }}
                onClick={() => switchTab('manage')} // 假设 switchTab 函数在当前作用域可访问
              >
                管理页面
              </span>
              导入聊天记录文件
            </span>
          }
          style={{ padding: '40px 0' }}
        />)
    }
    if (isSearching) {
      return (
        <List.Item>
          <Space align="center" justify="center" style={{ width: '100%', padding: '20px 0' }}>
            <SpinLoading style={{ '--size': '24px' }} />
            <span>正在搜索...</span>
          </Space>
        </List.Item>
      );
    }
    if (query && searchResults.length === 0) {
      return <Empty description="没有找到匹配的结果" style={{ padding: '40px 0' }} />;
    }
    if (!query) {
      return <Empty description="输入关键词开始搜索" style={{ padding: '40px 0' }} />;
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
    <List 
      header={`搜索结果 (${searchResults.length}/${messageCount ?? 0})`} 
      mode='card'
    >
      {renderContent()}
    </List>
  );
}