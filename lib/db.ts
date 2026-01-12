import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

const connectionString = env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter });
};

declare global {
    var prismaGlobalV3: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prismaGlobalV3 ?? prismaClientSingleton();

if (env.NODE_ENV !== "production") globalThis.prismaGlobalV3 = db;
