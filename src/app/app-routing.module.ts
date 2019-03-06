import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent, ProjectComponent, DashboardComponent } from './components';

import { AuthenticationGuard, AnonymousGuard } from './security';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'login',
    component: HomeComponent,
    canActivate: [AnonymousGuard]
  },
  {
    path: 'signup',
    component: HomeComponent,
    canActivate: [AnonymousGuard]
  },
  {
    path: 'project/:id',
    component: ProjectComponent,
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'example/:id',
    component: ProjectComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthenticationGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
