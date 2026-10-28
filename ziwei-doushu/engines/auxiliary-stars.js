/**
 * 通用传统紫微斗数辅星基础定位（实验模块）。
 * 规则口径：常见传统安星诀；不同流派对部分星曜及闰月/时辰边界可能另有差异。
 * 本模块只实现左辅、右弼、文昌、文曲、禄存、擎羊、陀罗的基础位置，
 * 不代表完整流派算法，且尚需以可信完整命例继续交叉核验。
 * 地支索引：子=0、丑=1、寅=2……亥=11；天干索引：甲=0……癸=9。
 */
const BRANCHES = Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
const STEMS = Object.freeze(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
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

/** 禄存按生年天干；擎羊在禄存后一支，陀罗在禄存前一支。 */
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

export function runAuxiliaryStarSelfTests() {
  const tests = [];
  const check = (name,actual,expected) => tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
  check('正月左辅在辰右弼在戌',[locateZuofuYoubi(1).zuofuBranch,locateZuofuYoubi(1).youbiBranch],['辰','戌']);
  check('十二月左辅在卯右弼在酉',[locateZuofuYoubi(12).zuofuBranch,locateZuofuYoubi(12).youbiBranch],['卯','酉']);
  check('子时文昌在戌文曲在辰',[locateWenchangWenqu(0).wenchangBranch,locateWenchangWenqu(0).wenquBranch],['戌','辰']);
  check('亥时文昌在亥文曲在卯',[locateWenchangWenqu(11).wenchangBranch,locateWenchangWenqu(11).wenquBranch],['亥','卯']);
  check('甲年禄存寅擎羊卯陀罗丑',[locateLucunQingyangTuoluo(0).lucunBranch,locateLucunQingyangTuoluo(0).qingyangBranch,locateLucunQingyangTuoluo(0).tuoluoBranch],['寅','卯','丑']);
  check('乙年禄存卯擎羊辰陀罗寅',[locateLucunQingyangTuoluo(1).lucunBranch,locateLucunQingyangTuoluo(1).qingyangBranch,locateLucunQingyangTuoluo(1).tuoluoBranch],['卯','辰','寅']);
  check('癸年禄存子擎羊丑陀罗亥',[locateLucunQingyangTuoluo(9).lucunBranch,locateLucunQingyangTuoluo(9).qingyangBranch,locateLucunQingyangTuoluo(9).tuoluoBranch],['子','丑','亥']);
  return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
