/**
 * 通用传统紫微斗数独立命盘组装器（实验阶段）。
 *
 * 本模块把独立核心规则与辅星定位组合为一份结构化命盘；不导入 iztro。
 * 输入必须是已经校准/确认的农历年干支、农历月日与时辰地支索引。
 * 不负责公历转农历、闰月换算、真太阳时、晚子时换日或完整流派差异。
 * 四化采用 core-rules.js 中的常见传统表，部分流派存在不同口径。
 */
import { BRANCHES, PALACE_NAMES, arrangeTwelvePalaces, getSihuaByStem } from './core-rules.js';
import {
  sexagenaryIndex, locateMingShen, fiveElementsBureau, locateZiwei,
  arrangeFourteenMajorStars, palaceStemIndex
} from './traditional-core.js';
import {
  locateZuofuYoubi, locateWenchangWenqu, locateLucunQingyangTuoluo,
  locateTiankuiTianyue, locateTianma, locateDikongDijie, locateHuoxingLingxing
} from './auxiliary-stars.js';

function assertIndex(value,min,max,label) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(label + '超出有效范围');
}

const STAR_KEYS = Object.freeze([
  ['左辅','zuofuBranchIndex'],['右弼','youbiBranchIndex'],
  ['文昌','wenchangBranchIndex'],['文曲','wenquBranchIndex'],
  ['禄存','lucunBranchIndex'],['擎羊','qingyangBranchIndex'],['陀罗','tuoluoBranchIndex'],
  ['天魁','tiankuiBranchIndex'],['天钺','tianyueBranchIndex'],['天马','tianmaBranchIndex'],
  ['地空','dikongBranchIndex'],['地劫','dijieBranchIndex'],
  ['火星','huoxingBranchIndex'],['铃星','lingxingBranchIndex']
]);

/**
 * 输入索引统一约定：甲=0…癸=9；子=0…亥=11；农历月=1…12；农历日=1…30。
 */
export function buildTraditionalChart(input) {
  if (!input || typeof input !== 'object') throw new TypeError('必须提供出生参数对象');
  const { yearStemIndex, yearBranchIndex, lunarMonth, lunarDay, hourBranchIndex } = input;
  assertIndex(yearStemIndex,0,9,'生年天干索引');
  assertIndex(yearBranchIndex,0,11,'生年地支索引');
  assertIndex(lunarMonth,1,12,'农历月份');
  assertIndex(lunarDay,1,30,'农历日期');
  assertIndex(hourBranchIndex,0,11,'时辰地支索引');
  if (sexagenaryIndex(yearStemIndex,yearBranchIndex) < 0) {
    throw new RangeError('生年天干与地支不是有效的六十甲子组合');
  }

  const mingShen = locateMingShen(lunarMonth,hourBranchIndex);
  const bureau = fiveElementsBureau(yearStemIndex,mingShen.mingBranchIndex);
  const ziwei = locateZiwei(lunarDay,bureau.bureau);
  const major = arrangeFourteenMajorStars(ziwei.branchIndex);
  const zuofuYoubi = locateZuofuYoubi(lunarMonth);
  const wenchangWenqu = locateWenchangWenqu(hourBranchIndex);
  const lucunQingyangTuoluo = locateLucunQingyangTuoluo(yearStemIndex);
  const tiankuiTianyue = locateTiankuiTianyue(yearStemIndex);
  const tianma = locateTianma(yearBranchIndex);
  const dikongDijie = locateDikongDijie(hourBranchIndex);
  const huoxingLingxing = locateHuoxingLingxing(yearBranchIndex,hourBranchIndex);

  const auxiliary = {};
  for (const [name,key] of STAR_KEYS) {
    const source = [zuofuYoubi,wenchangWenqu,lucunQingyangTuoluo,tiankuiTianyue,tianma,dikongDijie,huoxingLingxing]
      .find(item => Object.prototype.hasOwnProperty.call(item,key));
    auxiliary[name] = source[key];
  }

  const palaces = arrangeTwelvePalaces(mingShen.mingBranchIndex).map(palace => {
    const branchIndex = palace.branchIndex;
    const majorStars = major.starsByBranch[branchIndex].stars.slice();
    const auxiliaryStars = Object.entries(auxiliary).filter(([,starBranch]) => starBranch === branchIndex).map(([name]) => name);
    const palaceStem = palaceStemIndex(yearStemIndex,branchIndex);
    return {
      ...palace,
      stemIndex: palaceStem,
      stem: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][palaceStem],
      majorStars,
      auxiliaryStars,
      sihua: []
    };
  });

  const sihuaStars = getSihuaByStem(yearStemIndex);
  const sihuaNames = ['化禄','化权','化科','化忌'];
  sihuaStars.forEach((starName,index) => {
    const palace = palaces.find(p => p.majorStars.includes(starName) || p.auxiliaryStars.includes(starName));
    if (palace) palace.sihua.push({ type:sihuaNames[index], star:starName });
  });

  return {
    engine: 'traditional-independent-experimental',
    verifiedInputs: { yearStemIndex, yearBranchIndex, lunarMonth, lunarDay, hourBranchIndex },
    mingShen: {
      mingBranchIndex: mingShen.mingBranchIndex,
      mingBranch: BRANCHES[mingShen.mingBranchIndex],
      shenBranchIndex: mingShen.shenBranchIndex,
      shenBranch: BRANCHES[mingShen.shenBranchIndex]
    },
    bureau,
    ziwei: { branchIndex: ziwei.branchIndex, branch: ziwei.branch, tianfuBranchIndex: major.tianfuBranchIndex, tianfuBranch: BRANCHES[major.tianfuBranchIndex] },
    palaces,
    auxiliaryStarPositions: Object.fromEntries(Object.entries(auxiliary).map(([name,branchIndex]) => [name,{branchIndex,branch:BRANCHES[branchIndex]}])),
    notes: [
      '本结果使用独立实验模块组装，不调用 iztro。',
      '输入的农历日期与生年干支须由调用方先行核实。',
      '四化表和部分安星规则存在流派差异；本结果尚未通过完整标准命例逐盘验证。',
      '不用于声称《天纪》专属算法或预测准确性。'
    ]
  };
}

export function runTraditionalChartSelfTests() {
  const tests = [];
  const check = (name,actual,expected) => tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
  const sample = buildTraditionalChart({yearStemIndex:0,yearBranchIndex:0,lunarMonth:1,lunarDay:1,hourBranchIndex:0});
  check('组装命盘包含十二宫',sample.palaces.length,12);
  check('命宫在首宫',sample.palaces[0].name,'命宫');
  check('宫位地支互不重复',new Set(sample.palaces.map(p=>p.branchIndex)).size,12);
  check('每宫均有主星与辅星字段',sample.palaces.every(p=>Array.isArray(p.majorStars)&&Array.isArray(p.auxiliaryStars)),true);
  check('十四主星全部进入十二宫',sample.palaces.reduce((n,p)=>n+p.majorStars.length,0),14);
  check('十四颗已实现辅星均有位置',Object.keys(sample.auxiliaryStarPositions).length,14);
  check('返回结果明确标记实验引擎',sample.engine,'traditional-independent-experimental');
  let invalidSexagenaryRejected = false;
  try { buildTraditionalChart({yearStemIndex:0,yearBranchIndex:1,lunarMonth:1,lunarDay:1,hourBranchIndex:0}); }
  catch { invalidSexagenaryRejected = true; }
  check('拒绝无效的年干支组合',invalidSexagenaryRejected,true);
  return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
