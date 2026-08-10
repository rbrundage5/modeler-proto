export const IPC={
  openProject:'project:open',saveProject:'project:save',saveProjectAs:'project:save-as',
  importFile:'project:import',exportFile:'project:export',setDirty:'app:set-dirty',metadata:'app:metadata'
};
export const MENU_COMMANDS=new Set(['new','open','save','save-as','import','export','undo','redo']);
export const PROJECT_FILTERS=[{name:'Systems Modeler project',extensions:['sysml.json','json']}];
export const IMPORT_FILTERS=[{name:'Supported imports',extensions:['sysml.json','json','xlsx','xlsm','xls','csv']}];
export function validateText(value,{max=50_000_000}={}){
  if(typeof value!=='string')throw new TypeError('File content must be text.');
  if(Buffer.byteLength(value,'utf8')>max)throw new RangeError('File content exceeds the 50 MB desktop safety limit.');
  return value;
}
export function validateSuggestedName(value){
  if(value==null)return 'project.sysml.json';
  if(typeof value!=='string'||!value.trim()||value.length>180||/[\\/\0]/.test(value))throw new TypeError('Suggested file name is invalid.');
  return value;
}
