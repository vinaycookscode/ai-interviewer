// Shared by the server page and the client filter bar. Kept out of the "use client" module so the server gets the real array.
export const STATUS_FILTERS = ["all", "COMPLETED", "IN_PROGRESS", "PENDING"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
