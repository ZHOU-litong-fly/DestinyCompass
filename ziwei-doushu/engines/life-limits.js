/**
 * 大限、流年、小限基础计算（实验模块）。
 *
 * 口径说明：
 * - 大限：五行局数为起限虚岁；每十年一限。阳男阴女顺行，阴男阳女逆行。
 * - 流年：目标农历年地支所在宫作为流年命宫，十二流年宫按本命十二宫排列方向布列。
 * - 小限：采用常见年支三合组起点表；一岁起限后按男顺女逆逐年移动。
 *
 * 地支索引为子=0、丑=1、寅=2……亥=11。方向的“顺行”定义为索引 +1。
 * 各派在小限起法、年龄口径、流年细则上可能不同；此模块是明确标注口径的实验实现，
 * 并非完整流派排盘或权威命例验证。目标年份按农历年份使用。
 */
export const BRANCHES = Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
export const PALACE_NAMES = Object.freeze(['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫']);
const mod=(n,m)=>((n%m)+m)%m;
function range(n,min,max,label){if(!Number.isInteger(n)||n<min||n>max)throw new RangeError(label+'超出有效范围');}

/** 大限方向：阳男阴女顺行；阴男阳女逆行。 */
export function majorLimitDirection(yearStemIndex,gender){
 range(yearStemIndex,0,9,'生年天干索引');
 if(gender!=='男'&&gender!=='女')throw new RangeError('性别必须为男或女');
 const yangYear=yearStemIndex%2===0;
 return (yangYear&&gender==='男')||(!yangYear&&gender==='女')?1:-1;
}

/** 大限当前十年区间及所在宫。虚岁从目标农历年 - 出生农历年 + 1 计算。 */
export function calculateMajorLimit({mingBranchIndex,bureau,birthLunarYear,targetLunarYear,yearStemIndex,gender}){
 range(mingBranchIndex,0,11,'命宫地支索引');
 if(![2,3,4,5,6].includes(bureau))throw new RangeError('五行局数必须为 2 至 6');
 range(birthLunarYear,1,9999,'出生农历年');range(targetLunarYear,1,9999,'目标农历年');
 if(targetLunarYear<birthLunarYear)throw new RangeError('目标年份不能早于出生年份');
 const age=targetLunarYear-birthLunarYear+1;
 const direction=majorLimitDirection(yearStemIndex,gender);
 const limitIndex=Math.floor((age-bureau)/10);
 if(limitIndex<0)return {age,direction,startAge:bureau,endAge:bureau+9,branchIndex:null,palaceName:null,active:false,reason:'尚未到达五行局对应的起限虚岁'};
 const startAge=bureau+limitIndex*10,endAge=startAge+9;
 const branchIndex=mod(mingBranchIndex+direction*limitIndex,12);
 return {age,direction,limitIndex,startAge,endAge,branchIndex,palaceName:PALACE_NAMES[mod(-direction*limitIndex,12)],active:true};
}

/** 流年十二宫：目标农历年地支为流年命宫，依本命十二宫宫序展开。 */
export function calculateAnnualPalaces({targetLunarYear,mingBranchIndex}){
 range(targetLunarYear,1,9999,'目标农历年');range(mingBranchIndex,0,11,'本命命宫地支索引');
 const yearBranchIndex=mod(targetLunarYear-4,12);
 const annualMingBranchIndex=yearBranchIndex;
 return PALACE_NAMES.map((name,index)=>({
  name,
  branchIndex:mod(annualMingBranchIndex-index,12),
  branch:BRANCHES[mod(annualMingBranchIndex-index,12)],
  natalPalaceBranchIndex:mod(mingBranchIndex-index,12),
  annualPalaceIndex:index
 }));
}

/** 常见小限起点表：寅午戌男辰女戌；申子辰男戌女辰；巳酉丑男未女丑；亥卯未男丑女未。 */
export function minorLimitStartBranch(yearBranchIndex,gender){
 range(yearBranchIndex,0,11,'出生年地支索引');
 if(gender!=='男'&&gender!=='女')throw new RangeError('性别必须为男或女');
 const branchGroups=[
  {branches:[2,6,10],male:4,female:10}, // 寅午戌：辰/戌
  {branches:[8,0,4],male:10,female:4},  // 申子辰：戌/辰
  {branches:[5,9,1],male:7,female:1},   // 巳酉丑：未/丑
  {branches:[11,3,7],male:1,female:7}   // 亥卯未：丑/未
 ];
 const match=branchGroups.find(g=>g.branches.includes(yearBranchIndex));
 if(!match)throw new Error('无法匹配出生年地支三合组');
 return gender==='男'?match.male:match.female;
}

/** 小限虚岁一岁起于表定地支；男顺女逆，每年移动一宫。 */
export function calculateMinorLimit({yearBranchIndex,gender,age}){
 range(age,1,200,'虚岁');
 const startBranchIndex=minorLimitStartBranch(yearBranchIndex,gender);
 const direction=gender==='男'?1:-1;
 const branchIndex=mod(startBranchIndex+direction*(age-1),12);
 return {age,startBranchIndex,direction,branchIndex,branch:BRANCHES[branchIndex]};
}

export function calculateLifeLimits(input){
 const major=calculateMajorLimit(input);
 const annualPalaces=calculateAnnualPalaces(input);
 const minor=calculateMinorLimit({yearBranchIndex:input.yearBranchIndex,gender:input.gender,age:major.age});
 const annualMing=annualPalaces[0];
 return {
  engine:'life-limits-experimental',
  targetLunarYear:input.targetLunarYear,
  virtualAge:major.age,
  major,
  annual:{yearBranchIndex:mod(input.targetLunarYear-4,12),mingBranchIndex:annualMing.branchIndex,mingBranch:annualMing.branch,palaces:annualPalaces},
  minor,
  notes:['目标年份按农历年处理，虚岁=目标农历年-出生农历年+1。','大限采用五行局起限及年干阴阳配合性别决定顺逆的常见口径。','流年以太岁地支定位流年命宫；小限采用常见三合组起点表和男顺女逆口径。','大限、流年、小限均存在流派差异；本模块为实验实现，需用可靠标准命例逐盘核验。']
 };
}

export function runLifeLimitSelfTests(){
 const tests=[],check=(name,actual,expected)=>tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
 check('阳年男命大限顺行',majorLimitDirection(0,'男'),1);
 check('阳年女命大限逆行',majorLimitDirection(0,'女'),-1);
 check('阴年男命大限逆行',majorLimitDirection(1,'男'),-1);
 check('阴年女命大限顺行',majorLimitDirection(1,'女'),1);
 const major=calculateMajorLimit({mingBranchIndex:2,bureau:3,birthLunarYear:2000,targetLunarYear:2002,yearStemIndex:0,gender:'男'});
 check('木三局虚岁三岁进入第一大限',[major.age,major.startAge,major.endAge,major.branchIndex],[3,3,12,2]);
 check('大限每十年移动一宫',calculateMajorLimit({mingBranchIndex:2,bureau:3,birthLunarYear:2000,targetLunarYear:2012,yearStemIndex:0,gender:'男'}).branchIndex,3);
 check('流年命宫按目标年地支',calculateAnnualPalaces({targetLunarYear:2024,mingBranchIndex:2})[0].branch,'辰');
 check('流年十二宫各地支唯一',new Set(calculateAnnualPalaces({targetLunarYear:2024,mingBranchIndex:2}).map(p=>p.branchIndex)).size,12);
 check('寅年男命小限一岁起辰',minorLimitStartBranch(2,'男'),4);
 check('寅年女命小限一岁起戌',minorLimitStartBranch(2,'女'),10);
 check('小限虚岁二岁男顺行一宫',calculateMinorLimit({yearBranchIndex:2,gender:'男',age:2}).branchIndex,5);
 check('小限虚岁二岁女逆行一宫',calculateMinorLimit({yearBranchIndex:2,gender:'女',age:2}).branchIndex,9);
 return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
