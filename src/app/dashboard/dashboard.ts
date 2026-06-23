import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../core/auth.service';
import { UserService } from '../users/user.service';
import { MasterService } from '../masters/master.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly masterService = inject(MasterService);

  readonly currentUser = this.auth.currentUser;
  readonly loading = signal(true);
  readonly stats = signal<StatCard[]>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      users: this.userService.list({ uid: 0, lid: 1, pn: 1, ps: 1000 }),
      roles: this.masterService.list('role'),
      genders: this.masterService.list('sex'),
    }).subscribe({
      next: ({ users, roles, genders }) => {
        this.stats.set([
          { label: 'Users', value: users?.length ?? 0, icon: 'group', tone: 'tone-primary' },
          { label: 'Roles', value: roles?.length ?? 0, icon: 'badge', tone: 'tone-tertiary' },
          { label: 'Genders', value: genders?.length ?? 0, icon: 'wc', tone: 'tone-secondary' },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.stats.set([
          { label: 'Users', value: 0, icon: 'group', tone: 'tone-primary' },
          { label: 'Roles', value: 0, icon: 'badge', tone: 'tone-tertiary' },
          { label: 'Genders', value: 0, icon: 'wc', tone: 'tone-secondary' },
        ]);
        this.loading.set(false);
      },
    });
  }
}
