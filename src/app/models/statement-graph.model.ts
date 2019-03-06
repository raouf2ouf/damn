import {Statement} from './statement.model';
import {SGEdge} from './sg-edge.model';

export class StatementGraph {
  public statements:Statement[];
  public edges:SGEdge[];

  
  constructor(statements, edges) {
    this.statements = statements;
    this.edges = edges;
  }

}
