/** User as returned by the GSMS API (login / list / get). */
export interface User {
  uid: number;
  fname: string;
  uname: string;
  pcode: string;
  mail?: string | null;
  mob?: string | null;
  rid: number;
  rs?: string | null;
  cby?: number | null;
  cdt?: string | null;
  mby?: number | null;
  mdt?: string | null;
  lid?: number | null;
  lname?: string | null;
}

/**
 * Payload for inserting/updating a user.
 * `uid: 0` means insert; a real `uid` means update.
 * Field casing mirrors the upstream API contract exactly.
 */
export interface UserUpsert {
  uid: number;
  fname: string;
  uname: string;
  pcode: string;
  email: string;
  Mobile: string;
  Rid: number;
  Cby: number;
  lid: number;
}

/** Query params used to list users (sent to the proxy as query string). */
export interface UserListQuery {
  uid: number;
  lid: number;
  pn: number;
  ps: number;
}
