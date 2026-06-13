import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { MasterService } from '../master.service';
import { Master, MASTER_TYPES, MasterUpsert } from '../../models/master.model';
import { MasterDialog, MasterDialogData } from '../master-dialog/master-dialog';
import { ConfirmDialog, ConfirmData } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-masters-page',
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './masters-page.html',
  styleUrl: './masters-page.scss',
})
export class MastersPage {
  private readonly masterService = inject(MasterService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly masterTypes = MASTER_TYPES;
  readonly displayedColumns = ['id', 'cd', 'names', 'actions'];

  readonly selectedType = signal(MASTER_TYPES[0].key);
  readonly items = signal<Master[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.load();
  }

  get selectedLabel(): string {
    return this.masterTypes.find((t) => t.key === this.selectedType())?.label ?? '';
  }

  get singularLabel(): string {
    const label = this.selectedLabel;
    return label.endsWith('s') ? label.slice(0, -1) : label;
  }

  onTypeChange(key: string): void {
    if (!key) return;
    this.selectedType.set(key);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.masterService.list(this.selectedType()).subscribe({
      next: (list) => {
        // The API filters by `tname`; keep only rows matching the selected type.
        const tname = this.selectedType();
        this.items.set((list ?? []).filter((m) => m.tname === tname));
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
        this.snack.open('Failed to load records', 'Dismiss', { duration: 4000 });
      },
    });
  }

  openCreate(): void {
    const data: MasterDialogData = {
      tname: this.selectedType(),
      typeLabel: this.singularLabel,
      cby: this.auth.currentUser()?.uid ?? 0,
    };
    const ref = this.dialog.open(MasterDialog, { data, autoFocus: false });
    ref.afterClosed().subscribe((payload?: MasterUpsert) => {
      if (!payload) return;
      this.masterService.create(payload).subscribe({
        next: () => {
          this.snack.open(`${this.singularLabel} created successfully`, 'OK', {
            duration: 3000,
          });
          this.load();
        },
        error: () =>
          this.snack.open('Failed to create record', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  confirmDelete(item: Master): void {
    const data: ConfirmData = {
      title: `Delete ${this.singularLabel.toLowerCase()}`,
      message: `Are you sure you want to delete "${item.names}"?`,
    };
    const ref = this.dialog.open(ConfirmDialog, { data });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.masterService.remove(item.tname, Number(item.id)).subscribe({
        next: () => {
          this.snack.open('Record deleted successfully', 'OK', { duration: 3000 });
          this.load();
        },
        error: () =>
          this.snack.open('Failed to delete record', 'Dismiss', { duration: 4000 }),
      });
    });
  }
}
