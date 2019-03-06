import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';

import { environment } from '../../environments/environment';


import {Statement, StatementGraph, SGEdge, KnowledgeBase} from '../models';

@Injectable({
  providedIn: 'root'
})
export class SgService {
  apiRoot:string = `${environment.apiRoot}/sg`;

  onGetData:EventEmitter<any> = new EventEmitter();

  constructor(private http:HttpClient) { }

  build(kbs:KnowledgeBase[], projectId:string):Observable<any> {
    let data = {
      projectId: projectId,
      kbs: kbs
    }
    return this.http.post(`${this.apiRoot}/build`,data);
  }

  query(kbs:KnowledgeBase[], projectId:string, query:string, chosenSemantics:string) {
    let data = {
      projectId: projectId,
      kbs: kbs,
      query: query,
      semantics:chosenSemantics
    }
    return this.http.post(`${this.apiRoot}/query`,data);
  }
}
