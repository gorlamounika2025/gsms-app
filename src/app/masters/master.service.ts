import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Master, MasterUpsert } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class MasterService {
  private readonly api = inject(ApiService);

  list(tname: string): Observable<Master[]> {
    return this.api.get<Master[]>('masters', { tname });
  }

  create(payload: MasterUpsert): Observable<{ id: number }> {
    return this.api.post<{ id: number }>('masters', payload);
  }

  remove(tname: string, id: number): Observable<{ id: number }> {
    return this.api.delete<{ id: number }>(`masters/${tname},${id}`);
  }
}
