import { Resend } from "resend";
import { logger } from "./logger.js";

// Initialize Resend only if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send an invitation email to a user
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.link - Invitation link
 * @param {string} params.role - Role being invited to
 * @param {string} [params.agencyId] - Agency ID
 * @param {string} [params.inviterName] - Name of the person inviting
 * @param {string} [params.agencyName] - Name of the agency
 */
export const sendInvitationEmail = async ({
  to,
  link,
  role,
  agencyId,
  inviterName,
  agencyName,
}) => {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  // Format role for display
  const roleDisplay = role === "admin" ? "Administrador" : "Miembro";
  const agencyDisplay = agencyName || "la plataforma";

  // Email HTML template
  const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background: linear-gradient(135deg, #13131a 0%, #1a1a25 100%); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.3); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px;">✨</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ¡Has sido invitado!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0 0 16px; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
                ${inviterName ? `<strong style="color: #ffffff;">${inviterName}</strong> te ha invitado a unirte a` : 'Has sido invitado a unirte a'}
              </p>
              <p style="margin: 0 0 24px; color: #8b5cf6; font-size: 20px; font-weight: 600; text-align: center;">
                ${agencyDisplay}
              </p>
              
              <!-- Role badge -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="display: inline-block; padding: 8px 16px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; color: #a78bfa; font-size: 14px; font-weight: 500;">
                  Rol: ${roleDisplay}
                </span>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center;">
                <a href="${link}" 
                   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
                  Aceptar Invitación
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid rgba(139, 92, 246, 0.2);">
              <p style="margin: 0 0 8px; color: #71717a; font-size: 13px; text-align: center;">
                Si no esperabas esta invitación, puedes ignorar este email.
              </p>
              <p style="margin: 0; color: #52525b; font-size: 12px; text-align: center;">
                Este enlace expira en 7 días.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    // Console mode (development)
    if (provider === "console" || !resend) {
      logger.info(
        `[Email] Invitation -> ${to} | role=${role} | agency=${agencyId} | by=${inviterName} | link=${link}`,
      );
      
      // If RESEND_API_KEY is not set, log a warning
      if (!resend && provider !== "console") {
        logger.warn("RESEND_API_KEY not configured. Set EMAIL_PROVIDER=console in dev or add RESEND_API_KEY for production.");
      }
      
      return { ok: true, mode: "console" };
    }

    // Resend mode (production)
    if (provider === "resend" && resend) {
      const result = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `${inviterName ? inviterName + ' te' : 'Te'} ha invitado a ${agencyDisplay}`,
        html: emailHtml,
      });

      if (result.error) {
        logger.error("Resend email error", { error: result.error });
        throw new Error(result.error.message);
      }

      logger.info(`[Email] Invitation sent via Resend -> ${to} | id=${result.data?.id}`);
      return { ok: true, mode: "resend", id: result.data?.id };
    }

    // Fallback
    logger.warn(`Unknown EMAIL_PROVIDER: ${provider}. Falling back to console.`);
    logger.info(`[Email] Invitation -> ${to} | link=${link}`);
    return { ok: true, mode: "console" };

  } catch (err) {
    logger.error("Error sending invitation email", { error: err.message, to });
    throw err;
  }
};

/**
 * Send a generic notification email
 */
export const sendNotificationEmail = async ({ to, subject, html, text }) => {
  const provider = process.env.EMAIL_PROVIDER || "console";
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  try {
    if (provider === "console" || !resend) {
      logger.info(`[Email] Notification -> ${to} | subject=${subject}`);
      return { ok: true, mode: "console" };
    }

    if (provider === "resend" && resend) {
      const result = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      logger.info(`[Email] Notification sent -> ${to} | id=${result.data?.id}`);
      return { ok: true, mode: "resend", id: result.data?.id };
    }

    return { ok: true, mode: "console" };

  } catch (err) {
    logger.error("Error sending notification email", { error: err.message, to });
    throw err;
  }
};
