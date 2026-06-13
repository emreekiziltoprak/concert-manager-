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

    //create QR based tickets
    await prisma.$transaction(async (tx) => {
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

        await tx.order.update({
            where: {id: orderId},
            data: {status: "SUCCESS"}
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

const createPaymentIntent = async (orderId, amount) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount* 100),
        metadata: {orderId: orderId},
        currency: "try"
    })

    return paymentIntent.client_secret;
};

module.exports = {createOrder, completePayment, createPaymentIntent};
