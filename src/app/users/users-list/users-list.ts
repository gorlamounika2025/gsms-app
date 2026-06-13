import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';
import { UserService } from '../user.service';
import { MasterService } from '../../masters/master.service';
import { User, UserUpsert } from '../../models/user.model';
import { Master } from '../../models/master.model';
import { UserDialog, UserDialogData } from '../user-dialog/user-dialog';
import { ConfirmDialog, ConfirmData } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-users-list',
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList {
  private readonly userService = inject(UserService);
  private readonly masterService = inject(MasterService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly displayedColumns = ['uid', 'fname', 'uname', 'mail', 'mob', 'role', 'actions'];
  readonly users = signal<User[]>([]);
  readonly roles = signal<Master[]>([]);
  readonly loading = signal(true);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly total = signal(0);

  constructor() {
    this.loadRoles();
    this.loadUsers();
  }

  private loadRoles(): void {
    this.masterService.list('role').subscribe((roles) => this.roles.set(roles ?? []));
  }

  roleName(rid: number | null | undefined): string {
    const role = this.roles().find((r) => Number(r.id) === Number(rid));
    return role?.names ?? '—';
  }

  loadUsers(): void {
    this.loading.set(true);
    const pn = this.pageIndex() + 1;
    const ps = this.pageSize();
    this.userService.list({ uid: 0, lid: 1, pn, ps }).subscribe({
      next: (list) => {
        const results = list ?? [];
        this.users.set(results);
        const hasNext = results.length === ps;
        this.total.set(
          hasNext ? pn * ps + 1 : this.pageIndex() * ps + results.length
        );
        this.loading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loading.set(false);
        this.snack.open('Failed to load users', 'Dismiss', { duration: 4000 });
      },
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(user: User): void {
    this.openDialog(user);
  }

  private openDialog(user: User | null): void {
    const data: UserDialogData = {
      user,
      roles: this.roles(),
      cby: this.auth.currentUser()?.uid ?? 0,
    };
    const ref = this.dialog.open(UserDialog, { data, autoFocus: false });
    ref.afterClosed().subscribe((payload?: UserUpsert) => {
      if (!payload) return;
      this.userService.save(payload).subscribe({
        next: () => {
          this.snack.open(
            user ? 'User updated successfully' : 'User created successfully',
            'OK',
            { duration: 3000 }
          );
          this.loadUsers();
        },
        error: () =>
          this.snack.open('Failed to save user', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  confirmDelete(user: User): void {
    const data: ConfirmData = {
      title: 'Delete user',
      message: `Are you sure you want to delete "${user.fname}"? This action cannot be undone.`,
    };
    const ref = this.dialog.open(ConfirmDialog, { data });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.userService.remove([user.uid]).subscribe({
        next: () => {
          this.snack.open('User deleted successfully', 'OK', { duration: 3000 });
          this.loadUsers();
        },
        error: () =>
          this.snack.open('Failed to delete user', 'Dismiss', { duration: 4000 }),
      });
    });
  }
}
