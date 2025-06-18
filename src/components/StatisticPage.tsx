import { useEffect, useState } from "react";
import ChatThemeRiverChart from "./ChatThemeRiverChart";
import { useGlobal } from "./GlobalProvider"
import { Empty } from "antd-mobile";

const StatisticPage = ()=>{

	const {chatKey, mainDataHelper, switchTab} = useGlobal();

	const [chatRecord, setChatRecord] = useState(mainDataHelper.getChatHistory(chatKey));
	useEffect( 
		()=>{setChatRecord(mainDataHelper.getChatHistory(chatKey))}
		, [chatKey, mainDataHelper] );

	return (chatRecord? 
		(<ChatThemeRiverChart messages={chatRecord!.messages} />)
		:(
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
        />))

	// <ChatThemeRiverChart messages={mainDataHelper.getChatHistory(chatKey)} />)
};

export default StatisticPage;