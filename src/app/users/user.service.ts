import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { User, UserListQuery, UserUpsert } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  list(query: UserListQuery): Observable<User[]> {
    return this.api.get<User[]>('users', { ...query });
  }

  getById(uid: number): Observable<User> {
    return this.api.get<User>(`users/${uid}`);
  }

  save(payload: UserUpsert): Observable<User> {
    return this.api.post<User>('users', payload);
  }

  remove(uids: number[]): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`users/${uids.join(',')}`);
  }
}
