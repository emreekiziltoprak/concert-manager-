const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser")
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");

const authRoutes = require("./src/routes/authRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const { startOrderCronJobs } = require("./src/services/orderService");

const app = express();

app.use(cors());
app.use(cookieParser());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/", categoryRoutes);
app.use("/api/", eventRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get("/", (req, res) => {
  res.json({ message: "Event api is working" });
});

startOrderCronJobs();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} is alive!`);
});