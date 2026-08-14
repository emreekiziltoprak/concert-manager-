"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOutboxWorker = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const outboxHandlers_1 = __importDefault(require("../handlers/outboxHandlers"));
const errorMessage_1 = require("../utils/errorMessage");
const processOutboxEvents = async () => {
    try {
        const pendingEvents = await prismaClient_1.default.outboxEvent.findMany({
            where: { status: "PENDING" },
            take: 50,
            orderBy: { createdAt: 'asc' }
        });
        if (pendingEvents.length === 0)
            return;
        for (const event of pendingEvents) {
            try {
                const handler = outboxHandlers_1.default[event.type];
                if (!handler) {
                    throw new Error(`Unknown Event type: ${event.type}`);
                }
                await handler(event.payload);
                await prismaClient_1.default.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: "PROCESSED" },
                });
            }
            catch (error) {
                console.error("Error when handling worker", (0, errorMessage_1.errorMessage)(error));
                await prismaClient_1.default.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: "FAILED", error: (0, errorMessage_1.errorMessage)(error) },
                });
            }
        }
    }
    catch (error) {
        console.error("Outbox table cant be read", (0, errorMessage_1.errorMessage)(error));
    }
};
const startOutboxWorker = () => {
    node_cron_1.default.schedule("* * * * *", processOutboxEvents);
};
exports.startOutboxWorker = startOutboxWorker;
//# sourceMappingURL=outboxWorker.js.map