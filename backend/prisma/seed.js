const prisma = require("../src/utils/prismaClient");
const bcrypt = require("bcryptjs");

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
    await prisma.$disconnect();
  });