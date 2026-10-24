/**
 * The plan a visitor picked on the pricing page, carried through sign-up and
 * login as plain query params (?plan=PRO&period=YEARLY). It only preselects a
 * plan in the UI: prices and activation are always decided server-side.
 */
const PLANS = ["FREE", "PRO", "PREMIUM"] as const;
const PERIODS = ["MONTHLY", "YEARLY"] as const;

export type PlanChoice = (typeof PLANS)[number];
export type PeriodChoice = (typeof PERIODS)[number];

interface ParamReader {
    get(name: string): string | null;
}

/** Read the plan selection, ignoring anything that isn't a known value. */
export function readPlanSelection(params: ParamReader): { plan: PlanChoice | null; period: PeriodChoice | null } {
    const plan = params.get("plan") ?? params.get("selected");
    const period = params.get("period");
    return {
        plan: PLANS.find((p) => p === plan) ?? null,
        period: PERIODS.find((p) => p === period) ?? null,
    };
}

/** Query string for a plan selection, e.g. `plan=PRO&period=YEARLY`. */
export function planSelectionQuery(plan: string, period: string): string {
    return new URLSearchParams({ plan, period }).toString();
}
