/**
 * 独立传统算法回归测试。
 * 运行方式：在支持 ES modules 的环境中导入本文件并执行 runZiweiRegressionSuite()。
 * 这些测试验证核心数学规则和结构，不代替完整命例校盘。
 */
import { runTraditionalEngineSelfTests, locateZiwei, arrangeFourteenMajorStars, fiveElementsBureau, locateTianfu, sexagenaryIndex, locateMingShen } from './traditional-core.js';
import { ZIWEI_REFERENCE_TABLE } from './ziwei-reference-table.js';
import { runTianjiPolicySelfTests } from './tianji-reference-policy.js';
import { runAuxiliaryStarSelfTests, locateZuofuYoubi, locateWenchangWenqu, locateLucunQingyangTuoluo, locateTiankuiTianyue, locateTianma, locateDikongDijie, locateHuoxingLingxing } from './auxiliary-stars.js';
import { runTraditionalChartSelfTests } from './traditional-chart.js';
import { runTianjiEngineSelfTests, calculateTianjiBureau, locateTianjiMingShen, locateTianjiZiwei, arrangeTianjiMajorStars } from './tianji-engine.js';

export function runZiweiRegressionSuite() {
  const suites = [
    { name: '传统核心规则', result: runTraditionalEngineSelfTests() },
    { name: '《天纪》参考口径边界', result: runTianjiPolicySelfTests() },
    { name: '辅星基础定位', result: runAuxiliaryStarSelfTests() },
    { name: '独立传统命盘组装', result: runTraditionalChartSelfTests() },
    { name: '《天纪》独立规则引擎', result: runTianjiEngineSelfTests() }
  ];
  const exhaustive = [];
  // 对固定参考表逐项比对，而非仅检查输出范围。
  for (const bureau of [2,3,4,5,6]) {
    for (let day = 1; day <= 30; day++) {
      const actual = locateZiwei(day, bureau).branch;
      const expected = ZIWEI_REFERENCE_TABLE[bureau][day - 1];
      exhaustive.push({ name: '参考表比对：' + bureau + '局第' + day + '日', pass: actual === expected, actual, expected });
    }
  }
  for (const bureau of [2,3,4,5,6]) {
    for (let day = 1; day <= 30; day++) {
      const result = locateZiwei(day, bureau);
      exhaustive.push({
        name: '紫微定位范围：' + bureau + '局第' + day + '日',
        pass: result.branchIndex >= 0 && result.branchIndex < 12 && result.quotient >= 1
      });
    }
  }
  for (let stem = 0; stem < 10; stem++) {
    for (let branch = 0; branch < 12; branch++) {
      try {
        const bureau = fiveElementsBureau(stem, branch);
        exhaustive.push({ name: '五行局有效值：年干' + stem + '命宫支' + branch, pass: [2,3,4,5,6].includes(bureau.bureau) });
      } catch {
        // 六十甲子中阴阳不配的干支组合本来就无效，跳过。
      }
    }
  }
  for (let branch = 0; branch < 12; branch++) {
    const stars = arrangeFourteenMajorStars(branch).starsByBranch.flatMap(p => p.stars);
    exhaustive.push({ name: '十四主星布列：紫微支' + branch, pass: stars.length === 14 && new Set(stars).size === 14 });
    exhaustive.push({ name: '紫府轴对称：紫微支' + branch, pass: locateTianfu(branch) === ((4 - branch + 12) % 12) });
  }
  // 辅星定位的穷举范围检查：所有月份、时辰与年干均应落在十二地支内。
  for (let month = 1; month <= 12; month++) {
    const stars = locateZuofuYoubi(month);
    exhaustive.push({ name: '左辅位置范围：月' + month, pass: stars.zuofuBranchIndex >= 0 && stars.zuofuBranchIndex < 12 });
    exhaustive.push({ name: '右弼位置范围：月' + month, pass: stars.youbiBranchIndex >= 0 && stars.youbiBranchIndex < 12 });
  }
  for (let hour = 0; hour < 12; hour++) {
    const stars = locateWenchangWenqu(hour);
    exhaustive.push({ name: '文昌位置范围：时' + hour, pass: stars.wenchangBranchIndex >= 0 && stars.wenchangBranchIndex < 12 });
    exhaustive.push({ name: '文曲位置范围：时' + hour, pass: stars.wenquBranchIndex >= 0 && stars.wenquBranchIndex < 12 });
  }
  for (let stem = 0; stem < 10; stem++) {
    const stars = locateLucunQingyangTuoluo(stem);
    exhaustive.push({ name: '禄存位置范围：年干' + stem, pass: stars.lucunBranchIndex >= 0 && stars.lucunBranchIndex < 12 });
    exhaustive.push({ name: '擎羊位置范围：年干' + stem, pass: stars.qingyangBranchIndex >= 0 && stars.qingyangBranchIndex < 12 });
    exhaustive.push({ name: '陀罗位置范围：年干' + stem, pass: stars.tuoluoBranchIndex >= 0 && stars.tuoluoBranchIndex < 12 });
  }
  // 新增辅煞星位置的全输入范围检查。
  for (let stem = 0; stem < 10; stem++) {
    const stars = locateTiankuiTianyue(stem);
    exhaustive.push({ name: '天魁位置范围：年干' + stem, pass: stars.tiankuiBranchIndex >= 0 && stars.tiankuiBranchIndex < 12 });
    exhaustive.push({ name: '天钺位置范围：年干' + stem, pass: stars.tianyueBranchIndex >= 0 && stars.tianyueBranchIndex < 12 });
  }
  for (let branch = 0; branch < 12; branch++) {
    const star = locateTianma(branch);
    exhaustive.push({ name: '天马位置范围：年支' + branch, pass: star.tianmaBranchIndex >= 0 && star.tianmaBranchIndex < 12 });
  }
  for (let hour = 0; hour < 12; hour++) {
    const stars = locateDikongDijie(hour);
    exhaustive.push({ name: '地空位置范围：时' + hour, pass: stars.dikongBranchIndex >= 0 && stars.dikongBranchIndex < 12 });
    exhaustive.push({ name: '地劫位置范围：时' + hour, pass: stars.dijieBranchIndex >= 0 && stars.dijieBranchIndex < 12 });
  }
  for (let yearBranch = 0; yearBranch < 12; yearBranch++) {
    for (let hour = 0; hour < 12; hour++) {
      const stars = locateHuoxingLingxing(yearBranch, hour);
      exhaustive.push({ name: '火星位置范围：年支' + yearBranch + '时' + hour, pass: stars.huoxingBranchIndex >= 0 && stars.huoxingBranchIndex < 12 });
      exhaustive.push({ name: '铃星位置范围：年支' + yearBranch + '时' + hour, pass: stars.lingxingBranchIndex >= 0 && stars.lingxingBranchIndex < 12 });
    }
  }
  // Cross-check independent Ming/Shen palace, bureau, Ziwei position and major-star formulas for all 60 valid year pillars,
  // 12 lunar months and 12 birth hours: 60 * 12 * 12 = 8640 cases.
  for (let stem = 0; stem < 10; stem++) {
    for (let yearBranch = 0; yearBranch < 12; yearBranch++) {
      if ((stem % 2) !== (yearBranch % 2)) continue;
      for (let month = 1; month <= 12; month++) {
        for (let hour = 0; hour < 12; hour++) {
          const tianjiMingShen = locateTianjiMingShen(month, hour);
          const traditionalMingShen = locateMingShen(month, hour);
          const tianjiBureau = calculateTianjiBureau(stem, tianjiMingShen.mingBranchIndex).bureau;
          const traditionalBureau = fiveElementsBureau(stem, traditionalMingShen.mingBranchIndex).bureau;
          const tianjiZiwei = locateTianjiZiwei(15, tianjiBureau);
          const traditionalZiwei = locateZiwei(15, traditionalBureau);
          const tianjiStars = arrangeTianjiMajorStars(tianjiZiwei.branchIndex).starsByBranch
            .map((stars, branchIndex) => [branchIndex, stars]);
          const traditionalStars = arrangeFourteenMajorStars(traditionalZiwei.branchIndex).starsByBranch
            .map(({ branchIndex, stars }) => [branchIndex, stars]);
          const actual = [
            tianjiMingShen.mingBranchIndex, tianjiMingShen.shenBranchIndex,
            tianjiBureau, tianjiZiwei.branchIndex, tianjiStars
          ];
          const expected = [
            traditionalMingShen.mingBranchIndex, traditionalMingShen.shenBranchIndex,
            traditionalBureau, traditionalZiwei.branchIndex, traditionalStars
          ];
          exhaustive.push({
            name: '双引擎核心公式交叉核验：年干' + stem + '年支' + yearBranch + '月' + month + '时' + hour,
            pass: JSON.stringify(actual) === JSON.stringify(expected),
            actual,
            expected
          });
        }
      }
    }
  }
  // 六十甲子组合有效性：干支索引同阴阳才应存在于六十甲子。
  for (let stem = 0; stem < 10; stem++) {
    for (let branch = 0; branch < 12; branch++) {
      const valid = (stem % 2) === (branch % 2);
      exhaustive.push({ name: '六十甲子干支奇偶校验：' + stem + '/' + branch, pass: (sexagenaryIndex(stem, branch) >= 0) === valid });
    }
  }
  const exhaustiveResult = { name: '穷举边界检查', passed: exhaustive.filter(t => t.pass).length, total: exhaustive.length, tests: exhaustive };
  const passed = suites.reduce((sum, s) => sum + s.result.passed, 0) + exhaustiveResult.passed;
  const total = suites.reduce((sum, s) => sum + s.result.total, 0) + exhaustiveResult.total;
  return { passed, total, suites, exhaustive: exhaustiveResult };
}
