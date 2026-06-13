import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

const STORAGE_KEY = 'gsms.currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _currentUser = signal<User | null>(this.restore());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  private restore(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  /**
   * Authenticate against `POST /users`. The API returns the user object on
   * success and an empty body (no `uid`) on invalid credentials.
   */
  login(uname: string, pcode: string): Observable<User> {
    return this.api.post<User | null>('users', { uname, pcode }).pipe(
      map((user) => {
        if (!user || typeof user.uid !== 'number') {
          throw new Error('Invalid username or password');
        }
        this._currentUser.set(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}
