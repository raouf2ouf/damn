import { Component, OnInit, OnDestroy, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import {CollaborationService} from '../../../services';

import {FormBuilder, FormGroup} from '@angular/forms';
import {switchMap, debounceTime, tap, finalize} from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.scss']
})
export class InviteUserDialogComponent implements OnInit, OnDestroy {
  title="Invite user to this project";
  subscription: Subscription;
  filteredUsers: String[] = [];
  usersForm: FormGroup;
  isLoading = false;

  constructor(private dialogRef:MatDialogRef<InviteUserDialogComponent>,
              @Inject(MAT_DIALOG_DATA) data, private fb:FormBuilder, private collaborationService:CollaborationService) { }

  ngOnInit() {
    this.usersForm = this.fb.group({
      userInput: null
    })
    this.subscription = this.usersForm
      .get('userInput')
      .valueChanges
      .pipe(
        debounceTime(300),
        tap(() => this.isLoading = true),
        switchMap(value => this.collaborationService.search(value)
                  .pipe(
                    finalize(() => this.isLoading = false),
                  )
                 )
      )
      .subscribe(users => this.filteredUsers = users);
  }

  ngOnDestroy() {
    if(this.subscription) this.subscription.unsubscribe();
  }

  close() {
    this.dialogRef.close();
  }

  invite() {
    let username = this.usersForm.controls['userInput'].value;

    this.dialogRef.close(username);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.invite();
    }
  }
}
