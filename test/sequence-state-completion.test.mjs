import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stateMachineIssues} from '../public/src/state-machine-completion.js';

const sequenceSource=await readFile(new URL('../public/src/sequence-message-interactions.js',import.meta.url),'utf8');
const stateSource=await readFile(new URL('../public/src/state-machine-completion.js',import.meta.url),'utf8');

test('Sequence controller provides explicit Reply Message and robust document-level vertical dragging',()=>{
  assert.match(sequenceSource,/data-tool=\\?"ReplyMessage/);
  assert.match(sequenceSource,/Reply Message/);
  assert.match(sequenceSource,/messageSort='reply'/);
  assert.match(sequenceSource,/addEventListener\('pointermove',moveMessageDrag,true\)/);
  assert.match(sequenceSource,/moveMessageOccurrence\(drag\.edge,next\)/);
  assert.match(sequenceSource,/timelineStartY/);
  assert.match(sequenceSource,/timelineEndY/);
});

test('State Machine completion covers UML regions, state families, pseudostates and transition semantics',()=>{
  for(const token of ['CompositeState','SubmachineState','InitialPseudostate','ChoicePseudostate','JunctionPseudostate','ShallowHistory','DeepHistory','EntryPoint','ExitPoint','StateFork','StateJoin','FinalState','Region'])assert.match(stateSource,new RegExp(token));
  assert.match(stateSource,/triggerIds/);
  assert.match(stateSource,/guard/);
  assert.match(stateSource,/effect/);
  assert.match(stateSource,/submachineStateMachineId/);
  assert.match(stateSource,/\+ Region/);
});

test('State Machine validation rejects invalid UML transition endpoint conditions',()=>{
  const machine={id:'machine',kind:'StateMachine',ownerId:'root'},initial={id:'initial',kind:'InitialPseudostate',ownerId:'machine'},final={id:'final',kind:'FinalState',ownerId:'machine'},state={id:'state',kind:'State',ownerId:'machine'};
  const project={root:{id:'root',kind:'Model'},elements:[machine,initial,final,state],relationships:[{id:'bad-final',kind:'Transition',sourceId:'final',targetId:'state',ownerId:'machine'},{id:'bad-initial',kind:'Transition',sourceId:'state',targetId:'initial',ownerId:'machine'}]};
  const diagram={diagramType:'State Machine Diagram',contextId:'machine',ownerId:'machine',nodes:[]};
  const codes=stateMachineIssues(project,diagram).map(issue=>issue.code);
  assert.ok(codes.includes('STM_FINAL_OUTGOING'));
  assert.ok(codes.includes('STM_INITIAL_INCOMING'));
});

test('State Machine validation accepts correctly owned vertices and transition',()=>{
  const machine={id:'machine',kind:'StateMachine',ownerId:'root'},region={id:'region',kind:'Region',ownerId:'machine'},initial={id:'initial',kind:'InitialPseudostate',ownerId:'region'},state={id:'state',kind:'State',ownerId:'region'},final={id:'final',kind:'FinalState',ownerId:'region'};
  const project={root:{id:'root',kind:'Model'},elements:[machine,region,initial,state,final],relationships:[{id:'t1',kind:'Transition',sourceId:'initial',targetId:'state',ownerId:'region',triggerIds:[],guard:'',effect:''},{id:'t2',kind:'Transition',sourceId:'state',targetId:'final',ownerId:'region',triggerIds:[],guard:'done',effect:'stop()'}]};
  const diagram={diagramType:'State Machine Diagram',contextId:'machine',ownerId:'machine',nodes:[]};
  assert.deepEqual(stateMachineIssues(project,diagram),[]);
});
