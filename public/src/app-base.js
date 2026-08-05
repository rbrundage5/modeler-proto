import {DIAGRAM_TYPES,uid,createProject,allElements,findElement,findRelationship,qualifiedName,defaultElement,defaultRelationship,relationshipStyle,normalizeProject,refreshQualifiedNames} from "./model.js";
import {allowed} from "./sysml-profile.js";
import {importWorkbook} from "./importer.js";
import {validate} from "./validator.js";
import {CollaborationClient} from "./collaboration.js";
const $=id=>document.getElementById(id);
let project=normalizeProject(loadLocal()||createProject()),selectedId=null,selectedNodeId=null,activeTool=null,relationshipSource=null,zoom=1;
let history=[],future=[],drag=null,suppressPublish=false;
const collab=new CollaborationClient({
  getProject:()=>project,
  onProject:(incoming,reason)=>{suppressPublish=true;project=normalizeProject(incoming);saveLocal();renderAll();log(`Loaded ${reason}.`,"ok");suppressPublish=false},
  onPresence:users=>{$("presenceStatus").textContent=`${users.length} collaborator${users.length===1?"":"s"}`},
  onStatus:v=>$("connectionStatus").textContent=v,onLog:log,onMeta:meta=>{if(meta.branches){const sel=$("branchSelect");sel.replaceChildren();for(const b of meta.branches){const o=document.createElement("option");o.value=b.id;o.textContent=`${b.name} (r${b.head_revision})`;sel.append(o)}sel.value=collab.branchId}if(meta.revision!==undefined)$("revisionStatus").textContent=`r${meta.revision}`},
  onConflict:msg=>{log(`CONFLICT: ${msg.message} Latest revision loaded; reapply your edit.`,"error");suppressPublish=true;project=normalizeProject(msg.project);saveLocal();renderAll();suppressPublish=false}
});
function checkpoint(){history.push(JSON.stringify(project));if(history.length>80)history.shift();future=[]}
function changed(message="Project updated",operation={type:"project-change"}){
  refreshQualifiedNames(project);project.revision=(project.revision||0)+1;project.metadata.updatedAt=new Date().toISOString();
  saveLocal();renderAll();if(!suppressPublish)collab.publish(operation);log(message,"ok")
}
function activeDiagram(){return project.diagrams.find(d=>d.id===project.activeDiagramId)||project.diagrams[0]}
function saveLocal(){localStorage.setItem("systems-modeler.project.v2",JSON.stringify(project))}
function loadLocal(){try{return JSON.parse(localStorage.getItem("systems-modeler.project.v2"))}catch{return null}}
function log(message,cls=""){const div=document.createElement("div");div.className=`log-entry ${cls}`;div.textContent=`${new Date().toLocaleTimeString()}  ${message}`;$("log").prepend(div)}
function renderAll(){renderTree();renderPalette();renderDiagramSelect();renderCanvas();renderProperties();$("revisionStatus").textContent=`r${project.revision||0}`}
function renderTree(){
  const tree=$("tree");tree.replaceChildren();const children=new Map();
  for(const e of allElements(project)){const k=e.ownerId||"ROOT";if(!children.has(k))children.set(k,[]);children.get(k).push(e)}
  const draw=(e,depth=0)=>{const row=document.createElement("div");row.className=`tree-row ${selectedId===e.id?"selected":""}`;row.style.paddingLeft=`${5+depth*16}px`;
    row.innerHTML=`<span>${icon(e.kind)}</span><span>${esc(e.name)}</span>`;row.onclick=()=>{selectedId=e.id;selectedNodeId=null;renderAll()};tree.append(row);
    for(const c of children.get(e.id)||[])draw(c,depth+1)};draw(project.root)
}
function icon(k){return{Model:"◈",Package:"📁",Block:"▣",Requirement:"R",Actor:"♙",UseCase:"◯",ProxyPort:"□",FullPort:"■"}[k]||"◇"}
function renderPalette(){
  const p=$("palette");p.replaceChildren();const d=activeDiagram(),tools=allowed(d?.diagramType);
  for(const [label,list] of [["Elements",tools.elements],["Relationships",tools.relationships]]){
    const section=document.createElement("div");section.className="palette-group";section.innerHTML=`<h4>${label}</h4>`;
    for(const tool of list){const b=document.createElement("button");b.className="palette-tool";b.textContent=tool;b.onclick=()=>{activeTool=tool;relationshipSource=null;log(`Selected ${tool}.`)};section.append(b)}p.append(section)
  }
}
function renderDiagramSelect(){
  const s=$("diagramSelect");s.replaceChildren();for(const d of project.diagrams){const o=document.createElement("option");o.value=d.id;o.textContent=`${d.name} — ${d.diagramType}`;s.append(o)}
  s.value=project.activeDiagramId||"";$("diagramTitle").textContent=activeDiagram()?.name||"No Diagram"
}
function renderCanvas(){
  const svg=$("canvas");svg.replaceChildren();svg.style.transform=`scale(${zoom})`;defs(svg);const d=activeDiagram();if(!d)return;
  for(const edge of d.edges)drawEdge(svg,d,edge);for(const node of d.nodes)drawNode(svg,d,node);
  svg.onclick=e=>{if(e.target!==svg)return;if(!activeTool){selectedNodeId=null;renderProperties();return}
    if(allowed(d.diagramType).relationships.includes(activeTool)){log("Select a valid source element first.","error");return}
    const pt=svgPoint(svg,e),context=findElement(project,d.contextId),ownerId=context?.id||d.ownerId||project.root.id;
    checkpoint();const element=defaultElement(activeTool,ownerId);project.elements.push(element);
    d.nodes.push({id:uid("node"),elementId:element.id,x:pt.x,y:pt.y,width:widthFor(activeTool),height:heightFor(activeTool)});
    selectedId=element.id;selectedNodeId=d.nodes.at(-1).id;changed(`Created ${activeTool}.`,{type:"create-element",element:structuredClone(element),diagramId:d.id,node:structuredClone(d.nodes.at(-1))})}
}
function drawNode(svg,d,node){
  const e=findElement(project,node.elementId);if(!e)return;const g=el("g",{class:`node ${selectedNodeId===node.id?"selected":""}`,transform:`translate(${node.x} ${node.y})`}),w=node.width,h=node.height;
  if(e.kind==="Actor"){g.append(el("circle",{class:"shape",cx:w/2,cy:15,r:10}));for(const a of [{x1:w/2,y1:25,x2:w/2,y2:58},{x1:w/2-20,y1:36,x2:w/2+20,y2:36},{x1:w/2,y1:58,x2:w/2-18,y2:86},{x1:w/2,y1:58,x2:w/2+18,y2:86}])g.append(el("line",{...a,stroke:"#111"}));text(g,e.name,w/2,105,"middle")}
  else if(e.kind==="UseCase"){g.append(el("ellipse",{class:"shape",cx:w/2,cy:h/2,rx:w/2-2,ry:h/2-2}));text(g,e.name,w/2,h/2+4,"middle")}
  else if(["InitialNode","InitialPseudostate"].includes(e.kind))g.append(el("circle",{cx:w/2,cy:h/2,r:Math.min(w,h)/2-2,fill:"#111"}));
  else if(["DecisionNode","MergeNode"].includes(e.kind))g.append(el("polygon",{class:"shape",points:`${w/2},1 ${w-1},${h/2} ${w/2},${h-1} 1,${h/2}`}));
  else{g.append(el("rect",{class:"shape",x:1,y:1,width:w-2,height:h-2,rx:["State","Action"].includes(e.kind)?10:0}));let y=17;if(e.stereotype){text(g,`«${e.stereotype}»`,w/2,y,"middle","stereo");y+=16}text(g,e.name,w/2,y,"middle");y+=9;g.append(el("line",{x1:1,y1:y,x2:w-1,y2:y,stroke:"#111"}));
    if(e.kind==="Requirement"){text(g,`id = "${e.requirementId||e.externalId}"`,7,y+18);wrap(g,`text = "${e.requirementText||""}"`,7,y+35,w-14,14)}
    else if(["Block","InterfaceBlock","ConstraintBlock"].includes(e.kind))drawCompartments(g,e,w,y)}
  g.onpointerdown=ev=>{ev.stopPropagation();selectedId=e.id;selectedNodeId=node.id;if(allowed(d.diagramType).relationships.includes(activeTool)){relationshipClick(d,e);return}
    drag={node,startX:ev.clientX,startY:ev.clientY,origX:node.x,origY:node.y};g.setPointerCapture(ev.pointerId);renderProperties()};
  g.onpointermove=ev=>{if(!drag||drag.node!==node)return;node.x=drag.origX+(ev.clientX-drag.startX)/zoom;node.y=drag.origY+(ev.clientY-drag.startY)/zoom;g.setAttribute("transform",`translate(${node.x} ${node.y})`)};
  g.onpointerup=()=>{if(drag){const expectedValue={x:drag.origX,y:drag.origY};checkpoint();drag=null;changed("Moved diagram element.",{type:"move-node",diagramId:d.id,nodeId:node.id,x:node.x,y:node.y,expectedValue})}};svg.append(g)
}
function drawCompartments(g,e,w,y){let cy=y;for(const name of Object.keys(e.compartmentVisibility||{})){const items=e.compartments?.[name]||[];if(!e.compartmentVisibility[name]||!items.length)continue;cy+=18;text(g,name,7,cy,"start","stereo");cy+=5;g.append(el("line",{x1:1,y1:cy,x2:w-1,y2:cy,stroke:"#777"}));for(const item of items.slice(0,6)){cy+=16;text(g,typeof item==="string"?item:item.name||"",7,cy)}}}
function relationshipClick(d,e){
  if(!relationshipSource){relationshipSource=e.id;log(`Source: ${e.name}`);return}
  if(relationshipSource===e.id)return;const source=findElement(project,relationshipSource),target=e;
  const rules=allowed(d.diagramType);if(!rules.relationships.includes(activeTool)){log(`${activeTool} is not valid on this diagram.`,"error");return}
  checkpoint();const r=defaultRelationship(activeTool,source.id,target.id,d.contextId||d.ownerId);project.relationships.push(r);d.edges.push({id:uid("edge"),relationshipId:r.id,sourceId:source.id,targetId:target.id});
  relationshipSource=null;changed(`Created ${activeTool}.`,{type:"create-relationship",relationship:structuredClone(r),diagramId:d.id,edge:structuredClone(d.edges.at(-1))})
}
function drawEdge(svg,d,edge){const r=findRelationship(project,edge.relationshipId);if(!r)return;const s=d.nodes.find(n=>n.elementId===r.sourceId),t=d.nodes.find(n=>n.elementId===r.targetId);if(!s||!t)return;
  const x1=s.x+s.width/2,y1=s.y+s.height/2,x2=t.x+t.width/2,y2=t.y+t.height/2,style=relationshipStyle(r.kind);
  svg.append(el("line",{class:`edge ${style.dashed?"dashed":""}`,x1,y1,x2,y2,"marker-end":style.marker==="none"?"":`url(#${style.marker})`}));
  const label=r.stereotype?`«${r.stereotype}» ${r.name||""}`:r.name;if(label)text(svg,label,(x1+x2)/2,(y1+y2)/2-5,"middle","edge-label")
}
function defs(svg){const d=el("defs");d.innerHTML=`<marker id="open" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto"><path d="M1,1 L11,6 L1,11" fill="none" stroke="#263746"/></marker><marker id="triangle" markerWidth="14" markerHeight="14" refX="13" refY="7" orient="auto"><path d="M1,1 L13,7 L1,13 Z" fill="white" stroke="#263746"/></marker><marker id="diamond" markerWidth="16" markerHeight="12" refX="15" refY="6" orient="auto"><path d="M1,6 L7,1 L15,6 L7,11 Z" fill="white" stroke="#263746"/></marker><marker id="diamondFilled" markerWidth="16" markerHeight="12" refX="15" refY="6" orient="auto"><path d="M1,6 L7,1 L15,6 L7,11 Z" fill="#263746" stroke="#263746"/></marker>`;svg.append(d)}
function renderProperties(){
  const p=$("properties");p.replaceChildren();const e=findElement(project,selectedId);if(!e){p.textContent="Select a model element.";return}
  p.append(section("Identity",[field("Name",e.name,v=>edit(e,"name",v),"blur"),field("External ID",e.externalId||e.id,v=>edit(e,"externalId",v),"blur"),field("Qualified Name",qualifiedName(project,e.id)),field("Kind",e.kind)]));
  p.append(section("Ownership",[selectField("Owner",e.ownerId,allElements(project).filter(x=>x.id!==e.id).map(x=>[x.id,qualifiedName(project,x.id)]),v=>edit(e,"ownerId",v))]));
  p.append(section("Documentation",[field("Documentation",e.documentation||"",v=>edit(e,"documentation",v),"blur",true)]));
  if(e.kind==="Requirement")p.append(section("Requirement",[field("Requirement ID",e.requirementId||"",v=>edit(e,"requirementId",v),"blur"),field("Requirement Text",e.requirementText||"",v=>edit(e,"requirementText",v),"blur",true)]));
  if(["PartProperty","ReferenceProperty","ValueProperty","FlowProperty","ConstraintProperty","ProxyPort","FullPort"].includes(e.kind))p.append(section("Typed Feature",[field("Type Ref",e.typeRef||"",v=>edit(e,"typeRef",v),"blur"),field("Multiplicity",e.multiplicity||"1",v=>edit(e,"multiplicity",v),"blur"),field("Direction",e.direction||"inout",v=>edit(e,"direction",v),"blur")]));
  if(["Block","InterfaceBlock","ConstraintBlock"].includes(e.kind))p.append(compartmentEditor(e))
}
function edit(e,k,v){const expectedValue=structuredClone(e[k]);checkpoint();e[k]=v;changed(`Updated ${k}.`,{type:"set-property",targetType:"element",targetId:e.id,property:k,value:v,expectedValue})}
function section(title,children){const s=document.createElement("div");s.className="section";s.innerHTML=`<h3>${title}</h3>`;for(const c of children)s.append(c);return s}
function field(label,value,onChange,eventType="input",area=false){const row=document.createElement("label");row.className="field";row.innerHTML=`<span>${label}</span>`;const i=document.createElement(area?"textarea":"input");i.value=value??"";if(!onChange)i.readOnly=true;else i.addEventListener(eventType,e=>onChange(e.target.value));row.append(i);return row}
function selectField(label,value,options,onChange){const row=document.createElement("label");row.className="field";row.innerHTML=`<span>${label}</span>`;const s=document.createElement("select");for(const[v,n]of options){const o=document.createElement("option");o.value=v;o.textContent=n;s.append(o)}s.value=value||"";s.onchange=e=>onChange(e.target.value);row.append(s);return row}
function compartmentEditor(e){const s=section("Compartments",[]);for(const name of Object.keys(e.compartmentVisibility)){const row=document.createElement("div");row.className="field";const label=document.createElement("span"),cb=document.createElement("input");cb.type="checkbox";cb.checked=e.compartmentVisibility[name];cb.onchange=()=>{const expectedValue=e.compartmentVisibility[name];checkpoint();e.compartmentVisibility[name]=cb.checked;changed(`Changed ${name} visibility.`,{type:"set-compartment-visibility",elementId:e.id,name,value:cb.checked,expectedValue})};label.append(cb,document.createTextNode(name));const ta=document.createElement("textarea");ta.value=(e.compartments[name]||[]).join("\n");ta.onblur=()=>{const expectedValue=structuredClone(e.compartments[name]||[]);checkpoint();e.compartments[name]=ta.value.split("\n").map(x=>x.trim()).filter(Boolean);changed(`Updated ${name}.`,{type:"set-compartment",elementId:e.id,name,value:e.compartments[name],expectedValue})};row.append(label,ta);s.append(row)}return s}
function widthFor(k){return k==="Actor"?100:k==="UseCase"?180:["InitialNode","DecisionNode","MergeNode"].includes(k)?40:190}
function heightFor(k){return k==="Actor"?120:k==="UseCase"?90:["InitialNode","DecisionNode","MergeNode"].includes(k)?40:110}
function svgPoint(svg,e){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)/zoom,y:(e.clientY-r.top)/zoom}}
function el(n,a={}){const x=document.createElementNS("http://www.w3.org/2000/svg",n);for(const[k,v]of Object.entries(a))if(v!==""&&v!=null)x.setAttribute(k,v);return x}
function text(p,v,x,y,anchor="start",cls=""){const t=el("text",{x,y,"text-anchor":anchor,class:cls});t.textContent=v;p.append(t)}
function wrap(p,v,x,y,w,h){const words=String(v).split(/\s+/);let line="",row=0;for(const word of words){const test=`${line} ${word}`.trim();if(test.length*6>w&&line){text(p,line,x,y+row*h);line=word;row++}else line=test}if(line)text(p,line,x,y+row*h)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function download(name,data,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$("diagramSelect").onchange=e=>{project.activeDiagramId=e.target.value;renderAll()};
$("newDiagram").onclick=()=>{const name=prompt("Diagram name","New Diagram");if(!name)return;const type=prompt(`Diagram type:\n${DIAGRAM_TYPES.join("\n")}`,"Block Definition Diagram")||"Block Definition Diagram";checkpoint();const owner=selectedId||project.root.id,d={id:uid("diagram"),externalId:uid("DGM").toUpperCase(),name,diagramType:type,ownerId:owner,contextId:owner,nodes:[],edges:[]};project.diagrams.push(d);project.activeDiagramId=d.id;changed("Created diagram.",{type:"create-diagram",diagram:structuredClone(d)})};
$("newProject").onclick=()=>{checkpoint();project=createProject(prompt("Project name","New Systems Model")||"New Systems Model");selectedId=null;changed("Created project.",{type:"replace-project",project:structuredClone(project)})};
$("saveProject").onclick=()=>{saveLocal();log("Saved locally.","ok")};
$("exportProject").onclick=()=>download(`${project.name.replace(/\W+/g,"_")}.sysml.json`,JSON.stringify(project,null,2),"application/json");
$("openProject").onclick=()=>$("fileInput").click();$("fileInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;checkpoint();project=normalizeProject(JSON.parse(await f.text()));selectedId=null;changed(`Opened ${f.name}.`,{type:"replace-project",project:structuredClone(project)})};
$("importWorkbook").onclick=()=>$("workbookInput").click();$("workbookInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;checkpoint();try{await importWorkbook(f,project,log);changed(`Imported ${f.name}.`,{type:"replace-project",project:structuredClone(project),reason:"import-workbook",file:f.name})}catch(err){log(err.message,"error")}};
$("validateModel").onclick=()=>{const issues=validate(project);if(!issues.length)log("SysML validation passed.","ok");else issues.forEach(i=>log(`${i.severity.toUpperCase()} [${i.code}]: ${i.message}`,i.severity==="error"?"error":""))};
$("undo").onclick=()=>{if(!history.length)return;future.push(JSON.stringify(project));project=normalizeProject(JSON.parse(history.pop()));changed("Undo.",{type:"replace-project",project:structuredClone(project),reason:"undo"})};
$("redo").onclick=()=>{if(!future.length)return;history.push(JSON.stringify(project));project=normalizeProject(JSON.parse(future.pop()));changed("Redo.",{type:"replace-project",project:structuredClone(project),reason:"redo"})};
$("connectRoom").onclick=()=>{collab.setName($("displayName").value.trim()||"Modeler");collab.connect($("roomId").value.trim()||"default",$("branchSelect").value||"main")};
$("commitModel").onclick=()=>{const m=prompt("Commit message","Model update");if(m)collab.commit(m)};$("newBranch").onclick=()=>{const n=prompt("Branch name","feature-model");if(n)collab.createBranch(n)};$("branchSelect").onchange=e=>collab.switchBranch(e.target.value);$("lockSelected").onclick=()=>{if(selectedId)collab.lock(selectedId)};$("unlockSelected").onclick=()=>{if(selectedId)collab.unlock(selectedId)};$("displayName").value=collab.name;
$("zoomIn").onclick=()=>{zoom=Math.min(2,zoom+.1);renderCanvas()};$("zoomOut").onclick=()=>{zoom=Math.max(.3,zoom-.1);renderCanvas()};$("zoomReset").onclick=()=>{zoom=1;renderCanvas()};
renderAll();log("Systems Modeler v2 loaded.","ok");
