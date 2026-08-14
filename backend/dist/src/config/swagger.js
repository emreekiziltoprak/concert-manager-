"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
/**
 * Where swagger-jsdoc looks for `@swagger` blocks.
 *
 * Two things here are load-bearing and both fail *silently* if changed:
 *
 * 1. Anchored to `__dirname`, not to `process.cwd()`. The globs used to be
 *    `./src/routes/*.js`, which only resolved because the process happened to
 *    be started from backend/. It also means the compiled build looked for
 *    `<cwd>/src/routes` while its own routes sit in `dist/src/routes`.
 *
 * 2. POSIX separators. swagger-jsdoc v6 resolves these through glob@7, which
 *    treats `\` as an escape character rather than a path separator -- so the
 *    backslashes `path.join` produces on Windows match nothing at all.
 *
 * Both extensions are listed because the migration leaves `src/routes/` holding
 * a mix of `.ts` and `.js`, while `dist/src/routes/` is all `.js`. (The `.js`
 * entry is what keeps the production build documented, and is why tsconfig sets
 * `removeComments: false` -- stripping comments would empty the spec.)
 *
 * `./src/controllers/*.js` was dropped: all 22 `@swagger` blocks live in the
 * route modules, the controllers have none.
 */
const routesDir = path_1.default.join(__dirname, "..", "routes").split(path_1.default.sep).join("/");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Hub API',
            version: '1.0.0',
            description: 'API documentation for Event Hub application',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [`${routesDir}/*.ts`, `${routesDir}/*.js`],
};
const specs = (0, swagger_jsdoc_1.default)(options);
module.exports = specs;
//# sourceMappingURL=swagger.js.map