export interface Entry {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  /** Folder name; empty string means unfiled. */
  folder: string;
}
