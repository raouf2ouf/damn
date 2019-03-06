import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';

import { environment } from '../../environments/environment';

import { Project } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  apiRoot:string = `${environment.apiRoot}/project`;

  constructor(private http:HttpClient) { }

  saveProject(data):Observable<Project> {
    let url = `${this.apiRoot}`;
    url += (data.id) ? "/update" : "/add";
    return this.http.post<Project>(url,data);
  }

  deleteProject(id:string):Observable<any> {
    return this.http.get<any>(`${this.apiRoot}/delete/${id}`);
  }


  getProject(id:string):Observable<Project> {
    return this.http.get<Project>(`${this.apiRoot}/get/${id}`);
  }

  getOwnProjects():Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiRoot}/get/created`);
  }

  getCollaborationProjects():Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiRoot}/get/collaboration`);
  }
}
