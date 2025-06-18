// src/App.tsx

import { NavBar, TabBar } from 'antd-mobile';
import SearchPage from './components/SearchPage'; // 引入我们新的主内容页面
import ManagePage from './components/ManagePage';
import { GlobalProvider, useGlobal } from './components/GlobalProvider';
import { Tab } from './types';
import { SearchOutline, SetOutline } from 'antd-mobile-icons';


const BodyContent = () => {
  const { tabKey, mainDataHelper, chatKey } = useGlobal();

  const content = (() => {
    switch (tabKey) {
      case "manage":
        return (<ManagePage />);
      case "search": 
        return (<SearchPage 
          chatRecord={mainDataHelper.getChatHistory(chatKey)}
        />);
    }
  })();
  return (<div className='body'> {content} </div>)
}
const BottomContent = () => {
  const {tabKey, setTabKey} = useGlobal();
  return (<TabBar
    activeKey={tabKey}
    onChange={v => { setTabKey(v as Tab) }}
    defaultActiveKey={"search"}
    className='bottom'
  >
    <TabBar.Item key="search" title="搜索" icon={<SearchOutline/>} />
    <TabBar.Item key="manage" title="管理" icon={<SetOutline/>} />
  </TabBar>)
}
const TopContent = () => {
  const {tabKey} = useGlobal();
  return <NavBar back={null} className='top'>{tabKey==="search"?"搜索":"管理"}</NavBar>
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