const paymentService = require("../services/paymentService");
const ticketService = require("../services/ticketService");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = require("../utils/stripeClient");
//create order, orderitem and stripe secret for payment
const checkout = async (req, res) => {
    try {
        const { eventId, cartItems } = req.body

        const order = await paymentService.createOrder(req.user.userId, eventId, cartItems)

        const clientSecret = await paymentService.createPaymentIntent(order.id, order.totalAmount);

        return res.status(200).json({
            clientSecret, orderId: order.id
        })

    } catch (error) {
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