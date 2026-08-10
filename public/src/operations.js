import {synchronizeSemanticModel} from './semantic-core.js';
import {assertIBDContext,attachPortPresentation,createItemFlow,normalizeIBDProject,removeItemFlow,updateItemFlow} from './ibd-engine.js';
import {addWaypoint,moveWaypoint,removeWaypoint,resetRelationshipLabel,resetRouting,setRelationshipLabel} from './relationship-geometry.js';
import {moveRequirement} from './requirements.js';
import {normalizeConnectorEnds,reconnectConnectorEnd} from './connector-ends.js';
import {normalizeVerificationProject,VERDICTS} from './verification-model.js';
import {clearSuspectLink,markRelationshipSuspect,normalizeSuspectLinks} from './suspect-links.js';
import {createModelComment,createReviewRequest,resolveComment,transitionReview} from './model-reviews.js';
import {addConfigurationItem,assignInstanceDefinition,assignInstanceUsage,assignRequirementApplicability,assignUsageDefinition,captureConfigurationBaseline,normalizeSemanticFoundation,removeConfigurationItem} from './semantic-foundation.js';
import {addRequirementDecomposition,createRequirement,createRequirementRelationship,createRequirementRevision,markRequirementChangeSuspect,removeRequirementDecomposition} from './requirement-architecture.js';
import {normalizeRequirementArchitecture} from './requirements.js';

export function deepClone(value){return globalThis.structuredClone?structuredClone(value):JSON.parse(JSON.stringify(value))}
function stableOperationSuffix(value){let hash=2166136261;for(const character of JSON.stringify(value??null)){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(36)}

export function findTarget(project,type,id){
  if(type==='relationship')return project.relationships?.find(item=>item.id===id)||null;
  if(type==='diagram')return project.diagrams?.find(item=>item.id===id)||null;
  if(project.root?.id===id)return project.root;
  return project.elements?.find(item=>item.id===id)||null;
}

export function findDiagram(project,id){return project.diagrams?.find(diagram=>diagram.id===id)||null}
export function findNode(project,diagramId,nodeId){return findDiagram(project,diagramId)?.nodes?.find(node=>node.id===nodeId)||null}
export function containsId(project,id){return project.root?.id===id||project.elements?.some(item=>item.id===id)||project.relationships?.some(item=>item.id===id)||project.diagrams?.some(item=>item.id===id)||project.diagrams?.some(diagram=>diagram.nodes?.some(item=>item.id===id)||diagram.edges?.some(item=>item.id===id))}

function required(value,message){if(!value)throw Error(message);return value}
function assertNewId(project,item,label){required(item,`${label} is required`);required(item.id,`${label} ID is required`);if(containsId(project,item.id))throw Error(`Duplicate ID: ${item.id}`)}

export function currentValue(project,operation){
  if(operation.type==='set-property')return findTarget(project,operation.targetType||'element',operation.targetId)?.[operation.property];
  if(operation.type==='move-node'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{x:node.x,y:node.y}}
  if(operation.type==='resize-node'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{width:node.width,height:node.height}}
  if(operation.type==='resize-lifeline-timeline')return findNode(project,operation.diagramId,operation.nodeId)?.timelineEndY;
  if(operation.type==='move-open-message-anchor')return findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId)?.[operation.anchorKey];
  if(operation.type==='move-message-occurrence')return findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId)?.occurrenceY;
  if(operation.type==='resize-execution-specification')return findNode(project,operation.diagramId,operation.nodeId)?.height;
  if(operation.type==='reconnect-connector'){const relationship=findTarget(project,'relationship',operation.relationshipId);normalizeConnectorEnds(relationship);return structuredClone(relationship.connectorEnds.find(end=>end.side===operation.end))}
  if(operation.type==='reconnect-message'){const edge=findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId),relationship=findTarget(project,'relationship',operation.relationshipId);return edge&&relationship&&{nodeId:edge[`${operation.end}NodeId`],elementId:relationship[`${operation.end}Id`]}}
  if(operation.type==='set-edge-points')return findDiagram(project,operation.diagramId)?.edges?.find(edge=>edge.id===operation.edgeId)?.points;
  if(operation.type==='move-edge-label'){const edge=findDiagram(project,operation.diagramId)?.edges?.find(item=>item.id===operation.edgeId);return edge&&{labelX:edge.labelX??null,labelY:edge.labelY??null}}
  if(operation.type==='set-relationship-endpoint')return findTarget(project,'relationship',operation.relationshipId)?.[`${operation.end}Id`];
  if(operation.type==='set-compartment')return findTarget(project,'element',operation.elementId)?.compartments?.[operation.name];
  if(operation.type==='set-compartment-visibility')return findTarget(project,'element',operation.elementId)?.compartmentVisibility?.[operation.name];
  if(operation.type==='set-presentation-compartment-visibility')return findNode(project,operation.diagramId,operation.nodeId)?.presentationOptions?.compartmentVisibility?.[operation.name];
  if(operation.type==='set-property-path')return findTarget(project,'relationship',operation.relationshipId)?.[`${operation.end}PropertyPath`];
  if(operation.type==='set-port-placement'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{boundaryOwnerNodeId:node.boundaryOwnerNodeId,portSide:node.portSide,perimeterOffset:node.perimeterOffset}}
  if(operation.type==='nest-presentation'){const node=findNode(project,operation.diagramId,operation.nodeId);return node&&{parentPresentationId:node.parentPresentationId,relativeX:node.relativeX,relativeY:node.relativeY,propertyPath:node.propertyPath}}
  if(operation.type==='set-connector-kind'){const relationship=findTarget(project,'relationship',operation.relationshipId);return relationship&&{kind:relationship.kind,connectorKind:relationship.connectorKind}}
  if(operation.type==='set-diagram-context')return findDiagram(project,operation.diagramId)?.contextId;
  if(operation.type==='move-element')return findTarget(project,'element',operation.elementId)?.ownerId;
  if(operation.type==='batch-requirement-edit')return operation.changes.map(change=>findTarget(project,'element',change.id)?.[change.field]);
  return undefined;
}

export function canRebaseOperation(project,operation){
  if(['create-element','create-relationship','create-diagram','add-presentation','bulk-import'].includes(operation.type)){
    const id=operation.element?.id||operation.relationship?.id||operation.diagram?.id||operation.node?.id;
    return operation.type==='bulk-import'||Boolean(id&&!containsId(project,id));
  }
  if(['set-property','move-node','resize-node','resize-lifeline-timeline','move-message-occurrence','move-open-message-anchor','resize-execution-specification','reconnect-message','reconnect-connector','set-edge-points','set-compartment','set-compartment-visibility','set-presentation-compartment-visibility','set-property-path','set-port-placement','nest-presentation','set-connector-kind','set-diagram-context','move-element'].includes(operation.type))return JSON.stringify(currentValue(project,operation))===JSON.stringify(operation.expectedValue??operation.expectedOwnerId);
  if(['move-edge-label','set-relationship-endpoint'].includes(operation.type))return JSON.stringify(currentValue(project,operation))===JSON.stringify(operation.expectedValue);
  if(operation.type==='batch-requirement-edit')return operation.changes.every(change=>JSON.stringify(findTarget(project,'element',change.id)?.[change.field])===JSON.stringify(change.before));
  if(operation.type==='create-verification-execution')return !project.verificationExecutions?.some(item=>item.id===operation.execution?.id);
  if(operation.type==='create-requirement-baseline')return !project.requirementBaselines?.some(item=>item.id===operation.baseline?.id);
  if(operation.type==='mark-suspect-link')return !project.suspectLinks?.some(item=>item.id===operation.record?.id);
  if(operation.type==='save-report')return !project.savedReports?.some(item=>item.id===operation.report?.id);
  if(operation.type==='create-comment')return !project.comments?.some(item=>item.commentId===operation.comment?.commentId);
  if(operation.type==='create-review-request')return !project.reviewRequests?.some(item=>item.reviewId===operation.review?.reviewId);
  if(operation.type==='resolve-comment')return project.comments?.find(item=>item.commentId===operation.commentId)?.status===(operation.expectedStatus||'Open');
  if(operation.type==='transition-review')return project.reviewRequests?.find(item=>item.reviewId===operation.reviewId)?.status===(operation.expectedStatus||'Draft');
  if(operation.type==='batch-operation')return(operation.operations||[]).every(item=>canRebaseOperation(project,item));
  if(['clear-suspect-link','record-import-decision','delete-requirement-baseline','delete-report'].includes(operation.type))return true;
  if(['add-item-flow','update-item-flow','remove-item-flow'].includes(operation.type))return true;
  return ['delete-element','delete-relationship','delete-diagram','remove-presentation','remove-edge-presentation'].includes(operation.type);
}

function synchronizeProject(project){normalizeVerificationProject(project);normalizeSuspectLinks(project);normalizeSemanticFoundation(project);normalizeRequirementArchitecture(project);synchronizeSemanticModel(project);normalizeIBDProject(project);return project}
function replaceProject(operation){return synchronizeProject(deepClone(operation.project))}

export function applyOperation(project,operation){
  switch(operation.type){
    case'assign-usage-definition':assignUsageDefinition(project,operation.usageId,operation.definitionId);break;
    case'assign-instance-definition':assignInstanceDefinition(project,operation.instanceId,operation.definitionId);break;
    case'assign-instance-usage':assignInstanceUsage(project,operation.instanceId,operation.usageId);break;
    case'add-configuration-item':addConfigurationItem(project,operation.configurationId,deepClone(operation.item));break;
    case'remove-configuration-item':removeConfigurationItem(project,operation.configurationId,operation.itemId);break;
    case'capture-configuration-baseline':captureConfigurationBaseline(project,operation.configurationId,deepClone(operation.baseline||{}));break;
    case'assign-requirement-applicability':assignRequirementApplicability(project,operation.requirementId,deepClone(operation.rule));break;
    case'create-requirement':{if(findTarget(project,'element',operation.requirement?.id))break;createRequirement(project,deepClone(operation.requirement));break}
    case'create-requirement-revision':{if(findTarget(project,'element',operation.revision?.id))break;createRequirementRevision(project,operation.requirementId,deepClone(operation.revision));markRequirementChangeSuspect(project,operation.requirementId,{field:'currentRevisionId',reason:'Requirement Revision created'});break}
    case'add-requirement-decomposition':addRequirementDecomposition(project,operation.parentId,operation.childId,operation.index);markRequirementChangeSuspect(project,operation.childId,{field:'ownerId',reason:'Requirement decomposition changed'});break;
    case'remove-requirement-decomposition':removeRequirementDecomposition(project,operation.childId,operation.newOwnerId);markRequirementChangeSuspect(project,operation.childId,{field:'ownerId',reason:'Requirement decomposition removed'});break;
    case'create-requirement-relationship':{if(project.relationships.some(item=>item.id===operation.relationship?.id))break;const value=operation.relationship;createRequirementRelationship(project,value.kind,value.sourceId,value.targetId,value);break}
    case'upsert-requirement-applicability':{const requirement=required(findTarget(project,'element',operation.requirementId),'Requirement not found'),rules=requirement.applicabilityRules||[],index=rules.findIndex(item=>item.id===operation.rule.id);if(index>=0)rules[index]=deepClone(operation.rule);else assignRequirementApplicability(project,operation.requirementId,deepClone(operation.rule));requirement.applicabilityRules=rules;markRequirementChangeSuspect(project,requirement.id,{field:'applicabilityRules',reason:'Requirement applicability changed'});break}
    case'delete-requirement-applicability':{const requirement=required(findTarget(project,'element',operation.requirementId),'Requirement not found');requirement.applicabilityRules=(requirement.applicabilityRules||[]).filter(item=>item.id!==operation.ruleId);markRequirementChangeSuspect(project,requirement.id,{field:'applicabilityRules',reason:'Requirement applicability removed'});break}
    case'create-comment':createModelComment(project,operation.comment);break;
    case'resolve-comment':resolveComment(project,operation.commentId,{actor:operation.actor,status:operation.status});break;
    case'create-review-request':createReviewRequest(project,operation.review);break;
    case'transition-review':transitionReview(project,operation.reviewId,operation.status,operation.actor);break;
    case'set-property':{
      const target=required(findTarget(project,operation.targetType||'element',operation.targetId),'Target not found');
      if(target.kind==='Configuration'&&(target.status==='Released'||target.baselineId))throw Error('Released or baselined configurations cannot be changed through ordinary editing. Create a successor configuration.');
      if(target.kind==='RequirementRevision'&&target.immutable)throw Error('Released Requirement Revisions are immutable. Create a successor revision.');
      target[operation.property]=deepClone(operation.value);if((operation.targetType||'element')==='element'){const affected=target.kind==='Requirement'&&!['requirementText','requirementId','sourceRevision','verificationMethod'].includes(operation.property)?[]:(project.relationships||[]).filter(relationship=>relationship.sourceId===target.id||relationship.targetId===target.id);for(const relationship of affected)markRelationshipSuspect(project,relationship.id,{id:`suspect-${relationship.id}-${operation.property}-${stableOperationSuffix(operation.value)}`,sourceElementId:target.id,reason:`${operation.property} changed`,date:operation.changedAt||project.metadata?.updatedAt||''})}break;
    }
    case'batch-requirement-edit':{
      for(const change of operation.changes||[]){const requirement=required(findTarget(project,'element',change.id),'Requirement not found');if(requirement.kind!=='Requirement')throw Error('Batch edits only support Requirements');if(['id','externalId','kind','ownerId'].includes(change.field))throw Error(`Field is not editable: ${change.field}`);requirement[change.field]=deepClone(change.after)}break;
    }
    case'create-verification-execution':{
      const execution=required(operation.execution,'Verification execution is required');required(findTarget(project,'element',execution.testCaseId),'Test Case not found');if(!VERDICTS.includes(execution.verdict))throw Error('Invalid verification verdict');project.verificationExecutions=project.verificationExecutions||[];if(project.verificationExecutions.some(item=>item.id===execution.id))throw Error(`Duplicate ID: ${execution.id}`);project.verificationExecutions.push(deepClone(execution));break;
    }
    case'delete-verification-execution':project.verificationExecutions=(project.verificationExecutions||[]).filter(item=>item.id!==operation.executionId);break;
    case'batch-operation':{let next=project;for(const item of operation.operations||[])next=applyOperation(next,item);return next}
    case'create-requirement-baseline':project.requirementBaselines=project.requirementBaselines||[];required(operation.baseline?.id,'Baseline ID is required');if(project.requirementBaselines.some(item=>item.id===operation.baseline.id))throw Error(`Duplicate baseline ID: ${operation.baseline.id}`);project.requirementBaselines.push(deepClone(operation.baseline));break;
    case'delete-requirement-baseline':if(operation.confirmed!==true)throw Error('Baseline history deletion requires confirmation');project.requirementBaselines=(project.requirementBaselines||[]).filter(item=>item.id!==operation.baselineId);break;
    case'mark-suspect-link':markRelationshipSuspect(project,operation.relationshipId,deepClone(operation.record||{}));break;
    case'clear-suspect-link':clearSuspectLink(project,operation.suspectId,deepClone(operation.clearance||{}));break;
    case'save-report':project.savedReports=project.savedReports||[];if(project.savedReports.some(item=>item.id===operation.report.id))throw Error(`Duplicate report ID: ${operation.report.id}`);project.savedReports.push(deepClone(operation.report));break;
    case'delete-report':project.savedReports=(project.savedReports||[]).filter(item=>item.id!==operation.reportId);break;
    case'record-import-decision':project.importHistory=project.importHistory||[];project.importHistory.push(deepClone(operation.decision));break;
    case'move-element':{
      const element=required(findTarget(project,'element',operation.elementId),'Element not found');
      if(element.kind==='Requirement')moveRequirement(project,element.id,operation.targetOwnerId,operation.index);
      else{const owner=required(findTarget(project,'element',operation.targetOwnerId),'Owner not found');if(element.id===owner.id)throw Error('An element cannot own itself');let current=owner;while(current){if(current.id===element.id)throw Error('Containment cycle');current=findTarget(project,'element',current.ownerId)}element.ownerId=owner.id}
      break;
    }
    case'create-element':{
      assertNewId(project,operation.element,'Element');
      if(operation.node){required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.node,'Presentation node')}
      project.elements.push(deepClone(operation.element));
      if(operation.node)findDiagram(project,operation.diagramId).nodes.push(deepClone(operation.node));
      break;
    }
    case'delete-element':{
      if((project.configurationBaselines||[]).some(baseline=>(baseline.snapshot?.includedSemanticIds||[]).includes(operation.elementId)||baseline.sourceConfigurationId===operation.elementId))throw Error('Semantic content referenced by a released Configuration Baseline cannot be deleted through ordinary editing.');
      const ids=new Set([operation.elementId]);let changed=true;
      while(changed){changed=false;for(const element of project.elements)if(ids.has(element.ownerId)&&!ids.has(element.id)){ids.add(element.id);changed=true}}
      project.elements=project.elements.filter(element=>!ids.has(element.id));
      const affectedRelationships=new Set(project.relationships.filter(relationship=>ids.has(relationship.sourceId)||ids.has(relationship.targetId)||[...(relationship.sourcePropertyPath||[]),...(relationship.targetPropertyPath||[])].some(step=>ids.has(step.propertyId))).map(relationship=>relationship.id));
      for(const relationship of project.relationships)if(relationship.kind==='ItemFlow'&&affectedRelationships.has(relationship.connectorId))affectedRelationships.add(relationship.id);
      project.relationships=project.relationships.filter(relationship=>!affectedRelationships.has(relationship.id));
      for(const diagram of project.diagrams){const removedNodes=new Set(diagram.nodes.filter(node=>ids.has(node.elementId)||(node.propertyPath||[]).some(step=>ids.has(step.propertyId))).map(node=>node.id));let changedNodes=true;while(changedNodes){changedNodes=false;for(const node of diagram.nodes)if(removedNodes.has(node.parentPresentationId)&&!removedNodes.has(node.id)){removedNodes.add(node.id);changedNodes=true}}diagram.nodes=diagram.nodes.filter(node=>!removedNodes.has(node.id));diagram.edges=diagram.edges.filter(edge=>!removedNodes.has(edge.sourceNodeId)&&!removedNodes.has(edge.targetNodeId)&&!affectedRelationships.has(edge.relationshipId))}
      break;
    }
    case'create-relationship':{
      assertNewId(project,operation.relationship,'Relationship');
      if(operation.edge){required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.edge,'Presentation edge')}
      project.relationships.push(deepClone(operation.relationship));
      if(operation.edge)findDiagram(project,operation.diagramId).edges.push(deepClone(operation.edge));
      break;
    }
    case'delete-relationship':
      project.relationships=project.relationships.filter(relationship=>relationship.id!==operation.relationshipId);
      for(const diagram of project.diagrams)diagram.edges=diagram.edges.filter(edge=>edge.relationshipId!==operation.relationshipId);
      break;
    case'create-diagram':assertNewId(project,operation.diagram,'Diagram');assertIBDContext(project,operation.diagram);project.diagrams.push(deepClone(operation.diagram));break;
    case'delete-diagram':
      project.diagrams=project.diagrams.filter(diagram=>diagram.id!==operation.diagramId);
      if(project.activeDiagramId===operation.diagramId)project.activeDiagramId=project.diagrams[0]?.id||null;
      break;
    case'add-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');assertNewId(project,operation.node,'Presentation node');diagram.nodes.push(deepClone(operation.node));break;
    }
    case'remove-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),removed=new Set([operation.nodeId]);let changed=true;while(changed){changed=false;for(const node of diagram.nodes)if(removed.has(node.parentPresentationId)&&!removed.has(node.id)){removed.add(node.id);changed=true}}diagram.nodes=diagram.nodes.filter(node=>!removed.has(node.id));diagram.edges=diagram.edges.filter(edge=>!removed.has(edge.sourceNodeId)&&!removed.has(edge.targetNodeId));break;
    }
    case'create-relationship-presentation':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');if(!diagram.edges.some(edge=>edge.id===operation.edge.id))diagram.edges.push(deepClone(operation.edge));break}
    case'remove-edge-presentation':{
      const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');diagram.edges=diagram.edges.filter(edge=>edge.id!==operation.edgeId);break;
    }
    case'move-node':{
      const node=required(findNode(project,operation.diagramId,operation.nodeId),'Node not found');node.x=operation.x;node.y=operation.y;break;
    }
    case'resize-node':{
      const node=required(findNode(project,operation.diagramId,operation.nodeId),'Node not found');node.width=operation.width;node.height=operation.height;break;
    }
    case'resize-lifeline-timeline':{const node=required(findNode(project,operation.diagramId,operation.nodeId),'Lifeline presentation not found');node.timelineEndY=Math.max(node.y+(node.headHeight??45)+80,operation.timelineEndY);break}
    case'move-open-message-anchor':{if(!['lostAnchor','foundAnchor'].includes(operation.anchorKey))throw Error('Invalid open message anchor');const edge=required(findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId),'Open Message presentation not found');edge[operation.anchorKey]=deepClone(operation.anchor);edge.occurrenceY=operation.anchor.y;break}
    case'move-message-occurrence':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId),'Message presentation not found');edge.occurrenceY=Math.max(60,operation.occurrenceY);if(operation.relationshipId){const relationship=required(findTarget(project,'relationship',operation.relationshipId),'Message not found');relationship.sequenceOrder=Number(operation.sequenceOrder??edge.occurrenceY)}break}
    case'resize-execution-specification':{const node=required(findNode(project,operation.diagramId,operation.nodeId),'Execution specification not found');node.height=Math.max(35,operation.height);break}
    case'reconnect-connector':{if(!['source','target'].includes(operation.end))throw Error('Connector end must be source or target');const relationship=reconnectConnectorEnd(project,operation.relationshipId,operation.end,operation.descriptor);const edge=findDiagram(project,operation.diagramId)?.edges.find(item=>item.relationshipId===relationship.id);if(edge&&operation.descriptor.presentationId)edge[`${operation.end}NodeId`]=operation.descriptor.presentationId;break}
    case'reconnect-message':{if(!['source','target'].includes(operation.end))throw Error('Message end must be source or target');const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),edge=required(diagram.edges.find(item=>item.id===operation.edgeId),'Message presentation not found'),relationship=required(findTarget(project,'relationship',operation.relationshipId),'Message not found'),lifeline=required(findNode(project,operation.diagramId,operation.nodeId),'Lifeline presentation not found'),semantic=required(findTarget(project,'element',operation.elementId),'Lifeline not found');if(semantic.kind!=='Lifeline'||lifeline.elementId!==semantic.id)throw Error('Messages may only reconnect to Lifelines');edge[`${operation.end}NodeId`]=lifeline.id;edge[`${operation.end}Id`]=semantic.id;relationship[`${operation.end}Id`]=semantic.id;break}
    case'set-relationship-label':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(e=>e.id===operation.edgeId),'Edge not found');setRelationshipLabel(edge,operation.position);break}
    case'reset-relationship-label':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(e=>e.id===operation.edgeId),'Edge not found');resetRelationshipLabel(edge);break}
    case'add-waypoint':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(e=>e.id===operation.edgeId),'Edge not found');addWaypoint(edge,operation.waypoint);break}
    case'move-waypoint':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(e=>e.id===operation.edgeId),'Edge not found');moveWaypoint(edge,operation.waypointId,operation.point);break}
    case'remove-waypoint':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(e=>e.id===operation.edgeId),'Edge not found');removeWaypoint(edge,operation.waypointId);break}
    case'reset-relationship-routing':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(e=>e.id===operation.edgeId),'Edge not found');resetRouting(edge);break}
    case'set-edge-points':{
      const edge=required(findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId),'Edge not found');edge.points=deepClone(operation.points);break;
    }
    case'move-edge-label':{const edge=required(findDiagram(project,operation.diagramId)?.edges.find(item=>item.id===operation.edgeId),'Edge not found');edge.labelX=operation.labelX;edge.labelY=operation.labelY;break}
    case'set-relationship-endpoint':{const relationship=required(findTarget(project,'relationship',operation.relationshipId),'Relationship not found');if(!['source','target'].includes(operation.end))throw Error('Relationship end must be source or target');required(findTarget(project,'element',operation.elementId),'Relationship endpoint not found');relationship[`${operation.end}Id`]=operation.elementId;break}
    case'set-compartment':{
      const element=required(findTarget(project,'element',operation.elementId),'Element not found');element.compartments=element.compartments||{};element.compartments[operation.name]=deepClone(operation.value);break;
    }
    case'set-compartment-visibility':{
      const element=required(findTarget(project,'element',operation.elementId),'Element not found');element.compartmentVisibility=element.compartmentVisibility||{};element.compartmentVisibility[operation.name]=Boolean(operation.value);break;
    }
    case'set-presentation-compartment-visibility':{
      const node=required(findNode(project,operation.diagramId,operation.nodeId),'Presentation not found');node.presentationOptions=node.presentationOptions||{};node.presentationOptions.compartmentVisibility=node.presentationOptions.compartmentVisibility||{};node.presentationOptions.compartmentVisibility[operation.name]=Boolean(operation.value);break;
    }
    case'set-property-path':{const relationship=required(findTarget(project,'relationship',operation.relationshipId),'Relationship not found');if(!['source','target'].includes(operation.end))throw Error('Path end must be source or target');relationship[`${operation.end}PropertyPath`]=deepClone(operation.path);break}
    case'set-port-placement':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),node=required(findNode(project,operation.diagramId,operation.nodeId),'Port presentation not found'),owner=required(diagram.nodes.find(item=>item.id===operation.boundaryOwnerNodeId),'Boundary owner presentation not found');attachPortPresentation(node,owner,{side:operation.side,offset:operation.offset,endpointPath:operation.endpointPath});break}
    case'nest-presentation':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found'),node=required(findNode(project,operation.diagramId,operation.nodeId),'Presentation not found');if(operation.parentPresentationId===node.id)throw Error('A presentation cannot contain itself');node.parentPresentationId=operation.parentPresentationId||null;node.relativeX=operation.relativeX;node.relativeY=operation.relativeY;node.propertyPath=deepClone(operation.propertyPath||[]);break}
    case'set-connector-kind':{const relationship=required(findTarget(project,'relationship',operation.relationshipId),'Connector not found');if(!['assembly','delegation'].includes(operation.connectorKind))throw Error('Invalid connector kind');relationship.connectorKind=operation.connectorKind;relationship.kind=operation.connectorKind==='delegation'?'DelegationConnector':'Connector';break}
    case'add-item-flow':createItemFlow(project,required(findTarget(project,'relationship',operation.connectorId),'Connector not found'),operation.conveyedClassifierIds,operation.direction,operation.itemFlow||{});break;
    case'update-item-flow':updateItemFlow(project,operation.itemFlowId,deepClone(operation.changes));break;
    case'remove-item-flow':removeItemFlow(project,operation.itemFlowId);break;
    case'set-diagram-context':{const diagram=required(findDiagram(project,operation.diagramId),'Diagram not found');const next={...diagram,contextId:operation.contextId};assertIBDContext(project,next);diagram.contextId=operation.contextId;break}
    case'bulk-import':case'replace-project':return replaceProject(operation);
    default:throw Error(`Unsupported operation ${operation.type}`);
  }
  synchronizeProject(project);
  project.metadata=project.metadata||{};project.metadata.updatedAt=new Date().toISOString();
  return project;
}
