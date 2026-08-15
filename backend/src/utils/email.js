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

// Notifies the admin (ADMIN_NOTIFICATION_EMAIL) by email when a user submits
// manual payment proof — this is the "user's submission reaches me via email"
// flow: the email comes FROM the platform's configured sender, addressed
// TO the admin, but includes the user's own email as the reply-to so the
// admin can respond to that person directly if needed.
async function notifyAdminOfManualPaymentEmail({ user, transaction }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail || !isConfigured()) {
    console.log("[email] ADMIN_NOTIFICATION_EMAIL not set or SMTP not configured — skipping admin email.");
    return null;
  }
  const transport = getTransport();
  return transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    replyTo: user.email,
    subject: `New manual payment submitted — ${user.name}`,
    html: `
      <p>A user submitted proof of a manual payment and is waiting for review.</p>
      <ul>
        <li><b>User:</b> ${user.name} (${user.email})</li>
        <li><b>Plan:</b> ${transaction.plan} — ${transaction.durationWeeks} weeks</li>
        <li><b>Amount:</b> ${transaction.amount} ${transaction.currency}</li>
        <li><b>Reference:</b> ${transaction.proofReference || "(screenshot only, no reference typed)"}</li>
      </ul>
      <p>Review and confirm it in the Admin App under Payment → Pending payments.</p>
    `,
  });
}

module.exports = {
  isConfigured, sendEmail, sendFeedbackConfirmation, sendPaymentConfirmedEmail,
  notifyAdminOfManualPaymentEmail,
};
