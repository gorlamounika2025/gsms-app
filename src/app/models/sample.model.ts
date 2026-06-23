/** Sample line item (`ipjson` entry). */
export interface SampleLineItem {
  smdetid: number;
  bcode: string;
  smid: number;
  tid: number;
  smtid: number;
  spctid: number;
  ctypeid: number;
  ttid: number;
  volcoll: number;
  uid: number;
  noofcont: number;
  csid: number;
  ss: string;
  rmks: string;
}

/** POST /samples payload. */
export interface SampleUpsert {
  sid: number;
  sno: string;
  bid: number;
  pid: number;
  cdt: string;
  diffcoll: string;
  repcoll: string;
  recollreason: string;
  fs: string;
  ss: string;
  rmks: string;
  ipjson: SampleLineItem[];
  cby: number;
  lid: number;
}

/** GET /samples/{id} detail row mapped back to line item fields. */
export function mapSampleDetailRow(row: Record<string, unknown>): SampleLineItem {
  return {
    smdetid: Number(row['sdid'] ?? 0),
    bcode: String(row['bcode'] ?? ''),
    smid: Number(row['sid'] ?? 0),
    tid: Number(row['tid'] ?? 0),
    smtid: Number(row['stid'] ?? 1),
    spctid: Number(row['spectid'] ?? 1),
    ctypeid: Number(row['ctid'] ?? 1),
    ttid: Number(row['ttid'] ?? 1),
    volcoll: Number(row['volcoll'] ?? 0),
    uid: Number(row['uid'] ?? 1),
    noofcont: Number(row['noofcont'] ?? 1),
    csid: Number(row['csid'] ?? 1),
    ss: String(row['ss'] ?? ''),
    rmks: String(row['rmks'] ?? ''),
  };
}
