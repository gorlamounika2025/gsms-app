/** Order line item (`ipjson` entry) per GSMS API documentation. */
export interface OrderLineItem {
  odid: number;
  oid: number;
  tid: number;
  price: number;
  cby: number;
  lid: number;
  qty: number;
  priority: string;
}

/** POST /orders payload. */
export interface OrderUpsert {
  oid: number;
  ocd: string;
  vid: number;
  oddt: string;
  ptype: string;
  os: string;
  odby: number;
  rmks: string;
  ipjson: OrderLineItem[];
  cby: number;
  lid: number;
}
