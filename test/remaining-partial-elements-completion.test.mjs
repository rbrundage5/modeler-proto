import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,normalizeProject} from '../public/src/model.js';
import {showElementOnDiagram} from '../public/src/diagram-presentations.js';
import {compartmentAddKind,compartmentNames,getCompartmentRows,visibleCompartments} from '../public/src/notation.js';
import {elementCapabilityFor} from '../public/src/sysml/conformance-registry.js';
import {SUPPORTED_TYPE_INVENTORY,inventoryEntry} from '../public/src/supported-type-inventory.js';

const promoted=['Profile','Activity','ExtensionPoint','Lifeline','CombinedFragment','InteractionUse'];

test('no semantic element remains advertised as partial',()=>{
  const partial=SUPPORTED_TYPE_INVENTORY.filter(item=>item.recordKind==='element'&&item.supportStatus==='partial').map(item=>item.canonicalType);
  assert.deepEqual(partial,[]);
  for(const kind of promoted){
    const item=inventoryEntry(kind,'element');
    assert.equal(item.supportStatus,'complete',kind);
    assert.equal(item.semanticCreation,true,kind);
    assert.equal(item.presentationCreation,true,kind);
    assert.equal(item.knownLimitations.length,0,kind);
  }
});

test('qualified direct presentations are backed by working conformance fixtures',()=>{
  for(const [diagram,kind] of [
    ['Package Diagram','Profile'],
    ['Requirement Diagram','Activity'],
    ['Sequence Diagram','Lifeline'],
    ['Sequence Diagram','CombinedFragment'],
    ['Sequence Diagram','InteractionUse'],
  ]){
    const capability=elementCapabilityFor(diagram,kind);
    assert.ok(capability,`${kind} capability on ${diagram}`);
    assert.equal(capability.maturity,'working',`${kind} on ${diagram}`);
    assert.ok(capability.testFixtureId,`${kind} fixture`);
    assert.deepEqual(capability.knownLimitations,[]);
  }
});

test('UML ExtensionPoint is an owned UseCase compartment element',()=>{
  const project=createProject('Use case extension points');
  const useCase=defaultElement('UseCase',project.root.id),extension=defaultElement('ExtensionPoint',useCase.id);
  Object.assign(useCase,{id:'uc',name:'Authenticate'});Object.assign(extension,{id:'ep',name:'Alternative credentials'});
  project.elements.push(useCase,extension);normalizeProject(project);
  assert.ok(compartmentNames(useCase).includes('extensionPoints'));
  assert.equal(compartmentAddKind('extensionPoints'),'ExtensionPoint');
  assert.deepEqual(getCompartmentRows(project,useCase,'extensionPoints').map(item=>item.id),['ep']);
  assert.equal(visibleCompartments(project,useCase).find(item=>item.name==='extensionPoints')?.rows[0].name,'Alternative credentials');
  assert.equal(inventoryEntry('ExtensionPoint','element').creationWorkflow,'owned-compartment');
  assert.deepEqual(inventoryEntry('ExtensionPoint','element').diagramTypes,['Use Case Diagram']);
});

test('Profile and Activity use ordinary semantic/presentation identity and survive save-reload',()=>{
  const project=createProject('Qualification');
  const profile=defaultElement('Profile',project.root.id),activity=defaultElement('Activity',project.root.id);
  Object.assign(profile,{id:'profile',name:'EngineeringProfile'});Object.assign(activity,{id:'activity',name:'Verify operation'});
  project.elements.push(profile,activity);
  project.diagrams.push(
    {id:'pkg',name:'Profiles',diagramType:'Package Diagram',ownerId:project.root.id,contextId:project.root.id,nodes:[],edges:[]},
    {id:'req',name:'Requirement context',diagramType:'Requirement Diagram',ownerId:project.root.id,contextId:project.root.id,nodes:[],edges:[]},
  );
  showElementOnDiagram(project,'profile','pkg',{x:120,y:140});
  showElementOnDiagram(project,'activity','req',{x:420,y:180});
  const loaded=normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.equal(loaded.diagrams.find(d=>d.id==='pkg').nodes[0].elementId,'profile');
  assert.equal(loaded.diagrams.find(d=>d.id==='req').nodes[0].elementId,'activity');
});

test('sequence frame and interaction-use presentations retain specialized semantics and geometry',()=>{
  const project=createProject('Sequence qualification'),interaction=defaultElement('Interaction',project.root.id),lifeline=defaultElement('Lifeline','interaction'),fragment=defaultElement('CombinedFragment','interaction'),interactionUse=defaultElement('InteractionUse','interaction');
  Object.assign(interaction,{id:'interaction'});Object.assign(lifeline,{id:'lifeline',representedElementId:project.root.id});Object.assign(fragment,{id:'fragment',fragmentOperator:'alt'});Object.assign(interactionUse,{id:'interaction-use',name:'Referenced interaction'});
  project.elements.push(interaction,lifeline,fragment,interactionUse);
  project.diagrams.push({id:'seq',name:'Sequence',diagramType:'Sequence Diagram',ownerId:'interaction',contextId:'interaction',nodes:[],edges:[]});
  const lifeNode=showElementOnDiagram(project,'lifeline','seq',{x:100,y:60}).node;
  const fragmentNode=showElementOnDiagram(project,'fragment','seq',{x:80,y:180}).node;
  const useNode=showElementOnDiagram(project,'interaction-use','seq',{x:420,y:220}).node;
  assert.equal(lifeNode.elementId,'lifeline');
  assert.equal(fragmentNode.elementId,'fragment');
  assert.equal(useNode.elementId,'interaction-use');
  assert.equal(project.elements.find(item=>item.id==='fragment').fragmentOperator,'alt');
  const loaded=normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.ok(loaded.diagrams[0].nodes.some(node=>node.elementId==='fragment'));
  assert.ok(loaded.diagrams[0].nodes.some(node=>node.elementId==='interaction-use'));
});
