// Lightweight uniform-grid spatial index for diagram viewport/hit-test working sets.
// It avoids scanning every presentation for common rectangular queries.
export class SpatialIndex{
  constructor({cellSize=256}={}){this.cellSize=Math.max(32,cellSize);this.cells=new Map();this.items=new Map()}
  keys(box){const x0=Math.floor(box.x/this.cellSize),y0=Math.floor(box.y/this.cellSize),x1=Math.floor((box.x+Math.max(0,box.width))/this.cellSize),y1=Math.floor((box.y+Math.max(0,box.height))/this.cellSize),keys=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)keys.push(`${x}:${y}`);return keys}
  insert(id,box,value=null){this.remove(id);const item={id,box,value,keys:this.keys(box)};this.items.set(id,item);for(const key of item.keys){let bucket=this.cells.get(key);if(!bucket){bucket=new Set();this.cells.set(key,bucket)}bucket.add(id)}return item}
  remove(id){const item=this.items.get(id);if(!item)return;for(const key of item.keys){const bucket=this.cells.get(key);bucket?.delete(id);if(bucket?.size===0)this.cells.delete(key)}this.items.delete(id)}
  query(box){const ids=new Set(),out=[];for(const key of this.keys(box))for(const id of this.cells.get(key)||[])ids.add(id);for(const id of ids){const item=this.items.get(id),b=item.box;if(b.x<=box.x+box.width&&b.x+b.width>=box.x&&b.y<=box.y+box.height&&b.y+b.height>=box.y)out.push(item)}return out}
  clear(){this.cells.clear();this.items.clear()}
}
