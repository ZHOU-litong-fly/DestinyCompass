/**
 * 《天纪》参考口径配置（不是完整《天纪》排盘算法）
 *
 * 规则来源：公开项目 Renhuai123/ziwei-doushu 的 school-config.ts 对倪师派的口径标注。
 * 这是二手开源项目的标注，不等于已取得倪海厦原始资料的完整规则证明。
 * 因此本模块只保存待核验的配置，不实现断语，也不宣称完整复现《天纪》。
 */
export const TIANJI_REFERENCE_POLICY = Object.freeze({
  id: 'tianji-reference',
  label: '《天纪》参考口径（待核验）',
  lateZiRule: 'current-day',
  leapMonthRule: 'next-month',
  provenance: 'Renhuai123/ziwei-doushu 的公开 school-config.ts 标注；需继续核验',
  verifiedAgainstOriginalSource: false
});

/** 以明确策略解释晚子时的日期归属，不做公历/农历转换。 */
export function applyLateZiPolicy(date, hour, minute, policy = TIANJI_REFERENCE_POLICY) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TypeError('日期格式必须为 YYYY-MM-DD');
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new RangeError('小时必须为 0 到 23');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new RangeError('分钟必须为 0 到 59');
  if (hour !== 23) return { date, hourBranch: Math.floor((hour + 1) / 2) % 12, lateZi: false, rule: policy.lateZiRule };
  if (policy.lateZiRule === 'next-day') {
    const [y,m,d] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(y,m-1,d+1));
    return { date: dt.toISOString().slice(0,10), hourBranch: 0, lateZi: true, rule: policy.lateZiRule };
  }
  if (policy.lateZiRule === 'current-day') return { date, hourBranch: 0, lateZi: true, rule: policy.lateZiRule };
  throw new Error('不支持的晚子时口径：' + policy.lateZiRule);
}

/** 返回闰月口径标签；真正的闰月转日期必须由经核验的历法层完成。 */
export function describeLeapMonthPolicy(isLeapMonth, policy = TIANJI_REFERENCE_POLICY) {
  if (!isLeapMonth) return { isLeapMonth: false, rule: 'not-applicable', label: '非闰月' };
  const labels = {
    'next-month': '整月归下月',
    'split': '初一至十五归前月、十六以后归下月',
    'prev-month': '整月归前月',
    'origin-month': '按闰月本月处理'
  };
  if (!labels[policy.leapMonthRule]) throw new Error('不支持的闰月口径：' + policy.leapMonthRule);
  return { isLeapMonth: true, rule: policy.leapMonthRule, label: labels[policy.leapMonthRule] };
}

export function runTianjiPolicySelfTests() {
  const tests = [];
  const check = (name, actual, expected) => tests.push({ name, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) });
  check('参考口径标记为尚未由原始资料核验', TIANJI_REFERENCE_POLICY.verifiedAgainstOriginalSource, false);
  check('晚子时保留当日', applyLateZiPolicy('2024-02-29',23,30), {date:'2024-02-29',hourBranch:0,lateZi:true,rule:'current-day'});
  check('非晚子时不改日期', applyLateZiPolicy('2024-02-29',22,59), {date:'2024-02-29',hourBranch:11,lateZi:false,rule:'current-day'});
  check('闰月口径标签', describeLeapMonthPolicy(true).label, '整月归下月');
  check('非闰月不应用规则', describeLeapMonthPolicy(false).label, '非闰月');
  return { passed: tests.filter(t => t.pass).length, total: tests.length, tests };
}
