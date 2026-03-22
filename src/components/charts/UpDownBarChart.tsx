import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

// --- SETUP DAYJS PLUGINS (do this once in your app's entry point) ---
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

// --- 1. INPUT DATA TYPES (as per requirements) ---

export type MessageRecord = {
  id: number;
  text: string;
  from: string;
  /**
   * Date string, assumed to be in a format dayjs can parse (e.g., ISO 8601 UTC format: '2023-12-25T10:30:00Z')
   */
  date: string;
};

// --- PROPS FOR THE REACT COMPONENT ---

interface DailyMessageChartProps {
  messages: MessageRecord[];
  /** Optional style for the chart container */
  style?: React.CSSProperties;
}

// --- 2. DATA PROCESSING LOGIC (replaces the Python/Pandas part) ---

/**
 * Processes a list of messages into daily counts suitable for the chart.
 * This function replicates the pandas logic using dayjs and JavaScript.
 * @param messages The raw message records.
 * @returns An object containing data ready for ECharts series.
 */
const processChartData = (messages: MessageRecord[]) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  // Step 1: Group messages by "business day" (5 AM to 5 AM UTC+8) and sender.
  const dailyCountsBySender = new Map<string, Map<string, number>>();
  let minDate: dayjs.Dayjs | null = null;
  let maxDate: dayjs.Dayjs | null = null;
  const senders = new Set<string>();

  for (const msg of messages) {
    // Ensure message has a 'from' property
    if (!msg.from) continue;
    
    senders.add(msg.from);

    const dateUtc8 = dayjs(msg.date).tz('Asia/Shanghai');
    
    // A "business day" is from 5 AM to 5 AM the next day.
    // By subtracting 5 hours, any time before 5 AM falls into the previous calendar day.
    const businessDay = dateUtc8.subtract(5, 'hour').startOf('day');
    const dayKey = businessDay.format('YYYY-MM-DD');
    
    // Track min/max dates for filling gaps later
    if (!minDate || businessDay.isBefore(minDate)) {
      minDate = businessDay;
    }
    if (!maxDate || businessDay.isAfter(maxDate)) {
      maxDate = businessDay;
    }

    // Aggregate counts
    const dayMap = dailyCountsBySender.get(dayKey) || new Map<string, number>();
    const currentCount = dayMap.get(msg.from) || 0;
    dayMap.set(msg.from, currentCount + 1);
    dailyCountsBySender.set(dayKey, dayMap);
  }

  const senderList = Array.from(senders);
  if (senderList.length !== 2) {
    console.error(`This chart type is only suitable for exactly two senders. Detected ${senderList.length}: ${senderList.join(', ')}`);
    // You could return an error state or specific data to render an error message
    return { error: `This chart requires exactly two senders. Found ${senderList.length}.` };
  }

  const [sender1, sender2] = senderList;

  // Step 2: Fill in any missing dates between min and max date to ensure a continuous timeline.
  // This replicates the pandas `resample('D').sum()` behavior.
  const xData: string[] = [];
  const yDataSender1: number[] = [];
  const yDataSender2: (number | string)[] = []; // Use string for JS code formatter compatibility if needed

  if (minDate && maxDate) {
    let currentDate = minDate;
    while (currentDate.isBefore(maxDate) || currentDate.isSame(maxDate, 'day')) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const counts = dailyCountsBySender.get(dayKey);

      xData.push(dayKey);
      yDataSender1.push(counts?.get(sender1) || 0);
      // The second series data must be negative for the up-down effect
      yDataSender2.push((counts?.get(sender2) || 0) * -1);
      
      currentDate = currentDate.add(1, 'day');
    }
  }

  return {
    sender1,
    sender2,
    xData,
    yDataSender1,
    yDataSender2,
    error: null,
  };
};


// --- 3. THE REACT COMPONENT ---

const DailyMessageChart: React.FC<DailyMessageChartProps> = ({ messages, style }) => {
  
  // useMemo ensures that the expensive data processing only runs when the 'messages' prop changes.
  const chartData = useMemo(() => processChartData(messages), [messages]);

  if (!chartData) {
    return <div style={style}>Loading chart data...</div>;
  }
  
  if (chartData.error) {
     return <div style={{ padding: '20px', color: 'red', ...style }}>Error: {chartData.error}</div>;
  }

  const { sender1, sender2, xData, yDataSender1, yDataSender2 } = chartData;

  // --- ECHARTS OPTION (replicates the pyecharts configuration) ---
  const option: EChartsOption = {
    title: {
      text: "Daily Message Comparison (UTC+8, 5am-5am)",
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      // JavaScript formatter for Tooltip, directly translated from Python's JsCode
      formatter: (params: any) => {
        let sum = 0;
        params.forEach((t: any) => { sum += Math.abs(t.value) });
        let res = `${params[0].name}: ${sum}`;
        for (let i = 0, l = params.length; i < l; i++) {
            const value = Math.abs(params[i].value);
            res += `<br/>${params[i].marker}${params[i].seriesName} : ${value}`;
        }
        return res;
      }
    },
    legend: {
      show: true,
      data: [sender1, sender2],
    },
    grid: { // Add grid padding to prevent labels from being cut off
        left: '3%',
        right: '4%',
        bottom: '10%', // Increased bottom for dataZoom
        containLabel: true
    },
    toolbox: {
      show: true,
      feature: {
          dataZoom: { yAxisIndex: 'none' },
          magicType: { type: ['line', 'bar'] },
          restore: {},
          saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
      name: 'Message Count',
      interval: 100,
      axisLabel: {
        // JavaScript formatter for Y-axis labels
        formatter: (value: number) => `${Math.abs(value)}`,
      },
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: 100,
        xAxisIndex: [0],
        bottom: 10, // Position slider at the bottom
      },
      {
        type: 'inside',
        start: 0,
        end: 100,
        xAxisIndex: [0],
      },
    ],
    series: [
      {
        name: sender1,
        type: 'bar',
        stack: 'total', // Stacking is key for the up-down effect
        label: {
          show: false,
        },
        emphasis: { // Optional: for better hover effect
          focus: 'series'
        },
        data: yDataSender1,
        // Set item style with rounded corners for the top series
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
        },
      },
      {
        name: sender2,
        type: 'bar',
        stack: 'total',
        label: {
          show: false,
        },
        emphasis: {
          focus: 'series'
        },
        data: yDataSender2,
        // Set item style with rounded corners for the bottom series
        itemStyle: {
          borderRadius: [0, 0, 3, 3],
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '600px', width: '1200px', ...style }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default DailyMessageChart;