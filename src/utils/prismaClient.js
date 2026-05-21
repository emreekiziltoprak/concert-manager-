const { PrismaClient } = require('../../generated/prisma/client');
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
