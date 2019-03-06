import { Component, OnInit, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { Project } from '../../../models';
@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectDialogComponent implements OnInit {
  update:boolean = false;
  project:Project;

  constructor(private dialogRef:MatDialogRef<AddProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {
    if(data) {
      this.update = true;
      this.project = data;
    } else {
      this.project = new Project();
    }
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if(!this.project.name) {
      return;
    }

    this.dialogRef.close(this.project);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.save();
    }
  }
}
