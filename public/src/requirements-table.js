const DEFAULT_COLUMNS=[
  {key:'requirementId',label:'ID',width:130,visible:true},
  {key:'name',label:'Name',width:220,visible:true},
  {key:'requirementText',label:'Text',width:360,visible:true},
  {key:'lifecycleStatus',label:'Status',width:130,visible:true},
  {key:'priority',label:'Priority',width:100,visible:true},
  {key:'verificationMethod',label:'Method',width:130,visible:true},
  {key:'responsibleRole',label:'Responsible role',width:160,visible:true}
];

const clone=value=>globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value));
const id=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`;

export function normalizeRequirementTable(definition={}){
  return {id:definition.id||id('req-table'),name:definition.name||'Requirements',scope:{ownerId:null,includeDescendants:true,...definition.scope},columns:(definition.columns?.length?definition.columns:DEFAULT_COLUMNS).map(column=>({...column,visible:column.visible!==false,width:Math.max(60,Number(column.width)||140)})),filters:(definition.filters||[]).map(filter=>({...filter})),sort:(definition.sort||[]).map(sort=>({...sort})),groupBy:definition.groupBy||'',rowHeight:Math.max(24,Number(definition.rowHeight)||34),createdAt:definition.createdAt||new Date().toISOString(),updatedAt:definition.updatedAt||new Date().toISOString()};
}

export function saveRequirementTable(project,definition){
  project.requirementTables=project.requirementTables||[];const table=normalizeRequirementTable(definition),index=project.requirementTables.findIndex(item=>item.id===table.id);table.updatedAt=new Date().toISOString();if(index<0)project.requirementTables.push(table);else project.requirementTables[index]=table;return table;
}

function descendants(project,ownerId){const ids=new Set([ownerId]);let changed=true;while(changed){changed=false;for(const element of project.elements||[])if(ids.has(element.ownerId)&&!ids.has(element.id)){ids.add(element.id);changed=true}}return ids}
function matches(value,filter){const actual=String(value??'').toLowerCase(),expected=String(filter.value??'').toLowerCase();if(filter.operator==='equals')return actual===expected;if(filter.operator==='not-equals')return actual!==expected;if(filter.operator==='starts-with')return actual.startsWith(expected);if(filter.operator==='empty')return !actual;return actual.includes(expected)}

export function requirementTableRows(project,definition){
  const table=normalizeRequirementTable(definition),allowed=table.scope.ownerId&&table.scope.includeDescendants?descendants(project,table.scope.ownerId):null;
  let rows=(project.elements||[]).filter(element=>element.kind==='Requirement'&&(!table.scope.ownerId||(table.scope.includeDescendants?allowed.has(element.ownerId)||element.ownerId===table.scope.ownerId:element.ownerId===table.scope.ownerId))&&table.filters.every(filter=>matches(element[filter.key],filter)));
  rows.sort((a,b)=>{for(const rule of table.sort){const result=String(a[rule.key]??'').localeCompare(String(b[rule.key]??''),undefined,{numeric:true,sensitivity:'base'});if(result)return rule.direction==='desc'?-result:result}return String(a.requirementId||a.name).localeCompare(String(b.requirementId||b.name),undefined,{numeric:true})});return rows;
}

export function editRequirementCells(project,edits,{allowedFields}={}){
  const permitted=new Set(allowedFields||DEFAULT_COLUMNS.map(column=>column.key)),seen=new Set(),changes=[];
  for(const edit of edits){const key=`${edit.id}:${edit.field}`;if(seen.has(key))throw Error(`Duplicate edit for ${key}`);seen.add(key);const requirement=project.elements?.find(element=>element.id===edit.id&&element.kind==='Requirement');if(!requirement)throw Error(`Requirement not found: ${edit.id}`);if(!permitted.has(edit.field)||['id','externalId','kind','ownerId'].includes(edit.field))throw Error(`Field is not editable: ${edit.field}`);changes.push({requirement,field:edit.field,before:clone(requirement[edit.field]),after:clone(edit.value)})}
  for(const change of changes)change.requirement[change.field]=change.after;return {type:'batch-requirement-edit',changes:changes.map(({requirement,field,before,after})=>({id:requirement.id,field,before,after}))};
}

export function visibleTableWindow(rows,scrollTop,viewportHeight,rowHeight=34,overscan=5){const start=Math.max(0,Math.floor(scrollTop/rowHeight)-overscan),end=Math.min(rows.length,Math.ceil((scrollTop+viewportHeight)/rowHeight)+overscan);return{start,end,offsetTop:start*rowHeight,totalHeight:rows.length*rowHeight,rows:rows.slice(start,end)}}

export function requirementTableCsv(project,definition){const table=normalizeRequirementTable(definition),columns=table.columns.filter(column=>column.visible),escape=value=>`"${String(value??'').replaceAll('"','""')}"`;return [columns.map(column=>escape(column.label)).join(','),...requirementTableRows(project,table).map(row=>columns.map(column=>escape(row[column.key])).join(','))].join('\n')}

export function requirementTableWorkbook(project,definition){const table=normalizeRequirementTable(definition),columns=table.columns.filter(column=>column.visible);return {name:table.name,columns:columns.map(column=>column.label),rows:requirementTableRows(project,table).map(row=>columns.map(column=>row[column.key]??''))}}
