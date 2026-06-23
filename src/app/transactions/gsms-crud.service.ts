import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import {
  TransactionListQuery,
  TransactionRow,
  TransactionTab,
  getTransactionTab,
} from '../models/transaction.model';
import { withListDateFilters } from './list-date-filters';

/** CRUD access to GSMS transaction API resources (see API documentation). */
@Injectable({ providedIn: 'root' })
export class GsmsCrudService {
  private readonly api = inject(ApiService);

  list(tabKey: string, query: TransactionListQuery): Observable<TransactionRow[]> {
    const tab = getTransactionTab(tabKey);
    if (!tab.apiPath) {
      return of([]);
    }
    return this.listForTab(tab, query);
  }

  listForTab(tab: TransactionTab, query: TransactionListQuery): Observable<TransactionRow[]> {
    const params: Record<string, string | number> = {
      [tab.listIdField]: 0,
      lid: query.lid,
      pn: query.pn,
      ps: query.ps,
      ...withListDateFilters(tab.apiPath, tab.listFilters),
    };
    return this.api.get<TransactionRow[]>(tab.apiPath, params);
  }

  /** GET /samples/{id} or /results/{id} line-item details. */
  getDetails(apiPath: string, id: string | number): Observable<TransactionRow[]> {
    return this.api.get<TransactionRow[]>(`${apiPath}/${id}`);
  }

  save(tabKey: string, payload: unknown): Observable<unknown> {
    const tab = getTransactionTab(tabKey);
    return this.api.post(tab.apiPath, payload);
  }

  remove(tabKey: string, id: number | string): Observable<{ message: string }> {
    const tab = getTransactionTab(tabKey);
    const suffix = tab.deleteSuffix ? `,${tab.deleteSuffix}` : '';
    return this.api.delete<{ message: string }>(`${tab.apiPath}/${id}${suffix}`);
  }
}
