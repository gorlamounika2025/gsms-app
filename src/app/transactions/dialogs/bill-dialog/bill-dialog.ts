import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BillUpsert } from '../../../models/bill.model';
import { TransactionRow } from '../../../models/transaction.model';
import { toUsDate } from '../../list-date-filters';

export interface BillDialogData {
  row: TransactionRow | null;
  cby: number;
  lid: number;
}

@Component({
  selector: 'app-bill-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './bill-dialog.html',
  styles: [
    `
      .content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 8px;
        min-width: min(680px, 92vw);
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
        min-width: 130px;
      }
      .section-title {
        margin: 12px 0 4px;
        font: var(--mat-sys-title-small);
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
    `,
  ],
})
export class BillDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<BillDialog, BillUpsert>);
  readonly data = inject<BillDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.row !== null;

  readonly form = this.fb.nonNullable.group({
    bno: [String(this.data.row?.['BillNumber'] ?? '')],
    pid: [Number(this.data.row?.['PatientId'] ?? 0), [Validators.required, Validators.min(1)]],
    vid: [Number(this.data.row?.['VisitId'] ?? 0), [Validators.required, Validators.min(1)]],
    gamt: [Number(this.data.row?.['GrossAmount'] ?? 0), [Validators.required]],
    discount: [Number(this.data.row?.['DiscountAmount'] ?? 0)],
    tax: [Number(this.data.row?.['TaxAmount'] ?? 0)],
    netamt: [Number(this.data.row?.['NetAmount'] ?? 0), [Validators.required]],
    pamt: [Number(this.data.row?.['PaidAmount'] ?? 0)],
    balamt: [Number(this.data.row?.['BalanceAmount'] ?? 0)],
    bs: [String(this.data.row?.['BillStatus'] ?? 'Billed'), [Validators.required]],
    billLines: this.fb.array([this.createBillLine()]),
    payLines: this.fb.array([this.createPayLine()]),
  });

  get billLines(): FormArray {
    return this.form.controls.billLines;
  }

  get payLines(): FormArray {
    return this.form.controls.payLines;
  }

  addBillLine(): void {
    this.billLines.push(this.createBillLine());
  }

  removeBillLine(index: number): void {
    if (this.billLines.length === 1) return;
    this.billLines.removeAt(index);
  }

  addPayLine(): void {
    this.payLines.push(this.createPayLine());
  }

  removePayLine(index: number): void {
    if (this.payLines.length === 1) return;
    this.payLines.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const bid = this.isEdit ? Number(this.data.row?.['BillId'] ?? 0) : 0;
    const payload: BillUpsert = {
      bid,
      bno: value.bno,
      pid: Number(value.pid),
      vid: Number(value.vid),
      gamt: Number(value.gamt),
      discount: Number(value.discount),
      tax: Number(value.tax),
      netamt: Number(value.netamt),
      pamt: Number(value.pamt),
      balamt: Number(value.balamt),
      bs: value.bs,
      billdetjson: value.billLines.map((line) => ({
        bdid: 0,
        bid,
        tid: Number(line.tid),
        qty: Number(line.qty),
        price: Number(line.price),
        tamount: Number(line.tamount),
      })),
      paydetjson: value.payLines.map((line) => ({
        payid: 0,
        bid,
        pmid: Number(line.pmid),
        refno: line.refno,
        paidamt: Number(line.paidamt),
        recby: Number(line.recby),
        card: line.card,
      })),
      cby: this.data.cby,
      lid: this.data.lid,
    };
    this.ref.close(payload);
  }

  private createBillLine() {
    return this.fb.nonNullable.group({
      tid: [1, [Validators.required, Validators.min(1)]],
      qty: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      tamount: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private createPayLine() {
    return this.fb.nonNullable.group({
      pmid: [1, [Validators.required, Validators.min(1)]],
      refno: [''],
      paidamt: [0, [Validators.required, Validators.min(0)]],
      recby: [this.data.cby, [Validators.required]],
      card: [''],
    });
  }
}
