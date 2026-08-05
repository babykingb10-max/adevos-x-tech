const express = require("express");
const { Subscriber } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();

// Public: Stay Connected "Subscribe" form
router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  try {
    await Subscriber.create({ email });
    emitLiveEvent(req.app, `New newsletter subscriber: ${email}`);
    res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ message: "Already subscribed" });
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  res.json(await Subscriber.find().sort({ createdAt: -1 }));
});

module.exports = router;
