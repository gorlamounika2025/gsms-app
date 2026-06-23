import { Component, effect, inject, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { mapResultDetailRow } from '../../models/result.model';
import { mapSampleDetailRow } from '../../models/sample.model';
import { getTransactionTab, TransactionRow } from '../../models/transaction.model';
import { ConfirmDialog, ConfirmData } from '../../shared/confirm-dialog/confirm-dialog';
import { BillDialog } from '../dialogs/bill-dialog/bill-dialog';
import { OrderDialog } from '../dialogs/order-dialog/order-dialog';
import { ResultDialog } from '../dialogs/result-dialog/result-dialog';
import { SampleDialog } from '../dialogs/sample-dialog/sample-dialog';
import { GsmsCrudService } from '../gsms-crud.service';
import {
  TransactionFormDialog,
  TransactionFormDialogData,
} from '../transaction-form-dialog/transaction-form-dialog';

@Component({
  selector: 'app-transaction-crud-panel',
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './transaction-crud-panel.html',
  styleUrl: '../transactions-page/transactions-page.scss',
})
export class TransactionCrudPanel {
  private readonly crud = inject(GsmsCrudService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly tabKey = input.required<string>();

  readonly rows = signal<TransactionRow[]>([]);
  readonly columns = signal<string[]>([]);
  readonly loading = signal(true);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly addLabel = signal('Add');
  readonly emptyIcon = signal('inbox');
  readonly emptyMessage = signal('No records found.');
  readonly apiMissing = signal(false);

  constructor() {
    effect(() => {
      const tab = getTransactionTab(this.tabKey());
      this.addLabel.set(tab.addLabel);
      this.emptyIcon.set(tab.icon);
      this.emptyMessage.set(
        tab.apiPath ? `No ${tab.label.toLowerCase()} found.` : 'API endpoint not documented yet.'
      );
      this.apiMissing.set(!tab.apiPath);
      this.columns.set(tab.displayColumns);
      this.pageIndex.set(0);
      this.load();
    });
  }

  displayedColumns(): string[] {
    return [...this.columns(), 'actions'];
  }

  canWrite(): boolean {
    return getTransactionTab(this.tabKey()).supportsWrite === true;
  }

  load(): void {
    const tab = getTransactionTab(this.tabKey());
    if (!tab.apiPath) {
      this.rows.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const pn = this.pageIndex() + 1;
    const ps = this.pageSize();
    const lid = this.auth.currentUser()?.lid ?? 1;

    this.crud.list(this.tabKey(), { lid, pn, ps }).subscribe({
      next: (list) => {
        const results = list ?? [];
        this.rows.set(results);
        if (results.length > 0) {
          this.columns.set(Object.keys(results[0]).filter((k) => !k.startsWith('_')));
        }
        const hasNext = results.length === ps;
        this.total.set(hasNext ? pn * ps + 1 : this.pageIndex() * ps + results.length);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
        this.snack.open('Failed to load records', 'Dismiss', { duration: 4000 });
      },
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  cellValue(row: TransactionRow, field: string): string {
    const value = row[field];
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  headerLabel(field: string): string {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(row: TransactionRow): void {
    const tab = getTransactionTab(this.tabKey());
    const id = row[tab.rowIdField] ?? row[tab.listIdField];
    if (
      tab.formType === 'sample' &&
      id !== null &&
      id !== undefined &&
      typeof id !== 'boolean'
    ) {
      this.crud.getDetails(tab.apiPath, id).subscribe({
        next: (details) =>
          this.openSampleDialog(row, (details ?? []).map((d) => mapSampleDetailRow(d))),
        error: () => this.openSampleDialog(row),
      });
      return;
    }
    if (
      tab.formType === 'result' &&
      id !== null &&
      id !== undefined &&
      typeof id !== 'boolean'
    ) {
      this.crud.getDetails(tab.apiPath, id).subscribe({
        next: (details) =>
          this.openResultDialog(row, (details ?? []).map((d) => mapResultDetailRow(d))),
        error: () => this.openResultDialog(row),
      });
      return;
    }
    this.openForm(row);
  }

  confirmDelete(row: TransactionRow): void {
    const tab = getTransactionTab(this.tabKey());
    if (!tab.apiPath) return;

    const id = row[tab.rowIdField] ?? row[tab.listIdField];
    if (id === null || id === undefined || typeof id === 'boolean') return;

    const data: ConfirmData = {
      title: `Delete ${tab.label.toLowerCase()}`,
      message: `Are you sure you want to delete record ${id}?`,
    };
    const ref = this.dialog.open(ConfirmDialog, { data });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.crud.remove(this.tabKey(), id).subscribe({
        next: () => {
          this.snack.open('Record deleted successfully', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snack.open('Failed to delete record', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  private openForm(row: TransactionRow | null): void {
    const tab = getTransactionTab(this.tabKey());
    const ctx = {
      row,
      cby: this.auth.currentUser()?.uid ?? 0,
      lid: this.auth.currentUser()?.lid ?? 1,
    };

    let ref: MatDialogRef<unknown, unknown>;
    switch (tab.formType) {
      case 'order':
        ref = this.dialog.open(OrderDialog, { data: ctx, autoFocus: false });
        break;
      case 'bill':
        ref = this.dialog.open(BillDialog, { data: ctx, autoFocus: false });
        break;
      case 'sample':
        this.openSampleDialog(row);
        return;
      case 'result':
        this.openResultDialog(row);
        return;
      default:
        ref = this.dialog.open(TransactionFormDialog, {
          data: {
            tabKey: tab.key,
            tabLabel: tab.label,
            listIdField: tab.listIdField,
            rowIdField: tab.rowIdField,
            row,
            cby: ctx.cby,
            lid: ctx.lid,
          } satisfies TransactionFormDialogData,
          autoFocus: false,
        });
    }

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.savePayload(row, payload);
    });
  }

  private openSampleDialog(
    row: TransactionRow | null,
    lines?: ReturnType<typeof mapSampleDetailRow>[]
  ): void {
    const tab = getTransactionTab(this.tabKey());
    const ref = this.dialog.open(SampleDialog, {
      data: {
        row,
        lines,
        defaultSs: tab.defaultSampleStatus,
        cby: this.auth.currentUser()?.uid ?? 0,
        lid: this.auth.currentUser()?.lid ?? 1,
      },
      autoFocus: false,
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.savePayload(row, payload);
    });
  }

  private openResultDialog(
    row: TransactionRow | null,
    lines?: ReturnType<typeof mapResultDetailRow>[]
  ): void {
    const ref = this.dialog.open(ResultDialog, {
      data: {
        row,
        lines,
        cby: this.auth.currentUser()?.uid ?? 0,
        lid: this.auth.currentUser()?.lid ?? 1,
      },
      autoFocus: false,
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.savePayload(row, payload);
    });
  }

  private savePayload(row: TransactionRow | null, payload: unknown): void {
    this.crud.save(this.tabKey(), payload).subscribe({
      next: () => {
        this.snack.open(row ? 'Record updated successfully' : 'Record created successfully', 'OK', {
          duration: 3000,
        });
        this.load();
      },
      error: () => this.snack.open('Failed to save record', 'Dismiss', { duration: 4000 }),
    });
  }
}
