/**
 * 独立排盘引擎的历法适配层。
 * 依赖 lunar-javascript 进行公历/农历转换；不调用 iztro。
 * 晚子时与闰月策略由调用方显式指定；结果保留历法来源与策略元数据。
 * 注意：出生地历史时区/DST 与真太阳时需由上游提供校正后的当地日期时间。
 */
export const CALENDAR_STEMS = Object.freeze(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
export const CALENDAR_BRANCHES = Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);

const pad2 = n => String(n).padStart(2,'0');
const mod = (n,m) => ((n % m) + m) % m;
function parseDate(s,validateSolar=true) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new TypeError('日期必须为 YYYY-MM-DD');
  const [year,month,day] = m.slice(1).map(Number);
  if(validateSolar){
    const d = new Date(Date.UTC(year,month-1,day));
    if (d.getUTCFullYear()!==year || d.getUTCMonth()!==month-1 || d.getUTCDate()!==day) throw new RangeError('公历日期无效');
  }
  return {year,month,day};
}
function shiftSolarDate(date,days) {
  const p=parseDate(date), d=new Date(Date.UTC(p.year,p.month-1,p.day+days));
  return d.getUTCFullYear()+'-'+pad2(d.getUTCMonth()+1)+'-'+pad2(d.getUTCDate());
}
function getSolarDate(solar) {
  return solar.getYear()+'-'+pad2(solar.getMonth())+'-'+pad2(solar.getDay());
}
function stemIndex(gan) {
  const i=CALENDAR_STEMS.indexOf(gan);
  if(i<0) throw new Error('历法库返回了无法识别的年干：'+gan);
  return i;
}
function branchIndex(zhi) {
  const i=CALENDAR_BRANCHES.indexOf(zhi);
  if(i<0) throw new Error('历法库返回了无法识别的年支：'+zhi);
  return i;
}
function normalizeLeapMonth(year,month,day,rule,isLeap,Lunar,LunarYear) {
  if(!isLeap) return {year,month,day,isLeapMonth:false,policy:rule,sourceMonth:month};
  const leapMonth = LunarYear.fromYear(year).getLeapMonth();
  if(leapMonth!==month) throw new RangeError('所选闰月与该农历年份的实际闰月不一致；该年闰月为'+(leapMonth||'无'));
  let targetYear=year,targetMonth=month,targetDay=day,targetLeap=false;
  if(rule==='origin-month') {
    targetLeap=true;
  } else {
    let toPrevious = rule==='prev-month' || (rule==='split' && day<=15);
    if(rule==='split' && day>15) toPrevious=false;
    if(rule!=='prev-month' && rule!=='next-month' && rule!=='split') throw new Error('不支持的闰月口径：'+rule);
    if(toPrevious) {
      targetMonth--;
      if(targetMonth===0){targetYear--;targetMonth=12;}
    } else {
      targetMonth++;
      if(targetMonth===13){targetYear++;targetMonth=1;}
    }
  }
  const targetMonthDays = targetLeap ? Lunar.fromYmd(targetYear,-targetMonth,1) : Lunar.fromYmd(targetYear,targetMonth,1);
  if(!targetMonthDays || targetDay<1 || targetDay>30) throw new RangeError('农历日期超出范围');
  const actualMonth = Lunar.fromYmd(targetYear,targetLeap?-targetMonth:targetMonth,1);
  if(typeof actualMonth.getSolar!=='function' || !actualMonth.getSolar()) throw new RangeError('无法识别所选农历月份');
  return {year:targetYear,month:targetMonth,day:targetDay,isLeapMonth:targetLeap,policy:rule,sourceMonth:month};
}
function getLunarParts(lunar) {
  const eight = lunar.getEightChar();
  const yearGan = lunar.getYearGan ? lunar.getYearGan() : eight.getYearGan();
  const yearZhi = lunar.getYearZhi ? lunar.getYearZhi() : eight.getYearZhi();
  return {
    lunarYear:lunar.getYear(),
    lunarMonth:Math.abs(lunar.getMonth()),
    lunarDay:lunar.getDay(),
    isLeapMonth:typeof lunar.getMonth==='function' && lunar.getMonth()<0,
    yearStemIndex:stemIndex(yearGan),
    yearBranchIndex:branchIndex(yearZhi),
    yearGan,yearZhi
  };
}

/**
 * Resolve user input into a normalized solar/lunar date plus traditional chart indices.
 * input: {calendar:'solar'|'lunar', date:'YYYY-MM-DD', time:'HH:mm',
 *         hourIndex:0..12, leapMonth:boolean}
 * policy: {lateZiRule:'next-day'|'current-day', leapRule:'next-month'|'prev-month'|'split'|'origin-month'}
 */
export async function resolveBirthCalendar(input,policy={lateZiRule:'next-day',leapRule:'next-month'}) {
  if(!input || typeof input!=='object') throw new TypeError('必须提供出生资料');
  const api=await import('https://esm.sh/lunar-javascript?bundle');
  const Solar=api.Solar || api.default?.Solar;
  const Lunar=api.Lunar || api.default?.Lunar;
  const LunarYear=api.LunarYear || api.default?.LunarYear;
  if(!Solar || !Lunar || !LunarYear) throw new Error('无法加载历法转换库 lunar-javascript');
  const p=parseDate(input.date,input.calendar!=='lunar');
  let solarDate=input.date, requestedLunar=null;
  const hourParts=String(input.time||'12:00').split(':').map(Number);
  const hour=hourParts[0],minute=hourParts[1]||0;
  if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59) throw new RangeError('出生时间无效');
  if(input.calendar==='lunar') {
    const month=p.month,day=p.day;
    if(month<1||month>12||day<1||day>30) throw new RangeError('农历月份必须为1至12，日期必须为1至30');
    const normalized=normalizeLeapMonth(p.year,month,day,policy.leapRule,!!input.leapMonth,Lunar,LunarYear);
    const lunarMonth=normalized.isLeapMonth?-normalized.month:normalized.month;
    const lunar=Lunar.fromYmdHms(normalized.year,lunarMonth,normalized.day,hour,minute,0);
    solarDate=getSolarDate(lunar.getSolar());
    requestedLunar={...normalized};
  }
  // For solar input, the date/time should already have had any true-solar-time correction applied upstream.
  let effectiveHourIndex=Number(input.hourIndex);
  if(!Number.isInteger(effectiveHourIndex)||effectiveHourIndex<0||effectiveHourIndex>12) throw new RangeError('时辰索引必须为0至12');
  const isLateZi=effectiveHourIndex===12 || hour===23;
  if(isLateZi) {
    if(policy.lateZiRule==='next-day') solarDate=shiftSolarDate(solarDate,1);
    else if(policy.lateZiRule!=='current-day') throw new Error('不支持的晚子时口径：'+policy.lateZiRule);
    effectiveHourIndex=0;
  }
  const solarParts=parseDate(solarDate);
  const solar=Solar.fromYmdHms(solarParts.year,solarParts.month,solarParts.day,effectiveHourIndex===0?0:hour,minute,0);
  const lunar=solar.getLunar();
  const parts=getLunarParts(lunar);
  return {
    solarDate,
    lunarDate:{year:parts.lunarYear,month:parts.lunarMonth,day:parts.lunarDay,isLeapMonth:parts.isLeapMonth},
    yearStemIndex:parts.yearStemIndex,
    yearBranchIndex:parts.yearBranchIndex,
    yearGan:parts.yearGan,
    yearZhi:parts.yearZhi,
    lunarMonth:parts.lunarMonth,
    lunarDay:parts.lunarDay,
    hourBranchIndex:effectiveHourIndex,
    policies:{lateZiRule:policy.lateZiRule,leapRule:policy.leapRule},
    sourceCalendar:input.calendar,
    requestedLunar,
    note:'历法转换使用 lunar-javascript；真太阳时/历史时区须由调用方先行校正。'
  };
}

export function runCalendarLayerSelfTests() {
  const tests=[];
  const check=(name,actual,expected)=>tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
  check('日期跨年',shiftSolarDate('2024-12-31',1),'2025-01-01');
  check('日期跨闰年二月',shiftSolarDate('2024-02-28',1),'2024-02-29');
  check('甲干索引',stemIndex('甲'),0);
  check('亥支索引',branchIndex('亥'),11);
  let invalidDateRejected=false;try{parseDate('2024-02-30')}catch{invalidDateRejected=true;}
  check('拒绝无效公历日期',invalidDateRejected,true);
  let invalidStemRejected=false;try{stemIndex('未知')}catch{invalidStemRejected=true;}
  check('拒绝未知天干',invalidStemRejected,true);
  return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}

/**
 * Fixed calendar reference cases. The 1986-05-29 <-> 1986-04-21 pair is from
 * the lunar-javascript project's published README example; these tests validate
 * calendar conversion only, not Zi Wei chart correctness.
 */
export async function runCalendarReferenceCases() {
  const api=await import('https://esm.sh/lunar-javascript?bundle');
  const Solar=api.Solar || api.default?.Solar;
  const Lunar=api.Lunar || api.default?.Lunar;
  const LunarYear=api.LunarYear || api.default?.LunarYear;
  const tests=[];
  const check=(name,actual,expected)=>tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
  const solar=Solar.fromYmd(1986,5,29);
  const lunar=solar.getLunar();
  check('公开参考例：1986-05-29 对应农历四月廿一',[lunar.getYear(),Math.abs(lunar.getMonth()),lunar.getDay()],[1986,4,21]);
  const back=Lunar.fromYmd(1986,4,21).getSolar();
  check('公开参考例：农历1986-04-21 转公历',[getSolarDate(back)],['1986-05-29']);
  check('2023年闰二月识别',LunarYear.fromYear(2023).getLeapMonth(),2);
  const leap=Lunar.fromYmd(2023,-2,1);
  check('2023闰二月初一能转换为公历',/^2023-03-22$/.test(getSolarDate(leap.getSolar())),true);
  return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
