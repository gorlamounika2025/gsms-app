import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly sidenav = viewChild<MatSidenav>('sidenav');

  readonly isMobile = signal(false);

  readonly currentUser = this.auth.currentUser;
  readonly userInitial = computed(() => {
    const name = this.currentUser()?.fname ?? '?';
    return name.charAt(0).toUpperCase();
  });

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Users', icon: 'group', route: '/users' },
    { label: 'Masters', icon: 'list_alt', route: '/masters' },
  ];

  constructor() {
    this.breakpoints
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((state) => this.isMobile.set(state.matches));
  }

  onNavigate(): void {
    if (this.isMobile()) {
      this.sidenav()?.close();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
