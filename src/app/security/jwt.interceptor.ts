import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

import { TokenStorageService } from './token-storage.service';

const TOKEN_HEADER_KEY = 'Authorization';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private tokenService: TokenStorageService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler) {
      let authorizationRequest = request;
      const token = this.tokenService.getToken();
      if(token != null) {
        authorizationRequest = request.clone({headers: request.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token)});
      }
      return next.handle(authorizationRequest);
    }
}

export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
];
