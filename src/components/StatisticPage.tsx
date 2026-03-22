import { useEffect, useState } from "react";
import { useGlobal } from "./GlobalProvider"
import { Empty, Space } from "antd-mobile";
import ChatThemeRiverChart from "./charts/ChatThemeRiverChart";
import ChatThemeRiverChartHour from "./charts/ChatThemeRiverChart-hour";

const StatisticPage = ()=>{

	const {chatKey, mainDataHelper, switchTab} = useGlobal();

	const [chatRecord, setChatRecord] = useState(mainDataHelper.getChatHistory(chatKey));
	useEffect( 
		()=>{setChatRecord(mainDataHelper.getChatHistory(chatKey))}
		, [chatKey, mainDataHelper] );

  if(!chatRecord?.messages) {
    return (<Empty
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

	return (
    <Space direction="vertical" style={{width:"100%"}}> 
      <ChatThemeRiverChart messages={chatRecord!.messages} />
      <ChatThemeRiverChartHour messages={chatRecord!.messages} />
    </Space>
  )
};

export default StatisticPage;