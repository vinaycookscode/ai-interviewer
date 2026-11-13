// Test accounts for a throwaway local database (docs/LOCAL_DEVELOPMENT.md, Option B). Refuses any other database.
//
//   DATABASE_URL="postgresql://postgres@localhost:5433/build_check" LOCAL_TEST_PASSWORD="…" npx tsx scripts/seed-local-test-users.ts
//
// Creates (or resets the password of) one employer and two candidates:
//   hr@northwind.test (employer, id emp1), cand1@test.local (id u1), cand2@test.local (id u2)
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? "";
const host = (() => {
    try {
        return new URL(url).hostname;
    } catch {
        return "";
    }
})();
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error("Refusing: DATABASE_URL must point at a local database.");
    process.exit(1);
}
const password = process.env.LOCAL_TEST_PASSWORD;
if (!password || password.length < 12) {
    console.error("Set LOCAL_TEST_PASSWORD (12 characters or more).");
    process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const USERS = [
    { id: "emp1", email: "hr@northwind.test", name: "Northwind Labs", role: "EMPLOYER" as const },
    { id: "u1", email: "cand1@test.local", name: "Test Candidate", role: "CANDIDATE" as const },
    { id: "u2", email: "cand2@test.local", name: "Second Candidate", role: "CANDIDATE" as const },
];

async function main() {
    const hash = await bcrypt.hash(password!, 10);
    for (const u of USERS) {
        await db.user.upsert({ where: { id: u.id }, update: { password: hash }, create: { ...u, password: hash, emailVerified: new Date() } });
    }
    console.log(`Seeded ${USERS.length} local test users.`);
}

main().finally(() => db.$disconnect());
