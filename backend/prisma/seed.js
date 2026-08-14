// Deliberately standalone: this file must NOT import from src/.
//
// Dockerfile.prod runs `npx prisma db seed` in its CMD, and the runtime image
// only contains dist/ -- there is no src/ for `require("../src/utils/prismaClient")`
// to resolve. Building its own client costs six lines and works identically in
// development, in the test database and in production.
require("dotenv").config();

const { PrismaClient } = require("../generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@concert.com' },
    update: {},
    create: {
      email: 'admin@concert.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // $disconnect() does not close a pool owned by the driver adapter, so the
    // process would hang without ending it explicitly.
    await prisma.$disconnect();
    await pool.end();
  });
