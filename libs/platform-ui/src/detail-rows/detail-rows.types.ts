export type DetailRow = {
  label: string;
  value: string;
  /** Grid variant: highlight cell (e.g. allergies alert). */
  highlight?: boolean;
};

export type DetailFieldDef<T> = {
  label: string;
  /** Override static label per item (e.g. earnings share percent). */
  getLabel?: (item: T) => string;
  getValue: (item: T) => string | number | boolean | null | undefined;
  /** Hide row when value is empty after trim. */
  omitWhenEmpty?: boolean;
  /** Skip row entirely when false. */
  show?: (item: T) => boolean;
  /** Shown when value is null/undefined/empty string. */
  emptyText?: string;
  highlight?: (item: T) => boolean;
};
