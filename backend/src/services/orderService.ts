
import prisma = require("../utils/prismaClient");
import stripe = require("../utils/stripeClient");
import cron from "node-cron";
import { errorMessage } from "../utils/errorMessage";

const cancelExpiredPendingOrders = async (): Promise<{ count: number; orders: string[] }> => {
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

  const cancellable: string[] = [];

  for (const order of expiredOrders) {
    if (!order.stripePaymentIntentId) {
      cancellable.push(order.id);
      continue;
    }

    try {
      await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
      cancellable.push(order.id);
    } catch (error) {
      console.error("order expiry: intent cancel failed, skipping order", order.id, errorMessage(error));
    }
  }

  const cancelled = await prisma.order.updateMany({
    where: { id: { in: cancellable }, status: 'PENDING' },
    data: { status: 'CANCELLED' }
  });

  return { count: cancelled.count, orders: cancellable };
};

const startOrderCronJobs = (): void => {
  cron.schedule('* * * * *', () => {
    cancelExpiredPendingOrders()
      .catch(error => console.error("Error cancelling expired pending orders:", error));
  });
};

export {
  cancelExpiredPendingOrders,
  startOrderCronJobs
};
