"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const prisma = require("../utils/prismaClient");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const TOKEN_OPTIONS = { expiresIn: "7d" };
const register = async ({ email, password, fullName }) => {
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });
    if (existingUser)
        throw new Error("This user is registered");
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
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
};
exports.register = register;
const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user)
        throw new Error("User cant be found");
    const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValid)
        throw new Error("Email or password is wrong");
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, email: user.email }, 
    // Was `process.env.JWT_SECRET`, which is `string | undefined` under
    // strict and would have signed with `undefined` had the variable been
    // missing. requireEnv fails loudly instead.
    (0, env_1.requireEnv)("JWT_SECRET"), TOKEN_OPTIONS);
    return { token, user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        } };
};
exports.login = login;
//# sourceMappingURL=authService.js.map