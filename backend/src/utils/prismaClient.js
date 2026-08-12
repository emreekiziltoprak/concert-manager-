"use strict";
const { PrismaClient } = require('../../generated/prisma');
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({
    connectionString: connectionString
});
const adapter = new PrismaPg(pool);

require('dotenv').config();
const prisma = new PrismaClient({adapter});
module.exports = prisma;

//prisma.$disconnect() does not close a pool owned by the driver adapter,
//so the pool is exposed for callers that must release it (tests)
module.exports.$pool = pool;
