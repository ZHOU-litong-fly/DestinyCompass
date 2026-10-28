/**
 * 命运罗盘：独立紫微斗数算法基础规则（第一阶段）
 *
 * 重要说明：
 * - 本模块不导入 iztro，也不调用任何第三方排盘引擎。
 * - 目前实现并自检的是宫位定位、年干索引、年干四化与禄存定位等基础规则。
 * - 这不是完整排盘引擎：五行局、紫微星定位、十四主星与辅杂曜安星、完整历法边界仍需实现并通过标准命例核验。
 * - 不要在完成后续阶段前，将此模块宣称为完整《天纪》算法或完整传统排盘算法。
 *
 * 地支索引统一为：子=0、丑=1、寅=2、卯=3、辰=4、巳=5、
 * 午=6、未=7、申=8、酉=9、戌=10、亥=11。
 */
export const BRANCHES = Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
export const STEMS = Object.freeze(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
export const PALACE_NAMES = Object.freeze(['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫']);

/** 年份转换为天干索引；调用方必须先确定采用的换年口径及对应农历年。 */
export function yearStemIndex(year) {
  if (!Number.isInteger(year) || year < 1) throw new RangeError('年份必须为正整数');
  return ((year - 4) % 10 + 10) % 10;
}

/** 年份转换为地支索引；调用方必须先确定采用的换年口径及对应农历年。 */
export function yearBranchIndex(year) {
  if (!Number.isInteger(year) || year < 1) throw new RangeError('年份必须为正整数');
  return ((year - 4) % 12 + 12) % 12;
}

/**
 * 依据农历月与时辰地支，独立计算命宫、身宫地支索引。
 * lunarMonth: 1..12；hourBranch: 子=0..亥=11。
 * 规则：寅起正月，顺数生月；从生月宫起，逆数生时安命宫，顺数生时安身宫。
 */
export function locateMingShenPalaces(lunarMonth, hourBranch) {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError('农历月份必须为 1 到 12');
  }
  if (!Number.isInteger(hourBranch) || hourBranch < 0 || hourBranch > 11) {
    throw new RangeError('时辰地支索引必须为 0 到 11');
  }
  const monthBranch = (lunarMonth + 1) % 12; // 正月=寅(2)
  return {
    monthBranch,
    mingBranch: (monthBranch - hourBranch + 12) % 12,
    shenBranch: (monthBranch + hourBranch) % 12
  };
}

/** 由命宫地支生成十二宫落支。宫序依次为命、兄弟、夫妻……父母。 */
export function arrangeTwelvePalaces(mingBranch) {
  if (!Number.isInteger(mingBranch) || mingBranch < 0 || mingBranch > 11) {
    throw new RangeError('命宫地支索引必须为 0 到 11');
  }
  return PALACE_NAMES.map((name, index) => ({
    name,
    branchIndex: (mingBranch - index + 12) % 12,
    branch: BRANCHES[(mingBranch - index + 12) % 12]
  }));
}

/** 年干四化表：[化禄、化权、化科、化忌]。这是通用传统常见口径，流派差异需单独配置。 */
export const SIHUA_BY_STEM = Object.freeze({
  0: Object.freeze(['廉贞','破军','武曲','太阳']), // 甲
  1: Object.freeze(['天机','天梁','紫微','太阴']), // 乙
  2: Object.freeze(['天同','天机','文昌','廉贞']), // 丙
  3: Object.freeze(['太阴','天同','天机','巨门']), // 丁
  4: Object.freeze(['贪狼','太阴','右弼','天机']), // 戊
  5: Object.freeze(['武曲','贪狼','天梁','文曲']), // 己
  6: Object.freeze(['太阳','武曲','太阴','天同']), // 庚
  7: Object.freeze(['巨门','太阳','文曲','文昌']), // 辛
  8: Object.freeze(['天梁','紫微','左辅','武曲']), // 壬
  9: Object.freeze(['破军','巨门','太阴','贪狼'])  // 癸
});

/** 由年干索引获取四化星；返回副本，避免调用方意外修改常量。 */
export function getSihuaByStem(stemIndex) {
  if (!Number.isInteger(stemIndex) || stemIndex < 0 || stemIndex > 9) {
    throw new RangeError('天干索引必须为 0 到 9');
  }
  return [...SIHUA_BY_STEM[stemIndex]];
}

/** 禄存落宫（地支索引），通用传统常见表。 */
export const LUCUN_BY_STEM = Object.freeze([2,3,5,6,5,6,8,9,11,0]);

export function locateLucun(stemIndex) {
  if (!Number.isInteger(stemIndex) || stemIndex < 0 || stemIndex > 9) {
    throw new RangeError('天干索引必须为 0 到 9');
  }
  return LUCUN_BY_STEM[stemIndex];
}

/** 轻量自检；仅验证本模块基础规则，不代表完整命盘通过验证。 */
export function runCoreRuleSelfTests() {
  const tests = [];
  const check = (name, actual, expected) => {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    tests.push({ name, pass, actual, expected });
  };
  check('甲年天干索引', yearStemIndex(1984), 0);
  check('甲子年地支索引', yearBranchIndex(1984), 0);
  check('正月子时命宫在寅', locateMingShenPalaces(1, 0).mingBranch, 2);
  check('正月子时身宫在寅', locateMingShenPalaces(1, 0).shenBranch, 2);
  check('正月丑时命宫在丑', locateMingShenPalaces(1, 1).mingBranch, 1);
  check('十二宫数量', arrangeTwelvePalaces(2).length, 12);
  check('十二宫首位为命宫', arrangeTwelvePalaces(2)[0].name, '命宫');
  check('十二宫末位为父母宫', arrangeTwelvePalaces(2)[11].name, '父母宫');
  check('甲干四化', getSihuaByStem(0), ['廉贞','破军','武曲','太阳']);
  check('癸干四化', getSihuaByStem(9), ['破军','巨门','太阴','贪狼']);
  check('甲干禄存落寅', locateLucun(0), 2);
  check('癸干禄存落子', locateLucun(9), 0);
  return { passed: tests.filter(t => t.pass).length, total: tests.length, tests };
}
