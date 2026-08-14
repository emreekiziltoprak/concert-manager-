const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const { authLimiter, apiLimiter } = require("./middlewares/rateLimiters");
const swaggerSpecs = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const errorHandler = require("./middlewares/errorHandler");

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

app.get("/", (req, res) => {
  res.json({ message: "Event api is working" });
});

// Must stay last: an error handler only sees what the routes above pass it.
app.use(errorHandler);

module.exports = app;
