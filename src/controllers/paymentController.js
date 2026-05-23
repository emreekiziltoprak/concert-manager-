const paymentService = require("../services/paymentService");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = require("../utils/stripeClient");
//create order, orderitem and stripe secret for payment
const checkout = async (req, res) => {
    try {
        const { eventId, cartItems } = req.body

        const order = await paymentService.createOrder(req.body.user.id, eventId, cartItems)

        const clientSecret = await paymentService.createPaymentIntent(order.id, order.totalAmount);

        return res.status(200).json({
            clientSecret, orderId: order.id
        })

    } catch (error) {
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
        const event = req.body;

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            //create tickets
            await paymentService.completePayment(orderId)
        }
        //make stripe in contact
        res.status(200).json({ received: true });
    } catch (error) {
        res.status(400).send("Webhook Error")
    }
}

module.exports = { checkout, webhook }