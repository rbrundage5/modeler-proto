import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,defaultElement,defaultRelationship} from '../public/src/model.js';
import {associationEnds,effectiveFeatures,inheritedFeatures,synchronizeSemanticModel} from '../public/src/semantic-core.js';
import {formatFeature,getCompartmentRows} from '../public/src/notation.js';
import {validate} from '../public/src/validator.js';

const add=(project,kind,name,ownerId=project.root.id)=>{const element=defaultElement(kind,ownerId);element.name=name;project.elements.push(element);return element};

test('typed features resolve classifiers live after classifier renames',()=>{
  const project=createProject('Typed'),receiver=add(project,'Block','ReceiverBlock'),part=add(project,'PartProperty','receiver',project.root.id);part.typeRef=receiver.id;
  assert.equal(formatFeature(project,part),'receiver: ReceiverBlock');
  receiver.name='RenamedReceiver';
  assert.equal(formatFeature(project,part),'receiver: RenamedReceiver');
  assert.equal(validate(project).some(issue=>issue.code==='TYPE_REQUIRED'&&issue.id===part.id),false);
});

test('typed features require a compatible classifier',()=>{
  const project=createProject('Strict typing'),part=add(project,'PartProperty','receiver');
  assert(validate(project).some(issue=>issue.code==='TYPE_REQUIRED'&&issue.severity==='error'));
  const valueType=add(project,'ValueType','Voltage');part.typeRef=valueType.id;
  assert(validate(project).some(issue=>issue.code==='TYPE_KIND'&&issue.id===part.id));
});

test('inheritance exposes inherited features and supports overrides',()=>{
  const project=createProject('Inheritance'),vehicle=add(project,'Block','Vehicle'),receiver=add(project,'Block','Receiver');
  const inheritedPart=add(project,'PartProperty','powerSupply',vehicle.id),operation=add(project,'Operation','start',vehicle.id),type=add(project,'Block','PowerSupply');inheritedPart.typeRef=type.id;
  project.relationships.push(defaultRelationship('Generalization',receiver.id,vehicle.id,project.root.id));
  assert.deepEqual(inheritedFeatures(project,receiver.id).map(feature=>feature.name),['powerSupply','start']);
  assert.equal(effectiveFeatures(project,receiver.id).length,2);
  assert(getCompartmentRows(project,receiver,'parts').some(feature=>feature.isInherited&&feature.id===inheritedPart.id));
  const override=add(project,'PartProperty','powerSupply',receiver.id);override.typeRef=type.id;override.redefinedPropertyIds=[inheritedPart.id];
  assert.deepEqual(inheritedFeatures(project,receiver.id).map(feature=>feature.name),['start']);
});

test('composition synchronizes ownership, type, role, and multiplicity',()=>{
  const project=createProject('Composition'),receiver=add(project,'Block','Receiver'),supply=add(project,'Block','PowerSupply');
  const composition=defaultRelationship('Composition',receiver.id,supply.id,project.root.id);composition.targetRole='powerSupply';composition.targetMultiplicity='1..2';project.relationships.push(composition);
  synchronizeSemanticModel(project);
  const part=project.elements.find(element=>element.compositionRelationshipId===composition.id);
  assert.equal(part.kind,'PartProperty');assert.equal(part.ownerId,receiver.id);assert.equal(part.typeRef,supply.id);assert.equal(part.name,'powerSupply');assert.equal(part.multiplicity,'1..2');assert.equal(composition.targetAggregation,'composite');
  project.relationships=[];synchronizeSemanticModel(project);assert.equal(project.elements.includes(part),false);
});

test('association ends retain roles, multiplicities, aggregation, navigation, and ownership',()=>{
  const project=createProject('Ends'),a=add(project,'Block','A'),b=add(project,'Block','B'),association=defaultRelationship('Association',a.id,b.id,project.root.id);
  Object.assign(association,{sourceRole:'whole',targetRole:'part',sourceMultiplicity:'1',targetMultiplicity:'0..*',sourceNavigable:false,targetNavigable:true,sourceAggregation:'none',targetAggregation:'shared',sourceEndOwned:false,targetEndOwned:true});
  const [source,target]=associationEnds(association);
  assert.deepEqual({role:source.role,multiplicity:source.multiplicity,aggregation:source.aggregation,navigable:source.navigable,owned:source.owned},{role:'whole',multiplicity:'1',aggregation:'none',navigable:false,owned:false});
  assert.deepEqual({role:target.role,multiplicity:target.multiplicity,aggregation:target.aggregation,navigable:target.navigable,owned:target.owned},{role:'part',multiplicity:'0..*',aggregation:'shared',navigable:true,owned:true});
});
