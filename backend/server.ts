import "dotenv/config";

import app from "./src/app";
// Side-effect import: constructs the shared Redis connection at boot.
import "./src/services/redisClient";
import { startOrderCronJobs } from "./src/services/orderService";
import { startOutboxWorker } from "./src/jobs/outboxWorker";

startOrderCronJobs();
startOutboxWorker();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} is alive!`);
});
