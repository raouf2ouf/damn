import { StatementGraph } from './statement-graph.model';
import { KnowledgeBase } from './knowledge-base.model';
import { Agent } from './agent.model';

export class Project {
  public name:string;
  public id?:string;
  public isPublic?:boolean;
  public creator_id?:string;
  public contributors?:Agent[];
  public kbs:KnowledgeBase[];
  public query:string;
  public semantic:string;
  public description?:string;

  constructor() {
    this.isPublic =  true;
    this.kbs = [];
    this.semantic = "BDLwithoutTD";
  }
}
