import { Component, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TRANSACTION_TABS } from '../../models/transaction.model';
import { TransactionCrudPanel } from '../transaction-crud-panel/transaction-crud-panel';

@Component({
  selector: 'app-transactions-page',
  imports: [MatButtonToggleModule, TransactionCrudPanel],
  templateUrl: './transactions-page.html',
  styleUrl: './transactions-page.scss',
})
export class TransactionsPage {
  readonly transactionTabs = TRANSACTION_TABS;
  readonly selectedTab = signal(TRANSACTION_TABS[0].key);

  get activeTab() {
    return this.transactionTabs.find((tab) => tab.key === this.selectedTab()) ?? this.transactionTabs[0];
  }

  onTabChange(key: string): void {
    if (!key) return;
    this.selectedTab.set(key);
  }
}
