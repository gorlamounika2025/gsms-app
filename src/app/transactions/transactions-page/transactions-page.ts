import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface TransactionTab {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
}

@Component({
  selector: 'app-transactions-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './transactions-page.html',
  styleUrl: './transactions-page.scss',
})
export class TransactionsPage {
  readonly tabs: TransactionTab[] = [
    {
      key: 'patients',
      label: 'Patients',
      subtitle: 'Register and search patient records.',
      icon: 'person_add',
    },
    {
      key: 'visits',
      label: 'Visits',
      subtitle: 'Capture check-ins, visit details and follow-up context.',
      icon: 'event_note',
    },
    {
      key: 'orders',
      label: 'Orders',
      subtitle: 'Create lab orders and manage requested investigations.',
      icon: 'assignment',
    },
    {
      key: 'payments',
      label: 'Payments',
      subtitle: 'Record invoices, receipts and pending balances.',
      icon: 'payments',
    },
    {
      key: 'sample_collection',
      label: 'Sample Collection',
      subtitle: 'Track specimen collection workflow and labels.',
      icon: 'vaccines',
    },
    {
      key: 'sample_sending',
      label: 'Sample Sending',
      subtitle: 'Log transfer batches from collection to processing.',
      icon: 'outbound',
    },
    {
      key: 'sample_receiving',
      label: 'Sample Receiving',
      subtitle: 'Confirm incoming samples and quantity checks.',
      icon: 'inventory_2',
    },
    {
      key: 'process',
      label: 'Process',
      subtitle: 'Monitor processing status and technician actions.',
      icon: 'settings_suggest',
    },
    {
      key: 'results',
      label: 'Results',
      subtitle: 'Capture, verify and review final test outcomes.',
      icon: 'fact_check',
    },
    {
      key: 'dispatch',
      label: 'Dispatch',
      subtitle: 'Release reports and maintain dispatch history.',
      icon: 'local_shipping',
    },
  ];

  readonly selectedTab = signal(this.tabs[0].key);
  readonly activeTab = computed(
    () => this.tabs.find((tab) => tab.key === this.selectedTab()) ?? this.tabs[0],
  );

  onTabChange(key: string): void {
    if (!key || key === this.selectedTab()) {
      return;
    }
    this.selectedTab.set(key);
  }
}
