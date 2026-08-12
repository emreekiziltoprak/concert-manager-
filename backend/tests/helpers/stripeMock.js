const paymentIntents = {
  create: jest.fn(),
  cancel: jest.fn(),
  retrieve: jest.fn()
};

module.exports = { paymentIntents };
