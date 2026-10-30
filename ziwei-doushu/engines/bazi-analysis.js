/**
 * 八字五行结构分析（解释型实验模块）
 * 使用历法层已返回的四柱；不保存任何出生资料。
 * 采用常见子平八字基础表：藏干、十神、五行生克、地支关系。
 * 强弱与喜用倾向使用透明的启发式评分，不冒充完整格局/调候/盲派断法。
 */
export const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
export const ELEMENTS=['木','火','土','金','水'];
const STEM_INFO={
 甲:['木','阳'],乙:['木','阴'],丙:['火','阳'],丁:['火','阴'],戊:['土','阳'],
 己:['土','阴'],庚:['金','阳'],辛:['金','阴'],壬:['水','阳'],癸:['水','阴']
};
const HIDDEN={
 子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],
 巳:['丙','戊','庚'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],
 酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']
};
const BRANCH_ELEMENT={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
const GENERATES={木:'火',火:'土',土:'金',金:'水',水:'木'};
const CONTROLS={木:'土',土:'水',水:'火',火:'金',金:'木'};
const SEASON_WEIGHT={寅:{木:1.6,火:1.2,水:1.1,土:.7,金:.55},卯:{木:1.6,火:1.2,水:1.1,土:.7,金:.55},辰:{土:1.4,木:1.1,水:.9,火:.8,金:.8},
 巳:{火:1.6,土:1.2,木:1.1,金:.7,水:.55},午:{火:1.6,土:1.2,木:1.1,金:.7,水:.55},未:{土:1.4,火:1.1,木:.9,金:.8,水:.7},
 申:{金:1.6,水:1.2,土:1.1,木:.7,火:.55},酉:{金:1.6,水:1.2,土:1.1,木:.7,火:.55},戌:{土:1.4,金:1.1,火:.9,水:.8,木:.7},
 亥:{水:1.6,木:1.2,金:1.1,火:.7,土:.55},子:{水:1.6,木:1.2,金:1.1,火:.7,土:.55},丑:{土:1.4,水:1.1,金:.9,木:.8,火:.7}};
const BRANCH_PAIRS=[
 ['子','丑','六合'],['寅','亥','六合'],['卯','戌','六合'],['辰','酉','六合'],['巳','申','六合'],['午','未','六合'],
 ['子','午','六冲'],['丑','未','六冲'],['寅','申','六冲'],['卯','酉','六冲'],['辰','戌','六冲'],['巳','亥','六冲'],
 ['子','未','相害'],['丑','午','相害'],['寅','巳','相害'],['卯','辰','相害'],['申','亥','相害'],['酉','戌','相害'],
 ['子','酉','相破'],['午','卯','相破'],['辰','丑','相破'],['戌','未','相破'],['寅','亥','相破'],['巳','申','相破']
];
const TRIADS=[{branches:['申','子','辰'],element:'水',name:'申子辰三合水局'},{branches:['亥','卯','未'],element:'木',name:'亥卯未三合木局'},{branches:['寅','午','戌'],element:'火',name:'寅午戌三合火局'},{branches:['巳','酉','丑'],element:'金',name:'巳酉丑三合金局'}];
const SEASONS=[{branches:['寅','卯','辰'],name:'春',element:'木'},{branches:['巳','午','未'],name:'夏',element:'火'},{branches:['申','酉','戌'],name:'秋',element:'金'},{branches:['亥','子','丑'],name:'冬',element:'水'}];
const mod=(n,m)=>((n%m)+m)%m;
function elementOfStem(stem){return STEM_INFO[stem]?.[0]||null;}
function polarity(stem){return STEM_INFO[stem]?.[1]||null;}
function relation(dm,other){
 if(dm===other)return '比劫';
 if(GENERATES[other]===dm)return '印星';
 if(GENERATES[dm]===other)return '食伤';
 if(CONTROLS[dm]===other)return '财星';
 if(CONTROLS[other]===dm)return '官杀';
 return '未知';
}
function tenGod(dmStem,otherStem){
 const dmE=elementOfStem(dmStem),e=elementOfStem(otherStem);
 if(!dmE||!e)return '未知';
 const r=relation(dmE,e),same=polarity(dmStem)===polarity(otherStem);
 return ({比劫:same?'比肩':'劫财',印星:same?'偏印':'正印',食伤:same?'食神':'伤官',财星:same?'偏财':'正财',官杀:same?'七杀':'正官'})[r]||'未知';
}
function parsePillars(input){
 const values=Array.isArray(input)?input:[input?.year,input?.month,input?.day,input?.time];
 if(values.length!==4||values.some(x=>typeof x!=='string'||!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(x)))throw new TypeError('需要完整且有效的年、月、日、时四柱');
 return values.map((gz,i)=>({label:['年柱','月柱','日柱','时柱'][i],stem:gz[0],branch:gz[1],element:elementOfStem(gz[0]),hidden:HIDDEN[gz[1]].slice()}));
}
function detectBranchRelations(branches){
 const found=[];
 for(const [a,b,type] of BRANCH_PAIRS){const ia=branches.map((x,i)=>x===a?i:-1).filter(i=>i>=0),ib=branches.map((x,i)=>x===b?i:-1).filter(i=>i>=0);
  for(const i of ia)for(const j of ib)if(i!==j)found.push({type,branches:a+b,positions:[i,j]});
 }
 for(const t of TRIADS){if(t.branches.every(b=>branches.includes(b)))found.push({type:'三合',branches:t.branches.join(''),element:t.element,name:t.name,positions:t.branches.map(b=>branches.indexOf(b))});}
 const selfPunish=['辰','午','酉','亥'];
 for(const b of selfPunish)if(branches.filter(x=>x===b).length>=2)found.push({type:'自刑',branches:b+b,positions:branches.map((x,i)=>x===b?i:-1).filter(i=>i>=0)});
 const punish=[['寅','巳','申','无恩之刑'],['丑','戌','未','恃势之刑']];
 for(const [a,b,c,name] of punish)if([a,b,c].every(x=>branches.includes(x)))found.push({type:'三刑',branches:a+b+c,name,positions:[a,b,c].map(x=>branches.indexOf(x))});
 if(branches.includes('子')&&branches.includes('卯'))found.push({type:'无礼之刑',branches:'子卯',positions:[branches.indexOf('子'),branches.indexOf('卯')]});
 return found;
}
function hiddenDistribution(pillars){
 const out={木:0,火:0,土:0,金:0,水:0};
 pillars.forEach(p=>p.hidden.forEach((stem,i)=>{out[elementOfStem(stem)]+=i===0?1:.5;}));
 return out;
}
function calculateStrength(pillars,dmElement){
 const score={木:0,火:0,土:0,金:0,水:0};
 pillars.forEach((p,i)=>{
  const w=i===1?1.15:1;
  score[p.element]+=w;
  p.hidden.forEach((h,j)=>{
   const e=elementOfStem(h),base=j===0?1.25:.55;
   const season=i===1?(SEASON_WEIGHT[p.branch]?.[e]||1):1;
   score[e]+=base*season*w;
  });
 });
 const resource=Object.keys(GENERATES).find(k=>GENERATES[k]===dmElement);
 const support=score[dmElement]+score[resource];
 const total=Object.values(score).reduce((a,b)=>a+b,0)||1;
 const ratio=support/total;
 const monthSeason=SEASONS.find(x=>x.branches.includes(pillars[1].branch))||null;
 const monthFactor=SEASON_WEIGHT[pillars[1].branch]?.[dmElement]||1;
 const monthHidden=HIDDEN[pillars[1].branch].map(elementOfStem);
 const seasonGetsOrder=monthHidden.includes(dmElement)||monthFactor>=1.4;
 const rootPositions=pillars.map((p,i)=>p.hidden.some(h=>elementOfStem(h)===dmElement)?i:-1).filter(i=>i>=0);
 const visibleSupport=pillars.filter(p=>p.element===dmElement||p.element===resource).map(p=>p.label);
 const rootedPositions=rootPositions.map(i=>pillars[i].label);
 const strength=ratio>=.53?'偏强':ratio<=.39?'偏弱':'中和倾向';
 return {scores:score,support,total,ratio,strength,monthSeason,monthFactor,seasonGetsOrder,rootPositions,rootedPositions,visibleSupport};
}
function elementRoles(dm){
 const produced=GENERATES[dm],resource=Object.keys(GENERATES).find(k=>GENERATES[k]===dm);
 const wealth=CONTROLS[dm],officer=Object.keys(CONTROLS).find(k=>CONTROLS[k]===dm);
 return {resource,peer:dm,output:produced,wealth,officer};
}
function chooseUsefulElements(dm,strength){
 const r=elementRoles(dm);
 if(strength==='偏弱')return {primary:[r.resource,r.peer],avoid:[r.output,r.wealth,r.officer],reason:'日主支持力量偏少，先以生扶日主的印星、比劫方向作为候选。'};
 if(strength==='偏强')return {primary:[r.output,r.wealth,r.officer],avoid:[r.resource,r.peer],reason:'日主支持力量较多，先观察泄秀、财星与官杀方向是否能形成平衡。'};
 return {primary:[],avoid:[],reason:'当前评分落在中间区间，不宜只按强弱二分喜忌；需要结合格局、调候、合化和全局制化进一步判断。'};
}
function practicalAdvice(elements){
 const map={
 木:{own:'把成长目标拆成每周可完成的小任务；保持学习、尝试新方法，遇到阻力先调整路径而不是立刻放弃。',outside:'若木被后续完整分析确认为有利方向，可用绿色、植物、木质材料作象征提醒，例如天然木珠手串或在工作区养护绿植。'},
 火:{own:'练习主动表达、及时反馈和展示成果；重要沟通先准备结论与依据，同时避免情绪上头时立即承诺。',outside:'若火被确认为有利方向，可用暖色照明、红紫色小配件或适量暖色装饰作为行动提醒。'},
 土:{own:'建立规律作息、预算、计划和定期复盘；把长期事项分阶段推进，避免因求稳而迟迟不开始。',outside:'若土被确认为有利方向，可用陶土、陶瓷、黄棕色等自然质感物件作为象征提醒。'},
 金:{own:'强化边界、标准、核对和执行；表达意见时讲清规则与依据，同时避免过度苛求自己或他人。',outside:'若金被确认为有利方向，可选择银、不锈钢等简洁金属配件或白金色系小物作为提醒。'},
 水:{own:'增加倾听、信息收集、复盘和弹性调整；设定决策期限，避免反复思考却迟迟不行动。',outside:'若水被确认为有利方向，可用黑色、深蓝色或水意象饰品作为象征提醒。'}
 };
 return elements.map(e=>({element:e,...map[e]}));
}
export function analyzeBaZi(input){
 const pillars=parsePillars(input),dm=pillars[2].stem,dmElement=elementOfStem(dm),strength=calculateStrength(pillars,dmElement);
 const visible=pillars.map(p=>({pillar:p.label,stem:p.stem,tenGod:tenGod(dm,p.stem),branch:p.branch,hidden:p.hidden.map(h=>({stem:h,tenGod:tenGod(dm,h),element:elementOfStem(h)}))}));
 const branchRelations=detectBranchRelations(pillars.map(p=>p.branch));
 const useful=chooseUsefulElements(dmElement,strength.strength);
 const roles=elementRoles(dmElement);
 const season=strength.monthSeason;
 const dayRoot=pillars.filter(p=>p.hidden.some(h=>elementOfStem(h)===dmElement)).map(p=>p.label);
 const allElements=Object.keys(strength.scores).filter(e=>strength.scores[e]>0);
 const missing=Object.keys(strength.scores).filter(e=>strength.scores[e]===0);
 const seasonLine=season?'生于'+season.name+'，季节主气偏'+season.element+'；':'';
 const strengthReason='以日主'+dm+'（'+dmElement+'）为中心，结合月令季节、四柱天干和地支藏干作启发式加权，支持力量占比约'+Math.round(strength.ratio*100)+'%，暂评为'+strength.strength+'。得令观察：月支'+pillars[1].branch+'对日主五行的季节权重为'+strength.monthFactor+'，'+(strength.seasonGetsOrder?'月令藏干或季节权重显示有一定时令支持。':'月令没有显示明显的同类时令支持。')+'得地观察：'+(strength.rootedPositions.length?'日主同类藏根见于'+strength.rootedPositions.join('、')+'。':'四柱地支藏干中未见日主同类根气。')+'得势观察：天干中日主同类或生扶力量见于'+(strength.visibleSupport.length?strength.visibleSupport.join('、'):'未见')+'。这三项仅为可解释的结构观察，不等同于完整子平旺衰定论。'+seasonLine;
 const usable=useful.primary.length?useful.primary.join('、'):'暂不指定单一喜用五行';
 const cautions=['本评分是教学型启发式模型，不等同于传统命理师完整的旺衰、格局、调候、通关与合化判断。','五行“未出现”只表示当前四柱表层干支与本气/藏干统计没有该元素，不代表一定需要补它。','地支六合、三合、冲刑害破仅列出结构关系，不自动判定合化成功或吉凶。','颜色、手串、饰品和环境建议只作为传统文化象征与行为提醒，没有科学证据证明其能改运。'];
 return {
  dayMaster:{stem:dm,element:dmElement,polarity:polarity(dm),strength:strength.strength,score:strength.scores,supportRatio:strength.ratio,reason:strengthReason,rootedIn:dayRoot,diagnostics:{得令:strength.seasonGetsOrder,月令权重:strength.monthFactor,得地宫位:strength.rootedPositions,得势天干:strength.visibleSupport}},
  monthCommand:{branch:pillars[1].branch,hiddenStems:pillars[1].hidden,season:season?.name||'未知',seasonElement:season?.element||'未知'},
  pillars:visible,hiddenStemDistribution:hiddenDistribution(pillars),allElements,missingSurfaceElements:missing,
  tenGods:visible.flatMap(p=>[{pillar:p.pillar,stem:p.stem,tenGod:p.tenGod},...p.hidden.map(h=>({pillar:p.pillar,stem:h.stem,tenGod:h.tenGod,hidden:true}))],tenGodCounts:visible.flatMap(p=>[{tenGod:p.tenGod},...p.hidden.map(h=>({tenGod:h.tenGod}))]).reduce((out,x)=>{out[x.tenGod]=(out[x.tenGod]||0)+1;return out;},{}),
  branchRelations,elementRoles:roles,usefulElementCandidates:useful.primary,avoidElementCandidates:useful.avoid,usefulReason:useful.reason,
  suggestions:practicalAdvice(useful.primary),cautions
 };
}
export function runBaZiAnalysisTests(){
 const tests=[],check=(name,actual,expected)=>tests.push({name,pass:JSON.stringify(actual)===JSON.stringify(expected),actual,expected});
 const a=analyzeBaZi(['甲子','丙寅','甲寅','甲子']);
 check('识别甲木日主',a.dayMaster.element,'木');
 check('输出得令得地得势诊断',Object.keys(a.dayMaster.diagnostics).sort(),['得地宫位','得势天干','得令','月令权重'].sort());
 check('统计十神分布',a.tenGodCounts['比肩']>0,true);
 check('识别寅月为春季',a.monthCommand.season,'春');
 check('寅中藏干',a.pillars[1].hidden.map(x=>x.stem),['甲','丙','戊']);
 check('日主十神同类',a.pillars[2].tenGod,'比肩');
 check('检测子午冲',detectBranchRelations(['子','午','寅','卯']).some(x=>x.type==='六冲'),true);
 check('检测六合',detectBranchRelations(['子','丑','寅','卯']).some(x=>x.type==='六合'),true);
 let rejected=false;try{analyzeBaZi(['甲子','丙寅','甲','甲子']);}catch{rejected=true;}
 check('拒绝无效四柱',rejected,true);
 return {passed:tests.filter(t=>t.pass).length,total:tests.length,tests};
}
