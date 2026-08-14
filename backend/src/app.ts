import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { authLimiter, apiLimiter } from "./middlewares/rateLimiters";
import swaggerSpecs from "./config/swagger";
import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import eventRoutes from "./routes/eventRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import userRoutes from "./routes/userRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import errorHandler from "./middlewares/errorHandler";

const app = express();

// Security headers first, so they are set even on responses that never reach a route.
// crossOriginResourcePolicy is relaxed because the frontend is served from a
// different origin in development.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Set CORS_ORIGIN (comma separated) to lock the API to known origins. Left open
// when unset so an existing development setup keeps working.
const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim());
app.use(cors(corsOrigins?.length ? { origin: corsOrigins, credentials: true } : undefined));

app.use(cookieParser());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// `req`/`res` are annotated because Express's `get` is overloaded with the
// settings reader `get(name: string): any`; without the annotations the
// overload picked leaves both parameters implicitly `any`.
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Event api is working" });
});

// Must stay last: an error handler only sees what the routes above pass it.
app.use(errorHandler);

// `export =`, not `export default`: under module: commonjs a default export
// emits `module.exports.default`, and `server.ts` plus four
// `tests/integration/*.test.js` files require this module's value directly --
// they would receive the wrapper object and fail at runtime with nothing in the
// typechecker to warn about, since .js files are not checked.
export = app;
