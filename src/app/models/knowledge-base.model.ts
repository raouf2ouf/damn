import {Agent} from './agent.model';

export class KnowledgeBase {
  public id:string;
  public dlgp:string;
  public source:string;
  public agent_id?:string;
  public selected:boolean;
  public type: 'common' | string;
  public locked:boolean;
  public editors?:string[];

  constructor() {
    this.dlgp = "";
    this.source = "";
    this.agent_id = "";
    this.selected = true;
    this.type = "";
    this.locked = false;
  }
}
