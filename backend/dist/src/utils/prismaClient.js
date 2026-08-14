"use strict";
// Must come first: the pool below is constructed from process.env.DATABASE_URL,
// so dotenv has to have run by then. Previously `require('dotenv').config()` sat
// *after* the pool was built, which meant a process without DATABASE_URL already
// exported (outside docker-compose, which injects it) built a pool with
// `connectionString: undefined` and fell back to libpq defaults.
require("dotenv/config");
const prisma_1 = require("../types/prisma");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = Object.assign(new prisma_1.PrismaClient({ adapter }), { $pool: pool });
module.exports = prisma;
//# sourceMappingURL=prismaClient.js.map