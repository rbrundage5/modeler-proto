import '../containment-tree-policy.js';
const text=value=>String(value??'').trim();

const STEREOTYPE_KIND=new Map([
  ['requirement','Requirement'],
  ['block','Block'],
  ['interfaceblock','InterfaceBlock'],
  ['constraintblock','ConstraintBlock'],
  ['valuetype','ValueType'],
  ['partproperty','PartProperty'],
  ['referenceproperty','ReferenceProperty'],
  ['valueproperty','ValueProperty'],
  ['flowproperty','FlowProperty'],
  ['constraintproperty','ConstraintProperty'],
  ['proxyport','ProxyPort'],
  ['fullport','FullPort'],
  ['testcase','TestCase']
]);

function stereotypeLeaf(value){return text(value).split(/::|\./).pop().replace(/[«»<>]/g,'').trim().toLowerCase()}
function canonicalAutomobileUnitId(value){const raw=text(value),match=raw.match(/^(.*\.UNIT\.)(\d{3})$/i);return match?`${match[1]}0${match[2]}`:raw}

export function preserveRequirementLevel(element,row={}){
  const level=text(row['Level']);if(level)element.requirementLevel=level;
  const stereotypeKind=STEREOTYPE_KIND.get(stereotypeLeaf(element?.stereotype));if(stereotypeKind)element.kind=stereotypeKind;
  const symbol=text(row['Symbol']),quantityKind=text(row['Quantity Kind']),factor=text(row['SI Conversion Factor']);
  if(element?.kind==='InstanceSpecification'&&symbol&&quantityKind&&factor!==''){element.kind='Unit';element.metaclass='InstanceSpecification';element.stereotype=element.stereotype||'unit';element.symbol=symbol;element.unitSymbol=symbol;element.quantityKindRef=quantityKind;const numeric=Number(factor);element.siConversionFactor=Number.isFinite(numeric)?numeric:factor}
  if(element?.kind==='ValueType'&&element.unitRef)element.unitRef=canonicalAutomobileUnitId(element.unitRef);
  return element;
}
