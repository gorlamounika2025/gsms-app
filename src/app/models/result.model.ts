/** Result line item (`ipjson` entry). */
export interface ResultLineItem {
  rid: number;
  pdid: number;
  pid: number;
  tid: number;
  bcode: string;
  rslt: string;
  nrange: string;
  rsltflag: string;
  rsltrmks: string;
  rsltstatus: string;
}

/** POST /results payload. */
export interface ResultUpsert {
  rid: number;
  rno: string;
  sid: number;
  patid: number;
  rmks: string;
  eby: number;
  vby: number;
  isver: string;
  appby: number;
  isapp: string;
  rs: string;
  ipjson: ResultLineItem[];
  cby: number;
  lid: number;
}

/** GET /results/{id} detail row mapped back to line item fields. */
export function mapResultDetailRow(row: Record<string, unknown>): ResultLineItem {
  return {
    rid: Number(row['rid'] ?? 0),
    pdid: Number(row['pdid'] ?? 0),
    pid: Number(row['pid'] ?? 0),
    tid: Number(row['tid'] ?? 0),
    bcode: String(row['bcode'] ?? ''),
    rslt: String(row['rsltval'] ?? ''),
    nrange: String(row['nrange'] ?? ''),
    rsltflag: 'N',
    rsltrmks: String(row['rc'] ?? ''),
    rsltstatus: String(row['rs'] ?? ''),
  };
}
