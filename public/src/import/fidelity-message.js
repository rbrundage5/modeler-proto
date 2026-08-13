export function preserveMessageSignature(relationship,row={}){
  if(!relationship)return relationship;
  const signature=String(row['Signature']??'').trim();
  if(signature)relationship.signature=signature;
  return relationship;
}
