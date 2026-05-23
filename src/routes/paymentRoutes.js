const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/checkout", authMiddleware, paymentController.checkout);

router.post("/webhook", express.raw({ type: 'application/json' }), paymentController.webhook);


module.exports = router;