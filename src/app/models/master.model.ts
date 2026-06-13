/** A master / lookup record (e.g. role, sex, location). */
export interface Master {
  tname: string;
  id: number;
  cd: string | null;
  names: string;
}

/** Payload for inserting a master record. `mid: 0` means insert. */
export interface MasterUpsert {
  mid: number;
  cd: string;
  name: string;
  tname: string;
  cby: number;
}

/** A selectable master type shown in the Masters page. */
export interface MasterType {
  /** API `tname` value. */
  key: string;
  /** Human-readable English label. */
  label: string;
}

export const MASTER_TYPES: MasterType[] = [
  { key: 'role', label: 'Roles' },
  { key: 'sex', label: 'Genders' },
  { key: 'location', label: 'Locations' },
];
