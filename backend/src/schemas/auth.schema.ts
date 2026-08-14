import { z } from "zod";

const email = z.email("Email address is not valid");
const password = z.string().min(5, "Password at least need to be 5 characters");

export const loginSchema = z.object({
    body: z.strictObject({ email, password })
});

export const registerSchema = z.object({
    body: z.strictObject({
        email,
        password,
        fullName: z.string().trim().min(1, "Full name is required")
    })
});

export type LoginInput = z.infer<typeof loginSchema.shape.body>;
export type RegisterInput = z.infer<typeof registerSchema.shape.body>;
