export class CommandRegistry{
 #commands=new Map();
 register(definition){if(!definition?.id||typeof definition.execute!=='function')throw new TypeError('Commands require an id and execute function.');if(this.#commands.has(definition.id))throw new Error(`Duplicate command: ${definition.id}`);const command=Object.freeze({label:definition.id,category:'General',shortcut:'',isEnabled:()=>true,...definition});this.#commands.set(command.id,command);return command}
 get(id){return this.#commands.get(id)||null}
 list(context){return [...this.#commands.values()].map(command=>({...command,enabled:Boolean(command.isEnabled(context))}))}
 run(id,context,...args){const command=this.get(id);if(!command)throw new Error(`Unknown command: ${id}`);if(!command.isEnabled(context))return false;command.execute(context,...args);return true}
}
export function createWorkbenchCommands(actions){const registry=new CommandRegistry();for(const [id,label,category,shortcut] of [['navigation.back','Back','Navigation','Alt+Left'],['navigation.forward','Forward','Navigation','Alt+Right'],['workspace.modeling','Modeling layout','Workspace',''],['workspace.review','Review layout','Workspace',''],['workspace.diagram','Diagram layout','Workspace',''],['search.focus','Search model','Navigation','Ctrl+F']])registry.register({id,label,category,shortcut,isEnabled:actions[id]?.isEnabled||(()=>true),execute:actions[id]?.execute||(()=>{})});return registry}
