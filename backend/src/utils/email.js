const nodemailer = require("nodemailer");

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendEmail(to, subject, html) {
  if (!isConfigured()) {
    console.log("[email] Not configured — skipping email to", to, subject);
    return null;
  }
  const transport = getTransport();
  return transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendFeedbackConfirmation(to, name) {
  return sendEmail(
    to,
    "We received your feedback — Adevos-X Tech",
    `<p>Hi ${name},</p><p>Thanks for reaching out — our team will review your message and get back to you soon.</p><p>— Adevos-X Tech</p>`
  );
}

async function sendPaymentConfirmedEmail(to, name, plan, durationWeeks) {
  return sendEmail(
    to,
    "Payment confirmed — Adevos-X Tech",
    `<p>Hi ${name},</p><p>Your payment for the <b>${plan}</b> plan (${durationWeeks} weeks) has been confirmed. You can now deploy your bot.</p><p>— Adevos-X Tech</p>`
  );
}

module.exports = { isConfigured, sendEmail, sendFeedbackConfirmation, sendPaymentConfirmedEmail };
