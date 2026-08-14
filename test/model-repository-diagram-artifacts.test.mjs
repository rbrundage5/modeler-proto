import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isDiagramArtifactElement,modelRepositoryElements} from '../public/src/model-repository-visibility.js';

test('Model repository excludes diagram-kind artifacts while preserving legitimate semantic elements',()=>{
  const project={
    root:{id:'root',name:'Model',kind:'Model'},
    elements:[
      {id:'pkg',name:'Requirements',kind:'Package',ownerId:'root'},
      {id:'req',name:'Requirement',kind:'Requirement',ownerId:'pkg'},
      {id:'artifact-1',name:'Overview',kind:'Requirement Diagram',ownerId:'pkg'},
      {id:'artifact-2',name:'Structure',kind:'BlockDefinitionDiagram',ownerId:'pkg'},
      {id:'same-id',name:'Imported diagram document',kind:'Document',ownerId:'pkg'}
    ],
    diagrams:[{id:'same-id',name:'Actual Diagram',diagramType:'Requirement Diagram',ownerId:'pkg'}]
  };
  assert.equal(isDiagramArtifactElement(project.elements[2],project.diagrams),true);
  assert.deepEqual(modelRepositoryElements(project).map(element=>element.id),['root','pkg','req']);
});

test('element importer explicitly rejects diagram kinds without creating warnings',async()=>{
  const source=await readFile(new URL('../public/src/importer.js',import.meta.url),'utf8');
  assert.match(source,/isDiagramArtifactElement\(\{kind,/);
  assert.match(source,/ctx\.report\.elements\.skipped\+\+;continue/);
});
