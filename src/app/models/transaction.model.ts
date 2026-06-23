/**
 * GSMS transaction tabs mapped to API documentation:
 * https://docs.google.com/document/d/1AvJh5vhZAUFl-X7ZmR0q1P-LNE_bHglti1AyOAFn-4k
 */

/** Shared pagination/filter query sent to the GSMS API via the local proxy. */
export interface TransactionListQuery {
  lid: number;
  pn: number;
  ps: number;
}

export type TransactionRow = Record<string, string | number | boolean | null | undefined>;

/** A selectable transaction tab on the Transactions page. */
export interface TransactionTab {
  key: string;
  label: string;
  icon: string;
  description: string;
  /** GSMS API resource (`GET/POST/DELETE /api/{apiPath}`). */
  apiPath: string;
  /** Primary key field used in GET list request body (`0` = list all). */
  listIdField: string;
  /** Field on list rows used for edit/delete actions. */
  rowIdField: string;
  /** Optional DELETE suffix, e.g. `sample` → `samples/1,sample`. */
  deleteSuffix?: string;
  addLabel: string;
  /** Columns shown when the list is empty (from API response shape). */
  displayColumns: string[];
  /** Default GET list filters documented for this resource. */
  listFilters?: Record<string, string | number>;
  /** POST body fields for simple create/update forms (patients, visits). */
  writeFields?: string[];
  /** Dedicated nested JSON form type per API documentation. */
  formType?: 'simple' | 'order' | 'bill' | 'sample' | 'result';
  /** Default sample status when opening the sample form. */
  defaultSampleStatus?: string;
  supportsWrite?: boolean;
}

export const TRANSACTION_TABS: TransactionTab[] = [
  {
    key: 'patients',
    label: 'Patients',
    icon: 'personal_injury',
    description: 'Register and manage patient demographics and identifiers.',
    apiPath: 'patients',
    listIdField: 'pid',
    rowIdField: 'pid',
    addLabel: 'Add Patient',
    displayColumns: ['pid', 'pcd', 'fname', 'sex', 'age', 'mb', 'email'],
    listFilters: { pname: '', mob: '' },
    writeFields: [
      'pcd',
      'fname',
      'lname',
      'fullname',
      'sex',
      'dob',
      'age',
      'bgid',
      'mob',
      'mail',
      'addr1',
      'addr2',
      'aid',
      'econtact',
      'nid',
      'lid',
    ],
    formType: 'simple',
    supportsWrite: true,
  },
  {
    key: 'visits',
    label: 'Visits',
    icon: 'event_available',
    description: 'Track patient visits, referring doctors and visit status.',
    apiPath: 'visits',
    listIdField: 'vid',
    rowIdField: 'VisitId',
    addLabel: 'New Visit',
    displayColumns: ['VisitId', 'VisitNumber', 'PatientId', 'DoctorId', 'VisitDate', 'VisitType'],
    listFilters: {},
    writeFields: ['vno', 'pid', 'did', 'vdt', 'vtyp', 'rmks', 'diag', 'note', 'lid'],
    formType: 'simple',
    supportsWrite: true,
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: 'assignment',
    description: 'Create and review laboratory test orders for each visit.',
    apiPath: 'orders',
    listIdField: 'id',
    rowIdField: 'odid',
    addLabel: 'Create Order',
    displayColumns: ['odid', 'odno', 'oddt', 'fname', 'sex', 'mb', 'odstatus'],
    listFilters: {},
    formType: 'order',
    supportsWrite: true,
  },
  {
    key: 'receipts',
    label: 'Receipts',
    icon: 'payments',
    description: 'Record billing, receipts and payment details.',
    apiPath: 'bills',
    listIdField: 'bid',
    rowIdField: 'BillId',
    addLabel: 'Create Receipt',
    displayColumns: ['BillId', 'BillNumber', 'fname', 'NetAmount', 'PaidAmount', 'BillStatus'],
    listFilters: { pcd: '', pname: '', mb: '' },
    formType: 'bill',
    supportsWrite: true,
  },
  {
    key: 'sample-collection',
    label: 'Sample collection',
    icon: 'bloodtype',
    description: 'Log sample collection details at the collection centre.',
    apiPath: 'samples',
    listIdField: 'sid',
    rowIdField: 'smid',
    deleteSuffix: 'sample',
    addLabel: 'Log Collection',
    displayColumns: ['smid', 'smno', 'fname', 'pcd', 'colldt', 'ss'],
    listFilters: { sno: '', pcd: '', pname: '', mb: '' },
    formType: 'sample',
    defaultSampleStatus: 'S',
    supportsWrite: true,
  },
  {
    key: 'sample-send-receive',
    label: 'Sample send/receive',
    icon: 'local_shipping',
    description: 'Track outbound and inbound sample batches.',
    apiPath: 'samples',
    listIdField: 'sid',
    rowIdField: 'smid',
    deleteSuffix: 'sample',
    addLabel: 'Update Sample',
    displayColumns: ['smid', 'smno', 'fname', 'pcd', 'colldt', 'ss'],
    listFilters: { sno: '', pcd: '', pname: '', mb: '' },
    formType: 'sample',
    defaultSampleStatus: 'R',
    supportsWrite: true,
  },
  {
    key: 'results',
    label: 'Results',
    icon: 'lab_profile',
    description: 'Enter, validate and review test results.',
    apiPath: 'results',
    listIdField: 'rid',
    rowIdField: 'resultid',
    deleteSuffix: 'result',
    addLabel: 'Enter Results',
    displayColumns: ['resultid', 'resultno', 'fname', 'pcd', 'resultstatus', 'isverified'],
    listFilters: { sno: '', pcd: '', pname: '', mb: '' },
    formType: 'result',
    supportsWrite: true,
  },
  {
    key: 'dispatch',
    label: 'Dispatch',
    icon: 'send',
    description: 'Release finalized reports to patients and referrers.',
    apiPath: '',
    listIdField: 'id',
    rowIdField: 'id',
    addLabel: 'Dispatch Report',
    displayColumns: ['id', 'patient', 'report', 'channel', 'date'],
    supportsWrite: false,
  },
];

export function getTransactionTab(key: string): TransactionTab {
  return TRANSACTION_TABS.find((tab) => tab.key === key) ?? TRANSACTION_TABS[0];
}
