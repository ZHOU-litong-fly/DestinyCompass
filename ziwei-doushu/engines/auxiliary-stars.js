/**
 * 通用传统紫微斗数辅星基础定位（实验模块）。
 * 规则依据：常见传统安星诀；不同流派对个别星曜/边界可能有差异。
 * 本模块实现左辅右弼、文昌文曲、禄存擎羊陀罗、天魁天钺、天马、
 * 地空地劫、火星铃星的位置计算；不代表完整流派算法，仍需完整命例核验。
 * 参考：紫微斗数全书·卷二安星诀（公开古籍文本）及 iztro 安星诀说明。
 * 地支索引：子=0、丑=1、寅=2……亥=11；天干索引：甲=0……癸=9。
 */
const BRANCHES = Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
const mod = (n,m) => ((n % m) + m) % m;
function assertRange(v,min,max,label) {
  if (!Number.isInteger(v) || v < min || v > max) throw new RangeError(label + '超出有效范围');
}

/** 左辅正月起辰顺行；右弼正月起戌逆行。 */
export function locateZuofuYoubi(lunarMonth) {
  assertRange(lunarMonth,1,12,'农历月份');
  const zuofu = mod(4 + lunarMonth - 1,12);
  const youbi = mod(10 - (lunarMonth - 1),12);
  return { zuofuBranchIndex:zuofu, zuofuBranch:BRANCHES[zuofu], youbiBranchIndex:youbi, youbiBranch:BRANCHES[youbi] };
}

/** 文昌戌起子时逆行；文曲辰起子时顺行。 */
export function locateWenchangWenqu(hourBranchIndex) {
  assertRange(hourBranchIndex,0,11,'时辰地支索引');
  const wenchang = mod(10 - hourBranchIndex,12);
  const wenqu = mod(4 + hourBranchIndex,12);
  return { wenchangBranchIndex:wenchang, wenchangBranch:BRANCHES[wenchang], wenquBranchIndex:wenqu, wenquBranch:BRANCHES[wenqu] };
}

/** 禄存按年干；擎羊在禄存后一支，陀罗在禄存前一支。 */
export function locateLucunQingyangTuoluo(yearStemIndex) {
  assertRange(yearStemIndex,0,9,'生年天干索引');
  const lucunByStem = [2,3,5,6,5,6,8,9,11,0];
  const lucun = lucunByStem[yearStemIndex];
  const qingyang = mod(lucun + 1,12);
  const tuoluo = mod(lucun - 1,12);
  return {
    lucunBranchIndex:lucun, lucunBranch:BRANCHES[lucun],
    qingyangBranchIndex:qingyang, qingyangBranch:BRANCHES[qingyang],
    tuoluoBranchIndex:tuoluo, tuoluoBranch:BRANCHES[tuoluo]
  };
}

/** 天魁天钺按生年天干。 */
export function locateTiankuiTianyue(yearStemIndex) {
  assertRange(yearStemIndex,0,9,'生年天干索引');
  const table = [
    [1,7], [0,8], [11,9], [11,9], [1,7],
    [0,8], [1,7], [6,2], [3,5], [3,5]
  ];
  const [kui,yue] = table[yearStemIndex];
  return { tiankuiBranchIndex:kui, tiankuiBranch:BRANCHES[kui], tianyueBranchIndex:yue, tianyueBranch:BRANCHES[yue] };
}

/** 天马按生年地支三合局。 */
export function locateTianma(yearBranchIndex) {
  assertRange(yearBranchIndex,0,11,'生年地支索引');
  const group = Math.floor(yearBranchIndex % 4);
  const byBranch = new Map([
    [0,2], [4,2], [8,2],       // 申子辰 -> 寅
    [2,8], [6,8], [10,8],      // 寅午戌 -> 申
    [1,11], [5,11], [9,11],    // 巳酉丑 -> 亥
    [3,5], [7,5], [11,5]       // 亥卯未 -> 巳
  ]);
  const branch = byBranch.get(yearBranchIndex);
  return { tianmaBranchIndex:branch, tianmaBranch:BRANCHES[branch] };
}

/** 亥上起子时，地劫顺行、地空逆行。 */
export function locateDikongDijie(hourBranchIndex) {
  assertRange(hourBranchIndex,0,11,'时辰地支索引');
  const dijie = mod(11 + hourBranchIndex,12);
  const dikong = mod(11 - hourBranchIndex,12);
  return {
    dikongBranchIndex:dikong, dikongBranch:BRANCHES[dikong],
    dijieBranchIndex:dijie, dijieBranch:BRANCHES[dijie]
  };
}

/**
 * 火铃按年支三合组定子时起点，再顺数至出生时辰。
 * 返回的起点表按常见《紫微斗数全书》安火铃诀整理。
 */
export function locateHuoxingLingxing(yearBranchIndex,hourBranchIndex) {
  assertRange(yearBranchIndex,0,11,'生年地支索引');
  assertRange(hourBranchIndex,0,11,'时辰地支索引');
  const groupStarts = {
    0:[2,10], 4:[2,10], 8:[2,10],       // 申子辰：寅、戌
    2:[1,3], 6:[1,3], 10:[1,3],        // 寅午戌：丑、卯
    1:[3,10], 5:[3,10], 9:[3,10],      // 巳酉丑：卯、戌
    3:[9,10], 7:[9,10], 11:[9,10]      // 亥卯未：酉、戌
  };
  const [fireStart,bellStart] = groupStarts[yearBranchIndex];
  const huoxing = mod(fireStart + hourBranchIndex,12);
  const lingxing = mod(bellStart + hourBranchIndex,12);
  return {
    huoxingStartBranchIndex:fireStart, lingxingStartBranchIndex:bellStart,
    huoxingBranchIndex:huoxing, huoxingBranch:BRANCHES[huoxing],
    lingxingBranchIndex:lingxing, lingxingBranch:BRANCHES[lingxing]
  };
}

export function runAuxiliaryStarSelfTests() {
  const tests = [];
  const check = (name,actual,expected) => tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
  check('正月左辅在辰右弼在戌',[locateZuofuYoubi(1).zuofuBranch,locateZuofuYoubi(1).youbiBranch],['辰','戌']);
  check('十二月左辅在卯右弼在亥',[locateZuofuYoubi(12).zuofuBranch,locateZuofuYoubi(12).youbiBranch],['卯','亥']);
  check('子时文昌在戌文曲在辰',[locateWenchangWenqu(0).wenchangBranch,locateWenchangWenqu(0).wenquBranch],['戌','辰']);
  check('亥时文昌在亥文曲在卯',[locateWenchangWenqu(11).wenchangBranch,locateWenchangWenqu(11).wenquBranch],['亥','卯']);
  check('甲年禄存寅擎羊卯陀罗丑',[locateLucunQingyangTuoluo(0).lucunBranch,locateLucunQingyangTuoluo(0).qingyangBranch,locateLucunQingyangTuoluo(0).tuoluoBranch],['寅','卯','丑']);
  check('乙年禄存卯擎羊辰陀罗寅',[locateLucunQingyangTuoluo(1).lucunBranch,locateLucunQingyangTuoluo(1).qingyangBranch,locateLucunQingyangTuoluo(1).tuoluoBranch],['卯','辰','寅']);
  check('癸年禄存子擎羊丑陀罗亥',[locateLucunQingyangTuoluo(9).lucunBranch,locateLucunQingyangTuoluo(9).qingyangBranch,locateLucunQingyangTuoluo(9).tuoluoBranch],['子','丑','亥']);
  check('甲年天魁丑天钺未',[locateTiankuiTianyue(0).tiankuiBranch,locateTiankuiTianyue(0).tianyueBranch],['丑','未']);
  check('辛年天魁午天钺寅',[locateTiankuiTianyue(7).tiankuiBranch,locateTiankuiTianyue(7).tianyueBranch],['午','寅']);
  check('子年天马在寅',locateTianma(0).tianmaBranch,'寅');
  check('寅年天马在申',locateTianma(2).tianmaBranch,'申');
  check('子时地空地劫同在亥',[locateDikongDijie(0).dikongBranch,locateDikongDijie(0).dijieBranch],['亥','亥']);
  check('午时地空地劫同在巳',[locateDikongDijie(6).dikongBranch,locateDikongDijie(6).dijieBranch],['巳','巳']);
  check('申子辰年子时火星寅铃星戌',[locateHuoxingLingxing(0,0).huoxingBranch,locateHuoxingLingxing(0,0).lingxingBranch],['寅','戌']);
  check('寅午戌年卯时火星巳铃星未',[locateHuoxingLingxing(2,3).huoxingBranch,locateHuoxingLingxing(2,3).lingxingBranch],['辰','未']);
  return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
