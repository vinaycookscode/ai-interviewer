// How long a shortlist link works (AIIN-161). Plain module: the share dialog imports it in the browser.
export const SHARE_DAYS = [1, 7, 30] as const;
export type ShareDays = (typeof SHARE_DAYS)[number];
