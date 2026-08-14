"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhook = exports.checkout = void 0;
const paymentService = __importStar(require("../services/paymentService"));
const stripeClient_1 = __importDefault(require("../utils/stripeClient"));
const requireUser_1 = require("../utils/requireUser");
const env_1 = require("../config/env");
const errorMessage_1 = require("../utils/errorMessage");
//create order, orderitem and stripe secret for payment
const checkout = async (req, res) => {
    // Outside the try on purpose. requireUser throws a 401, and the catch below
    // answers 400 for everything it sees -- so calling it in there would turn a
    // "not logged in" into a "bad request". authMiddleware guards this route, so
    // in practice this only fires if the route is ever mounted without it.
    const { userId } = (0, requireUser_1.requireUser)(req);
    try {
        const { eventId, cartItems } = req.body;
        let pending = await paymentService.findPendingOrder(userId, eventId);
        if (pending && !paymentService.matchesCart(pending, cartItems)) {
            if (await paymentService.cancelPendingOrder(pending))
                pending = null;
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
        });
    }
    catch (error) {
        // errorCode duck-types `.code`, matching what this line did as JS.
        // `instanceof Prisma.PrismaClientKnownRequestError` would be stricter
        // than the check being replaced, and nothing covers the difference.
        if ((0, errorMessage_1.errorCode)(error) === "P2002") {
            return res.status(409).json({ error: "For this event there is an already existing order" });
        }
        console.error(error instanceof Error ? error.stack : error);
        res.status(400).json({ error: (0, errorMessage_1.errorMessage)(error) });
    }
};
exports.checkout = checkout;
//stripe calls
const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    // A header can arrive repeated, which is why express types it as
    // `string | string[]`; Stripe only accepts the single-value form.
    if (typeof sig !== "string") {
        return res.status(400).send("Webhook Error: missing stripe-signature header");
    }
    let event;
    //check if the request is coming from stripe
    try {
        // req.body really is a Buffer here -- app.js mounts express.raw for this
        // one path -- but @types/express types `body` as `any`, so the assertion
        // documents the contract rather than satisfying the compiler.
        //
        // The secret is read here rather than at module scope: as a module-level
        // requireEnv it would crash boot for any developer without the variable
        // set, where today an unset value simply fails verification with a 400.
        event = stripeClient_1.default.webhooks.constructEvent(req.body, sig, (0, env_1.requireEnv)("STRIPE_WEBHOOK_SECRET"));
    }
    catch (error) {
        console.error("STRIPE İMZA DOĞRULAMA HATASI:", (0, errorMessage_1.errorMessage)(error)); // <--- Bunu ekleyin
        return res.status(400).send(`Webhook Error: ${(0, errorMessage_1.errorMessage)(error)}`);
    }
    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            // Set by paymentService.createPaymentIntent, so it is always present
            // on an intent this application created.
            const orderId = paymentIntent.metadata.orderId;
            //create tickets
            await paymentService.completePayment(orderId);
            //TODO::
        }
        //make stripe in contact
        res.status(200).json({ received: true });
    }
    catch (error) {
        if ((0, errorMessage_1.errorMessage)(error) === "this order is processed") {
            return res.status(200).json({ received: true, note: "Already processed" });
        }
        res.status(400).send("Webhook Error");
    }
};
exports.webhook = webhook;
//# sourceMappingURL=paymentController.js.map