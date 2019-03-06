export interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: any;
  points?: any;
  line?: string;
  oldLine?: any;
  textTransform?: string;
  textAngle?: number;
  textPath?: string;
  oldTextPath?: string;
  unhighlight?:boolean;
  collapsed?:boolean;
}
