const express = require("express");
const { Response } = require("../models");
const { protect, adminOnly, optionalAuth } = require("../middleware/auth");
const { sendFeedbackConfirmation } = require("../utils/email");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();

// Public: submit feedback (bug report / feature request / general opinion)
router.post("/", optionalAuth, async (req, res) => {
  const { category, message, name, email } = req.body;
  if (!category || !message || !name || !email) {
    return res.status(400).json({ message: "category, message, name and email are required" });
  }
  const response = await Response.create({
    category, message, name, email,
    user: req.user?._id || null,
  });

  await sendFeedbackConfirmation(email, name);
  emitLiveEvent(req.app, `New ${category} feedback from ${name}`);
  res.status(201).json({ message: "Feedback submitted", response });
});

// Admin: list + manage
router.get("/", protect, adminOnly, async (req, res) => {
  res.json(await Response.find().sort({ createdAt: -1 }));
});

router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  const { status } = req.body; // "new" | "in_review" | "resolved"
  const response = await Response.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!response) return res.status(404).json({ message: "Not found" });
  res.json(response);
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  await Response.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
