
import "dotenv/config";

import Stripe from "stripe";

// requireEnv rather than process.env directly: Stripe's constructor takes a
// `string`, and an unset key would otherwise construct a client that fails on
// the first API call with a less obvious error.
import { requireEnv } from "../config/env";

const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

// `export =` is load-bearing beyond the require() interop reason that applies to
// every single-value module here: three test files do
// `jest.mock("../../src/utils/stripeClient", () => require("../helpers/stripeMock"))`,
// and `export =` emits no `__esModule` marker, which is what keeps that mock
// shape (a plain object with `paymentIntents`) substitutable for this module.
export = stripe;
