const mailer = require('../config/mailer');

// Names (and, in principle, any other user-supplied field) end up interpolated
// into these HTML email bodies - escape them so a submitted name like
// "<a href=evil>click</a>" can't inject markup or a spoofed link into an
// email our own system sends out.
const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const send = (to, subject, html) => mailer.sendMail({ from: process.env.SMTP_FROM, to, subject, html });

const sendVisitRejectedEmail = async (to, name) => {
    return send(
        to,
        'Your parking lot listing request',
        `<p>Hi ${escapeHtml(name)},</p>
         <p>Thanks for your interest in listing your lot with us. After review, we won't be moving forward with your request at this time.</p>`
    );
};

const sendVisitApprovedExistingAccountEmail = async (to, name) => {
    return send(
        to,
        'Your parking lot listing request was approved',
        `<p>Hi ${escapeHtml(name)},</p>
         <p>Good news — your request to list your lot has been approved. Since you already have an account with us, just log in to get started: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a>.</p>`
    );
};

const sendVisitApprovedNewAccountEmail = async (to, name, setPasswordUrl) => {
    return send(
        to,
        'Your parking lot listing request was approved',
        `<p>Hi ${escapeHtml(name)},</p>
         <p>Good news — your request to list your lot has been approved. Set a password for your new business account to get started:</p>
         <p><a href="${setPasswordUrl}">${setPasswordUrl}</a></p>
         <p>This link expires in 24 hours.</p>`
    );
};

module.exports = {
    sendVisitRejectedEmail,
    sendVisitApprovedExistingAccountEmail,
    sendVisitApprovedNewAccountEmail,
};
