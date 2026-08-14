import type { Request, Response } from "express";

import * as paymentService from "../services/paymentService";
import stripe from "../utils/stripeClient";
import { requireUser } from "../utils/requireUser";
import { requireEnv } from "../config/env";
import { errorMessage, errorCode } from "../utils/errorMessage";

type StripeEvent = ReturnType<typeof stripe.webhooks.constructEvent>;

//create order, orderitem and stripe secret for payment
const checkout = async (req: Request, res: Response) => {
    // Outside the try on purpose. requireUser throws a 401, and the catch below
    // answers 400 for everything it sees -- so calling it in there would turn a
    // "not logged in" into a "bad request". authMiddleware guards this route, so
    // in practice this only fires if the route is ever mounted without it.
    const { userId } = requireUser(req);

    try {
        const { eventId, cartItems } = req.body

        let pending = await paymentService.findPendingOrder(userId, eventId);

        if (pending && !paymentService.matchesCart(pending, cartItems)) {
            if (await paymentService.cancelPendingOrder(pending)) pending = null;
        }

        if (pending) {
            const resumed = await paymentService.resumePendingOrder(pending);
            //still with the bank means there is nothing for the user to do yet
            return res.status(resumed.status === "PROCESSING" ? 202 : 200).json(resumed);
        }

        const order = await paymentService.createOrder(userId, eventId, cartItems);

        const clientSecret = await paymentService.createPaymentIntent(order.id, order.totalAmount);

        return res.status(200).json({
            clientSecret, orderId: order.id, status: "REQUIRES_PAYMENT"
        })

    } catch (error) {
        // errorCode duck-types `.code`, matching what this line did as JS.
        // `instanceof Prisma.PrismaClientKnownRequestError` would be stricter
        // than the check being replaced, and nothing covers the difference.
        if (errorCode(error) === "P2002") {
            return res.status(409).json({ error: "For this event there is an already existing order" });
        }

        console.error(error instanceof Error ? error.stack : error)
        res.status(400).json({ error: errorMessage(error) })
    }
}

//stripe calls
const webhook = async (req: Request, res: Response) => {

    const sig = req.headers['stripe-signature'];

    // A header can arrive repeated, which is why express types it as
    // `string | string[]`; Stripe only accepts the single-value form.
    if (typeof sig !== "string") {
        return res.status(400).send("Webhook Error: missing stripe-signature header");
    }

    let event: StripeEvent;

    //check if the request is coming from stripe
    try {
        // req.body really is a Buffer here -- app.js mounts express.raw for this
        // one path -- but @types/express types `body` as `any`, so the assertion
        // documents the contract rather than satisfying the compiler.
        //
        // The secret is read here rather than at module scope: as a module-level
        // requireEnv it would crash boot for any developer without the variable
        // set, where today an unset value simply fails verification with a 400.
        event = stripe.webhooks.constructEvent(
            req.body as Buffer,
            sig,
            requireEnv("STRIPE_WEBHOOK_SECRET")
        );
    } catch (error) {
        console.error("STRIPE İMZA DOĞRULAMA HATASI:", errorMessage(error)); // <--- Bunu ekleyin
        return res.status(400).send(`Webhook Error: ${errorMessage(error)}`);
    }

    try {

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            // Set by paymentService.createPaymentIntent, so it is always present
            // on an intent this application created.
            const orderId = paymentIntent.metadata.orderId as string;

            //create tickets
            await paymentService.completePayment(orderId)

            //TODO::
        }
        //make stripe in contact
        res.status(200).json({ received: true });
    } catch (error) {

        if (errorMessage(error) === "this order is processed") {
        return res.status(200).json({ received: true, note: "Already processed" });
        }

        res.status(400).send("Webhook Error")
    }
}

export { checkout, webhook }
