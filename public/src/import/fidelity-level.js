export function preserveRequirementLevel(element,row={}){
  const value=String(row['Level']??'').trim();
  if(value) element.requirementLevel=value;
  return element;
}
