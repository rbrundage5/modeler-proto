import {contextBridge,ipcRenderer} from 'electron';
import {IPC} from './ipc-contract.mjs';
const invoke=(channel,payload)=>ipcRenderer.invoke(channel,payload);
contextBridge.exposeInMainWorld('modelerDesktop',Object.freeze({
  platform:'desktop',openProject:()=>invoke(IPC.openProject),saveProject:(content,suggestedName)=>invoke(IPC.saveProject,{content,suggestedName}),
  saveProjectAs:(content,suggestedName)=>invoke(IPC.saveProjectAs,{content,suggestedName}),importFile:()=>invoke(IPC.importFile),
  exportFile:(content,suggestedName,mime)=>invoke(IPC.exportFile,{content,suggestedName,mime}),metadata:()=>invoke(IPC.metadata),
  setDirty:dirty=>ipcRenderer.send(IPC.setDirty,Boolean(dirty)),onCommand:callback=>{if(typeof callback!=='function')throw new TypeError('Command listener required.');const listener=(_event,command)=>callback(command);ipcRenderer.on('menu:command',listener);return()=>ipcRenderer.removeListener('menu:command',listener)}
}));
