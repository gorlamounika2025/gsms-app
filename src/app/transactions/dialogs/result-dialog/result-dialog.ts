import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResultLineItem, ResultUpsert } from '../../../models/result.model';
import { TransactionRow } from '../../../models/transaction.model';

export interface ResultDialogData {
  row: TransactionRow | null;
  lines?: ResultLineItem[];
  cby: number;
  lid: number;
}

@Component({
  selector: 'app-result-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './result-dialog.html',
  styles: [
    `
      .content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 8px;
        min-width: min(720px, 92vw);
        max-height: 70vh;
        overflow-y: auto;
      }
      .row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .row mat-form-field {
        flex: 1;
        min-width: 120px;
      }
      .line-card {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
      }
      .line-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .section-title {
        margin-top: 8px;
        font: var(--mat-sys-title-small);
      }
    `,
  ],
})
export class ResultDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<ResultDialog, ResultUpsert>);
  readonly data = inject<ResultDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.row !== null;
  private readonly initialLines = this.data.lines?.length ? this.data.lines : [undefined];

  readonly form = this.fb.nonNullable.group({
    rno: [String(this.data.row?.['resultno'] ?? '')],
    sid: [Number(this.data.row?.['sampleid'] ?? 0), [Validators.required, Validators.min(1)]],
    patid: [Number(this.data.row?.['patientid'] ?? 0), [Validators.required, Validators.min(1)]],
    rmks: [String(this.data.row?.['resultcomments'] ?? '')],
    eby: [this.data.cby, [Validators.required]],
    vby: [0],
    isver: ['N'],
    appby: [0],
    isapp: ['N'],
    rs: [String(this.data.row?.['resultstatus'] ?? 'Result Processing'), [Validators.required]],
    lines: this.fb.array(this.initialLines.map((line) => this.createLine(line))),
  });

  get lines(): FormArray {
    return this.form.controls.lines;
  }

  addLine(): void {
    this.lines.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) return;
    this.lines.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const rid = this.isEdit ? Number(this.data.row?.['resultid'] ?? 0) : 0;
    const payload: ResultUpsert = {
      rid,
      rno: value.rno,
      sid: Number(value.sid),
      patid: Number(value.patid),
      rmks: value.rmks,
      eby: Number(value.eby),
      vby: Number(value.vby),
      isver: value.isver,
      appby: Number(value.appby),
      isapp: value.isapp,
      rs: value.rs,
      ipjson: value.lines.map((line) => ({
        rid,
        pdid: Number(line.pdid),
        pid: Number(line.pid),
        tid: Number(line.tid),
        bcode: line.bcode,
        rslt: line.rslt,
        nrange: line.nrange,
        rsltflag: line.rsltflag,
        rsltrmks: line.rsltrmks,
        rsltstatus: line.rsltstatus,
      })),
      cby: this.data.cby,
      lid: this.data.lid,
    };
    this.ref.close(payload);
  }

  private createLine(item?: Partial<ResultLineItem>) {
    return this.fb.nonNullable.group({
      pdid: [item?.pdid ?? 1],
      pid: [item?.pid ?? 1],
      tid: [item?.tid ?? 1, [Validators.required, Validators.min(1)]],
      bcode: [item?.bcode ?? ''],
      rslt: [item?.rslt ?? '', [Validators.required]],
      nrange: [item?.nrange ?? ''],
      rsltflag: [item?.rsltflag ?? 'N'],
      rsltrmks: [item?.rsltrmks ?? ''],
      rsltstatus: [item?.rsltstatus ?? 'Result Processed'],
    });
  }
}
