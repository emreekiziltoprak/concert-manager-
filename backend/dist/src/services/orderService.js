"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOrderCronJobs = exports.cancelExpiredPendingOrders = void 0;
const prisma = require("../utils/prismaClient");
const stripe = require("../utils/stripeClient");
const node_cron_1 = __importDefault(require("node-cron"));
const errorMessage_1 = require("../utils/errorMessage");
const cancelExpiredPendingOrders = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const expiredOrders = await prisma.order.findMany({
        where: {
            status: 'PENDING',
            createdAt: {
                lt: tenMinutesAgo
            }
        }
    });
    if (expiredOrders.length === 0) {
        return { count: 0, orders: [] };
    }
    const cancellable = [];
    for (const order of expiredOrders) {
        if (!order.stripePaymentIntentId) {
            cancellable.push(order.id);
            continue;
        }
        try {
            await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
            cancellable.push(order.id);
        }
        catch (error) {
            console.error("order expiry: intent cancel failed, skipping order", order.id, (0, errorMessage_1.errorMessage)(error));
        }
    }
    const cancelled = await prisma.order.updateMany({
        where: { id: { in: cancellable }, status: 'PENDING' },
        data: { status: 'CANCELLED' }
    });
    return { count: cancelled.count, orders: cancellable };
};
exports.cancelExpiredPendingOrders = cancelExpiredPendingOrders;
const startOrderCronJobs = () => {
    node_cron_1.default.schedule('* * * * *', () => {
        cancelExpiredPendingOrders()
            .catch(error => console.error("Error cancelling expired pending orders:", error));
    });
};
exports.startOrderCronJobs = startOrderCronJobs;
//# sourceMappingURL=orderService.js.map