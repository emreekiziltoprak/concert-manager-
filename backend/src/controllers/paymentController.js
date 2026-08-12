const paymentService = require("../services/paymentService");
const ticketService = require("../services/ticketService");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = require("../utils/stripeClient");

//create order, orderitem and stripe secret for payment
const checkout = async (req, res) => {
    try {
        const { eventId, cartItems } = req.body

        let pending = await paymentService.findPendingOrder(req.user.userId, eventId);

        if (pending && !paymentService.matchesCart(pending, cartItems)) {
            if (await paymentService.cancelPendingOrder(pending)) pending = null;
        }

        if (pending) {
            const resumed = await paymentService.resumePendingOrder(pending);
            //still with the bank means there is nothing for the user to do yet
            return res.status(resumed.status === "PROCESSING" ? 202 : 200).json(resumed);
        }

        const order = await paymentService.createOrder(req.user.userId, eventId, cartItems);

        const clientSecret = await paymentService.createPaymentIntent(order.id, order.totalAmount);

        return res.status(200).json({
            clientSecret, orderId: order.id, status: "REQUIRES_PAYMENT"
        })

    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({ error: "For this event there is an already existing order" });
        }

        console.error(error.stack)
        res.status(400).json({ error: error.message })
    }
}

//stripe calls
const webhook = async (req, res) => {

    const sig = req.headers['stripe-signature'];
    let event;

    //check if the request is coming from stripe
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);    
    } catch (error) {
        console.error("STRIPE İMZA DOĞRULAMA HATASI:", error.message); // <--- Bunu ekleyin
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            //create tickets
            await paymentService.completePayment(orderId)

            //TODO:: 
        }
        //make stripe in contact
        res.status(200).json({ received: true });
    } catch (error) {
        
        if (error.message === "this order is processed") {
        return res.status(200).json({ received: true, note: "Already processed" });
        }

        res.status(400).send("Webhook Error")
    }
}

module.exports = { checkout, webhook }