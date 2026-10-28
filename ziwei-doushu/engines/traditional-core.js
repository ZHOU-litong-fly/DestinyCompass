/**
 * 独立传统紫微斗数核心排星模块（实验阶段）
 *
 * 不导入 iztro。实现范围：宫干、命宫纳音五行局、紫微/天府定位、十四主星布列。
 * 输入须由调用方提供已核实的农历年干索引、农历生日、命宫地支索引。
 * 本模块不负责公历转农历，也不等同于完整流派算法；辅煞星、四化入宫、
 * 大限流年及历法边界仍需后续实现并以标准命例回归验证。
 *
 * 地支索引：子=0、丑=1、寅=2……亥=11；天干索引：甲=0……癸=9。
 */
export const STEMS = Object.freeze(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
export const BRANCHES = Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
export const BUREAU = Object.freeze({水:2,木:3,金:4,土:5,火:6});
const ELEMENT_TO_BUREAU = Object.freeze({水:2,木:3,金:4,土:5,火:6});

// 六十甲子按顺序每两位一组的纳音五行；索引 0 对应甲子/乙丑。
const NAYIN_ELEMENTS = Object.freeze([
 '金','火','木','土','金','火','水','土','金','木',
 '水','土','火','木','水','金','火','木','土','金',
 '火','水','土','金','木','水','土','火','木','水'
]);

function assertIntRange(value,min,max,label){
 if(!Number.isInteger(value)||value<min||value>max) throw new RangeError(label+'超出有效范围');
}
const mod=(n,m)=>((n%m)+m)%m;

/** 五虎遁：根据生年天干，求寅宫天干索引。 */
export function yinPalaceStemIndex(yearStemIndex){
 assertIntRange(yearStemIndex,0,9,'生年天干索引');
 const startByYearStem=[2,4,6,8,0,2,4,6,8,0]; // 甲己丙、乙庚戊、丙辛庚、丁壬壬、戊癸甲
 return startByYearStem[yearStemIndex];
}

/** 求指定地支的宫干索引。 */
export function palaceStemIndex(yearStemIndex,branchIndex){
 assertIntRange(branchIndex,0,11,'地支索引');
 return mod(yinPalaceStemIndex(yearStemIndex)+(branchIndex-2),10);
}

/** 在六十甲子中查找干支组合索引；非法阴阳搭配返回 -1。 */
export function sexagenaryIndex(stemIndex,branchIndex){
 assertIntRange(stemIndex,0,9,'天干索引'); assertIntRange(branchIndex,0,11,'地支索引');
 for(let i=0;i<60;i++) if(i%10===stemIndex&&i%12===branchIndex) return i;
 return -1;
}

/** 按农历月份与时辰地支独立定位命宫、身宫。 */
export function locateMingShen(lunarMonth,hourBranchIndex){
 assertIntRange(lunarMonth,1,12,'农历月份');
 assertIntRange(hourBranchIndex,0,11,'时辰地支索引');
 const monthBranchIndex=mod(2+(lunarMonth-1),12); // 寅起正月，顺数至生月
 const mingBranchIndex=mod(monthBranchIndex-hourBranchIndex,12); // 逆数至生时
 const shenBranchIndex=mod(monthBranchIndex+hourBranchIndex,12); // 顺数至生时
 return {
  monthBranchIndex,monthBranch:BRANCHES[monthBranchIndex],
  mingBranchIndex,mingBranch:BRANCHES[mingBranchIndex],
  shenBranchIndex,shenBranch:BRANCHES[shenBranchIndex]
 };
}

/** 由宫干支的纳音五行确定五行局数。 */
export function fiveElementsBureau(yearStemIndex,mingBranchIndex){
 const stem=palaceStemIndex(yearStemIndex,mingBranchIndex);
 const cycleIndex=sexagenaryIndex(stem,mingBranchIndex);
 if(cycleIndex<0) throw new Error('命宫干支不是有效的六十甲子组合');
 const element=NAYIN_ELEMENTS[Math.floor(cycleIndex/2)];
 return {stemIndex:stem,branchIndex:mingBranchIndex,stem:STEMS[stem],branch:BRANCHES[mingBranchIndex],element,bureau:ELEMENT_TO_BUREAU[element],bureauName:({2:'水二局',3:'木三局',4:'金四局',5:'土五局',6:'火六局'})[ELEMENT_TO_BUREAU[element]]};
}

/**
 * 由农历生日与五行局独立定位紫微。
 * 补数 k 使 (day+k) 可被局数整除；从寅起按商数定位，
 * 补数为奇数则逆退 k 宫，为偶数则顺进 k 宫。
 * branch index 使用子=0……亥=11。
 */
export function locateZiwei(lunarDay,bureau){
 assertIntRange(lunarDay,1,30,'农历生日');
 if(![2,3,4,5,6].includes(bureau)) throw new RangeError('五行局必须为 2、3、4、5、6');
 const remainder=lunarDay%bureau;
 const supplement=mod(-remainder,bureau);
 const quotient=(lunarDay+supplement)/bureau;
 const countedFromYin=mod(2+quotient-1,12);
 const branchIndex=mod(countedFromYin+(supplement%2===1?-supplement:supplement),12);
 return {branchIndex,branch:BRANCHES[branchIndex],lunarDay,bureau,supplement,quotient};
}

/** 紫微、天府以寅申轴对称定位。 */
export function locateTianfu(ziweiBranchIndex){
 assertIntRange(ziweiBranchIndex,0,11,'紫微星地支索引');
 return mod(4-ziweiBranchIndex,12);
}

/** 布列十四主星。紫微系逆布，天府系顺布。 */
export function arrangeFourteenMajorStars(ziweiBranchIndex){
 assertIntRange(ziweiBranchIndex,0,11,'紫微星地支索引');
 const tianfu=locateTianfu(ziweiBranchIndex);
 const stars=Array.from({length:12},()=>[]);
 const ziweiSeries=[['紫微',0],['天机',-1],['太阳',-3],['武曲',-4],['天同',-5],['廉贞',-8]];
 const tianfuSeries=[['天府',0],['太阴',1],['贪狼',2],['巨门',3],['天相',4],['天梁',5],['七杀',6],['破军',10]];
 for(const [name,offset] of ziweiSeries) stars[mod(ziweiBranchIndex+offset,12)].push(name);
 for(const [name,offset] of tianfuSeries) stars[mod(tianfu+offset,12)].push(name);
 return {tianfuBranchIndex:tianfu,starsByBranch:stars.map((names,branchIndex)=>({branchIndex,branch:BRANCHES[branchIndex],stars:names}))};
}

export function runTraditionalEngineSelfTests(){
 const tests=[];
 const check=(name,actual,expected)=>tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
 check('甲年寅宫起丙',yinPalaceStemIndex(0),2);
 check('乙年寅宫起戊',yinPalaceStemIndex(1),4);
 check('甲年命宫在子，宫干为甲',palaceStemIndex(0,0),0);
 check('农历五月子时命身同在午', [locateMingShen(5,0).mingBranch,locateMingShen(5,0).shenBranch], ['午','午']);
 check('农历三月午时命身同在戌', [locateMingShen(3,6).mingBranch,locateMingShen(3,6).shenBranch], ['戌','戌']);
 check('甲子纳音金局',fiveElementsBureau(0,0).bureau,4);
 check('甲年命宫在寅，丙寅纳音火六局',fiveElementsBureau(0,2).bureau,6);
 check('水二局初一紫微在丑',locateZiwei(1,2).branch,'丑');
 check('水二局初二紫微在寅',locateZiwei(2,2).branch,'寅');
 check('木三局初一紫微在辰',locateZiwei(1,3).branch,'辰');
 check('火六局初一紫微在酉',locateZiwei(1,6).branch,'酉');
 check('紫微在寅时天府在寅',BRANCHES[locateTianfu(2)],'寅');
 const stars=arrangeFourteenMajorStars(2).starsByBranch.flatMap(x=>x.stars);
 check('十四主星总数',stars.length,14);
 check('十四主星名称不重复',new Set(stars).size,14);
 return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
