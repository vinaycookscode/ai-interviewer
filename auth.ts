import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

const ROLE_RECHECK_MS = 5 * 60 * 1000

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await db.user.findUnique({ where: { email } });
                    if (!user || !user.password) return null;
                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) return user;
                }

                // Invalid credentials
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role as "CANDIDATE" | "EMPLOYER" | "ADMIN";
            }
            return session;
        },
        // Runs on every auth() call. Keep the role in the token instead of querying
        // the user each time, but re-check it every few minutes so a role change
        // (e.g. removing an admin) takes effect without waiting for the JWT to expire.
        async jwt({ token, user, trigger }) {
            if (!token.sub) return token;

            const now = Date.now();
            if (user && "role" in user) {
                token.role = user.role;
                token.roleCheckedAt = now;
                return token;
            }

            const stale = typeof token.roleCheckedAt !== "number" || now - token.roleCheckedAt > ROLE_RECHECK_MS;
            if (trigger !== "update" && token.role && !stale) return token;

            const existingUser = await db.user.findUnique({ where: { id: token.sub }, select: { role: true } });
            if (!existingUser) return token;
            token.role = existingUser.role;
            token.roleCheckedAt = now;
            return token;
        }
    }
})
