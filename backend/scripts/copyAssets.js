// tsc only emits code, so anything read from disk at runtime has to be placed
// next to the compiled output by hand.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const assets = [
    // src/services/emailService.js reads this with a __dirname relative path;
    // without it, sending a ticket email throws ENOENT in production.
    ["src/templates", "dist/src/templates"],

    // src/utils/prismaClient.js requires "../../generated/prisma". From
    // dist/src/utils/ that resolves to dist/generated/prisma, not the project
    // root, so the client has to be mirrored there.
    //
    // The tidier long-term fix is to let Prisma generate to its default location
    // and import "@prisma/client" instead, which would also repair the
    // import("@prisma/client") type annotations that currently resolve to
    // nothing. That is a schema + regeneration change, deliberately kept out of
    // the toolchain batch.
    ["generated/prisma", "dist/generated/prisma"]
];

for (const [from, to] of assets) {
    fs.cpSync(path.join(root, from), path.join(root, to), { recursive: true });
    console.log(`copied ${from} -> ${to}`);
}
