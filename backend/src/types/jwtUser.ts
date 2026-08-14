import type { UserRole } from "./prisma";

// Shape is fixed by authService.login, which signs { userId, role, email }.
// There is no `id` field.
export interface JwtUser {
    userId: string;
    role: UserRole;
    email: string;
}

export type { UserRole };
