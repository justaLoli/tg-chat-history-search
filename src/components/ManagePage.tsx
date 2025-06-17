import { Button } from "antd-mobile";
import { useState } from "react";

type ManagePageProps = {
	importChatHistory: any;
	setTabKey: any;
};

export default function ManagePage({
	importChatHistory,
	setTabKey
}: ManagePageProps) {

	const handleImport = async () => {
		const input = document.createElement('input');
		input.type = "file";
		input.addEventListener('change', async () => {
			const file = input.files?.[0];
			if (!file) return;
			setIsImporting(true);
			const text = await file.text(); try {
				importChatHistory(text, "default");
				setIsImporting(false);
				setTabKey("search");
			} catch (error) {
				setIsImporting(false);
			}
		})
		input.click();
	};

	const [isImporting, setIsImporting] = useState(false);

	return (<Button
		color="primary"
		size="small"
		fill="solid"
		onClick={handleImport}
		loading={isImporting}
		disabled={isImporting}
	>
		导入新文件
	</Button>)
}