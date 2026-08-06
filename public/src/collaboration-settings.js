const FALLBACK_NAME='Modeler';
const FALLBACK_ROOM='default';
const FALLBACK_BRANCH='main';

function clean(value,fallback){
  const normalized=String(value??'').trim();
  return normalized||fallback;
}

export function collaborationSettings({search='',stored={}}={}){
  const params=new URLSearchParams(search);
  return {
    displayName:clean(stored.displayName,FALLBACK_NAME),
    roomId:clean(params.get('room')??stored.roomId,FALLBACK_ROOM),
    branchId:clean(params.get('branch')??stored.branchId,FALLBACK_BRANCH)
  };
}

export function collaborationLink(locationLike,settings){
  const url=new URL(locationLike.href);
  url.searchParams.set('room',clean(settings.roomId,FALLBACK_ROOM));
  const branchId=clean(settings.branchId,FALLBACK_BRANCH);
  if(branchId===FALLBACK_BRANCH)url.searchParams.delete('branch');
  else url.searchParams.set('branch',branchId);
  url.hash='';
  return url.toString();
}

export function saveCollaborationSettings(storage,settings){
  storage.setItem('systems-modeler.collaboration',JSON.stringify({
    displayName:clean(settings.displayName,FALLBACK_NAME),
    roomId:clean(settings.roomId,FALLBACK_ROOM),
    branchId:clean(settings.branchId,FALLBACK_BRANCH)
  }));
}

export function loadCollaborationSettings(storage){
  try{return JSON.parse(storage.getItem('systems-modeler.collaboration'))||{}}
  catch{return {}}
}
