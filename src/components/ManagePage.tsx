import { Button, Footer, Space, Toast } from "antd-mobile";
import { useState } from "react";
import { useGlobal } from "./GlobalProvider";


export default function ManagePage() {

	const { switchTab, mainDataHelper } = useGlobal();

	const handleImport = async () => {
		const input = document.createElement('input');
		input.type = "file";
		input.addEventListener('change', async () => {
			const file = input.files?.[0];
			if (!file) return;
			setIsImporting(true);
			const text = await file.text(); try {
				mainDataHelper.importChatHistory(text, "default");
				setIsImporting(false);
				switchTab("search");
			} catch (error) {
				setIsImporting(false);
			}
		})
		input.click();
	};

	const [isImporting, setIsImporting] = useState(false);

	return (<Space direction="vertical" block >
		<div
			style={{
				width: "calc(100 - 20px)",
				display: "flex",           // 启用 Flexbox 布局
				justifyContent: "space-between", // 在项目之间平均分配空间
				gap: "10px",               // 设置项目之间的间距
				padding: "0 10px"          // 可选：给容器左右留白，让按钮不紧贴边缘
			}}
		>
			<Button
				color="primary"
				fill="solid"
				onClick={handleImport}
				loading={isImporting}
				disabled={isImporting}
				style={{ flex: 1 }} // 让按钮平均占据可用空间
			>
				导入聊天记录
			</Button>
			<Button
				color="warning"
				fill="solid"
				style={{ flex: 1 }} // 让按钮平均占据可用空间
				disabled={isImporting}
				onClick={() => { mainDataHelper.clearLocalStorage(); Toast.show({ content: "已清除" }) }}
			>
				清空本地缓存
			</Button>
		</div >
		<Footer content="本工具所有数据皆在本地处理，请放心使用" 
			style={{ padding: "0 10px" }} /> 
	</Space>
	)
}