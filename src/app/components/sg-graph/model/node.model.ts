export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeDimension {
  width: number;
  height: number;
}

export interface Node {
  id: string;
  position?: NodePosition;
  dimension?: NodeDimension;
  transform?: string;
  oldTransform?: string;
  label?: string;
  data?: any;
  unhighlight?:boolean;
  collapsed?:boolean;
}
