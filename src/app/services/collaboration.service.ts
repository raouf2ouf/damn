import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {myRxStompConfig} from '../my-rx-stomp.config';
import { RxStompService, InjectableRxStompConfig} from '@stomp/ng2-stompjs';
import { Message } from '@stomp/stompjs';
import { Subscription, Observable, of } from 'rxjs';

import {TokenStorageService} from '../security';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {

  apiRoot:string = `${environment.apiRoot}/collaboration`;

  constructor(private rxStompService: RxStompService,
              private tokenService:TokenStorageService,
              private http:HttpClient) { }

  connect() {
    // Open Websocket connection
    const stompConfig: InjectableRxStompConfig = Object.assign({}, myRxStompConfig, {
         connectHeaders: {
             Authorization: 'Bearer ' + this.tokenService.getToken()
         }
     });

     this.rxStompService.configure(stompConfig);
     this.rxStompService.activate();
  }

  watch(url:string) {
    // return this.rxStompService.watch(`${this.apiRoot}/project/${url}`);
    return this.rxStompService.watch(url);
  }

  publish(data:any) {
    return this.rxStompService.publish(data);
  }

  search(username:string):Observable<String[]> {
    return username ? this.http.get<String[]>(`${this.apiRoot}/user/${username}`) : of([]);
  }

  inviteUser(username:string, project_id:string):Observable<any> {
    return this.http.get<any>(`${this.apiRoot}/invite/${username}/to/${project_id}`);
  }

  saveKB(projectId:string, kb):Observable<any> {
    return this.http.post<any>(`${this.apiRoot}/saveKB/${projectId}`, kb);
  }

  saveAllKBs(projectId:string, kbs):Observable<any> {
    return this.http.post<any>(`${this.apiRoot}/saveAllKBs/${projectId}`, kbs);
  }

  deleteKB(projectId:string, kb):Observable<any> {
    return this.http.post<any>(`${this.apiRoot}/deleteKB/${projectId}`, kb);
  }

  getKB(projectId:string, id:string):Observable<any> {
    return this.http.get<any>(`${this.apiRoot}/get/${projectId}/${id}`);
  }

}
