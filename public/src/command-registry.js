export class CommandRegistry{
  constructor(){this.commands=new Map();this.recent=[]}
  register(command){if(!command?.id||!command.label||typeof command.execute!=='function')throw Error('Command requires id, label, and execute.');if(this.commands.has(command.id))throw Error(`Duplicate command ID: ${command.id}`);this.commands.set(command.id,{icon:'',category:'General',shortcut:'',undoable:false,enabled:()=>true,visible:()=>true,...command});return command}
  get(id){return this.commands.get(id)}
  execute(id,context){const command=this.get(id);if(!command||!command.visible(context)||!command.enabled(context))return false;command.execute(context);this.recent=[id,...this.recent.filter(value=>value!==id)].slice(0,12);return true}
  search(query='',context){const words=String(query).toLowerCase().split(/\s+/).filter(Boolean);return[...this.commands.values()].filter(c=>c.visible(context)&&words.every(word=>`${c.label} ${c.category} ${c.shortcut}`.toLowerCase().includes(word))).sort((a,b)=>(this.recent.indexOf(a.id)+1||99)-(this.recent.indexOf(b.id)+1||99)||a.label.localeCompare(b.label))}
}
