export function preserveLifelineRepresentation(element,row={}){
  if(!element)return element;
  const id=String(row['Represents External ID']??'').trim();
  const qn=String(row['Represents Qualified Name String']??'').trim();
  if(id)element.representedElementId=id;
  if(qn)element.representedQualifiedNameString=qn;
  return element;
}
