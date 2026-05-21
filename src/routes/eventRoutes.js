const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");


router.get("/events", authMiddleware, eventController.getEvents);
router.post("/events",  authMiddleware, eventController.addEvent);
router.put("/events", authMiddleware, eventController.updateEvent);
router.delete("/events",authMiddleware, eventController.deleteEvent);
module.exports = router;