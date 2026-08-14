require("dotenv").config();

const app = require("./src/app");
require("./src/services/redisClient");
const { startOrderCronJobs } = require("./src/services/orderService");
const { startOutboxWorker } = require("./src/jobs/outboxWorker");

startOrderCronJobs();
startOutboxWorker();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} is alive!`);
});
