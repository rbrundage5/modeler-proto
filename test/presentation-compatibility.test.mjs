import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createProject,defaultElement,normalizeProject} from '../public/src/model.js';
import {DIAGRAMS} from '../public/src/sysml-profile.js';
import {auditDirectPresentationCoverage,buildPresentationCompatibilityMatrix,resolvePresentation} from '../public/src/presentation-compatibility.js';
import {canShowElementOnDiagram,defaultPresentationSize,showElementOnDiagram} from '../public/src/diagram-presentations.js';

const expected=[
 ['Actor','Use Case Diagram','DIRECT','ActorPresentation'],['Actor','Sequence Diagram','CONTEXTUAL','LifelineReference'],['Lifeline','Sequence Diagram','DIRECT','LifelinePresentation'],['UseCase','Use Case Diagram','DIRECT','UseCasePresentation'],['State','State Machine Diagram','DIRECT','StatePresentation'],['Action','Activity Diagram','DIRECT','ActionPresentation'],['Block','Block Definition Diagram','DIRECT','BlockPresentation'],['Requirement','Requirement Diagram','DIRECT','RequirementPresentation'],['ConstraintProperty','Parametric Diagram','DIRECT','ConstraintPropertyPresentation']
];
test('presentation compatibility matrix distinguishes direct, contextual, and intentionally unavailable notation',()=>{for(const [semanticType,diagramType,placementMode,presentationType] of expected){const result=resolvePresentation({semanticType,diagramType});assert.equal(result.placementMode,placementMode,`${semanticType} + ${diagramType}`);assert.equal(result.presentationType,presentationType)}const audit=auditDirectPresentationCoverage();assert.equal(audit.passed,true,JSON.stringify(audit.failures));assert.equal(audit.matrix.length,buildPresentationCompatibilityMatrix().length)});

test('Sequence palette exposes only directly placeable participants and frames',()=>{assert.deepEqual(DIAGRAMS['Sequence Diagram'].elements,['Lifeline','CombinedFragment','InteractionUse','Comment']);for(const contextual of ['Actor','ExecutionSpecification','InteractionOperand','Gate','TimeConstraint','DurationConstraint'])assert.ok(!DIAGRAMS['Sequence Diagram'].elements.includes(contextual))});

test('Actor remains visible on Use Case diagrams but is rejected as a direct Sequence node',()=>{const project=createProject('Presentation'),actor=defaultElement('Actor',project.root.id);actor.id='actor';project.elements.push(actor);project.diagrams.push({id:'uc',name:'UC',diagramType:'Use Case Diagram',ownerId:project.root.id,nodes:[],edges:[]},{id:'seq',name:'Seq',diagramType:'Sequence Diagram',ownerId:project.root.id,nodes:[],edges:[]});normalizeProject(project);const shown=showElementOnDiagram(project,'actor','uc',{x:20,y:20});assert.equal(shown.created,true);assert.deepEqual({width:shown.node.width,height:shown.node.height},defaultPresentationSize('Actor'));const rejected=canShowElementOnDiagram(project,'actor','seq');assert.equal(rejected.valid,false);assert.equal(rejected.code,'contextual-presentation-required');assert.match(rejected.message,/Lifeline/)});

test('every direct Sequence tool has explicit visible SVG rendering and missing renderers diagnose rather than disappear',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');for(const renderer of ['drawSequenceLifeline','drawCombinedFragment','drawInteractionUse','drawComment'])assert.match(source,new RegExp(renderer));assert.match(source,/Missing renderer:/);assert.match(source,/Skipped contextual presentation:/);assert.match(source,/messageFilled/)});

test('relationships remain endpoint workflows and are never treated as floating nodes',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');assert.match(source,/allowed\(d\.diagramType\)\.relationships\.includes\(tool\)/);assert.match(source,/Select a source and target element/);assert.doesNotMatch(source,/defaultElement\(tool[^\n]*relationships/)});

test('palette placement uses the same compatibility and presentation service as containment drag',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');assert.match(source,/function createAt\([^)]*targetNode=null\).*canShowElementOnDiagram/s);assert.match(source,/showElementOnDiagram\(project,element\.id,d\.id,pt/);assert.match(source,/placementMode==='CONTEXTUAL'.*createAt\(\$\('canvas'\),d,ev,n\)/s)});

test('context-owned frame features use the diagram frame attachment instead of becoming invisible',async()=>{const source=await readFile(new URL('../public/src/app.js',import.meta.url),'utf8');assert.match(source,/frame\.onclick=.*placementMode!=='CONTEXTUAL'.*contextNode.*createAt\(svg,d,ev,contextNode\)/s)});
