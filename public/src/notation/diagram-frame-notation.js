export const DIAGRAM_FRAME_NOTATION={
 'Block Definition Diagram':'bdd','Internal Block Diagram':'ibd','Requirement Diagram':'req','Use Case Diagram':'uc','Activity Diagram':'act','State Machine Diagram':'stm','Sequence Diagram':'sd','Parametric Diagram':'par','Package Diagram':'pkg','Instance Diagram':'instance'
};
export function framePresentation(diagram){return {visible:diagram.frame?.visible!==false,x:diagram.frame?.x??12,y:diagram.frame?.y??12,width:diagram.frame?.width??3160,height:diagram.frame?.height??2160,kind:DIAGRAM_FRAME_NOTATION[diagram.diagramType]||'diagram'};}
