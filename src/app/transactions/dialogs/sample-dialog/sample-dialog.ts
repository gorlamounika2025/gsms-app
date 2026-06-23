import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SampleLineItem, SampleUpsert } from '../../../models/sample.model';
import { TransactionRow } from '../../../models/transaction.model';
import { toUsDate } from '../../list-date-filters';

export interface SampleDialogData {
  row: TransactionRow | null;
  lines?: SampleLineItem[];
  defaultSs?: string;
  cby: number;
  lid: number;
}

@Component({
  selector: 'app-sample-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './sample-dialog.html',
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
export class SampleDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<SampleDialog, SampleUpsert>);
  readonly data = inject<SampleDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.row !== null;
  private readonly initialLines = this.data.lines?.length ? this.data.lines : [undefined];

  readonly form = this.fb.nonNullable.group({
    sno: [String(this.data.row?.['smno'] ?? '')],
    bid: [Number(this.data.row?.['bid'] ?? 0), [Validators.required, Validators.min(1)]],
    pid: [Number(this.data.row?.['pid'] ?? 0), [Validators.required, Validators.min(1)]],
    cdt: [this.formatDate(this.data.row?.['colldt']), [Validators.required]],
    diffcoll: ['N'],
    repcoll: ['N'],
    recollreason: [''],
    fs: ['Y'],
    ss: [this.data.defaultSs ?? String(this.data.row?.['ss'] ?? 'S'), [Validators.required]],
    rmks: [String(this.data.row?.['rmks'] ?? '')],
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
    const sid = this.isEdit ? Number(this.data.row?.['smid'] ?? this.data.row?.['sid'] ?? 0) : 0;
    const payload: SampleUpsert = {
      sid,
      sno: value.sno,
      bid: Number(value.bid),
      pid: Number(value.pid),
      cdt: value.cdt,
      diffcoll: value.diffcoll,
      repcoll: value.repcoll,
      recollreason: value.recollreason,
      fs: value.fs,
      ss: value.ss,
      rmks: value.rmks,
      ipjson: value.lines.map((line) => ({
        smdetid: 0,
        bcode: line.bcode,
        smid: sid,
        tid: Number(line.tid),
        smtid: Number(line.smtid),
        spctid: Number(line.spctid),
        ctypeid: Number(line.ctypeid),
        ttid: Number(line.ttid),
        volcoll: Number(line.volcoll),
        uid: Number(line.uid),
        noofcont: Number(line.noofcont),
        csid: Number(line.csid),
        ss: line.lineSs,
        rmks: line.lineRmks,
      })),
      cby: this.data.cby,
      lid: this.data.lid,
    };
    this.ref.close(payload);
  }

  private createLine(item?: Partial<SampleLineItem>) {
    return this.fb.nonNullable.group({
      bcode: [item?.bcode ?? ''],
      tid: [item?.tid ?? 1, [Validators.required, Validators.min(1)]],
      smtid: [item?.smtid ?? 1],
      spctid: [item?.spctid ?? 1],
      ctypeid: [item?.ctypeid ?? 1],
      ttid: [item?.ttid ?? 1],
      volcoll: [item?.volcoll ?? 5],
      uid: [item?.uid ?? 1],
      noofcont: [item?.noofcont ?? 1],
      csid: [item?.csid ?? 1],
      lineSs: [item?.ss ?? ''],
      lineRmks: [item?.rmks ?? ''],
    });
  }

  private formatDate(value: unknown): string {
    if (!value) return toUsDate(new Date());
    return toUsDate(value as string);
  }
}
