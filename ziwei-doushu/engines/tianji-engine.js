/**
 * 《天机道 / 天纪》规则实验引擎。
 *
 * 规则依据：公开《天机道（天纪系列）》文本中可核对的安命身宫、定十二宫、
 * 定五行局、起紫微、安天府与十四主星口诀。来源链接记录于 README。
 * 本模块独立实现核心公式，不导入 iztro、traditional-core.js 或 auxiliary-stars.js。
 *
 * 边界声明：部分辅煞星规则采用公开传统安星诀交叉核对；年干四化及晚子时细则
 * 尚需逐条对照倪海厦原始课程/讲义。不得据此宣称已完整复现全部《天纪》内容。
 */
const STEMS=Object.freeze(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
const BRANCHES=Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
const PALACES=Object.freeze(['命宫','兄弟宫','夫妻宫','子女宫','财帛宫','疾厄宫','迁移宫','交友宫','官禄宫','田宅宫','福德宫','父母宫']);
const SIHUA=Object.freeze([
 ['廉贞','破军','武曲','太阳'],['天机','天梁','紫微','太阴'],
 ['天同','天机','文昌','廉贞'],['太阴','天同','天机','巨门'],
 ['贪狼','太阴','右弼','天机'],['武曲','贪狼','天梁','文曲'],
 ['太阳','武曲','太阴','天同'],['巨门','太阳','文曲','文昌'],
 ['天梁','紫微','左辅','武曲'],['破军','巨门','太阴','贪狼']
]);
const mod=(n,m)=>((n%m)+m)%m;
function range(n,min,max,label){if(!Number.isInteger(n)||n<min||n>max)throw new RangeError(label+'超出范围');}
function getPalaceStem(yearStem,branch){range(yearStem,0,9,'年干');range(branch,0,11,'地支');const yinStart=[2,4,6,8,0,2,4,6,8,0][yearStem];return mod(yinStart+branch-2,10);}
function sexagenary(stem,branch){for(let i=0;i<60;i++)if(i%10===stem&&i%12===branch)return i;return -1;}
/** 按《天机道》文本中的干支数相加诀独立计算五行局，不使用纳音查表。 */
function bureauByStemBranch(stem,branch){
 const stemValue=[1,1,2,2,3,3,4,4,5,5][stem];
 const branchValue=[1,1,2,2,3,3,1,1,2,2,3,3][branch];
 let value=(stemValue+branchValue)%5;if(value===0)value=5;
 const element={1:'木',2:'金',3:'水',4:'火',5:'土'}[value];
 const bureau={木:3,金:4,水:2,火:6,土:5}[element];
 return {element,bureau,bureauName:({2:'水二局',3:'木三局',4:'金四局',5:'土五局',6:'火六局'})[bureau],value,stemValue,branchValue};
}
export function calculateTianjiBureau(yearStemIndex,mingBranchIndex){
 range(yearStemIndex,0,9,'年干');range(mingBranchIndex,0,11,'命宫地支');
 const stemIndex=getPalaceStem(yearStemIndex,mingBranchIndex);
 return {...bureauByStemBranch(stemIndex,mingBranchIndex),stemIndex,stem:STEMS[stemIndex],branchIndex:mingBranchIndex,branch:BRANCHES[mingBranchIndex]};
}
export function locateTianjiMingShen(month,hour){
 range(month,1,12,'农历月份');range(hour,0,11,'时辰');
 const monthBranch=mod(2+month-1,12);
 return {mingBranchIndex:mod(monthBranch-hour,12),shenBranchIndex:mod(monthBranch+hour,12)};
}
export function locateTianjiZiwei(day,bureau){
 range(day,1,30,'农历日期');if(![2,3,4,5,6].includes(bureau))throw new RangeError('五行局必须为2至6');
 const remainder=day%bureau,supplement=mod(-remainder,bureau),quotient=(day+supplement)/bureau;
 const counted=mod(2+quotient-1,12),branchIndex=mod(counted+(supplement%2?-supplement:supplement),12);
 return {branchIndex,branch:BRANCHES[branchIndex],supplement,quotient};
}
function locateTianfu(ziwei){range(ziwei,0,11,'紫微星位置');return mod(4-ziwei,12);}
export function arrangeTianjiMajorStars(ziwei){
 const tianfu=locateTianfu(ziwei),stars=Array.from({length:12},()=>[]);
 for(const [name,offset] of [['紫微',0],['天机',-1],['太阳',-3],['武曲',-4],['天同',-5],['廉贞',-8]])stars[mod(ziwei+offset,12)].push(name);
 for(const [name,offset] of [['天府',0],['太阴',1],['贪狼',2],['巨门',3],['天相',4],['天梁',5],['七杀',6],['破军',10]])stars[mod(tianfu+offset,12)].push(name);
 return {tianfuBranchIndex:tianfu,starsByBranch:stars};
}
function locateAuxiliary(input){
 const {lunarMonth,hourBranchIndex,yearStemIndex,yearBranchIndex}=input;
 const zuofu=mod(4+lunarMonth-1,12),youbi=mod(10-(lunarMonth-1),12);
 const wenchang=mod(10-hourBranchIndex,12),wenqu=mod(4+hourBranchIndex,12);
 const lucunByStem=[2,3,5,6,5,6,8,9,11,0],lucun=lucunByStem[yearStemIndex];
 const tiankuiTable=[[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[6,2],[3,5],[3,5]];
 const [tiankui,tianyue]=tiankuiTable[yearStemIndex];
 const tianmaMap={0:2,4:2,8:2,2:8,6:8,10:8,1:11,5:11,9:11,3:5,7:5,11:5};
 const dikong=mod(11-hourBranchIndex,12),dijie=mod(11+hourBranchIndex,12);
 const starts={0:[2,10],4:[2,10],8:[2,10],2:[1,3],6:[1,3],10:[1,3],1:[3,10],5:[3,10],9:[3,10],3:[9,10],7:[9,10],11:[9,10]};
 const [fireStart,bellStart]=starts[yearBranchIndex];
 const positions={
  左辅:zuofu,右弼:youbi,文昌:wenchang,文曲:wenqu,禄存:lucun,
  擎羊:mod(lucun+1,12),陀罗:mod(lucun-1,12),天魁:tiankui,天钺:tianyue,
  天马:tianmaMap[yearBranchIndex],地空:dikong,地劫:dijie,
  火星:mod(fireStart+hourBranchIndex,12),铃星:mod(bellStart+hourBranchIndex,12)
 };
 return positions;
}
export function buildTianjiChart(input){
 if(!input||typeof input!=='object')throw new TypeError('必须提供出生资料');
 const {yearStemIndex,yearBranchIndex,lunarMonth,lunarDay,hourBranchIndex}=input;
 range(yearStemIndex,0,9,'年干');range(yearBranchIndex,0,11,'年支');range(lunarMonth,1,12,'农历月份');range(lunarDay,1,30,'农历日期');range(hourBranchIndex,0,11,'时辰');
 if(sexagenary(yearStemIndex,yearBranchIndex)<0)throw new RangeError('年干支不是有效六十甲子组合');
 const ms=locateTianjiMingShen(lunarMonth,hourBranchIndex);
 const bureau=calculateTianjiBureau(yearStemIndex,ms.mingBranchIndex);
 const ziwei=locateTianjiZiwei(lunarDay,bureau.bureau);
 const major=arrangeTianjiMajorStars(ziwei.branchIndex);
 const auxiliary=locateAuxiliary({lunarMonth,hourBranchIndex,yearStemIndex,yearBranchIndex});
 const palaces=PALACES.map((name,i)=>{
  const branchIndex=mod(ms.mingBranchIndex-i,12),stemIndex=getPalaceStem(yearStemIndex,branchIndex);
  const majorStars=major.starsByBranch[branchIndex].slice();
  const auxiliaryStars=Object.entries(auxiliary).filter(([,branch])=>branch===branchIndex).map(([star])=>star);
  const transformations=[];
  SIHUA[yearStemIndex].forEach((star,index)=>{
   if(majorStars.includes(star)||auxiliaryStars.includes(star))transformations.push({type:['化禄','化权','化科','化忌'][index],star});
  });
  return {name,branchIndex,branch:BRANCHES[branchIndex],stemIndex,stem:STEMS[stemIndex],majorStars,auxiliaryStars,sihua:transformations};
 });
 return {
  engine:'tianji-rules-experimental',
  verifiedInputs:{yearStemIndex,yearBranchIndex,lunarMonth,lunarDay,hourBranchIndex},
  mingShen:{mingBranchIndex:ms.mingBranchIndex,mingBranch:BRANCHES[ms.mingBranchIndex],shenBranchIndex:ms.shenBranchIndex,shenBranch:BRANCHES[ms.shenBranchIndex]},
  bureau,ziwei:{branchIndex:ziwei.branchIndex,branch:ziwei.branch,tianfuBranchIndex:major.tianfuBranchIndex,tianfuBranch:BRANCHES[major.tianfuBranchIndex]},
  palaces,auxiliaryStarPositions:Object.fromEntries(Object.entries(auxiliary).map(([name,branchIndex])=>[name,{branchIndex,branch:BRANCHES[branchIndex]}])),
  notes:['独立实现《天机道》公开文本中的核心安星公式，不调用 iztro 或通用传统核心模块。','闰月整月归下月有公开《天机道》文本依据；晚子时口径仍需原始课程资料进一步核实。','部分辅煞星及四化规则仍需逐盘校核；本引擎为实验版，不代表完整复现全部《天纪》规则。']
 };
}
export function runTianjiEngineSelfTests(){
 const tests=[],check=(name,actual,expected)=>tests.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});
 check('五行局诀示例：甲子为金四局',bureauByStemBranch(0,0).bureau,4);
 check('五行局诀示例：丙子为水二局',bureauByStemBranch(2,0).bureau,2);
 check('五行局诀示例：辛未为土五局',bureauByStemBranch(7,7).bureau,5);
 check('五行局诀示例：庚申为木三局',bureauByStemBranch(6,8).bureau,3);
 const sample=buildTianjiChart({yearStemIndex:9,yearBranchIndex:3,lunarMonth:1,lunarDay:1,hourBranchIndex:5});
 check('输出十二宫',sample.palaces.length,12);
 check('十四主星完整布列',sample.palaces.reduce((n,p)=>n+p.majorStars.length,0),14);
 check('十四颗已实现辅煞星',Object.keys(sample.auxiliaryStarPositions).length,14);
 check('命宫身宫与独立公式一致',[sample.mingShen.mingBranchIndex,sample.mingShen.shenBranchIndex],[9,7]);
 return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
