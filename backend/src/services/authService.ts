
import prisma = require("../utils/prismaClient");
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { requireEnv } from "../config/env";

export interface RegisterInput {
    email: string;
    password: string;
    fullName: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

const TOKEN_OPTIONS: SignOptions = { expiresIn: "7d" };

const register = async ({email, password, fullName}: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
      where: {email}
    });

    if(existingUser) throw new Error("This user is registered")

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email, passwordHash, fullName
        }
    });

    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
    };


}

const login = async ({email, password}: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: {email}
    });

    if(!user) throw new Error("User cant be found");

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if(!isValid) throw new Error("Email or password is wrong");

    const token = jwt.sign(
        {userId: user.id, role: user.role, email: user.email},
        // Was `process.env.JWT_SECRET`, which is `string | undefined` under
        // strict and would have signed with `undefined` had the variable been
        // missing. requireEnv fails loudly instead.
        requireEnv("JWT_SECRET"),
        TOKEN_OPTIONS

    );

    return { token, user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
    }}
}

export {
    register, login
};
