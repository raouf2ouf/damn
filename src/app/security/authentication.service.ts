import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { JwtResponse } from './jwt-response.model';
import { SignUpInfo } from './signup.model';
import { LoginInfo } from './login.model';

import { TokenStorageService } from './token-storage.service';

import {Agent} from '../models';

import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private loginUrl = `${environment.apiRoot}/auth/signin`;
  private signupUrl = `${environment.apiRoot}/auth/signup`;
  private signoutUrl = `${environment.apiRoot}/auth/signout`;

  constructor(private http:HttpClient,
              private tokenService:TokenStorageService) { }

  attemptAuthentication(credentials:LoginInfo):Observable<JwtResponse> {
    return this.http.post<JwtResponse>(this.loginUrl, credentials, httpOptions);
  }

  attemptRegistration(info:SignUpInfo): Observable<any> {
    return this.http.post<any>(this.signupUrl, info, httpOptions);
  }

  saveUser(data:JwtResponse):void {
    this.tokenService.saveToken(data.accessToken);
    this.tokenService.saveUsername(data.username);
  }

  logout():Observable<any> {
    this.tokenService.signOut();
    return this.http.get<any>(this.signoutUrl);
  }

  getLoggedUser():Agent {
    let username = this.tokenService.getUsername();
    if(!username) return null;

    return new Agent(username);
  }
}
