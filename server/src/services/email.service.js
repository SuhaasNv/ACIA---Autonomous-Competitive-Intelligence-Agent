const nodemailer = require('nodemailer');
const { env } = require('../config/env');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;

    transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    return transporter;
}

/**
 * Sends a one-shot alert email when a scan detects a significant pricing change.
 * Best-effort: never throws - a failed send must never break the scan response.
 */
async function sendChangeAlert(toEmail, competitorName, classification, insight) {
    const t = getTransporter();
    if (!t) {
        console.warn('[Email] SMTP not configured - skipping change alert');
        return;
    }
    if (!toEmail) {
        console.warn('[Email] No recipient email - skipping change alert');
        return;
    }

    try {
        await t.sendMail({
            from: env.SMTP_FROM || env.SMTP_USER,
            to: toEmail,
            subject: `Signal: ${competitorName} pricing changed - ${classification}`,
            text: `${competitorName} just had a material pricing change.\n\nClassification: ${classification}\n\n${insight}\n\nOpen your dashboard for the full delta.`,
            html: `<p><strong>${competitorName}</strong> just had a material pricing change.</p>
<p><strong>Classification:</strong> ${classification}</p>
<p>${insight}</p>
<p><a href="${env.FRONTEND_URL || ''}/dashboard">Open your dashboard</a> for the full delta.</p>`,
        });
        console.log(`[Email] Change alert sent to ${toEmail}`);
    } catch (err) {
        console.error('[Email] Failed to send change alert:', err.message);
    }
}

module.exports = { sendChangeAlert };
