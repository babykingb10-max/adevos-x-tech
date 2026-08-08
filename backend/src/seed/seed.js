// Fills the database with placeholder ("fake") content so the site is never empty
// on first launch. Everything here is fully editable afterwards from the Admin App.
//
// IMPORTANT — idempotent by design: each collection is only seeded if it is
// currently EMPTY. Running `npm run seed` again after you've customized
// content (e.g. edited a bot's description) will NOT overwrite your edits —
// it only fills in whatever is still empty. Use `npm run seed:destroy` then
// `npm run seed` if you deliberately want to reset everything back to defaults.
//
// Usage:
//   npm run seed            -> populate anything still empty
//   npm run seed:destroy    -> wipe all seeded collections
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const {
  User, HeroSlide, Service, InTouchCard, Plan, Bot,
  PaymentMethod, Package, DeploymentPlatform, DeploymentMusic,
  Support, Testimonial, StayConnectedLink, FooterLink, MenuItem, Update, Tutorial, Banner,
} = require("../models");

const IMG = (seed, w = 800, h = 500) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Only inserts `docs` into `Model` if the collection is currently empty —
// this is what makes re-running the seed script safe.
async function seedIfEmpty(Model, docs, label) {
  const count = await Model.countDocuments();
  if (count > 0) {
    console.log(`[seed] ${label}: already has ${count} document(s), skipping.`);
    return;
  }
  await Model.insertMany(docs);
  console.log(`[seed] ${label}: inserted ${docs.length} placeholder document(s).`);
}

async function seed() {
  await connectDB();

  if (process.argv.includes("--destroy")) {
    await Promise.all([
      HeroSlide.deleteMany(), Service.deleteMany(), InTouchCard.deleteMany(), Plan.deleteMany(),
      Bot.deleteMany(), PaymentMethod.deleteMany(), Package.deleteMany(),
      DeploymentPlatform.deleteMany(), DeploymentMusic.deleteMany(),
      Support.deleteMany(), Testimonial.deleteMany(), StayConnectedLink.deleteMany(),
      FooterLink.deleteMany(), MenuItem.deleteMany(), Update.deleteMany(), Tutorial.deleteMany(),
      Banner.deleteMany(),
    ]);
    console.log("[seed] All seeded collections cleared.");
    process.exit(0);
  }

  /* ---------------- Admin account ---------------- */
  const adminEmail = `${process.env.ADMIN_USERNAME || "admin"}@admin.local`;
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10),
      role: "admin",
    });
    console.log("[seed] Admin account created:", adminEmail);
  } else {
    console.log("[seed] Admin account already exists, skipping.");
  }

  await seedIfEmpty(HeroSlide, [
    {
      heading: "Deploy by using AV Coins",
      description: "Earn coins through referrals and deploy your first bot without spending a cent.",
      imageUrl: IMG("hero1"),
      buttonLabel: "Learn More",
      actionType: "internal", actionTarget: "/av-coins", order: 1,
    },
    {
      heading: "Watch step by step tutorials",
      description: "New here? Follow our guided videos and get your bot running in minutes.",
      imageUrl: IMG("hero2"),
      buttonLabel: "Explore tutorials",
      actionType: "internal", actionTarget: "popup:tutorials", order: 2,
    },
    {
      heading: "24/7 Community support",
      description: "Join thousands of builders getting fast answers from our team and community.",
      imageUrl: IMG("hero3"),
      buttonLabel: "Join now",
      actionType: "internal", actionTarget: "#support", order: 3,
    },
    {
      heading: "Deploy unlimited bots with Deployer plan",
      description: "Scale past one bot — host as many numbers and platforms as you need.",
      imageUrl: IMG("hero4"),
      buttonLabel: "View plan",
      actionType: "internal", actionTarget: "/bots?plan=deployer", order: 4,
    },
  ], "HeroSlide");

  await seedIfEmpty(Service, [
    { icon: "code", heading: "Web Development", description: "Custom websites and apps built with modern stacks, optimized for speed and scale.", order: 1 },
    { icon: "whatsapp", heading: "WhatsApp Bots", description: "Powerful automated bots for business, customer service, and entertainment.", order: 2 },
    { icon: "rocket", heading: "Bot Deployment", description: "Seamless hosting and deployment for your bots across multiple platforms.", order: 3 },
    { icon: "brain", heading: "AI Solutions", description: "Custom AI integrations and automation tailored to your workflow.", order: 4 },
    { icon: "telegram", heading: "Telegram Bots", description: "High-speed Telegram integrations for communities and businesses.", order: 5 },
    { icon: "shield", heading: "Cyber Security", description: "Protect your digital assets with proactive monitoring and defense.", order: 6 },
  ], "Service");

  await seedIfEmpty(InTouchCard, [
    { heading: "Deploy bot", description: "Get your bot live in minutes.", buttonLabel: "Deploy now", actionType: "popup", actionTarget: "smart:deploy", order: 1 },
    { heading: "Watch tutorials", description: "Learn how everything works.", buttonLabel: "Watch", actionType: "popup", actionTarget: "tutorials", order: 2 },
    { heading: "Send your feedback", description: "Tell us what to improve.", buttonLabel: "Send", actionType: "popup", actionTarget: "feedback", order: 3 },
    { heading: "Deployer plan", description: "Unlock unlimited bot deployments.", buttonLabel: "View plan", actionType: "internal_link", actionTarget: "/bots?plan=deployer", order: 4 },
    { heading: "Updates", description: "See what's new on Adevos-X Tech.", buttonLabel: "View updates", actionType: "popup", actionTarget: "updates", order: 5 },
    { heading: "Developer", description: "Reach out to the team directly.", buttonLabel: "Contact", actionType: "contact", actionTarget: "hello@adevosxtech.com", order: 6 },
  ], "InTouchCard");

  await seedIfEmpty(Plan, [
    { key: "user", heading: "User plan", description: "Perfect for individuals deploying a single bot.", features: ["1 active bot", "Standard support", "Pay with AV Coins or cash"] },
    { key: "deployer", heading: "Deployer plan", description: "For power users and resellers deploying multiple bots.", features: ["Unlimited active bots", "Priority support", "Access to all platforms"] },
  ], "Plan");

  await seedIfEmpty(Bot, [
    {
      name: "Adevos Min-Bot", slug: "adevos-min-bot",
      description: "A free, no-cost WhatsApp bot to get you started instantly.",
      author: "Adevos", imageUrl: IMG("minbot", 800, 450),
      isFree: true, freeWebsiteUrl: "https://minbot.adevosxtech.com",
      badge: "none", order: 1,
    },
    {
      name: "Adevos-X Bot", slug: "adevos-x-bot",
      description: "Multi-Device Popular WhatsApp bot with rich features.",
      author: "Adevos", imageUrl: IMG("xbot", 800, 450),
      githubRepoUrl: "https://github.com/adevos/adevos-x-bot",
      pairSiteUrl: "https://pair.adevosxtech.com/x-bot",
      badge: "popular", ratingAverage: 8.0, ratingCount: 214, order: 2,
    },
    {
      name: "Adevos Nova Bot", slug: "adevos-nova-bot",
      description: "Lightweight bot focused on speed and low resource usage.",
      author: "Adevos", imageUrl: IMG("novabot", 800, 450),
      githubRepoUrl: "https://github.com/adevos/nova-bot",
      pairSiteUrl: "https://pair.adevosxtech.com/nova-bot",
      availableForPlans: ["deployer"], badge: "new", ratingAverage: 6.5, ratingCount: 42, order: 3,
    },
    {
      name: "Adevos Sentinel Bot", slug: "adevos-sentinel-bot",
      description: "Security-focused bot with anti-spam and group moderation.",
      author: "Adevos", imageUrl: IMG("sentinelbot", 800, 450),
      githubRepoUrl: "https://github.com/adevos/sentinel-bot",
      pairSiteUrl: "https://pair.adevosxtech.com/sentinel-bot",
      availableForPlans: ["deployer"], badge: "beta", ratingAverage: 7.2, ratingCount: 58, order: 4,
    },
  ], "Bot");

  await seedIfEmpty(PaymentMethod, [
    { key: "av_coins", label: "AV Coins", icon: "coin", availableForPlans: ["user"] },
    { key: "manual", label: "Manual Payment", icon: "banknote", availableForPlans: ["user", "deployer"] },
    { key: "paystack", label: "Paystack", icon: "credit-card", availableForPlans: ["user", "deployer"] },
    { key: "paypal", label: "PayPal", icon: "paypal", availableForPlans: ["user", "deployer"] },
  ], "PaymentMethod");

  await seedIfEmpty(Package, [
    { plan: "user", durationWeeks: 2, priceCoins: 200, priceUSD: 3, order: 1 },
    { plan: "user", durationWeeks: 4, priceCoins: 350, priceUSD: 5, order: 2 },
    { plan: "user", durationWeeks: 8, priceCoins: 600, priceUSD: 9, order: 3 },
    { plan: "deployer", durationWeeks: 2, priceUSD: 8, order: 1 },
    { plan: "deployer", durationWeeks: 4, priceUSD: 15, order: 2 },
    { plan: "deployer", durationWeeks: 8, priceUSD: 26, order: 3 },
  ], "Package");

  await seedIfEmpty(DeploymentPlatform, [
    { name: "Heroku", icon: "cloud-upload", apiIdentifier: "heroku", badge: "recommended", order: 1 },
    { name: "Railway", icon: "bolt", apiIdentifier: "railway", badge: "none", order: 2 },
    { name: "Render", icon: "rocket", apiIdentifier: "render", badge: "slow", order: 3 },
  ], "DeploymentPlatform");

  await seedIfEmpty(DeploymentMusic, [
    { title: "Lo-Fi Focus", artist: "Adevos Beats", url: "https://example.com/audio/lofi-focus.mp3", order: 1 },
    { title: "Deploy Vibes", artist: "Adevos Beats", url: "https://example.com/audio/deploy-vibes.mp3", order: 2 },
  ], "DeploymentMusic");

  const supportCount = await Support.countDocuments();
  if (supportCount === 0) {
    await Support.create({
      description: "You need to get a quick response from Admins? Join our community and channels — our team and fellow builders are online around the clock.",
      communityUrl: "https://t.me/adevosxtech_community",
      whatsappUrl: "https://wa.me/255700000000",
      telegramUrl: "https://t.me/adevosxtech",
    });
    console.log("[seed] Support: created placeholder document.");
  } else {
    console.log("[seed] Support: already exists, skipping.");
  }

  await seedIfEmpty(Testimonial, [
    { name: "Elena R., CTO", message: "Adevos-X Tech made deploying our WhatsApp bot painless — genuinely futuristic tech.", order: 1 },
    { name: "James K., Founder", message: "The AV Coins system got us testing for free before we committed to a plan.", order: 2 },
    { name: "Maria T., Product Lead", message: "Support responds fast on Telegram — best experience we've had with a bot platform.", order: 3 },
  ], "Testimonial");

  await seedIfEmpty(StayConnectedLink, [
    { platform: "twitter", icon: "twitter", url: "https://twitter.com/adevosxtech", order: 1 },
    { platform: "whatsapp", icon: "whatsapp", url: "https://wa.me/255700000000", order: 2 },
    { platform: "youtube", icon: "youtube", url: "https://youtube.com/@adevosxtech", order: 3 },
    { platform: "facebook", icon: "facebook", url: "https://facebook.com/adevosxtech", order: 4 },
    { platform: "instagram", icon: "instagram", url: "https://instagram.com/adevosxtech", order: 5 },
    { platform: "telegram", icon: "telegram", url: "https://t.me/adevosxtech", order: 6 },
    { platform: "tiktok", icon: "tiktok", url: "https://tiktok.com/@adevosxtech", order: 7 },
  ], "StayConnectedLink");

  await seedIfEmpty(FooterLink, [
    { group: "services", label: "Web Development", url: "#services", order: 1 },
    { group: "services", label: "WhatsApp Bots", url: "#services", order: 2 },
    { group: "services", label: "Bot Deployment", url: "#services", order: 3 },
    { group: "services", label: "AI Solutions", url: "#services", order: 4 },
    { group: "company", label: "About Us", url: "/about", order: 1 },
    { group: "company", label: "Our Team", url: "/team", order: 2 },
    { group: "legal", label: "Privacy Policy", url: "/privacy", order: 1 },
    { group: "legal", label: "Terms of Use", url: "/terms", order: 2 },
    { group: "resources", label: "Docs", url: "/docs", order: 1 },
    { group: "resources", label: "Tutorials", url: "popup:tutorials", order: 2 },
  ], "FooterLink");

  await seedIfEmpty(MenuItem, [
    { label: "Home", icon: "home", subItems: [{ label: "Dashboard", icon: "dashboard", destination: "/", order: 1 }], order: 1 },
    { label: "Updates", icon: "bell", subItems: [{ label: "Latest News", icon: "newspaper", destination: "popup:updates", order: 1 }], order: 2 },
    {
      label: "Bot Deployment", icon: "cloud-upload",
      subItems: [
        { label: "Deploy bot", icon: "rocket", destination: "smart:deploy", order: 1 },
        { label: "Available bots", icon: "code", destination: "popup:plan_select", order: 2 },
        { label: "Manage your bot", icon: "key", destination: "/bot-management", order: 3 },
      ],
      order: 3,
    },
    { label: "AV Coins", icon: "coin", destination: "/av-coins", order: 4 },
    {
      label: "Tutorials", icon: "graduation-cap",
      subItems: [
        { label: "How to get a free bot", icon: "gift", destination: "tutorial:free-bot", order: 1 },
        { label: "How to deploy WhatsApp Bot", icon: "whatsapp", destination: "tutorial:deploy-whatsapp", order: 2 },
        { label: "How to get Telegram bot", icon: "telegram", destination: "tutorial:telegram-bot", order: 3 },
      ],
      order: 5,
    },
    { label: "Feedback", icon: "message-square", subItems: [{ label: "Send your response", icon: "send", destination: "popup:feedback", order: 1 }], order: 6 },
    { label: "My Account", icon: "user-circle", destination: "popup:account", order: 7 },
  ], "MenuItem");

  await seedIfEmpty(Update, [
    { heading: "Welcome to Adevos-X Tech", description: "Your account is ready — explore bots, deploy instantly, and earn AV Coins through referrals." },
    { heading: "New platform added: Railway", description: "You can now deploy bots to Railway in addition to Heroku and Render." },
    { heading: "Referral bonus increased", description: "Earn more AV Coins for every friend who joins using your referral link." },
  ], "Update");

  await seedIfEmpty(Tutorial, [
    { title: "How to get a free bot", videoUrl: "https://example.com/videos/free-bot.mp4", icon: "gift", order: 1 },
    { title: "How to deploy WhatsApp Bot", videoUrl: "https://example.com/videos/deploy-whatsapp.mp4", icon: "whatsapp", order: 2 },
    { title: "How to get Telegram bot", videoUrl: "https://example.com/videos/telegram-bot.mp4", icon: "telegram", order: 3 },
    { title: "How to create Deployer account", videoUrl: "https://example.com/videos/deployer-account.mp4", icon: "key", order: 4 },
  ], "Tutorial");

  await seedIfEmpty(Banner, [
    { key: "sign_in_intro", title: "Welcome", body: "To continue with Adevos-X Tech, sign in or create an account." },
    { key: "plan_choosing_intro", title: "Choose your plan", body: "Pick the plan that fits how many bots you want to run." },
  ], "Banner");

  console.log("[seed] Done. Anything already present was left untouched.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
