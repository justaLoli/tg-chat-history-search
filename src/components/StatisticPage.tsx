import { useEffect, useState } from "react";
import { useGlobal } from "./GlobalProvider"
import { Space } from "antd-mobile";
import ChatThemeRiverChart from "./charts/ThemeRiverChart-Month";
import ChatThemeRiverChartHour from "./charts/ThemeRiverChart-Day";
import MyEmpty from "./MyEmpty";

const StatisticPage = () => {

  const { chatKey, mainDataHelper, switchTab } = useGlobal();

  const [chatRecord, setChatRecord] = useState(mainDataHelper.getChatHistory(chatKey));
  
  useEffect(() => { 
    setChatRecord(mainDataHelper.getChatHistory(chatKey)) 
  }, [chatKey, mainDataHelper]);

  if (!chatRecord?.messages) {
    return (<MyEmpty onClick={() => switchTab('manage')} />)
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}> 
      <ChatThemeRiverChart messages={chatRecord!.messages} />
      <ChatThemeRiverChartHour messages={chatRecord!.messages} />
    </Space>
  )
};

export default StatisticPage;