import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MessageRecord, ThemeRiverChartWorker } from '../../types';
import { Space, SpinLoading } from 'antd-mobile';
import ThemeRiverWorker from '../../worker/ThemeRiverChartData.worker?worker';

const generateChartOption = (chatData: ThemeRiverChartWorker.Response) => {
  const {allSenders, chartData, start_date, end_date} = chatData;
  const subtitle_text = `数据区间: ${start_date} 至 ${end_date}`;
  return {
    title: {
      text: "月度聊天动态",
      subtext: subtitle_text,
      bottom: "3%",
      left: "center",
      textStyle: {
        fontSize: 16,
        color: "#A3A3A3"
      },
      subtextStyle: {
        fontSize: 10,
        color: "#777777"
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line"
      },
      textStyle: {
        fontSize: 12
      }
    },
    legend: {
      show: true,
      data: Array.from(allSenders), // 从数据中动态获取图例
      top: "6%",
      orient: "horizontal",
      textStyle: {
        fontSize: 10,
        color: "#999999"
      }
    },
    toolbox: {
      show: false, // 隐藏工具箱
    },
    singleAxis: {
      type: "time",
      top: "15%",
      bottom: "20%",
      axisLabel: {
        fontSize: 9,
        color: "#888888"
      },
    },
    series: [
      {
        type: "themeRiver",
        data: chartData,
        label: {
          show: false
        },
        emphasis: {
          disabled: true // 禁用高亮，适合移动端
        }
      }
    ],
  };
}

// 定义组件的 Props 类型
interface ChatThemeRiverChartProps {
  messages: MessageRecord[];
}

/**
 * 一个React组件，用于统计每月不同发送者的聊天数，
 * 合并发言过少的次要贡献者，并生成一个适合移动端展示的主题河流图。
 * 
 * @param {ChatThemeRiverChartProps} props - 组件的 props.
 * @param {Message[]} props.messages - 聊天消息数组.
 * @returns {React.ReactNode} - 渲染出的图表或提示信息.
 */
const ChatThemeRiverChart = ({ messages }: ChatThemeRiverChartProps) => {

  const [chartOption, setChartOption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    setIsLoading(true);
    const worker = new ThemeRiverWorker;
    workerRef.current = worker;
    worker.onmessage = (event) => {
      const data = event.data as ThemeRiverChartWorker.Response;
      setChartOption(generateChartOption(data));
      setIsLoading(false);
    }
    worker.onerror = () => {
      setChartOption(null);
      setIsLoading(false);
    }
    worker.postMessage({messages, groupmode: 'month'});
    return () => {
      console.log("Terminating worker");
      worker.terminate();
      workerRef.current = null;
    };
  }, [messages]);

  if (isLoading) {
    return (
      <Space direction='vertical' style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        <SpinLoading style={{ '--size': '48px' }} />
        <div> 正在加载中 </div>
      </Space>
    );
  }

  // 如果没有有效数据或计算结果为空，显示提示信息
  if (!chartOption) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>没有有效的消息数据来生成图表。</div>;
  }

  // --- 渲染图表 ---
  return (
    <ReactECharts
      option={chartOption}
      style={{ height: '500px' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default ChatThemeRiverChart;