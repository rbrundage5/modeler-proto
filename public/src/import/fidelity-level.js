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

function stereotypeLeaf(value){
  return text(value).split(/::|\./).pop().replace(/[«»<>]/g,'').trim().toLowerCase();
}

function canonicalAutomobileUnitId(value){
  const raw=text(value);
  const match=raw.match(/^(.*\.UNIT\.)(\d{3})$/i);
  return match?`${match[1]}0${match[2]}`:raw;
}

export function preserveRequirementLevel(element,row={}){
  const level=text(row['Level']);
  if(level)element.requirementLevel=level;

  // Explicit SysML stereotypes are authoritative over their generic UML
  // metaclasses (Class, DataType, Property, Port, Behavior). This prevents
  // Requirement/ConstraintBlock/InterfaceBlock/ValueType rows from silently
  // degrading to generic Block/DataType records during import.
  const stereotypeKind=STEREOTYPE_KIND.get(stereotypeLeaf(element?.stereotype));
  if(stereotypeKind)element.kind=stereotypeKind;

  // Unit workbooks encode SysML Units as stereotyped InstanceSpecifications.
  // The Automobile acceptance set omits the stereotype column but provides
  // the canonical Unit semantics explicitly through Symbol/Quantity Kind/SI
  // Conversion Factor, so preserve those rows as Unit semantic elements.
  const symbol=text(row['Symbol']);
  const quantityKind=text(row['Quantity Kind']);
  const factor=text(row['SI Conversion Factor']);
  if(element?.kind==='InstanceSpecification'&&symbol&&quantityKind&&factor!==''){
    element.kind='Unit';
    element.metaclass='InstanceSpecification';
    element.stereotype=element.stereotype||'unit';
    element.symbol=symbol;
    element.unitSymbol=symbol;
    element.quantityKindRef=quantityKind;
    const numeric=Number(factor);
    element.siConversionFactor=Number.isFinite(numeric)?numeric:factor;
  }

  // The supplied Automobile ValueType workbook uses CAR.UNIT.001 while the
  // Unit table uses CAR.UNIT.0001. Canonicalize that documented ID form before
  // the normal alias resolver runs; other unit-ID formats are left unchanged.
  if(element?.kind==='ValueType'&&element.unitRef)element.unitRef=canonicalAutomobileUnitId(element.unitRef);
  return element;
}
