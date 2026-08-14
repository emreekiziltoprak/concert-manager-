"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./src/app"));
// Side-effect import: constructs the shared Redis connection at boot.
require("./src/services/redisClient");
const orderService_1 = require("./src/services/orderService");
const outboxWorker_1 = require("./src/jobs/outboxWorker");
(0, orderService_1.startOrderCronJobs)();
(0, outboxWorker_1.startOutboxWorker)();
const PORT = process.env.PORT || 3000;
app_1.default.listen(PORT, () => {
    console.log(`Server ${PORT} is alive!`);
});
//# sourceMappingURL=server.js.map