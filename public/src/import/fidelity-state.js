export function preserveStateBehaviors(element,row={}){
  if(!element)return element;
  const entry=String(row['Entry Behavior']??'').trim();
  const doing=String(row['Do Behavior']??'').trim();
  const exit=String(row['Exit Behavior']??'').trim();
  if(entry)element.entryBehavior=entry;
  if(doing)element.doBehavior=doing;
  if(exit)element.exitBehavior=exit;
  return element;
}
