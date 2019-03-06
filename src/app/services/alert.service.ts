import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { AuthenticationService } from '../security';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private subject = new Subject<any>();

  constructor(public authenticationService:AuthenticationService) {}

  success(message: string) {
    this.subject.next({type: 'success', text: message});
  }

  error(error) {
    if(error.status && error.status == 401) {
      this.authenticationService.logout();
    }
    console.log(error);
    let message = (error.error) ? error.error.message : error.message;
    this.subject.next({type: 'error', text: message});
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
