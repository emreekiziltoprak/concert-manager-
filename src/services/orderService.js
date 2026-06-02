const prisma = require("../utils/prismaClient");
const cron = require("node-cron");

/**
 * Finds and cancels expired pending orders (older than 10 minutes)
 * Also releases the associated tickets back to inventory
 * @returns {Promise<Object>} Result with count of cancelled orders and details
 */
const cancelExpiredPendingOrders = async () => {
  try {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: tenMinutesAgo
      }
    },
    include: {
      orderItems: true
    }
  });
  
  if (expiredOrders.length === 0) {
    return { count: 0, orders: [] };
  }

  if(expiredOrders.length > 0) {
    
    await prisma.$transaction(async (tx) => {
      for (const order of expiredOrders) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' }
        }); }
      });
  }
} catch (error) {
    console.error("Error cancelling expired pending orders:", error);
    throw error;
  }
};

const startOrderCronJobs = () => {
  cron.schedule('* * * * *', () => {
    cancelExpiredPendingOrders();
  });
};

module.exports = {
  cancelExpiredPendingOrders,
  startOrderCronJobs
};
