/**
 * 可复算标准边界案例。
 * 来源：iztro 项目公开测试 palace.test.ts 中的 getSoulAndBody 案例。
 * 这里仅用其公开的出生日期/时辰作为交叉核验输入，并将宫位转换为本项目
 * 子=0…亥=11 的索引；本测试不把 iztro 的整张星盘当作本项目规则的唯一标准。
 */
import { resolveBirthCalendar } from './calendar-layer.js?v=20261029-6';
import { locateMingShen, fiveElementsBureau } from './traditional-core.js';
import { calculateTianjiBureau } from './tianji-engine.js';
import { buildTraditionalChart } from './traditional-chart.js';

export async function runStandardCaseSuite() {
  const tests=[];
  const check=(name,actual,expected)=>tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
  const first=await resolveBirthCalendar(
    {calendar:'solar',date:'2023-01-22',time:'10:00',hourIndex:5,leapMonth:false},
    {lateZiRule:'current-day',leapRule:'next-month'}
  );
  check('标准案例A：2023-01-22 公历转农历日期',[first.lunarDate.year,first.lunarDate.month,first.lunarDate.day],[2023,1,1]);
  check('标准案例A：年柱癸卯索引',[first.yearStemIndex,first.yearBranchIndex],[9,3]);
  const firstPalaces=locateMingShen(first.lunarMonth,first.hourBranchIndex);
  check('标准案例A：命宫酉、身宫未',[firstPalaces.mingBranchIndex,firstPalaces.shenBranchIndex],[9,7]);
  const firstChart=buildTraditionalChart({...first,hourBranchIndex:first.hourBranchIndex});
  check('标准案例A：组装后十四主星总数',firstChart.palaces.reduce((n,p)=>n+p.majorStars.length,0),14);
  check('标准案例A：十二宫地支无重复',new Set(firstChart.palaces.map(p=>p.branchIndex)).size,12);

  const second=await resolveBirthCalendar(
    {calendar:'solar',date:'2023-02-19',time:'23:00',hourIndex:12,leapMonth:false},
    {lateZiRule:'current-day',leapRule:'next-month'}
  );
  check('标准案例B：晚子时保留当日日期',second.solarDate,'2023-02-19');
  check('标准案例B：晚子时归子时',second.hourBranchIndex,0);
  const secondPalaces=locateMingShen(second.lunarMonth,second.hourBranchIndex);
  check('标准案例B：命身宫均在寅',[secondPalaces.mingBranchIndex,secondPalaces.shenBranchIndex],[2,2]);
  const secondChart=buildTraditionalChart({...second,hourBranchIndex:second.hourBranchIndex});
  check('标准案例B：十四主星总数',secondChart.palaces.reduce((n,p)=>n+p.majorStars.length,0),14);
  return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
