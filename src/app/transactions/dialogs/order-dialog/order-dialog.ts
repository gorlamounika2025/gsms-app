import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderLineItem, OrderUpsert } from '../../../models/order.model';
import { TransactionRow } from '../../../models/transaction.model';
import { toUsDate } from '../../list-date-filters';

export interface OrderDialogData {
  row: TransactionRow | null;
  cby: number;
  lid: number;
}

@Component({
  selector: 'app-order-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './order-dialog.html',
  styles: [
    `
      .content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 8px;
        min-width: min(640px, 92vw);
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
        min-width: 140px;
      }
      .lines {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .line-card {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        padding: 12px;
      }
      .line-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font: var(--mat-sys-title-small);
      }
    `,
  ],
})
export class OrderDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<OrderDialog, OrderUpsert>);
  readonly data = inject<OrderDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.row !== null;

  readonly form = this.fb.nonNullable.group({
    ocd: [String(this.data.row?.['odno'] ?? '')],
    vid: [Number(this.data.row?.['vid'] ?? this.data.row?.['VisitId'] ?? 0), [Validators.required, Validators.min(1)]],
    oddt: [this.formatDate(this.data.row?.['oddt']), [Validators.required]],
    ptype: ['N', [Validators.required]],
    os: [String(this.data.row?.['odstatus'] ?? 'Orfered'), [Validators.required]],
    odby: [this.data.cby, [Validators.required]],
    rmks: [String(this.data.row?.['odremarks'] ?? '')],
    lines: this.fb.array([this.createLine()]),
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
    const oid = this.isEdit ? Number(this.data.row?.['odid'] ?? 0) : 0;
    const payload: OrderUpsert = {
      oid,
      ocd: value.ocd,
      vid: Number(value.vid),
      oddt: value.oddt,
      ptype: value.ptype,
      os: value.os,
      odby: Number(value.odby),
      rmks: value.rmks,
      ipjson: value.lines.map((line) => ({
        odid: 0,
        oid,
        tid: Number(line.tid),
        price: Number(line.price),
        cby: this.data.cby,
        lid: this.data.lid,
        qty: Number(line.qty),
        priority: line.priority,
      })),
      cby: this.data.cby,
      lid: this.data.lid,
    };
    this.ref.close(payload);
  }

  private createLine(item?: Partial<OrderLineItem>) {
    return this.fb.nonNullable.group({
      tid: [item?.tid ?? 1, [Validators.required, Validators.min(1)]],
      price: [item?.price ?? 0, [Validators.required, Validators.min(0)]],
      qty: [item?.qty ?? 1, [Validators.required, Validators.min(1)]],
      priority: [item?.priority ?? 'L', [Validators.required]],
    });
  }

  private formatDate(value: unknown): string {
    if (!value) return toUsDate(new Date());
    return toUsDate(value as string);
  }
}
