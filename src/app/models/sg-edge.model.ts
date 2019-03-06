export class SGEdge {
    id: string;
    source: string | number;
    target: string | number;
    type:string;
    label:string;

    constructor(values:Object = {}) {
      Object.assign(this, values);
    }
}
