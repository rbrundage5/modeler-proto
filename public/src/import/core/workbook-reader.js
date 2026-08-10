import {readCsv,readXlsx} from './xlsx-reader.js';
const normalize=value=>String(value??'').trim();
export const headerKey=value=>normalize(value).toLowerCase().replace(/[^a-z0-9]/g,'');

export function detectHeaderRow(matrix,requiredGroups=[],maxScanRows=40){
  const limit=Math.min(matrix.length,maxScanRows);let best={index:-1,score:-Infinity,headers:[]};
  for(let i=0;i<limit;i+=1){
    const raw=matrix[i]||[],headers=raw.map(headerKey),nonBlank=headers.filter(Boolean);
    if(nonBlank.length<2)continue;
    let matched=0;
    for(const group of requiredGroups){if(group.some(candidate=>headers.includes(headerKey(candidate))))matched+=1;}
    const unique=new Set(nonBlank).size;
    const numericRatio=raw.filter(v=>normalize(v)!==''&&!Number.isNaN(Number(v))).length/nonBlank.length;
    // Real headers match multiple alias groups, contain varied labels, and are rarely mostly numeric.
    const score=matched*20+Math.min(nonBlank.length,24)+unique*0.25-numericRatio*12-i*0.02;
    if(score>best.score)best={index:i,score,headers};
  }
  return best.index;
}

export function rowsFromMatrix(matrix,headerRowIndex){
  if(headerRowIndex<0||headerRowIndex>=matrix.length)return[];
  const rawHeaders=matrix[headerRowIndex]||[];
  const seen=new Map();
  const headers=rawHeaders.map((value,index)=>{
    const base=normalize(value)||`Column ${index+1}`;const count=seen.get(base)||0;seen.set(base,count+1);return count?`${base} (${count+1})`:base;
  });
  return matrix.slice(headerRowIndex+1).map((cells,rowOffset)=>{
    const row={__rowNumber:headerRowIndex+rowOffset+2};headers.forEach((header,index)=>{row[header]=cells?.[index]??'';});return row;
  }).filter(row=>Object.entries(row).some(([name,value])=>name!=='__rowNumber'&&normalize(value)!==''));
}

export async function readWorkbook(file,profile){
  const extension=String(file.name||'').toLowerCase().split('.').at(-1);let parsed;
  if(extension==='xlsx'||extension==='xlsm')parsed=await readXlsx(await file.arrayBuffer());
  else if(extension==='csv')parsed=[{name:String(file.name||'CSV').replace(/\.csv$/i,''),matrix:readCsv(await file.text())}];
  else if(extension==='xls'&&globalThis.XLSX){const legacy=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});parsed=legacy.SheetNames.map(name=>({name,matrix:XLSX.utils.sheet_to_json(legacy.Sheets[name],{header:1,defval:'',raw:false})}))}
  else throw new Error('Legacy binary .xls requires the optional online compatibility parser. For offline import, save the workbook as .xlsx or .csv.');
  const workbook={SheetNames:parsed.map(sheet=>sheet.name)};const sheets=[];
  for(const {name,matrix} of parsed){
    const definition=profile.matchSheet(name);
    const headerRow=detectHeaderRow(matrix,definition?.headerGroups||profile.defaultHeaderGroups,40);
    const rows=rowsFromMatrix(matrix,headerRow);
    sheets.push({name,definition,headerRow,rows,matrix});
  }
  return{workbook,sheets};
}
