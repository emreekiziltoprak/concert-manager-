import os from "os";
/**
 * Guards the one migration failure that reports nothing.
 *
 * swagger-jsdoc scrapes `@swagger` blocks off disk via a glob. When the route
 * modules became `.ts`, the old `./src/routes/*.js` glob matched zero files --
 * swagger-jsdoc does not treat that as an error, so it returned a valid spec
 * with an empty `paths`, `/api-docs` rendered blank, and nothing in the build,
 * the typechecker, or the rest of the suite noticed. Verified by hand: the count
 * went 13 -> 0 -> 13 across the fix.
 *
 * The same trap is still armed for the compiled build, which is why tsconfig
 * sets `removeComments: false` and the glob covers `.js` as well as `.ts`.
 */
import specs from "../../src/config/swagger";

describe("swagger spec", () => {
  test("is populated from the route JSDoc blocks", () => {
    expect(Object.keys(specs.paths || {}).length).toBeGreaterThan(10);
  });

  // One path per route module. A count threshold alone can be satisfied by a
  // partial match, so each entry here pins the glob to a specific file: if it
  // stops reaching any one route module, exactly that name fails.
  test.each([
    ["authRoutes", "/api/auth/login"],
    ["categoryRoutes", "/api/categories"],
    ["eventRoutes", "/api/events/{eventId}/ticket-types/{ticketTypeId}"],
    ["paymentRoutes", "/payments/checkout"],
    ["ticketRoutes", "/api/tickets/my-tickets"],
    ["userRoutes", "/api/users/profile"],
  ])("includes the endpoint documented in %s", (_module, apiPath) => {
    expect(specs.paths[apiPath]).toBeDefined();
  });

  test("resolves its globs independently of the working directory", () => {
    // The original globs were relative, so they only ever resolved when the
    // process was started from backend/. Re-requiring from a different cwd is
    // the cheapest proof that the __dirname anchor actually holds.
    const cwd = process.cwd();
    try {
      process.chdir(os.tmpdir());
      jest.resetModules();
      const reloaded = require("../../src/config/swagger") as typeof specs;
      expect(Object.keys(reloaded.paths || {}).length).toBeGreaterThan(10);
    } finally {
      process.chdir(cwd);
    }
  });
});
