require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const {
  HeroSlide, Service, InTouchCard, Plan,
  PaymentMethod, Package,
  DeploymentPlatform, DeploymentMusic,
  Support, Testimonial, StayConnectedLink, FooterLink, MenuItem, Tutorial, Banner,
} = require("./models");
const crudRouter = require("./routes/crudRouter");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

// Make io available to route handlers (e.g. deployment build-log streaming, live activity feed)
app.set("io", io);
io.on("connection", (socket) => {
  socket.on("join-deployment", (deploymentId) => socket.join(`deployment:${deploymentId}`));
  socket.on("join-admin-live", () => socket.join("admin-live"));
});

connectDB();

/* ---------------- Global middleware ---------------- */
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
// Paystack webhook needs the RAW body to verify its HMAC signature, so this
// must be registered before the global JSON parser below.
app.use("/api/payments/webhooks/paystack", express.raw({ type: "*/*" }));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  })
);

/* ---------------- Health check ---------------- */
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

/* ---------------- Feature routes ---------------- */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/bots", require("./routes/bots.routes"));
app.use("/api/payments", require("./routes/payments.routes"));
app.use("/api/deployment", require("./routes/deployment.routes"));
app.use("/api/feedback", require("./routes/feedback.routes"));
app.use("/api/av-coins", require("./routes/avcoins.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/updates", require("./routes/updates.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/newsletter", require("./routes/newsletter.routes"));

/* ---------------- Generic content routers (Admin-managed simple content) ---------------- */
app.use("/api/hero-slides", crudRouter(HeroSlide, { contentType: "hero-slides" }));
app.use("/api/services", crudRouter(Service, { contentType: "services" }));
app.use("/api/in-touch", crudRouter(InTouchCard, { contentType: "in-touch" }));
app.use("/api/plans", crudRouter(Plan, { contentType: "plans" }));
app.use("/api/testimonials", crudRouter(Testimonial, { contentType: "testimonials" }));
app.use("/api/stay-connected", crudRouter(StayConnectedLink, { contentType: "stay-connected" }));
app.use("/api/footer-links", crudRouter(FooterLink, { contentType: "footer-links" }));
app.use("/api/menu-items", crudRouter(MenuItem, { contentType: "menu-items" }));
app.use("/api/tutorials", crudRouter(Tutorial, { contentType: "tutorials" }));
app.use("/api/banners", crudRouter(Banner, { contentType: "banners" }));
app.use("/api/payment-methods", crudRouter(PaymentMethod, { contentType: "payment-methods" }));
app.use("/api/packages", crudRouter(Package, { contentType: "packages" }));
app.use("/api/deployment-platforms", crudRouter(DeploymentPlatform, { contentType: "deployment-platforms" }));
app.use("/api/deployment-music", crudRouter(DeploymentMusic, { contentType: "deployment-music" }));

/* ---------------- Support (single-document content) ---------------- */
const { protect, adminOnly } = require("./middleware/auth");
const { broadcastContentChange } = require("./utils/liveEvents");
app.get("/api/support", async (req, res) => {
  const support = await Support.findOne();
  res.json(support || {});
});
app.put("/api/support", protect, adminOnly, async (req, res) => {
  const support = (await Support.findOne()) || new Support();
  Object.assign(support, req.body);
  await support.save();
  res.json(support);
  broadcastContentChange(req.app, "support");
});

/* ---------------- 404 + error handler ---------------- */
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[server] Adevos-X Tech API running on port ${PORT}`));

module.exports = { app, io };
