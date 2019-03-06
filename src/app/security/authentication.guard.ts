import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from './authentication.service';
import { Agent } from '../models/agent.model';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private router:Router, private authenticationService:AuthenticationService) {}

  canActivate(route:ActivatedRouteSnapshot, state:RouterStateSnapshot) {
    let user:Agent = this.authenticationService.getLoggedUser()
    if(user) return true;
    // not logged
    this.router.navigate(['/'], {queryParams: {returnUrl: state.url}});
    return false;
  }
}
