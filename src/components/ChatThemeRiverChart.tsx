// src/components/ChatThemeRiverChart.tsx

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { MessageRecord } from '../types';

// 初始化 Day.js 插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 定义组件的 Props 类型
interface ChatThemeRiverChartProps {
  messages: MessageRecord[];
}

/**
 * 一个React组件，用于统计每月不同发送者的聊天数，
 * 合并次要贡献者，并生成一个适合移动端展示的主题河流图。
 * 
 * @param {ChatThemeRiverChartProps} props - 组件的 props.
 * @param {Message[]} props.messages - 聊天消息数组.
 * @returns {React.ReactNode} - 渲染出的图表或提示信息.
 */
const ChatThemeRiverChart = ({ messages }: ChatThemeRiverChartProps) => {
  
  // 使用 useMemo 来缓存计算结果，只有当 messages 改变时才重新计算
  const chartOption = useMemo(() => {
    // --- 1. 数据加载与清洗 ---
    // 从 props 获取数据，并过滤掉没有 'from' 字段的消息
    const validMessages = messages.filter(msg => msg.from);
    
    if (validMessages.length === 0) {
      return null; // 没有有效数据，不渲染图表
    }

    // --- 2. 数据聚合 (替代 Pandas GroupBy & Pivot) ---
    // 结构: { 'YYYY-MM': { 'senderA': count, 'senderB': count } }
    const monthlyCountsBySender = validMessages.reduce<Record<string, Record<string, number>>>((acc, msg) => {
        // 使用 Day.js 解析日期并转换为上海时区，然后格式化为 'YYYY-MM'
        const month = dayjs(msg.date).tz('Asia/Shanghai').format('YYYY-MM');
        const sender = msg.from!; // 我们已经过滤了 undefined 的情况
        
        // 初始化月份和发送者
        acc[month] = acc[month] || {};
        acc[month][sender] = (acc[month][sender] || 0) + 1;
        
        return acc;
    }, {});
    
    // --- 3. 聚合次要发送者为 "Others" ---
    const senderTotals: Record<string, number> = {};
    let totalMessages = 0;

    Object.values(monthlyCountsBySender).forEach(monthData => {
      Object.entries(monthData).forEach(([sender, count]) => {
        senderTotals[sender] = (senderTotals[sender] || 0) + count;
        totalMessages += count;
      });
    });

    const threshold = totalMessages * 0.01;
    const minorSenders = Object.keys(senderTotals).filter(
      sender => senderTotals[sender] < threshold
    );

    let dataWithOthers = monthlyCountsBySender;
    
    if (minorSenders.length > 0) {
      console.log(`检测到 ${minorSenders.length} 个次要发送者 (消息总数 < 1%)，将合并为 'Others':`, minorSenders);
      
      // 创建一个新的对象以避免直接修改
      const processedData: Record<string, Record<string, number>> = {};
      Object.entries(monthlyCountsBySender).forEach(([month, monthData]) => {
        processedData[month] = processedData[month] || {};
        let othersCount = 0;
        
        Object.entries(monthData).forEach(([sender, count]) => {
          if (minorSenders.includes(sender)) {
            othersCount += count;
          } else {
            processedData[month][sender] = count;
          }
        });

        if (othersCount > 0) {
          processedData[month]['Others'] = (processedData[month]['Others'] || 0) + othersCount;
        }
      });
      dataWithOthers = processedData;
    } else {
       console.log("未检测到次要发送者。");
    }

    // --- 4. 数据格式转换 (为 ECharts 准备) ---
    const chartData: (string | number)[][] = [];
    const allSenders = new Set<string>();
    
    Object.entries(dataWithOthers).forEach(([month, monthData]) => {
      Object.entries(monthData).forEach(([sender, count]) => {
        if (count > 0) {
          // ECharts 主题河流图需要 [日期, 数值, 系列名] 格式
          chartData.push([`${month}-01`, count, sender]);
          allSenders.add(sender);
        }
      });
    });

    const sortedMonths = Object.keys(dataWithOthers).sort();
    const start_date = dayjs(sortedMonths[0]).format('YYYY年MM月');
    const end_date = dayjs(sortedMonths[sortedMonths.length - 1]).format('YYYY年MM月');
    const subtitle_text = `数据区间: ${start_date} 至 ${end_date}`;
    
    // --- 5. ECharts 配置 (直接从 Pyecharts 配置翻译) ---
    return {
      title: {
        title: "月度聊天动态",
        subtext: subtitle_text,
        bottom: "3%",
        left: "center",
        textStyle: {
          fontSize: 16
        },
        subtextStyle: {
          fontSize: 10,
          color: "#999"
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
          fontSize: 10
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
          color: "#666"
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

  }, [messages]); // 依赖项数组

  // 如果没有有效数据或计算结果为空，显示提示信息
  if (!chartOption) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>没有有效的消息数据来生成图表。</div>;
  }

  // --- 渲染图表 ---
  return (
    <ReactECharts
      option={chartOption}
      style={{ height: '500px', width: 'calc(100% - 20px)' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default ChatThemeRiverChart;