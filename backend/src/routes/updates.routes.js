const express = require("express");
const { Update, UpdateReadReceipt } = require("../models");
const { protect, adminOnly, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, async (req, res) => {
  const updates = await Update.find({ isHidden: false }).sort({ createdAt: -1 });
  if (!req.user) return res.json(updates.map((u) => ({ ...u.toObject(), read: false })));

  const receipts = await UpdateReadReceipt.find({ user: req.user._id });
  const readIds = new Set(receipts.map((r) => r.update.toString()));
  res.json(updates.map((u) => ({ ...u.toObject(), read: readIds.has(u._id.toString()) })));
});

router.get("/unread-count", protect, async (req, res) => {
  const updates = await Update.find({ isHidden: false }).select("_id");
  const receipts = await UpdateReadReceipt.find({ user: req.user._id }).select("update");
  const readIds = new Set(receipts.map((r) => r.update.toString()));
  const unread = updates.filter((u) => !readIds.has(u._id.toString())).length;
  res.json({ unread });
});

router.post("/:id/read", protect, async (req, res) => {
  await UpdateReadReceipt.findOneAndUpdate(
    { user: req.user._id, update: req.params.id },
    { readAt: new Date() },
    { upsert: true }
  );
  res.json({ message: "Marked as read" });
});

router.post("/mark-all-read", protect, async (req, res) => {
  const updates = await Update.find({ isHidden: false }).select("_id");
  const ops = updates.map((u) => ({
    updateOne: {
      filter: { user: req.user._id, update: u._id },
      update: { readAt: new Date() },
      upsert: true,
    },
  }));
  if (ops.length) await UpdateReadReceipt.bulkWrite(ops);
  res.json({ message: "All marked as read" });
});

/* Admin CRUD */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  res.json(await Update.find().sort({ createdAt: -1 }));
});
router.post("/", protect, adminOnly, async (req, res) => {
  res.status(201).json(await Update.create(req.body));
});
router.put("/:id", protect, adminOnly, async (req, res) => {
  const u = await Update.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!u) return res.status(404).json({ message: "Not found" });
  res.json(u);
});
router.patch("/:id/hide", protect, adminOnly, async (req, res) => {
  const u = await Update.findById(req.params.id);
  if (!u) return res.status(404).json({ message: "Not found" });
  u.isHidden = !u.isHidden;
  await u.save();
  res.json(u);
});
router.delete("/:id", protect, adminOnly, async (req, res) => {
  await Update.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
