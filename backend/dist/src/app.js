"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const rateLimiters_1 = require("./middlewares/rateLimiters");
const swagger_1 = __importDefault(require("./config/swagger"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const app = (0, express_1.default)();
// Security headers first, so they are set even on responses that never reach a route.
// crossOriginResourcePolicy is relaxed because the frontend is served from a
// different origin in development.
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Set CORS_ORIGIN (comma separated) to lock the API to known origins. Left open
// when unset so an existing development setup keeps working.
const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim());
app.use((0, cors_1.default)(corsOrigins?.length ? { origin: corsOrigins, credentials: true } : undefined));
app.use((0, cookie_parser_1.default)());
app.use("/api/payments/webhook", express_1.default.raw({ type: "application/json" }));
app.use(express_1.default.json());
app.use("/api", rateLimiters_1.apiLimiter);
app.use("/api/auth", rateLimiters_1.authLimiter);
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/events", eventRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/tickets", ticketRoutes_1.default);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// `req`/`res` are annotated because Express's `get` is overloaded with the
// settings reader `get(name: string): any`; without the annotations the
// overload picked leaves both parameters implicitly `any`.
app.get("/", (req, res) => {
    res.json({ message: "Event api is working" });
});
// Must stay last: an error handler only sees what the routes above pass it.
app.use(errorHandler_1.default);
module.exports = app;
//# sourceMappingURL=app.js.map