import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MessageRecord, ThemeRiverChartWorker } from '../../types';
import { Space, SpinLoading } from 'antd-mobile';
import ThemeRiverWorker from '../../worker/ThemeRiverChartData.worker?worker';

interface ChatThemeRiverChartProps {
  messages: MessageRecord[];
  groupmode: ThemeRiverChartWorker.Message['groupmode']
}

const ChatThemeRiverChart = ({ messages, groupmode }: ChatThemeRiverChartProps) => {

  const [chartOption, setChartOption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const workerRef = useRef<ThemeRiverChartWorker.WorkerInterface | null>(null);
  useEffect(() => {
    setIsLoading(true);
    // terminate existing worker (idk if this is necessary, just in case)
    workerRef.current?.terminate();
    workerRef.current = null;
    // set new worker
    workerRef.current = new ThemeRiverWorker as ThemeRiverChartWorker.WorkerInterface;
    workerRef.current.onmessage = ({ data }) => {
      setChartOption(generateChartOption(data, groupmode));
      setIsLoading(false);
    }
    workerRef.current.onerror = () => {
      setChartOption(null);
      setIsLoading(false);
    }
    workerRef.current.postMessage({ messages, groupmode });
    return () => {
      console.log("Terminating worker");
      workerRef.current?.terminate();
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


const generateChartOption = (
  chatData: ThemeRiverChartWorker.Response, 
  groupmode: ThemeRiverChartWorker.Message['groupmode']
) => {
  const { allSenders, chartData, startDate, endDate } = chatData;
  const subtitleText = `数据区间: ${startDate} 至 ${endDate}`;
  const titleText = (() => {
    switch (groupmode) {
      case ('month'): return "月度聊天动态";
      case ('day'): return "每日聊天动态（4时-次日4时）";
    }
  })();
  const legendData = Array.from(allSenders);
  
  return {
    title: {
      text: titleText,
      subtext: subtitleText,
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
      data: legendData,
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