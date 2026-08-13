import {uid,defaultElement,defaultRelationship,refreshQualifiedNames} from './model.js';
import {readWorkbook} from './import/core/workbook-reader.js';
import {catiaCameoProfile,valueFor,normalizeKind,normalizeRelationshipKind,splitIds,booleanValue,normalizedKey} from './import/profiles/catia-cameo.js';
import {createImportReport,finishImportReport} from './import/core/report.js';
import {preserveRequirementLevel} from './import/fidelity-level.js';
import {preserveStateBehaviors} from './import/fidelity-state.js';
import {preserveLifelineRepresentation} from './import/fidelity-lifeline.js';
import {preserveMessageSignature} from './import/fidelity-message.js';

const text=value=>String(value??'').trim();
const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const numberOr=(value,fallback)=>{const n=Number(value);return Number.isFinite(n)?n:fallback;};

export async function inspectWorkbook(file,{profile=catiaCameoProfile}={}){
  const parsed=await readWorkbook(file,profile);
  return parsed.sheets.map(sheet=>({name:sheet.name,role:sheet.definition?.role||'unknown',headerRow:sheet.headerRow+1,rows:sheet.rows.length,kind:sheet.definition?.kind||'',relationshipKind:sheet.definition?.relationshipKind||''}));
}

export async function importWorkbook(file,project,log,options={}){
  const {strict=false,duplicatePolicy='merge',profile=catiaCameoProfile,dryRun=false,onProgress=()=>{},downloadReport=false}=options;
  const original=clone(project),staged=clone(project),report=createImportReport(file.name,profile.id);
  try{
    const parsed=await readWorkbook(file,profile);
    report.sheets=parsed.sheets.map(sheet=>({name:sheet.name,role:sheet.definition?.role||'unknown',headerRow:sheet.headerRow+1,rows:sheet.rows.length}));
    const ctx=createContext(staged,report,file.name,duplicatePolicy,strict);
    const ordered=[...parsed.sheets].sort((a,b)=>minimumOrder(a.rows)-minimumOrder(b.rows));

    onProgress({phase:'elements',percent:8});
    importElements(ordered.filter(s=>s.definition?.role==='elements'),ctx);
    resolveElementReferences(ctx);

    onProgress({phase:'equations',percent:28});
    importConstraintEquations(ordered.filter(s=>s.definition?.role==='constraintEquations'),ctx);

    onProgress({phase:'diagrams',percent:36});
    importDiagrams(ordered.filter(s=>s.definition?.role==='diagrams'),ctx);

    onProgress({phase:'relationships',percent:48});
    importRelationships(ordered.filter(s=>s.definition?.role==='relationships'),ctx);
    importConnectorEnds(ordered.filter(s=>s.definition?.role==='connectorEnds'),ctx);
    linkImplicitItemFlows(ctx);
    createDerivedRelationships(ctx);

    onProgress({phase:'presentations',percent:70});
    importDiagramNodes(ordered.filter(s=>s.definition?.role==='diagramNodes'),ctx);
    importDiagramEdges(ordered.filter(s=>s.definition?.role==='diagramEdges'),ctx);
    expandDiagramLists(ordered.filter(s=>s.definition?.role==='diagrams'),ctx);
    importNavigation(ordered.filter(s=>s.definition?.role==='navigation'),ctx);

    onProgress({phase:'validation',percent:90});
    validateImportGraph(ctx);
    refreshQualifiedNames(staged);
    staged.metadata=staged.metadata||{};staged.metadata.updatedAt=new Date().toISOString();
    staged.importHistory=[...(staged.importHistory||[]),{file:file.name,profile:profile.id,at:new Date().toISOString(),report:clone(report)}].slice(-100);
    finishImportReport(report);onProgress({phase:'complete',percent:100});
    if(report.errors.length&&strict)throw new Error(`Import blocked with ${report.errors.length} error(s).`);
    if(!dryRun)replaceProject(project,staged);
    log(`CATIA/Cameo import ${dryRun?'preview':'complete'}: ${report.elements.created} created, ${report.elements.updated} updated, ${report.relationships.created} relationships, ${report.diagrams.created} diagrams.`,report.errors.length?'error':'ok');
    report.warnings.forEach(message=>log(`WARNING: ${message}`,'warn'));report.errors.forEach(message=>log(`ERROR: ${message}`,'error'));
    if(downloadReport)downloadJsonReport(report);return report;
  }catch(error){replaceProject(project,original);finishImportReport(report);if(!report.errors.includes(error.message))report.errors.push(error.message);log(`Import rolled back: ${error.message}`,'error');error.importReport=report;throw error;}
}

function createContext(project,report,fileName,duplicatePolicy,strict){
  project.elements=project.elements||[];project.relationships=project.relationships||[];project.diagrams=project.diagrams||[];
  const elementAlias=new Map(),diagramAlias=new Map(),relationshipAlias=new Map(),presentationAlias=new Map();
  for(const element of [project.root,...project.elements])addAliases(elementAlias,element,element.id);
  for(const diagram of project.diagrams)addAliases(diagramAlias,diagram,diagram.id);
  for(const relationship of project.relationships)addAliases(relationshipAlias,relationship,relationship.id);
  return{project,report,fileName,duplicatePolicy,strict,elementAlias,diagramAlias,relationshipAlias,presentationAlias,pendingElementRefs:[],pendingDerived:[]};
}

function importElements(sheets,ctx){
  for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){
    const externalId=text(valueFor(row,'externalId'))||uid('imported');
    const name=text(valueFor(row,'name'))||externalId;
    const rawKind=sheet.definition.kindFromColumn?row[sheet.definition.kindFromColumn]:valueFor(row,'kind');
    let kind=normalizeKind(rawKind||valueFor(row,'metaclass')||valueFor(row,'stereotype'),sheet.definition.kind||'');
    const stereotype=text(valueFor(row,'stereotype'));
    if(normalizedKey(sheet.name).includes('ports')){if(/fullport/i.test(stereotype))kind='FullPort';else if(/proxyport/i.test(stereotype))kind='ProxyPort';}
    const action=text(valueFor(row,'action')).toLowerCase()||'merge';
    if(!kind){ctx.report.warnings.push(`${sheet.name} row ${row.__rowNumber}: unsupported element kind.`);continue;}
    let element=findByAlias(ctx.project.elements,ctx.elementAlias,externalId);
    if(element&&(ctx.duplicatePolicy==='skip'||action==='skip')){ctx.report.elements.skipped++;continue;}
    if(action==='delete'){if(element){removeElement(ctx.project,element.id);ctx.report.elements.updated++;}continue;}
    if(!element){element=defaultElement(kind,ctx.project.root.id);element.id=externalId;ctx.project.elements.push(element);ctx.report.elements.created++;}else ctx.report.elements.updated++;

    const ownerRaw=text(valueFor(row,'owner'));
    const typeRaw=text(valueFor(row,'typeRef'));
    const lower=text(valueFor(row,'lower')),upper=text(valueFor(row,'upper'));
    Object.assign(element,{
      externalId,name,kind,metaclass:text(valueFor(row,'metaclass'))||element.metaclass,
      stereotype:stereotype||element.stereotype,
      ownerId:ownerRaw||ctx.project.root.id,ownerQualifiedNameString:text(valueFor(row,'ownerQualifiedName')),
      qualifiedNameString:text(valueFor(row,'qualifiedName'))||element.qualifiedNameString,
      documentation:text(valueFor(row,'documentation')),
      requirementId:kind==='Requirement'?(text(valueFor(row,'requirementId'))||externalId):text(valueFor(row,'requirementId')),
      requirementText:text(valueFor(row,'requirementText')),
      parentRequirementId:text(valueFor(row,'parentRequirement')),
      typeRef:typeRaw,typeQualifiedNameString:text(valueFor(row,'typeQualifiedName')),
      multiplicity:text(valueFor(row,'multiplicity'))||(lower||upper?`${lower||0}..${upper||'*'}`:element.multiplicity||'1'),
      lower:lower===''?element.lower:numberOr(lower,0),upper:upper===''?element.upper:(upper==='*'?'*':numberOr(upper,1)),
      aggregation:text(valueFor(row,'aggregation'))||element.aggregation||'none',direction:text(valueFor(row,'direction'))||element.direction||'inout',
      defaultValue:text(valueFor(row,'defaultValue')),unitRef:text(row['Unit External ID']||valueFor(row,'unit')),quantityKindRef:text(valueFor(row,'quantityKind')),
      lifecycleStatus:text(valueFor(row,'status')),priority:text(valueFor(row,'priority')),risk:text(valueFor(row,'risk')),
      verificationMethod:text(valueFor(row,'verificationMethod')),verificationCaseId:text(valueFor(row,'verificationCaseId')||valueFor(row,'requirementId')),verificationObjective:text(valueFor(row,'verificationObjective')),acceptanceCriteria:text(valueFor(row,'acceptanceCriteria')),verificationLevel:text(valueFor(row,'verificationLevel')),plannedEnvironment:text(valueFor(row,'plannedEnvironment')),responsibleRole:text(valueFor(row,'responsibleRole')),preconditions:text(valueFor(row,'preconditions')),postconditions:text(valueFor(row,'postconditions')),procedureReference:text(valueFor(row,'procedureReference')),plannedStatus:text(valueFor(row,'plannedStatus')),sourceDocument:text(valueFor(row,'sourceDocument')),sourceSection:text(valueFor(row,'sourceSection')),
      providedInterfaceIds:splitIds(valueFor(row,'providedInterfaces')),requiredInterfaceIds:splitIds(valueFor(row,'requiredInterfaces')),
      isExternalReference:Boolean(sheet.definition.referenceOnly),importSource:{file:ctx.fileName,sheet:sheet.name,row:row.__rowNumber,profile:'catia-cameo-workbook-v2-fsbs-grindavik'},
      provenance:text(valueFor(row,'provenance'))
    });
    attachBehaviorFields(element,row);attachInstanceFields(element,row);attachWorkbookFidelity(element,row,sheet,ctx);
    addAliases(ctx.elementAlias,element,element.id);ctx.pendingElementRefs.push(element);
    ctx.report.provenance.push({externalId,sheet:sheet.name,row:row.__rowNumber});
    const verifyId=text(valueFor(row,'verifiesRequirement'));if(verifyId)ctx.pendingDerived.push({kind:'Verify',source:externalId,target:verifyId,owner:ownerRaw});
    const realizedUseCase=text(valueFor(row,'realizedUseCase'));if(realizedUseCase)ctx.pendingDerived.push({kind:'Refine',source:externalId,target:realizedUseCase,owner:ownerRaw});
    for(const req of splitIds(valueFor(row,'relatedRequirements')))ctx.pendingDerived.push({kind:'Trace',source:externalId,target:req,owner:ownerRaw});
  }
}

function attachWorkbookFidelity(element,row,sheet,ctx){
  preserveRequirementLevel(element,row);preserveStateBehaviors(element,row);preserveLifelineRepresentation(element,row);
  const symbol=text(row['Symbol']);if(symbol)element.symbol=symbol;
  const primitiveKind=text(row['Primitive Kind']);if(primitiveKind)element.primitiveKind=primitiveKind;
  const conversion=text(row['SI Conversion Factor']);if(conversion)element.siConversionFactor=numberOr(conversion,conversion);
  const baseType=text(row['Base Type Qualified Name String']);if(baseType)element.baseTypeQualifiedNameString=baseType;
  const unitSymbol=text(row['Unit Symbol']);if(unitSymbol)element.unitSymbol=unitSymbol;
  const constraintExpression=text(row['Constraint Expression']);if(constraintExpression){element.constraintExpressions=element.constraintExpressions||[];const id=`${element.id}.EXPR.1`,record=element.constraintExpressions.find(item=>item.id===id);if(record)record.expression=constraintExpression;else element.constraintExpressions.push({id,expression:constraintExpression,sequence:1});}
  if(element.kind==='Enumeration')importEnumerationLiterals(element,row,ctx);
}

function importEnumerationLiterals(enumeration,row,ctx){
  const names=String(row['Literals']??'').split(/[;,\n]+/).map(text).filter(Boolean);for(let index=0;index<names.length;index++){
    const name=names[index],id=`${enumeration.id}.LIT.${slug(name).toUpperCase()}`;let literal=ctx.project.elements.find(item=>item.id===id||item.kind==='EnumerationLiteral'&&item.ownerId===enumeration.id&&item.name===name);
    if(!literal){literal=defaultElement('EnumerationLiteral',enumeration.id);literal.id=id;literal.externalId=id;ctx.project.elements.push(literal);ctx.report.elements.created++;}
    Object.assign(literal,{name,kind:'EnumerationLiteral',metaclass:'EnumerationLiteral',ownerId:enumeration.id,literalOrder:index,documentation:literal.documentation||''});addAliases(ctx.elementAlias,literal,literal.id);
  }
}

function attachBehaviorFields(element,row){
  const trigger=text(valueFor(row,'trigger')),guard=text(valueFor(row,'guard')),effect=text(valueFor(row,'effect'));
  if(trigger)element.trigger=trigger;if(guard)element.guard=guard;if(effect)element.effect=effect;
  const seq=text(valueFor(row,'sequence'));if(seq)element.sequence=numberOr(seq,seq);
  const sort=text(valueFor(row,'messageSort'));if(sort)element.messageSort=sort;
  const allocated=text(valueFor(row,'allocatedBlock'));if(allocated)element.allocatedBlockId=allocated;const represented=text(row['Represents External ID']||row['Represented Element ID']||row['Represents']||row['Represented Classifier ID']);if(represented)element.representedElementId=represented;const behavior=text(row['Referenced Behavior ID']||row['Behavior ID']||row['Called Behavior ID']);if(behavior)element.referencedBehaviorId=behavior;const operator=text(row['Interaction Operator']||row['Fragment Operator']);if(operator)element.fragmentOperator=operator;
  for(const [header,field] of [['Preconditions','preconditions'],['Postconditions','postconditions'],['Main Success Scenario','mainScenario'],['Alternate / Exception Flows','alternateFlows'],['Primary Actors','primaryActors'],['Supporting Actors / Systems','supportingActors'],['Entry/Do/Exit Behavior','stateBehaviors'],['Invocation','invocation'],['Signature','signature']])if(text(row[header]))element[field]=text(row[header]);
}
function attachInstanceFields(element,row){
  const map=[['Classifier Block ID','classifierId'],['Parent Instance ID','parentInstanceId'],['Configuration ID','configurationId'],['Defining Part Property ID','definingFeatureId'],['Defining Value Property ID','definingFeatureId'],['Value Instance ID','valueInstanceId'],['Root Instance ID','rootInstanceId']];
  for(const [header,field] of map)if(text(row[header]))element[field]=text(row[header]);
}

function resolveElementReferences(ctx){
  for(const element of ctx.pendingElementRefs){
    element.ownerId=resolveOwner(ctx,element.ownerId,element.ownerQualifiedNameString);
    for(const field of ['typeRef','unitRef','parentRequirementId','classifierId','parentInstanceId','configurationId','definingFeatureId','valueInstanceId','rootInstanceId','allocatedBlockId','representedElementId','referencedBehaviorId','coveredLifelineId','startMessageId','finishMessageId'])if(element[field])element[field]=resolveAlias(ctx.elementAlias,element[field])||element[field];
    element.providedInterfaceIds=(element.providedInterfaceIds||[]).map(id=>resolveAlias(ctx.elementAlias,id)||id);
    element.requiredInterfaceIds=(element.requiredInterfaceIds||[]).map(id=>resolveAlias(ctx.elementAlias,id)||id);
  }
}

function resolveOwner(ctx,raw,qualified){const candidate=text(raw)||text(qualified);if(!candidate)return ctx.project.root.id;const resolved=resolveAlias(ctx.elementAlias,candidate);if(resolved)return resolved;return ensurePackagePath(ctx,candidate);}
function ensurePackagePath(ctx,path){const names=String(path).split(/\s*(?:::|>)\s*/).map(text).filter(Boolean);if(!names.length)return ctx.project.root.id;let owner=ctx.project.root.id;for(const name of names){let pkg=ctx.project.elements.find(e=>e.kind==='Package'&&e.ownerId===owner&&e.name===name);if(!pkg){pkg=defaultElement('Package',owner);pkg.id=`pkg-${slug(name)}-${uid('').slice(-8)}`;pkg.externalId=pkg.id;pkg.name=name;pkg.isAutoCreatedByImport=true;ctx.project.elements.push(pkg);ctx.report.elements.created++;addAliases(ctx.elementAlias,pkg,pkg.id);}owner=pkg.id;}return owner;}

function importConstraintEquations(sheets,ctx){for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){const ownerId=resolveAlias(ctx.elementAlias,valueFor(row,'equationOwner'));const owner=ctx.project.elements.find(e=>e.id===ownerId);if(!owner){ctx.report.warnings.push(`${sheet.name} row ${row.__rowNumber}: constraint block not found.`);continue;}owner.constraintExpressions=owner.constraintExpressions||[];const id=text(valueFor(row,'externalId'))||uid('equation');const expression=text(valueFor(row,'expression'));const existing=owner.constraintExpressions.find(e=>e.id===id);const record={id,expression,sequence:numberOr(valueFor(row,'sequence'),owner.constraintExpressions.length+1),language:text(row['Language/Profile']),status:text(valueFor(row,'status'))};if(existing)Object.assign(existing,record);else owner.constraintExpressions.push(record);}}

function importDiagrams(sheets,ctx){for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){const externalId=text(valueFor(row,'diagramId'))||text(valueFor(row,'externalId'))||uid('diagram');const name=text(valueFor(row,'name'))||externalId;let diagram=findByAlias(ctx.project.diagrams,ctx.diagramAlias,externalId);if(!diagram){diagram={id:externalId,externalId,name,diagramType:'Block Definition Diagram',ownerId:ctx.project.root.id,contextId:ctx.project.root.id,nodes:[],edges:[],documentation:''};ctx.project.diagrams.push(diagram);ctx.report.diagrams.created++;}else ctx.report.diagrams.updated++;const ownerRaw=text(valueFor(row,'owner')),contextRaw=text(valueFor(row,'context'));Object.assign(diagram,{name,diagramType:normalizeDiagramType(valueFor(row,'diagramType')),ownerId:resolveOwner(ctx,ownerRaw,valueFor(row,'ownerQualifiedName')),contextId:resolveAlias(ctx.elementAlias,contextRaw)||resolveOwner(ctx,contextRaw||ownerRaw,''),documentation:text(valueFor(row,'documentation'))||text(row['CATIA Build Note']),purpose:text(row['Purpose'])||diagram.purpose,parentDiagramExternalId:text(valueFor(row,'parentDiagram'))||diagram.parentDiagramExternalId,canvasWidth:numberOr(valueFor(row,'canvasWidth'),diagram.canvasWidth||2400),canvasHeight:numberOr(valueFor(row,'canvasHeight'),diagram.canvasHeight||1600),autoLayout:booleanValue(valueFor(row,'autoLayout')),importSource:{file:ctx.fileName,sheet:sheet.name,row:row.__rowNumber}});addAliases(ctx.diagramAlias,diagram,diagram.id);}}

function importRelationships(sheets,ctx){
  for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){
    const kind=normalizeRelationshipKind(valueFor(row,'relationshipKind'),sheet.definition.relationshipKind||'Dependency');
    if(kind==='ItemFlow'){
      const connectorRaw=text(row['Connector ID']||row['Connector External ID']||row['Realizing Connector ID']),connectorId=resolveAlias(ctx.relationshipAlias,connectorRaw)||connectorRaw,connector=ctx.project.relationships.find(r=>r.id===connectorId);
      if(connector){const externalId=text(valueFor(row,'relationshipId'))||text(valueFor(row,'externalId'))||uid('flow');let flow=findByAlias(ctx.project.relationships,ctx.relationshipAlias,externalId);if(!flow){flow=defaultRelationship('ItemFlow',connector.sourceId,connector.targetId,connector.ownerId);flow.id=externalId;ctx.project.relationships.push(flow);ctx.report.relationships.created++;}else ctx.report.relationships.updated++;const conveyedClassifierIds=splitIds(valueFor(row,'conveyedIds')||row['Conveyed Classifier IDs']||row['Conveyed Classifier ID']||row['Item ID']).map(id=>resolveAlias(ctx.elementAlias,id)||id);Object.assign(flow,{externalId,connectorId:connector.id,sourceId:connector.sourceId,targetId:connector.targetId,conveyedClassifierIds,conveyedIds:[...conveyedClassifierIds],itemPropertyId:resolveAlias(ctx.elementAlias,text(row['Item Property ID']))||text(row['Item Property ID']),direction:text(row['Direction']||row['Item Flow Direction'])||'sourceToTarget',documentation:text(row['Documentation']||flow.documentation),importSource:{file:ctx.fileName,sheet:sheet.name,row:row.__rowNumber}});connector.itemFlowIds=connector.itemFlowIds||[];if(!connector.itemFlowIds.includes(flow.id))connector.itemFlowIds.push(flow.id);addAliases(ctx.relationshipAlias,flow,flow.id);continue;}
    }
    const endpoints=relationshipEndpoints(sheet,row,ctx),incomingMessageSort=text(valueFor(row,'messageSort')),allowsOpenEnd=kind==='Message'&&(incomingMessageSort==='lost'&&endpoints.source||incomingMessageSort==='found'&&endpoints.target);if((!endpoints.source||!endpoints.target)&&!allowsOpenEnd){ctx.report.warnings.push(`${sheet.name} row ${row.__rowNumber}: blank relationship endpoint.`);continue;}
    const sourceId=resolveAlias(ctx.elementAlias,endpoints.source)||endpoints.source,targetId=resolveAlias(ctx.elementAlias,endpoints.target)||endpoints.target;
    if(sourceId&&!ctx.project.elements.some(e=>e.id===sourceId)&&ctx.project.root.id!==sourceId){ctx.report.errors.push(`${sheet.name} row ${row.__rowNumber}: unresolved source '${endpoints.source}'.`);continue;}
    if(targetId&&!ctx.project.elements.some(e=>e.id===targetId)&&ctx.project.root.id!==targetId){ctx.report.errors.push(`${sheet.name} row ${row.__rowNumber}: unresolved target '${endpoints.target}'.`);continue;}
    const externalId=text(valueFor(row,'relationshipId'))||text(valueFor(row,'externalId'))||uid('rel');let rel=findByAlias(ctx.project.relationships,ctx.relationshipAlias,externalId);if(!rel){rel=defaultRelationship(kind,sourceId,targetId,ctx.project.root.id);rel.id=externalId;ctx.project.relationships.push(rel);ctx.report.relationships.created++;}else ctx.report.relationships.updated++;
    Object.assign(rel,{externalId,name:text(valueFor(row,'name')),kind,sourceId,targetId,ownerId:resolveOwner(ctx,valueFor(row,'owner'),valueFor(row,'ownerQualifiedName')),documentation:text(valueFor(row,'documentation')),sourceRole:text(valueFor(row,'sourceRole')),targetRole:text(valueFor(row,'targetRole')),sourceMultiplicity:text(valueFor(row,'sourceMultiplicity'))||'1',targetMultiplicity:text(valueFor(row,'targetMultiplicity'))||'1',sourceNavigable:booleanValue(valueFor(row,'sourceNavigable')),targetNavigable:booleanValue(valueFor(row,'targetNavigable')),connectorTypeRef:resolveAlias(ctx.elementAlias,valueFor(row,'connectorType'))||text(valueFor(row,'connectorType')),connectorKind:text(row['Connector Kind']||row['Kind'])||((kind==='DelegationConnector')?'delegation':'assembly'),sourcePortId:resolveAlias(ctx.elementAlias,valueFor(row,'sourcePort'))||text(valueFor(row,'sourcePort')),targetPortId:resolveAlias(ctx.elementAlias,valueFor(row,'targetPort'))||text(valueFor(row,'targetPort')),sourcePartWithPortPath:splitIds(valueFor(row,'sourcePartWithPort')).map(id=>resolveAlias(ctx.elementAlias,id)||id),targetPartWithPortPath:splitIds(valueFor(row,'targetPartWithPort')).map(id=>resolveAlias(ctx.elementAlias,id)||id),conveyedIds:splitIds(valueFor(row,'conveyedIds')).map(id=>resolveAlias(ctx.elementAlias,id)||id),guard:text(valueFor(row,'guard')),effect:text(valueFor(row,'effect')),trigger:text(valueFor(row,'trigger')),triggerIds:splitIds(valueFor(row,'trigger')).map(id=>resolveAlias(ctx.elementAlias,id)||id),messageSort:text(valueFor(row,'messageSort')),sequenceOrder:numberOr(valueFor(row,'sequence'),rel.sequenceOrder??0),operationRef:resolveAlias(ctx.elementAlias,text(row['Operation ID']))||text(row['Operation ID']),signalRef:resolveAlias(ctx.elementAlias,text(row['Signal ID']))||text(row['Signal ID']),carriedTypeId:resolveAlias(ctx.elementAlias,text(row['Carried Type ID']||row['Object Type ID']))||text(row['Carried Type ID']||row['Object Type ID']),extensionPointId:text(row['Extension Point ID']),importSource:{file:ctx.fileName,sheet:sheet.name,row:row.__rowNumber}});if(kind==='Message')preserveMessageSignature(rel,row);
    rel.sourceEndpointPath=[...rel.sourcePartWithPortPath,...(rel.sourcePortId?[rel.sourcePortId]:[rel.sourceId])];rel.targetEndpointPath=[...rel.targetPartWithPortPath,...(rel.targetPortId?[rel.targetPortId]:[rel.targetId])];addAliases(ctx.relationshipAlias,rel,rel.id);const diagramId=resolveAlias(ctx.diagramAlias,valueFor(row,'diagramId'))||text(valueFor(row,'diagramId'));const diagram=ctx.project.diagrams.find(d=>d.id===diagramId);if(diagram)addRelationshipPresentation(diagram,rel,ctx);
  }
}

function linkImplicitItemFlows(ctx){for(const flow of ctx.project.relationships.filter(r=>r.kind==='ItemFlow'&&!r.connectorId)){const matches=ctx.project.relationships.filter(r=>r.kind==='Connector'&&r.ownerId===flow.ownerId&&((r.sourceId===flow.sourceId&&r.targetId===flow.targetId)||(r.sourceId===flow.targetId&&r.targetId===flow.sourceId)));if(matches.length!==1)continue;const connector=matches[0];flow.connectorId=connector.id;flow.direction=flow.direction||'sourceToTarget';flow.conveyedItemName=flow.conveyedItemName||text(flow.name).split('_on_')[0];connector.itemFlowIds=[...new Set([...(connector.itemFlowIds||[]),flow.id])];}}

function relationshipEndpoints(sheet,row,ctx){const n=normalizedKey(sheet.name);if(n.includes('generalization'))return{source:text(row['Specific External ID']||valueFor(row,'source')),target:text(row['General External ID']||valueFor(row,'target'))};if(n.includes('connector')&&text(row['Source Port ID']))return{source:text(row['Source Port ID']),target:text(row['Target Port ID'])};if(n.includes('itemflow'))return{source:text(row['Source Port ID']||row['Connector ID']||valueFor(row,'source')),target:text(row['Target Port ID']||row['Connector ID']||valueFor(row,'target'))};if(n.includes('bindingconnector'))return{source:text(row['Constraint Parameter ID']||row['Constraint Property ID']),target:text(row['Bound Value Property ID'])};if(n.includes('configurationmembership'))return{source:text(row['Configuration ID']),target:text(row['Instance ID'])};return{source:text(valueFor(row,'source')),target:text(valueFor(row,'target'))};}
function createDerivedRelationships(ctx){for(const item of ctx.pendingDerived){const sourceId=resolveAlias(ctx.elementAlias,item.source),targetId=resolveAlias(ctx.elementAlias,item.target);if(!sourceId||!targetId)continue;const id=`derived-${slug(item.kind)}-${slug(item.source)}-${slug(item.target)}`;if(ctx.project.relationships.some(r=>r.id===id))continue;const rel=defaultRelationship(item.kind,sourceId,targetId,resolveOwner(ctx,item.owner,''));rel.id=id;rel.externalId=id;rel.isDerivedFromImport=true;ctx.project.relationships.push(rel);addAliases(ctx.relationshipAlias,rel,id);ctx.report.relationships.created++;}}
function importConnectorEnds(sheets,ctx){for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){const relationshipId=resolveAlias(ctx.relationshipAlias,valueFor(row,'relationshipId')||valueFor(row,'externalId'));const rel=ctx.project.relationships.find(r=>r.id===relationshipId);if(!rel){ctx.report.warnings.push(`${sheet.name} row ${row.__rowNumber}: connector not found.`);continue;}const end=text(row['End']||row['Connector End']||'').toLowerCase();const property=text(row['Part With Port ID']||row['Property Path']||row['Part Property ID']);const port=text(row['Port ID']);const path=splitIds(property).map(id=>resolveAlias(ctx.elementAlias,id)||id);if(end.includes('target')||end==='2'){rel.targetPartWithPortPath=path;if(port)rel.targetPortId=resolveAlias(ctx.elementAlias,port)||port;}else{rel.sourcePartWithPortPath=path;if(port)rel.sourcePortId=resolveAlias(ctx.elementAlias,port)||port;}rel.sourceEndpointPath=[...rel.sourcePartWithPortPath,...(rel.sourcePortId?[rel.sourcePortId]:[rel.sourceId])];rel.targetEndpointPath=[...rel.targetPartWithPortPath,...(rel.targetPortId?[rel.targetPortId]:[rel.targetId])];}}

function importDiagramNodes(sheets,ctx){for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){const diagramId=resolveAlias(ctx.diagramAlias,valueFor(row,'diagramId'))||text(valueFor(row,'diagramId'));const rawElement=valueFor(row,'semanticElement')||valueFor(row,'externalId')||valueFor(row,'sourceElement');const elementId=resolveAlias(ctx.elementAlias,rawElement);const diagram=ctx.project.diagrams.find(d=>d.id===diagramId);if(!diagram||!elementId){ctx.report.warnings.push(`${sheet.name} row ${row.__rowNumber}: unresolved diagram presentation.`);continue;}const presentationId=text(valueFor(row,'presentationId'))||uid('node');let node=diagram.nodes.find(n=>n.id===presentationId||n.elementId===elementId);if(!node){node={id:presentationId,elementId};diagram.nodes.push(node);ctx.report.presentations.created++;}const parentPresentationId=text(row['Parent Presentation ID']||row['Boundary Owner Presentation ID']);const endpointPath=splitIds(row['Endpoint Path']||row['Nested Property Path']).map(id=>resolveAlias(ctx.elementAlias,id)||id),propertyIds=splitIds(row['Property Path IDs']||row['Nested Property Path IDs']||row['Nested Property Path']).map(id=>resolveAlias(ctx.elementAlias,id)||id),propertyPath=propertyIds.map(propertyId=>{const property=ctx.project.elements.find(item=>item.id===propertyId);return{propertyId,typeId:property?.typeRef||''}});Object.assign(node,{x:numberOr(valueFor(row,'x'),node.x??80),y:numberOr(valueFor(row,'y'),node.y??80),width:numberOr(valueFor(row,'width'),node.width??190),height:numberOr(valueFor(row,'height'),node.height??110),zIndex:numberOr(row['Z Order'],node.zIndex??0),parentPresentationId,boundaryOwnerNodeId:parentPresentationId||node.boundaryOwnerNodeId,portSide:text(row['Port Side']||row['Boundary Side']).toLowerCase()||node.portSide,perimeterOffset:numberOr(row['Perimeter Offset']??row['Relative Position'],node.perimeterOffset),endpointPath:endpointPath.length?endpointPath:node.endpointPath,propertyPath:propertyPath.length?propertyPath:node.propertyPath,collapsed:/^(?:true|yes|1)$/i.test(text(row['Collapsed']))||Boolean(node.collapsed),relativeX:numberOr(row['Relative X'],node.relativeX),relativeY:numberOr(row['Relative Y'],node.relativeY),compartmentDisplay:text(row['Compartment Display']),stereotypeDisplay:text(row['Stereotype Display']),layer:text(row['Layer']||'default')});ctx.presentationAlias.set(presentationId,node.id);}}
function importDiagramEdges(sheets,ctx){for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){const diagramId=resolveAlias(ctx.diagramAlias,valueFor(row,'diagramId'))||text(valueFor(row,'diagramId'));const relationshipId=resolveAlias(ctx.relationshipAlias,valueFor(row,'semanticEdge')||valueFor(row,'relationshipId')||valueFor(row,'externalId'));const diagram=ctx.project.diagrams.find(d=>d.id===diagramId),relationship=ctx.project.relationships.find(r=>r.id===relationshipId);if(!diagram||!relationship){ctx.report.warnings.push(`${sheet.name} row ${row.__rowNumber}: unresolved diagram edge.`);continue;}const bendRaw=text(valueFor(row,'bendPoints')),routing=/^(orthogonal|straight|direct|manual)$/i.test(bendRaw)?bendRaw.toLowerCase():(text(valueFor(row,'routingStyle'))||'orthogonal');addRelationshipPresentation(diagram,relationship,ctx,{id:text(valueFor(row,'edgePresentationId'))||uid('edge'),points:parseBendPoints(bendRaw),routingStyle:routing,label:text(valueFor(row,'labelText')),occurrenceY:numberOr(row['Occurrence Y']||row['Message Y'],undefined),labelPosition:(row['Label X']!=null||row['Label Y']!=null)?{x:numberOr(row['Label X'],0),y:numberOr(row['Label Y'],0)}:undefined});}}
function expandDiagramLists(sheets,ctx){for(const sheet of sheets)for(const row of sheet.rows){const diagramId=resolveAlias(ctx.diagramAlias,valueFor(row,'diagramId')||valueFor(row,'externalId'));const diagram=ctx.project.diagrams.find(d=>d.id===diagramId);if(!diagram)continue;for(const rawId of splitIds(valueFor(row,'displayedElementIds'))){const elementId=resolveAlias(ctx.elementAlias,rawId);if(elementId&&!diagram.nodes.some(n=>n.elementId===elementId))autoNode(diagram,elementId,ctx);}for(const rawId of splitIds(valueFor(row,'relationshipIds'))){const relId=resolveAlias(ctx.relationshipAlias,rawId);const rel=ctx.project.relationships.find(r=>r.id===relId);if(rel)addRelationshipPresentation(diagram,rel,ctx);}}}
function importNavigation(sheets,ctx){for(const sheet of sheets)for(const row of sortedRows(sheet.rows)){const sourceId=resolveAlias(ctx.elementAlias,valueFor(row,'sourceElement'));const targetId=resolveAlias(ctx.diagramAlias,valueFor(row,'targetDiagram')||valueFor(row,'childDiagram'));const parentId=resolveAlias(ctx.diagramAlias,valueFor(row,'parentDiagram'));const source=ctx.project.elements.find(e=>e.id===sourceId),target=ctx.project.diagrams.find(d=>d.id===targetId),parent=ctx.project.diagrams.find(d=>d.id===parentId);if(source&&target){source.childDiagramIds=[...new Set([...(source.childDiagramIds||[]),target.id])];source.primaryChildDiagramId=booleanValue(valueFor(row,'isPrimary'))?target.id:(source.primaryChildDiagramId||target.id);source.navigationLabel=text(valueFor(row,'navigationLabel'));ctx.report.navigation.created++;}if(parent&&target){parent.childDiagramIds=[...new Set([...(parent.childDiagramIds||[]),target.id])];target.parentDiagramId=parent.id;ctx.report.navigation.created++;}}}

function validateImportGraph(ctx){const elementIds=new Set([ctx.project.root.id,...ctx.project.elements.map(e=>e.id)]),relationshipIds=new Set(ctx.project.relationships.map(r=>r.id));for(const rel of ctx.project.relationships){const openMessageEnd=rel.kind==='Message'&&(rel.messageSort==='lost'&&!rel.targetId||rel.messageSort==='found'&&!rel.sourceId);if((!elementIds.has(rel.sourceId)||!elementIds.has(rel.targetId))&&!openMessageEnd)ctx.report.errors.push(`Relationship ${rel.id} has unresolved endpoints.`);if(rel.kind==='Connector'){for(const id of [...(rel.sourcePartWithPortPath||[]),...(rel.targetPartWithPortPath||[]),rel.sourcePortId,rel.targetPortId].filter(Boolean))if(!elementIds.has(id))ctx.report.errors.push(`Connector ${rel.id} has unresolved endpoint path element ${id}.`);}}for(const diagram of ctx.project.diagrams){if(!elementIds.has(diagram.ownerId))ctx.report.errors.push(`Diagram ${diagram.name} has unresolved owner ${diagram.ownerId}.`);if(!elementIds.has(diagram.contextId))ctx.report.warnings.push(`Diagram ${diagram.name} has unresolved context ${diagram.contextId}.`);for(const node of diagram.nodes||[]){if(!elementIds.has(node.elementId))ctx.report.errors.push(`Diagram ${diagram.name} references missing element ${node.elementId}.`);for(const step of node.propertyPath||[])if(step.propertyId&&!elementIds.has(step.propertyId))ctx.report.errors.push(`Diagram ${diagram.name} has unresolved property path ${step.propertyId}.`);}for(const edge of diagram.edges||[])if(!relationshipIds.has(edge.relationshipId))ctx.report.errors.push(`Diagram ${diagram.name} references missing relationship ${edge.relationshipId}.`);}for(const req of ctx.project.elements.filter(e=>e.kind==='Requirement'))if(!text(req.requirementText))ctx.report.warnings.push(`Requirement ${req.externalId||req.id} has blank text.`);}
function addRelationshipPresentation(diagram,relationship,ctx,overrides={}){let edge=diagram.edges.find(e=>e.relationshipId===relationship.id);if(!edge){const source=ensureNode(diagram,relationship.sourceId,ctx),target=ensureNode(diagram,relationship.targetId,ctx);edge={id:overrides.id||uid('edge'),relationshipId:relationship.id,sourceId:relationship.sourceId,targetId:relationship.targetId,sourceNodeId:source?.id,targetNodeId:target?.id,points:[],...(relationship.kind==='Message'?{occurrenceY:Number(relationship.sequenceOrder)||120}:{})};diagram.edges.push(edge);ctx.report.presentations.created++;}Object.assign(edge,overrides);}
function ensureNode(diagram,elementId,ctx){if(!elementId)return null;return diagram.nodes.find(n=>n.elementId===elementId)||autoNode(diagram,elementId,ctx);}
function autoNode(diagram,elementId,ctx){const i=diagram.nodes.length,kind=ctx.project.elements.find(item=>item.id===elementId)?.kind,size=kind==='Lifeline'?{width:140,height:45}:kind==='CombinedFragment'?{width:420,height:240}:{width:190,height:110},node={id:uid('node'),elementId,x:80+(i%5)*220,y:80+Math.floor(i/5)*150,...size};diagram.nodes.push(node);ctx.report.presentations.created++;return node;}
function parseBendPoints(value){return String(value??'').split(/[;|]/).map(pair=>pair.trim().split(/[, ]+/).map(Number)).filter(p=>p.length>=2&&p.every(Number.isFinite)).map(([x,y])=>({x,y}));}
function normalizeDiagramType(value){const raw=text(value);const k=normalizedKey(raw);const map={bdd:'Block Definition Diagram',blockdefinitiondiagram:'Block Definition Diagram',ibd:'Internal Block Diagram',internalblockdiagram:'Internal Block Diagram',requirementsdiagram:'Requirement Diagram',requirementdiagram:'Requirement Diagram',req:'Requirement Diagram',usecasediagram:'Use Case Diagram',activitydiagram:'Activity Diagram',act:'Activity Diagram',statemachinediagram:'State Machine Diagram',stm:'State Machine Diagram',sequencediagram:'Sequence Diagram',seq:'Sequence Diagram',parametricdiagram:'Parametric Diagram',par:'Parametric Diagram',packagediagram:'Package Diagram',allocationdiagram:'Allocation Diagram',alloc:'Allocation Diagram',instancediagram:'Instance Diagram'};return map[k]||raw||'Block Definition Diagram';}
function sortedRows(rows){return[...rows].sort((a,b)=>(Number(valueFor(a,'order'))||999999)-(Number(valueFor(b,'order'))||999999));}
function minimumOrder(rows){return Math.min(...rows.map(r=>Number(valueFor(r,'order'))||999999),999999);}
function resolveAlias(map,value){return map.get(text(value))||map.get(text(value).toLowerCase())||'';}
function addAliases(map,item,id){for(const value of [id,item.id,item.externalId,item.name,item.qualifiedNameString])if(text(value)){map.set(text(value),id);map.set(text(value).toLowerCase(),id);}}
function findByAlias(items,map,value){const id=resolveAlias(map,value)||value;return items.find(item=>item.id===id||item.externalId===value);}
function removeElement(project,id){project.elements=project.elements.filter(e=>e.id!==id&&e.ownerId!==id);project.relationships=project.relationships.filter(r=>r.sourceId!==id&&r.targetId!==id);for(const d of project.diagrams){d.nodes=(d.nodes||[]).filter(n=>n.elementId!==id);d.edges=(d.edges||[]).filter(edge=>project.relationships.some(r=>r.id===edge.relationshipId));}}
function replaceProject(target,source){for(const key of Object.keys(target))delete target[key];Object.assign(target,source);}
function slug(value){return String(value??'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'item';}
function downloadJsonReport(report){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download=`${report.fileName.replace(/\.[^.]+$/,'')}-import-report.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
