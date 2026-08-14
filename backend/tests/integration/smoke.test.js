const { prisma, truncateAll, disconnect } = require("../helpers/db");
const { createTestUser } = require("../helpers/fixtures");

afterAll(disconnect);

test("can connect to the test database and create/truncate data", async () => {
  await truncateAll();

  const user = await createTestUser({ email: "smoke-test@example.com" });
  expect(user.id).toBeDefined();

  const found = await prisma.user.findUnique({ where: { id: user.id } });
  expect(found.email).toBe("smoke-test@example.com");

  await truncateAll();

  const afterTruncate = await prisma.user.findMany();
  expect(afterTruncate).toHaveLength(0);
});
