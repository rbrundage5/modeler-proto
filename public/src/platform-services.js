function browserDownload(name,content,type){const blob=content instanceof Blob?content:new Blob([content],{type}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return Promise.resolve({name})}
export function createPlatformServices(host=globalThis){
  const desktop=host.modelerDesktop;
  if(!desktop)return Object.freeze({kind:'browser',capabilities:{nativeFiles:false},openProject:async()=>null,saveProject:browserDownload,saveProjectAs:browserDownload,exportFile:browserDownload,setDirty:()=>{},onCommand:()=>()=>{}});
  return Object.freeze({kind:'desktop',capabilities:{nativeFiles:true},openProject:()=>desktop.openProject(),saveProject:(name,content)=>desktop.saveProject(content,name),saveProjectAs:(name,content)=>desktop.saveProjectAs(content,name),exportFile:(name,content,type)=>desktop.exportFile(content,name,type),importFile:()=>desktop.importFile(),setDirty:value=>desktop.setDirty(value),onCommand:callback=>desktop.onCommand(callback),metadata:()=>desktop.metadata()});
}
export const platformServices=createPlatformServices();
