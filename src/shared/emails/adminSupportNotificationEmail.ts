export const adminSupportNotificationEmail = (
  name: string,
  email: string,
  phone: string | undefined,
  subject: string | undefined,
  message: string,
  submittedAt: string
) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Message - POCOTECH Admin Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0F172A;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #D97706 0%, #16A34A 100%); height: 5px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 36px; background-color: #FFFFFF; border-bottom: 1px solid #E2E8F0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
                      POCO<span style="color: #16A34A;">TECH</span>
                    </div>
                    <div style="font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      Admin Support Notification
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #FEF3C7; border: 1px solid #F59E0B; color: #B45309; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px; letter-spacing: 0.5px;">
                      📩 NEW SUPPORT INQUIRY
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0F172A;">
                Hello Admin,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                A new support request message has been submitted on the <strong style="color: #0F172A;">POCOTECH Troubleshooting Platform</strong>.
              </p>

              <!-- User Information Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 24px; padding: 16px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #16A34A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      👤 User Information
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748B; width: 100px;">Name:</td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0F172A; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748B;">Email:</td>
                        <td style="padding: 5px 0; font-size: 13px; color: #16A34A; font-weight: 600;">${email}</td>
                      </tr>
                      ${
                        phone
                          ? `<tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748B;">Phone:</td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0F172A;">${phone}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        subject
                          ? `<tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748B;">Subject:</td>
                        <td style="padding: 5px 0; font-size: 13px; color: #D97706; font-weight: 600;">${subject}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748B;">Time:</td>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748B;">${submittedAt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- User Message Box -->
              <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-left: 4px solid #D97706; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  💬 Message:
                </div>
                <div style="font-size: 14px; color: #1E293B; line-height: 1.6;">
                  ${message}
                </div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                You can reply directly to the user at <a href="mailto:${email}" style="color: #16A34A; text-decoration: none; font-weight: 600;">${email}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                Automated System Notification — POCOTECH Troubleshooting Services
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
  return html;
};
