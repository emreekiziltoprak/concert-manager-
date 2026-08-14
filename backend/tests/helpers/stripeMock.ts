const paymentIntents = {
  create: jest.fn(),
  cancel: jest.fn(),
  retrieve: jest.fn()
};

// export =, not named exports: stripeClient is `export = stripe`, so the three
// jest.mock factories that swap this in must produce the same default-shaped
// module. Named exports would add __esModule and the consumers would read
// `.default` as undefined.
export = { paymentIntents };
