import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User, UserUpsert } from '../../models/user.model';
import { Master } from '../../models/master.model';

export interface UserDialogData {
  user: User | null;
  roles: Master[];
  cby: number;
}

@Component({
  selector: 'app-user-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss',
})
export class UserDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<UserDialog, UserUpsert>);
  readonly data = inject<UserDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.user !== null;
  readonly roles = this.data.roles;

  readonly form = this.fb.nonNullable.group({
    fname: [this.data.user?.fname ?? '', [Validators.required]],
    uname: [this.data.user?.uname ?? '', [Validators.required]],
    pcode: [this.data.user?.pcode ?? '', [Validators.required]],
    email: [this.data.user?.mail ?? '', [Validators.required, Validators.email]],
    Mobile: [this.data.user?.mob ?? '', [Validators.required]],
    Rid: [this.data.user?.rid ?? (this.roles[0]?.id ?? 1), [Validators.required]],
    lid: [this.data.user?.lid ?? 1, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: UserUpsert = {
      uid: this.data.user?.uid ?? 0,
      fname: value.fname.trim(),
      uname: value.uname.trim(),
      pcode: value.pcode,
      email: value.email.trim(),
      Mobile: String(value.Mobile).trim(),
      Rid: Number(value.Rid),
      Cby: this.data.cby,
      lid: Number(value.lid),
    };
    this.ref.close(payload);
  }
}
