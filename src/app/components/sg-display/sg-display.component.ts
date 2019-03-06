import { Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';

import * as shape from 'd3-shape';

import { StatementGraph, Statement, SGEdge } from '../../models';

import { AlertService, SgService} from '../../services';

import { Subscription } from 'rxjs';

@Component({
  selector: 'sg-display',
  templateUrl: './sg-display.component.html',
  styleUrls: ['./sg-display.component.scss']
})
export class SgDisplayComponent implements OnInit, OnDestroy {

  view = undefined; //[1000,1000];
  layout = 'dagre';
  curve = shape.curveMonotoneY;

  layoutSettings = {orientation:'BT'};

  subscription:Subscription;

  sg:StatementGraph = new StatementGraph([],[]);

  constructor(private alertService:AlertService,
    private sgService:SgService) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.showGraph();
  }

  ngOnDestroy() {
      if(this.subscription) {
        this.subscription.unsubscribe();
      }
  }

  showGraph() {
    this.subscription = this.sgService.onGetData.subscribe(res => {
      if(!res) return;
      res.statements.push(...res.queryStatements);
      // if empty statement graph then simply assigning
      if(!this.sg || this.sg.statements.length == 0) {
          this.sg = res;
        return
      }

      let statements:Statement[] = [];
      let edges:SGEdge[] = [];

      // remove and update statements
      this.sg.statements.forEach(s => {
        const updated = res.statements.find(statement => statement.id === s.id);
        if(updated) { // element already exists
            statements.push(Object.assign(s, updated));
        }
      });
      // add new statements
      res.statements.forEach(newS => {
        const existingS = this.sg.statements.find(statement => statement.id === newS.id);
        if(!existingS) { // edge does not exist
            statements.push(newS);
        }
      });


      // remove and update edges
      this.sg.edges.forEach(e => {
        const updated = res.edges.find(edge => edge.id === e.id);
        if(updated) { // element already exists
            edges.push(Object.assign(e, updated));
        }
      });
      // add new edges
      res.edges.forEach(newE => {
        const existingE = this.sg.edges.find(edge => edge.id === newE.id);
        if(!existingE) { // edge does not exist
            edges.push(newE);
        }
      });
      this.sg.edges = edges;
      this.sg.statements = statements;
    }, error => {
      this.alertService.error(error.message);
    });
  }

}
