const dependencies=['Dependency','Abstraction','Redefines','Subsets','Requires','Satisfy','Verify','Refine','DeriveReqt','Trace','Copy','Allocate','Include','Extend','VariantBinding'];
const stereotypes={Include:'include',Extend:'extend'};
export function relationshipNotation(kind){
 if(kind==='Generalization')return {lineStyle:'solid',sourceMarker:'none',targetMarker:'triangle',keyword:''};
 if(kind==='Realization'||kind==='Provides')return {lineStyle:'dashed',sourceMarker:'none',targetMarker:'triangle',keyword:''};
 if(['Composition','Aggregation','Association','AssociationBlock'].includes(kind))return {lineStyle:'solid',sourceMarker:'none',targetMarker:'none',keyword:''};
 if(['ControlFlow','ObjectFlow','InterruptingEdge','Transition'].includes(kind))return {lineStyle:'solid',sourceMarker:'none',targetMarker:'open',keyword:''};
 if(kind==='Message')return {lineStyle:'solid',sourceMarker:'none',targetMarker:'filled',keyword:''};
 if(['Connector','DelegationConnector','BindingConnector'].includes(kind))return {lineStyle:'solid',sourceMarker:'none',targetMarker:'none',keyword:kind==='BindingConnector'?'bindingConnector':''};
 if(kind==='ItemFlow')return {lineStyle:'solid',sourceMarker:'none',targetMarker:'flow',keyword:'itemFlow'};
 if(dependencies.includes(kind))return {lineStyle:'dashed',sourceMarker:'none',targetMarker:'open',keyword:stereotypes[kind]||kind[0].toLowerCase()+kind.slice(1)};
 return {lineStyle:'solid',sourceMarker:'none',targetMarker:'none',keyword:''};
}
export function relationshipPresentation(relationship){const base=relationshipNotation(relationship.kind),result={...base};for(const end of ['source','target']){const aggregation=relationship[`${end}Aggregation`];if(aggregation==='composite')result[`${end}Marker`]='diamondFilled';else if(aggregation==='shared')result[`${end}Marker`]='diamond'}if(relationship.kind==='Message'){if(relationship.messageSort==='asynchronous')result.targetMarker='open';if(relationship.messageSort==='reply')result.lineStyle='dashed';if(relationship.messageSort==='delete')result.targetMarker='destruction'}return result}
