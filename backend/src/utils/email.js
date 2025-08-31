import { logger } from './logger.js';

// Simple placeholder mailer. Replace with real provider (SMTP/Resend/Postmark).
export const sendInvitationEmail = async ({ to, link, role, agencyId, inviterName }) => {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  try {
    if (provider === 'console') {
      logger.info(`[Email] Invitation -> ${to} | role=${role} | agency=${agencyId} | by=${inviterName} | link=${link}`);
      return { ok: true };
    }
    // Example for future SMTP integration (nodemailer):
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: Number(process.env.SMTP_PORT || 587),
    //   secure: false,
    //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // });
    // await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: 'Invitación', html: `...` });
    logger.warn('EMAIL_PROVIDER set but no implementation; falling back to console log.');
    logger.info(`[Email] Invitation -> ${to} | link=${link}`);
    return { ok: true };
  } catch (err) {
    logger.error('Error sending email', { error: err.message });
    throw err;
  }
};
