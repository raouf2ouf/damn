import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {FormControl, Validators} from '@angular/forms';

import { LoginInfo } from '../../../security';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginDialogComponent implements OnInit {

  loginInfo:LoginInfo = new LoginInfo(null,null);

  usernameControl = new FormControl('', [Validators.required, Validators.maxLength(30)]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);


  constructor( public dialogRef: MatDialogRef<LoginDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any) { }


  ngOnInit() {
  }

  login() {
    this.dialogRef.close(this.loginInfo);
  }
}
