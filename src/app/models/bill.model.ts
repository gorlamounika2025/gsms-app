/** Bill line item (`billdetjson` entry). */
export interface BillLineItem {
  bdid: number;
  bid: number;
  tid: number;
  qty: number;
  price: number;
  tamount: number;
}

/** Payment line item (`paydetjson` entry). */
export interface BillPaymentItem {
  payid: number;
  bid: number;
  pmid: number;
  refno: string;
  paidamt: number;
  recby: number;
  card: string;
}

/** POST /bills payload. */
export interface BillUpsert {
  bid: number;
  bno: string;
  pid: number;
  vid: number;
  gamt: number;
  discount: number;
  tax: number;
  netamt: number;
  pamt: number;
  balamt: number;
  bs: string;
  billdetjson: BillLineItem[];
  paydetjson: BillPaymentItem[];
  cby: number;
  lid: number;
}
