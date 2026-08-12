const prisma = require("../utils/prismaClient");
const stripe = require("../utils/stripeClient");


//returns orderItemData
//function for creating pending order with multiple orderitems
const createOrder = async (userId, eventId, cartItems) => {
    return await prisma.$transaction(async (tx) => {
        let totalAmountData = 0;
        const orderItemsData = [];

        for (const ticket of cartItems) {
            
        const ticketTypes = await tx.$queryRaw`
        SELECT * FROM "ticket_types" WHERE id = ${ticket.ticketTypeId} 
        AND "eventId" = ${eventId} FOR UPDATE`;
        const ticketType = ticketTypes[0];

        if(!ticketType) throw new Error("ticket type  cant be found");

        //find how many tickets are sold or reserved
        const aggregations = await tx.orderItem.aggregate({
            where: {
                ticketTypeId: ticketType.id,
                order: {
                    status: { in: ["PENDING", "SUCCESS"]}
                }
            },  
            _sum: {
                quantity: true
            }
        })
        const availableTickets = ticketType.totalCount - (aggregations._sum.quantity || 0);

        //if the available tickets arent enough throw error
        if(availableTickets < ticket.count) 
            throw new Error("there is no enough tickets");

        totalAmountData += ticketType.price * ticket.count;

        //add each ticket type for creating orderItemsData 
        orderItemsData.push({
        ticketTypeId: ticket.ticketTypeId,
        quantity: ticket.count,
        unitPrice: ticketType.price,
        totalPrice: ticketType.price * ticket.count
        });
    
    }

    const order = await tx.order.create({
        data: {
            userId: userId,
            eventId: eventId,
            totalAmount: totalAmountData,
            status: "PENDING",
            orderItems: {
                create: orderItemsData
            }

        }
    });

    return order;

    })
};

//convert orderitems to actual tickets
const completePayment = async (orderId) => {
   const order = await prisma.order.findUnique(
        {where: {id: orderId},
        include: {orderItems: true, user: true}
    },
    );

    if(!order) throw new Error("order cant be found");

    if(order.status == "SUCCESS")
        throw new Error("this order is processed");

    if(order.status == "CANCELLED")
        throw new Error("this order was cancelled before the payment completed");

    //create QR based tickets
    await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
            where: {id: orderId, status: "PENDING"},
            data: {status: "SUCCESS"}
        });

        if(claimed.count === 0) throw new Error("this order is processed");

        const ticketsData = [];
        //each orderıtem represents different types of orders based on 
        //eachtickettypes
        for (orderItem of order.orderItems) {
            for (let i = 0; i < orderItem.quantity; i++) {
                ticketsData.push({
                    userId: order.userId,
                    ticketTypeId: orderItem.ticketTypeId,
                    orderItemId: orderItem.id,
                    isSold: true,
                    soldDate: new Date()
                })
            }}

        await tx.ticket.createMany({
            data: ticketsData
        });

        //TODO:: create workbox event and send email
        await tx.outboxEvent.create({
            data: {
            type: "SEND_TICKET_EMAIL",
            payload: {
                userEmail: order.user.email,
                fullName: order.user.fullName,
                orderId: orderId
            }
        }})

    });

 
}

const createPaymentIntent = async (orderId, amount, replacing = null) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount* 100),
        metadata: {orderId: orderId},
        currency: "try"
    },
    { idempotencyKey: replacing ? `order_${orderId}_after_${replacing}` : `order_${orderId}` })

    await prisma.order.update({
        where: {id: orderId},
        data: {stripePaymentIntentId: paymentIntent.id}
    });

    return paymentIntent.client_secret;
};

const findPendingOrder = async (userId, eventId) => {
    return await prisma.order.findFirst({
        where: {userId, eventId, status: "PENDING"},
        include: {orderItems: true}
    });
};

const matchesCart = (order, cartItems = []) => {
    if(order.orderItems.length !== cartItems.length) return false;

    return cartItems.every(item => order.orderItems.some(
        existing => existing.ticketTypeId === item.ticketTypeId
                 && existing.quantity === item.count
    ));
};

const cancelPendingOrder = async (order) => {
    if(order.stripePaymentIntentId){
        const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

        if(intent.status === "succeeded" || intent.status === "processing") return false;

        if(intent.status !== "canceled"){
            await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
        }
    }

    const cancelled = await prisma.order.updateMany({
        where: {id: order.id, status: "PENDING"},
        data: {status: "CANCELLED"}
    });

    return cancelled.count > 0;
};


/**
 * 
 * @param {*} order
 * @returns {{status: string, clientSecret: string|null, orderId: string|number}}

 */
const resumePendingOrder = async (order) => {

    if(!order.stripePaymentIntentId){
        const clientSecret = await createPaymentIntent(order.id, order.totalAmount);
        return {status: "REQUIRES_PAYMENT", clientSecret, orderId: order.id};
    }

    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    //if payment is succeeded, and the order is stuck on pending, then we complete order on db level
    //make it success and create qr tickets, with actual tickets
       if(intent.status === "succeeded"){
        await completePayment(order.id).catch(error => {
            if(error.message !== "this order is processed") throw error;
        });
        return {status: "SUCCESS", orderId: order.id};
    }

    //if intent is cancelled, and, order stuck on pending, we recreate intent
    //because we want the order to continue
    if(intent.status === "canceled"){
        const clientSecret = await createPaymentIntent(
            order.id, order.totalAmount, order.stripePaymentIntentId
        );
        return {status: "REQUIRES_PAYMENT", clientSecret, orderId: order.id};
    }

    //already processing, nothing to do
    if(intent.status === "processing"){
        return {status: "PROCESSING", orderId: order.id};
    }

    //works when: requires_payment_method, requires_confirmation, requires_action
    return {status: "REQUIRES_PAYMENT", clientSecret: intent.client_secret, orderId: order.id};
};

module.exports = {createOrder, completePayment, createPaymentIntent, findPendingOrder, matchesCart, cancelPendingOrder, resumePendingOrder};
