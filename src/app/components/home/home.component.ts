import { Component, OnInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { HelpDialogComponent } from '../dialogs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  openHelpDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    const dialogRef = this.dialog.open(HelpDialogComponent, dialogConfig);
  }
}
