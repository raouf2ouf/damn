import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {FormControl, Validators} from '@angular/forms';

import { SignUpInfo } from '../../../security';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterDialogComponent implements OnInit {

  signUpInfo:SignUpInfo = new SignUpInfo();

  usernameControl = new FormControl('', [Validators.required, Validators.maxLength(30)]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(6)]);


  constructor( public dialogRef: MatDialogRef<RegisterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any) { }

  ngOnInit() {
  }

  register() {
    this.dialogRef.close(this.signUpInfo);
  }

}
