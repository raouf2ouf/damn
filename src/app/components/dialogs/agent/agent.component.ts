import { Component, OnInit, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html',
  styleUrls: ['./agent.component.scss']
})
export class AgentDialogComponent implements OnInit {

  title:string = "Add Local Agent";

  name:string;

  constructor(private dialogRef:MatDialogRef<AgentDialogComponent>,
  @Inject(MAT_DIALOG_DATA) data) {
    if(data) {
      this.name = data.name;
      this.title = "Edit Local Agent";
    }
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    const data = {
      name: this.name
    };

    this.dialogRef.close(data);
  }

  onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    this.save();
  }
}
}
