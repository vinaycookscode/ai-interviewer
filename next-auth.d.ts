import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

export type ExtendedUser = DefaultSession["user"] & {
    id: string;
    name: string;
    email: string;
    role: UserRole;
};

declare module "next-auth" {
    interface Session {
        user: ExtendedUser;
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        role?: UserRole;
    }
}
