import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
import { UsersList } from '../../users/users-list/users-list';

export interface MastersPageTab {
  key: 'masters' | 'users';
  label: string;
  description: string;
}

export const MASTERS_PAGE_TABS: MastersPageTab[] = [
  {
    key: 'masters',
    label: 'Masters',
    description: 'Manage lookup data such as roles, genders and locations.',
  },
  {
    key: 'users',
    label: 'Users',
    description: 'Manage laboratory staff accounts and roles.',
  },
];

@Component({
  selector: 'app-masters-page',
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    UsersList,
  ],
  templateUrl: './masters-page.html',
  styleUrl: './masters-page.scss',
})
export class MastersPage {
  private readonly masterService = inject(MasterService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageTabs = MASTERS_PAGE_TABS;
  readonly masterTypes = MASTER_TYPES;
  readonly displayedColumns = ['id', 'cd', 'names', 'actions'];

  readonly selectedPageTab = signal<MastersPageTab['key']>('masters');
  readonly selectedType = signal(MASTER_TYPES[0].key);
  readonly items = signal<Master[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');

  readonly filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.items();
    if (!query) return list;
    return list.filter((item) =>
      [item.id, item.cd, item.names].some((value) =>
        String(value ?? '').toLowerCase().includes(query)
      )
    );
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'users' || tab === 'masters') {
        this.selectedPageTab.set(tab);
      }
    });
    this.load();
  }

  get activePageTab(): MastersPageTab {
    return (
      this.pageTabs.find((tab) => tab.key === this.selectedPageTab()) ?? this.pageTabs[0]
    );
  }

  get selectedLabel(): string {
    return this.masterTypes.find((t) => t.key === this.selectedType())?.label ?? '';
  }

  get singularLabel(): string {
    const label = this.selectedLabel;
    return label.endsWith('s') ? label.slice(0, -1) : label;
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onPageTabChange(key: string): void {
    if (!key || (key !== 'masters' && key !== 'users')) return;
    this.selectedPageTab.set(key);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: key === 'masters' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
    this.openDialog(null);
  }

  openEdit(item: Master): void {
    this.openDialog(item);
  }

  private openDialog(master: Master | null): void {
    const data: MasterDialogData = {
      master,
      tname: this.selectedType(),
      typeLabel: this.singularLabel,
      cby: this.auth.currentUser()?.uid ?? 0,
    };
    const ref = this.dialog.open(MasterDialog, { data, autoFocus: false });
    ref.afterClosed().subscribe((payload?: MasterUpsert) => {
      if (!payload) return;
      this.masterService.save(payload).subscribe({
        next: () => {
          this.snack.open(
            master
              ? `${this.singularLabel} updated successfully`
              : `${this.singularLabel} created successfully`,
            'OK',
            { duration: 3000 }
          );
          this.load();
        },
        error: () =>
          this.snack.open('Failed to save record', 'Dismiss', { duration: 4000 }),
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
