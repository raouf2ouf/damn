import { Component, OnInit, OnDestroy, HostBinding} from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';


// Material
import { MatDialog, MatDialogConfig, MatSnackBar} from '@angular/material';
import { OverlayContainer} from '@angular/cdk/overlay';

// Models
import { Agent, Project } from './models';

// Services
import { AuthenticationService } from './security';
import { AlertService, ProjectService } from './services';

// DialogBoxes
import { LoginDialogComponent, RegisterDialogComponent, HelpDialogComponent,
         AddProjectDialogComponent } from './components/dialogs';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Defeasible Reasoning Tool';
  @HostBinding('class') componentCssClass;

  themes = [
    {title: "Light Theme", value:"light-theme"},
    {title: "Dark Theme", value:"dark-theme"}
  ];

  agent:Agent;

  subscriptions:Subscription[] = [];

  constructor(private projectService:ProjectService,
    private dialog: MatDialog,
    public overlayContainer: OverlayContainer,
    public alertService: AlertService,
    public snackbar: MatSnackBar,
    public authenticationService:AuthenticationService,
    private route: ActivatedRoute,
    private router:Router) {
      this.componentCssClass="light-theme";
  }

  ngOnInit() {
    this.agent = this.authenticationService.getLoggedUser();

    this.subscriptions.push(this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd) {
        if(event.url == "/login") {
          this.openLoginDialog();
        } else if(event.url == "/signup") {
          this.openRegisterDialog();
        }
      }
    }));

    this.subscriptions.push(this.alertService.getMessage().subscribe(message => {
      if(message && message.text) {
        let snackbarClass:string = (message.type == 'success') ? 'snackbar-success' : 'snackbar-error';
        this.snackbar.open(message.text, 'Ok', {duration: 4500, panelClass: snackbarClass});
      }
    }));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => {
      s.unsubscribe();
    });
  }


  openProjectDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    const dialogRef = this.dialog.open(AddProjectDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(data => {
      if(!data) return;
      data.creator_id = this.agent.id;
      this.projectService.saveProject(data).subscribe(data => {
        this.redirectTo(`project/${data.id}`);
      },
      error => {
        this.alertService.error(error.message);
      });
    });
  }


  openLoginDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    const dialogRef = this.dialog.open(LoginDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result && result.username && result.password) {
        this.authenticationService.attemptAuthentication(result).subscribe(data => {
          this.authenticationService.saveUser(data);
          this.agent = this.authenticationService.getLoggedUser();
          let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
          this.alertService.success("Successfully logged in!");
        },
        error => {
          this.openLoginDialog();
          this.alertService.error(error.message);
        });
      }
    });
  }

  openRegisterDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    const dialogRef = this.dialog.open(RegisterDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if(result && result.username && result.password && result.email) {
        this.authenticationService.attemptRegistration(result).subscribe(data => {
          this.authenticationService.saveUser(data);
          this.agent = this.authenticationService.getLoggedUser();
          let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
          this.alertService.success("Successfully signed up!");
        },
        error => {
          this.openRegisterDialog();
          this.alertService.error(error.message);
        });
      }
    });
  }

  logout() {
    this.authenticationService.logout().subscribe(res => {
      this.agent = null;
      this.router.navigate(['/home']);
      this.alertService.success("Successfully logged out!");
    },
    error => {
      this.alertService.error(error.message);
    });
  }

  openHelpDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    const dialogRef = this.dialog.open(HelpDialogComponent, dialogConfig);
  }


  setTheme(theme:string) {
    this.componentCssClass = theme;
    this.themes.forEach((t) => {
      this.overlayContainer.getContainerElement().classList.remove(t.value);
    })
    this.overlayContainer.getContainerElement().classList.add(theme);
  }

  redirectTo(path:string) {
    this.router.navigate([path]);
  }
}
