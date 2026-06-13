import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MasterUpsert } from '../../models/master.model';

export interface MasterDialogData {
  tname: string;
  typeLabel: string;
  cby: number;
}

@Component({
  selector: 'app-master-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Add {{ data.typeLabel }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Code (optional)</mat-label>
          <input matInput formControlName="cd" maxlength="10" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="undefined">Cancel</button>
        <button mat-flat-button color="primary" type="submit">Create</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .content {
        display: flex;
        flex-direction: column;
        padding-top: 8px;
        min-width: min(360px, 80vw);
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class MasterDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<MasterDialog, MasterUpsert>);
  readonly data = inject<MasterDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    cd: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: MasterUpsert = {
      mid: 0,
      cd: value.cd.trim(),
      name: value.name.trim(),
      tname: this.data.tname,
      cby: this.data.cby,
    };
    this.ref.close(payload);
  }
}
