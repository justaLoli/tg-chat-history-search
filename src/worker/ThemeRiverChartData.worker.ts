import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { MessageRecord, ThemeRiverChartWorker } from '../types'; // Make sure the path to your types is correct

// Initialize Day.js plugins within the worker
dayjs.extend(utc);
dayjs.extend(timezone);

const generateChartOption = (
  messages: MessageRecord[], 
  groupmode: 'month' | 'day' = 'month'
): ThemeRiverChartWorker.Response => {

  // --- 1. 数据加载与清洗 ---
  // 从 props 获取数据，并过滤掉没有 'from' 字段的消息
  const validMessages = messages.filter(msg => msg.from);
    
  if (validMessages.length === 0) {
    // 让外部通过onerror处理，固定这里的返回格式
    throw Error("no messages!")
  }

  // --- 2. 数据聚合 (替代 Pandas GroupBy & Pivot) ---
  // 结构: { 'YYYY-MM': { 'senderA': count, 'senderB': count } }
  type MonthlyCountsBySender = {
    [month: string]: { [sender: string]: number } //Record<string, Record<string, number>>;
  }
  const monthlyCountsBySender = validMessages.reduce<MonthlyCountsBySender>((acc, msg) => {
    // 使用 Day.js 解析日期并转换为上海时区，然后格式化为 'YYYY-MM'
    // let month:string = '';
    const month = (() => {
      switch (groupmode) {
        case 'month': return dayjs(msg.date).tz('Asia/Shanghai').format('YYYY-MM'); break;
        case 'day': return dayjs(msg.date).tz('Asia/Shanghai').subtract(4, 'hour').startOf('day').format('YYYY-MM-DD');
      }
    })();
    const sender = msg.from!; // 我们已经过滤了 undefined 的情况
    // 初始化月份和发送者
    acc[month] = acc[month] || {};
    acc[month][sender] = (acc[month][sender] || 0) + 1;
        
    return acc;
  }, {});
    
  // --- 3. 聚合次要发送者为 "Others" ---
  type TotalCountsBySender = {
    [sender: string]: number
  }
  const totalCountsBySender: TotalCountsBySender = {};
  let totalMessages = 0;

  Object.values(monthlyCountsBySender).forEach(monthData => {
    Object.entries(monthData).forEach(([sender, count]) => {
      totalCountsBySender[sender] = (totalCountsBySender[sender] || 0) + count;
      totalMessages += count;
    });
  });
  const threshold = totalMessages * 0.01;
  const minorSenders = Object.keys(totalCountsBySender).filter(
    sender => totalCountsBySender[sender] < threshold
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
  const chartData: [string, number, string][] = [];
  const allSenders = new Set<string>();
    
  Object.entries(dataWithOthers).forEach(([month, monthData]) => {
    Object.entries(monthData).forEach(([sender, count]) => {
      if (count > 0) {
        // ECharts 主题河流图需要 [日期, 数值, 系列名] 格式
        switch (groupmode) {
          case 'month': chartData.push([`${month}-01`, count, sender]); break;
          case 'day': chartData.push([`${month}`, count, sender]); break;
        }
        allSenders.add(sender);
      }
    });
  });

  const sortedMonths = Object.keys(dataWithOthers).sort();
  const start_date = dayjs(sortedMonths[0]).format('YYYY年MM月');
  const end_date = dayjs(sortedMonths[sortedMonths.length - 1]).format('YYYY年MM月');

  return {
    allSenders,
    chartData,
    start_date,
    end_date
  };
}

self.onmessage = (e: MessageEvent<ThemeRiverChartWorker.Message>) => {
  console.log('Worker: Received messages from main thread.');
  const { messages, groupmode } = e.data;
  
  // Perform the heavy calculation
  // note: if error happens, the outside will handle it in the onerror() method.
  const chartOption = generateChartOption(messages, groupmode);
  // Send the result back to the main thread
  self.postMessage(chartOption);
  
};