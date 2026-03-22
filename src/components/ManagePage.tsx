import { Button, Footer, NavBar, Space, Toast } from "antd-mobile";
import { useState } from "react";
import { useGlobal } from "./GlobalProvider";
import { MessageRecord } from "../types";


export default function ManagePage() {

	const { switchTab, mainDataHelper, chatKey } = useGlobal();

	const handleImport = async () => {
		const getFileFromInput = () =>
			new Promise<File | undefined>(resolve => {
				const input = document.createElement('input');
				input.type = "file";
				input.oncancel = () => resolve(undefined);
				input.onchange = () => resolve(input.files?.[0]);
				input.click();
			});
		const importFile = async (file: File) => {
			setIsImporting(true);
			const text = await file.text();
			try {
				mainDataHelper.importChatHistory(text, "default");
				switchTab("search");
			} catch (error) {
				Toast.show({icon:"fail", content: "导入发生错误"})
			}finally {
				setIsImporting(false);
			}
		};
		const file = await getFileFromInput();
		if(!file) return;
		await importFile(file);
	};

	const handleClearData = () => {
		mainDataHelper.clearLocalStorage();
		Toast.show({ content: "已清除" })
	}

	const handleMinify = () => {
		const messages = mainDataHelper.getChatHistory(chatKey)?.messages;
		if (!messages) {
			Toast.show({ icon: 'fail', content: "未导入数据" })
			return;
		}
		const truncateWords = (text: string, limit: number = 100): string => {
			const words = text.trim().split(/\s+/);
			if (words.length <= limit) return text;
			return words.slice(0, limit).join(" ") + "...";
		};
		const normalizeNewlines = (text: string): string => {
			// 把换行变成可见符号
			return text.replace(/\r?\n/g, " ⏎ ");
		};
		const extractDate = (date: string): string => {
			return date.slice(0, 10);
		};
		const buildChatText = (messages: MessageRecord[]): string => {
			let result: string[] = [];
			let lastDate = "";
			messages.forEach(msg => {
				const currentDate = extractDate(msg.date);
				if (currentDate !== lastDate) {
					result.push(currentDate);
					lastDate = currentDate;
				}
				let text = msg.text;
				text = normalizeNewlines(text);
				text = truncateWords(text, 100);
				result.push(`${msg.from}: ${text}`);
			})
			return result.join("\n");
		};
		const downloadText = (text: string, filename: string) => {
			const blob = new Blob([text], { type: "text/plain" });
			const url = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();

			URL.revokeObjectURL(url);
		};
		downloadText(buildChatText(messages), "messages.txt");
		Toast.show({ content: "以发起下载" })
	}

	const [isImporting, setIsImporting] = useState(false);

	return (<Space direction="vertical" block >
		{/*First Line*/}
		<div
			style={{
				display: "flex",           // 启用 Flexbox 布局
				justifyContent: "space-between", // 在项目之间平均分配空间
				gap: "10px",               // 设置项目之间的间距
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
				onClick={handleClearData}
			>
				清空本地缓存
			</Button>
		</div >
		{/*Second Line*/}
		<NavBar back={null}> 其它工具 </NavBar>
		<div
			style={{
				display: "flex",           // 启用 Flexbox 布局
				justifyContent: "space-between", // 在项目之间平均分配空间
				gap: "10px",               // 设置项目之间的间距
			}}
		>
			<Button
				color="default"
				fill="solid"
				onClick={handleMinify}
				disabled={isImporting}
				style={{ flex: 1 }} // 让按钮平均占据可用空间
			>
				简化聊天记录为TXT
			</Button>
		</div >
		<Footer content="本工具所有数据皆在本地处理，请放心使用" /> 
	</Space>
	)
}