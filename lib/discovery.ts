// Who an employer may find (AIIN-198). Every match list and search (AIIN-199, 200) must start from this filter, so
// turning "Let employers find me" off, or blocking an employer, takes effect on the very next query (AC2).
import type { Prisma } from "@prisma/client";

export function discoverableWhere(employerId: string): Prisma.CandidateProfileWhereInput {
    return {
        discoverable: true,
        factsConfirmedAt: { not: null },
        user: { role: "CANDIDATE", blockedEmployers: { none: { employerId } } },
    };
}
