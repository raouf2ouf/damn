import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular material
import { MatSidenavModule, MatToolbarModule, MatButtonModule,
         MatIconModule, MatCardModule, MatMenuModule,
         MatInputModule, MatSelectModule, MatCheckboxModule,
         MatDialogModule, MatSlideToggleModule, MatExpansionModule,
         MatSnackBarModule, MatTooltipModule, MatListModule,
         MatAutocompleteModule, MatProgressSpinnerModule } from '@angular/material';
import { OverlayModule} from '@angular/cdk/overlay';
import 'hammerjs';

// Graph display
import { NgxChartsModule } from '@swimlane/ngx-charts';

// For collaboration
import { InjectableRxStompConfig, RxStompService, rxStompServiceFactory } from '@stomp/ng2-stompjs';
import { myRxStompConfig } from './my-rx-stomp.config';

// Services
import { AnonymousGuard, AuthenticationGuard, AuthenticationService,
         TokenStorageService, httpInterceptorProviders } from './security';
import { AlertService, ProjectService, SgService,
         CollaborationService } from './services';

// Components
import { HomeComponent, ProjectComponent, DashboardComponent,
  SgDisplayComponent } from './components';

import { SgGraphModule } from './components/sg-graph/sg-graph.module';

// Dialog boxes
import { LoginDialogComponent, RegisterDialogComponent, HelpDialogComponent,
         AddProjectDialogComponent, AgentDialogComponent, InviteUserDialogComponent } from './components/dialogs';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,

    LoginDialogComponent, RegisterDialogComponent, HelpDialogComponent,
    AddProjectDialogComponent, AgentDialogComponent, InviteUserDialogComponent,

    ProjectComponent, DashboardComponent, SgDisplayComponent
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule,

    AppRoutingModule,

    HttpClientModule,

    FormsModule, ReactiveFormsModule,

    MatSidenavModule, MatToolbarModule, MatButtonModule,
     MatIconModule, MatCardModule, MatMenuModule,
     MatInputModule, MatSelectModule, MatCheckboxModule,
     MatDialogModule, MatSlideToggleModule, MatExpansionModule,
     MatSnackBarModule, MatTooltipModule, MatListModule,
     MatAutocompleteModule, MatProgressSpinnerModule,

     OverlayModule,

    NgxChartsModule, SgGraphModule
  ],
  providers: [ AnonymousGuard, AuthenticationGuard, AuthenticationService,
               TokenStorageService, httpInterceptorProviders,
               AlertService, ProjectService, SgService,
               CollaborationService,
               {
                  provide: InjectableRxStompConfig,
                  useValue: myRxStompConfig
                },
                RxStompService
             ],
  entryComponents: [ LoginDialogComponent, RegisterDialogComponent, HelpDialogComponent,
                     AddProjectDialogComponent, AgentDialogComponent, InviteUserDialogComponent ],
  bootstrap: [AppComponent]
})
export class AppModule { }
