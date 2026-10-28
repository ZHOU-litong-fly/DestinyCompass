/**
 * 独立传统算法回归测试。
 * 运行方式：在支持 ES modules 的环境中导入本文件并执行 runZiweiRegressionSuite()。
 * 这些测试验证核心数学规则和结构，不代替完整命例校盘。
 */
import { runTraditionalEngineSelfTests, locateZiwei, arrangeFourteenMajorStars, fiveElementsBureau, locateTianfu, sexagenaryIndex } from './traditional-core.js';
import { ZIWEI_REFERENCE_TABLE } from './ziwei-reference-table.js';
import { runTianjiPolicySelfTests } from './tianji-reference-policy.js';

export function runZiweiRegressionSuite() {
  const suites = [
    { name: '传统核心规则', result: runTraditionalEngineSelfTests() },
    { name: '《天纪》参考口径边界', result: runTianjiPolicySelfTests() }
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
