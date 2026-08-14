
// Must come first: the pool below is constructed from process.env.DATABASE_URL,
// so dotenv has to have run by then. Previously `require('dotenv').config()` sat
// *after* the pool was built, which meant a process without DATABASE_URL already
// exported (outside docker-compose, which injects it) built a pool with
// `connectionString: undefined` and fell back to libpq defaults.
import "dotenv/config";

import { PrismaClient } from "../types/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);

const prisma = Object.assign(new PrismaClient({ adapter }), { $pool: pool });

// `export =`, not `export default`. Under module: commonjs a default export
// emits `module.exports.default`, and every not-yet-converted
// `const prisma = require("../utils/prismaClient")` would silently receive the
// wrapper object instead of the client. .js files are not typechecked, so
// nothing would warn -- it would fail at runtime.
export = prisma;
