const prisma = require("../utils/prismaClient");
const stripe = require("../utils/stripeClient");
const cron = require("node-cron");

/**
 * Finds and cancels expired pending orders (older than 10 minutes)
 * Also releases the associated tickets back to inventory
 * @returns {Promise<Object>} Result with count of cancelled orders and details
 */
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
    } catch (error) {
      console.error("order expiry: intent cancel failed, skipping order", order.id, error.message);
    }
  }

  const cancelled = await prisma.order.updateMany({
    where: { id: { in: cancellable }, status: 'PENDING' },
    data: { status: 'CANCELLED' }
  });

  return { count: cancelled.count, orders: cancellable };
};

const startOrderCronJobs = () => {
  cron.schedule('* * * * *', () => {
    cancelExpiredPendingOrders()
      .catch(error => console.error("Error cancelling expired pending orders:", error));
  });
};

module.exports = {
  cancelExpiredPendingOrders,
  startOrderCronJobs
};
