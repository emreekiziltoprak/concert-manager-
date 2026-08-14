"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
require("dotenv/config");
const stripe_1 = __importDefault(require("stripe"));
// requireEnv rather than process.env directly: Stripe's constructor takes a
// `string`, and an unset key would otherwise construct a client that fails on
// the first API call with a less obvious error.
const env_1 = require("../config/env");
const stripe = new stripe_1.default((0, env_1.requireEnv)("STRIPE_SECRET_KEY"));
module.exports = stripe;
//# sourceMappingURL=stripeClient.js.map