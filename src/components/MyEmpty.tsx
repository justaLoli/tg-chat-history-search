import { Empty } from "antd-mobile";
const MyEmpty = ({ onClick }: { onClick: any }) => {
  return (<Empty
    description={
      <span>
        请先在
        <span
          style={{ color: 'var(--adm-color-primary)', cursor: 'pointer' }}
          onClick={onClick}
        >
          管理页面
        </span>
        导入聊天记录文件
      </span>
    }
    style={{ padding: '40px 0' }}
  />)
}
export default MyEmpty;