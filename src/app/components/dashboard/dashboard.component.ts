import { Component, OnInit } from '@angular/core';

import { Project } from '../../models';
import { ProjectService, AlertService } from '../../services';

import {Router} from '@angular/router';

import { MatDialog, MatDialogConfig} from '@angular/material';

import { AddProjectDialogComponent } from '../dialogs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  ownProjects:Project[];
  collaborationProjects:Project[];

  constructor(private alertService:AlertService,
              private projectService:ProjectService,
              private router:Router,
              private dialog: MatDialog) { }

  ngOnInit() {
    this.projectService.getOwnProjects().subscribe(data => {
      this.ownProjects = data;
    }, error => {
      this.alertService.error(error);
    });

    this.projectService.getCollaborationProjects().subscribe(data => {
      this.collaborationProjects = data;
    }, error => {
      this.alertService.error(error);
    });
  }

  getFirstLetters(str:string):string {
    let title = "";
    str.split(' ').forEach(word => {
      title += word.substr(0,1).toUpperCase();
    });
    return title;
  }

  redirectTo(path:string) {
    this.router.navigate([path]);
  }


  openProjectDialog(project:Project) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = project;

    const dialogRef = this.dialog.open(AddProjectDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(data => {
      if(!data) return;
      this.projectService.saveProject(data).subscribe(data => {
        this.alertService.success("Project updated successfully!");
      },
      error => {
        this.alertService.error(error);
      });
    });
  }

  deleteProject(project:Project) {
    if(confirm("Are you sure to delete '"+project.name + "''?")) {
      this.projectService.deleteProject(project.id).subscribe(data => {
        this.alertService.success("Project deleted successfully!");
        this.ownProjects = this.ownProjects.filter(p => p.id != project.id);
        this.collaborationProjects = this.collaborationProjects.filter(p => p.id != project.id);
      },
      error => {
        this.alertService.error(error);
      })
    }
  }
}
