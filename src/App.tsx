// src/App.tsx

import { NavBar, TabBar } from 'antd-mobile';
import SearchPage from './components/SearchPage'; // 引入我们新的主内容页面
import { useState, useEffect } from "react";
import { ChatRecord, MainData, MessageRecord } from './types';
import ManagePage from './components/ManagePage';


const STORAGE_KEY = 'chat-history-data';

export default function App() {


  const [mainData, setMainData] = useState<MainData>({});

  // 关于加载数据的帮助函数
  // 注意：这些函数并非async，它们执行过程中UI会完全卡死，哈哈！

  const loadMainDataFromLocalStorage = () => {
    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (!cachedData) { return; }
    try {
      const json = JSON.parse(cachedData!);
      setMainData(json);
      console.log("seted", json);
    } catch (error) {
      console.error(`Error in loadMainDataFromLocalStorage: ${error}`)
    }
  }

  const importChatHistory = (dataString: string, key: string = "default") => {
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

      const chatRecord: ChatRecord = {
        id: key,
        name: json.name || "Unnamed Chat",
        count: messages.length,
        messages,
      };

      const new_data = {
        ...mainData,
        [key]: chatRecord
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(new_data));
      setMainData(new_data);

    } catch (error) {
      throw error;
    }
  };

  const getChatHistory = (key: string): ChatRecord | null => {
    console.log(mainData)
    if (!(key in mainData)) { return null; }
    return mainData[key];
  }

  useEffect(loadMainDataFromLocalStorage, []);


  //TODO: 将tabkey转变为Context
  const [tabKey, setTabKey] = useState<string>("");
  const [chatKey, setChatKey] = useState<string>("");
  
  useEffect(() => { setChatKey("default") }, [])
  useEffect(() => { setTabKey("search") }, [])



  const mainContent = () => {
    switch (tabKey) {
      case "manage":
        return (<ManagePage 
          importChatHistory={importChatHistory}
          setTabKey={setTabKey}
        />)
      case "search": 
        return (<SearchPage 
          chatRecord={getChatHistory(chatKey)}
        />)
    }
  }

  return (
    <div className='app'>
      <NavBar back={null} className='top'>聊天记录检索工具</NavBar>
      <div className='body'>
        {mainContent()}
      </div>
      <TabBar
        activeKey={tabKey}
        onChange={v => { setTabKey(v) }}
        defaultActiveKey={"search"}
        className='bottom'
      >
        <TabBar.Item key="search" title="搜索" />
        <TabBar.Item key="manage" title="管理" />
      </TabBar>  
    </div>
  );
}