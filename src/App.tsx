// src/App.tsx

import { NavBar, TabBar } from 'antd-mobile';
import SearchPage from './components/SearchPage'; // 引入我们新的主内容页面
import ManagePage from './components/ManagePage';
import { GlobalProvider, useGlobal } from './components/GlobalProvider';
import { Tab } from './types';
import { HistogramOutline, SearchOutline, SetOutline } from 'antd-mobile-icons';
import StatisticPage from './components/StatisticPage';


const BodyContent = () => {
  const { tabKey, mainDataHelper, chatKey } = useGlobal();

  return (
    <div className='body'>
      {/*Search Page*/}
      <div style={{ display: tabKey === 'search' ? 'block' : 'none' }} >
        <SearchPage chatRecord={mainDataHelper.getChatHistory(chatKey)} />
      </div>

      {/*Statistic Page*/}
      <div style={{ display: tabKey === 'statistic' ? 'block' : 'none' }}>
        <StatisticPage />
      </div>

      {/*Manage Page*/}
      <div style={{ display: tabKey === 'manage' ? 'block' : 'none' }} > 
        <ManagePage />
      </div>
    </div>
  )
}
const BottomContent = () => {
  const { tabKey, setTabKey } = useGlobal();
  return (<TabBar
    activeKey={tabKey}
    onChange={v => { setTabKey(v as Tab) }}
    defaultActiveKey={"search"}
    className='bottom'
  >
    <TabBar.Item key="search" title="搜索" icon={<SearchOutline />} />
    <TabBar.Item key="statistic" title="统计" icon={<HistogramOutline />} />
    <TabBar.Item key="manage" title="管理" icon={<SetOutline />} />
  </TabBar>)
}
const TopContent = () => {
  const { tabKey } = useGlobal();
  return <NavBar back={null} className='top'>{
    (()=>{switch(tabKey){
      case "search": return "搜索";
      case "statistic": return "统计";
      case "manage": return "管理";
    }})()
  }</NavBar>
}

export default function App() {
  return (
    <div className='app'>
      <GlobalProvider>
        <TopContent />
        <BodyContent />
        <BottomContent />
      </GlobalProvider>
    </div>
  );
}