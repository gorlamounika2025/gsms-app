import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { getTransactionTab, TransactionRow } from '../../models/transaction.model';
import { toUsDate } from '../list-date-filters';

export interface TransactionFormDialogData {
  tabKey: string;
  tabLabel: string;
  listIdField: string;
  rowIdField: string;
  row: TransactionRow | null;
  cby: number;
  lid: number;
}

@Component({
  selector: 'app-transaction-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './transaction-form-dialog.html',
  styles: [
    `
      .content {
        display: flex;
        flex-direction: column;
        padding-top: 8px;
        min-width: min(420px, 80vw);
        gap: 4px;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class TransactionFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<TransactionFormDialog, TransactionRow>);
  readonly data = inject<TransactionFormDialogData>(MAT_DIALOG_DATA);

  readonly tab = getTransactionTab(this.data.tabKey);
  readonly isEdit = this.data.row !== null;
  readonly fields = this.tab.writeFields ?? [];

  readonly form = this.fb.group(
    Object.fromEntries(
      this.fields.map((field) => [field, [this.valueForField(field), this.validatorsFor(field)]])
    )
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue() as Record<string, string>;
    const payload: TransactionRow = {
      [this.data.listIdField]: this.isEdit
        ? Number(this.data.row?.[this.data.rowIdField] ?? this.data.row?.[this.data.listIdField] ?? 0)
        : 0,
      cby: this.data.cby,
    };

    for (const field of this.fields) {
      const value = raw[field]?.trim?.() ?? raw[field];
      if (value === '' || value === undefined) continue;
      payload[field] = ['age', 'bgid', 'aid', 'nid', 'pid', 'did', 'lid'].includes(field)
        ? Number(value)
        : value;
    }

    if (this.data.tabKey === 'visits' && typeof payload['vdt'] === 'string') {
      payload['vdt'] = toUsDate(payload['vdt']);
    }
    if (this.data.tabKey === 'patients' && typeof payload['dob'] === 'string') {
      payload['dob'] = toUsDate(payload['dob']);
    }

    if (!payload['lid']) payload['lid'] = this.data.lid;
    this.ref.close(payload);
  }

  private valueForField(field: string): string | number {
    if (this.data.row) {
      const fromRow = this.rowValue(field);
      if (fromRow !== null && fromRow !== undefined) return fromRow as string | number;
    }
    if (field === 'lid') return this.data.lid;
    if (field === 'vdt' && this.data.tabKey === 'visits') return toUsDate(new Date());
    if (field === 'dob') return '1/1/1990';
    return '';
  }

  private rowValue(field: string): string | number | boolean | null | undefined {
    const row = this.data.row;
    if (!row) return undefined;

    if (this.data.tabKey === 'visits') {
      const aliases: Record<string, string> = {
        vno: 'VisitNumber',
        pid: 'PatientId',
        did: 'DoctorId',
        vdt: 'VisitDate',
        vtyp: 'VisitType',
        rmks: 'Remarks',
        diag: 'Diagnosis',
        note: 'ClinicalNotes',
      };
      const apiField = aliases[field];
      if (apiField && row[apiField] !== undefined) {
        if (field === 'vdt') return toUsDate(row[apiField] as string);
        return row[apiField] as string | number;
      }
    }

    return row[field];
  }

  private isOptionalField(field: string): boolean {
    const optional = new Set(['lid', 'age', 'bgid', 'aid', 'nid', 'pcd', 'addr2', 'econtact']);
    if (this.data.tabKey === 'visits') {
      ['vno', 'rmks', 'diag', 'note'].forEach((f) => optional.add(f));
    }
    if (this.data.tabKey === 'patients') {
      ['pcd', 'addr2', 'econtact'].forEach((f) => optional.add(f));
    }
    return optional.has(field);
  }

  private validatorsFor(field: string) {
    if (this.isOptionalField(field)) return [];
    if (this.data.tabKey === 'visits' && (field === 'pid' || field === 'did')) {
      return [Validators.required, Validators.min(1)];
    }
    return [Validators.required];
  }
}
