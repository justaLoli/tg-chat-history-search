import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { ChatRecord, MainData, MessageRecord, AppContext_t, Tab, MainDataHelper } from '../types';

// 1. 创建 Context
const AppContext = createContext<AppContext_t | null>(null);
const STORAGE_KEY = 'chat-history-data';

// 2. 创建一个 Provider 组件，它将管理状态
export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [tabKey, setTabKey] = useState<Tab>("search"); // 默认显示 A 页面
  const [chatKey, setChatKey] = useState<string>("default");
  const [mainData, setMainData] = useState<MainData>({});

  // MARK: 完成 useMemo/useCallback 的性能优化
  // 使用 useMemo 来包裹 mainDataHelper 对象。
  // 这样，只有当其依赖 `mainData` 状态改变时，这个对象才会被重新创建。
  // 这可以防止因为 Provider 组件重渲染而导致的不必要的子组件重渲染。
  const mainDataHelper: MainDataHelper = useMemo(() => ({
    loadMainDataFromLocalStorage: () => {
      const cachedData = localStorage.getItem(STORAGE_KEY);
      if (!cachedData) { return; }
      try {
        const json = JSON.parse(cachedData!);
        if (json["id"] === "default") { return; } /* 忽视旧数据格式 */
        setMainData(json);
      } catch (error) {
        console.error(`Error in loadMainDataFromLocalStorage: ${error}`)
      }
    },
    importChatHistory: (dataString: string, key: string = "default") => {
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

        // 从当前的 mainData 状态创建新对象，确保函数闭包能访问到最新的状态
        const new_data = {
          ...mainData,
          [key]: chatRecord
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(new_data));
        setMainData(new_data);

      } catch (error) {
        throw error;
      }
    },
    clearLocalStorage: () => {
      localStorage.removeItem(STORAGE_KEY);
      setMainData({});
    },
    getChatHistory: (key: string): ChatRecord | null => {
      // 从当前的 mainData 状态获取数据
      if (!(key in mainData)) { return null; }
      return mainData[key];
    }
  }), [mainData]); // 依赖数组中放入 mainData

  // 使用 useCallback 来记忆 switchTab 函数。
  // setTabKey 是由 useState 返回的，React 保证它在组件的生命周期内是稳定的，
  // 所以依赖数组可以为空 `[]`。
  const switchTab = useCallback((tab: Tab) => {
    setTabKey(tab);
  }, []); // 依赖项为空，因为 setTabKey 是稳定的

  // 加载初始数据
  useEffect(() => {
    mainDataHelper.loadMainDataFromLocalStorage()
  }, []); // 依赖 mainDataHelper，确保在 helper 创建后执行

  // 使用 useMemo 来创建传递给 Provider 的 value 对象。
  // 这样，只有当 value 对象中的任何一个值（tabKey, chatKey, mainDataHelper, switchTab）发生变化时，
  // 这个 value 对象才会被重新创建，从而避免不必要的子组件重渲染。
  // useState 返回的 setter 函数 (setTabKey, setChatKey) 是稳定的，无需作为依赖。
  const value: AppContext_t = useMemo(() => ({
    tabKey,
    setTabKey,
    switchTab,
    chatKey,
    setChatKey,
    mainDataHelper
  }), [tabKey, chatKey, mainDataHelper, switchTab]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// 3. 创建一个自定义 Hook，方便子组件使用
export function useGlobal(): AppContext_t {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useGlobal 必须在 GlobalProvider 内部使用');
  }
  return context;
}