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
<body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #161E2E; border-radius: 12px; overflow: hidden; border: 1px solid #2D3748; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #E4B010 0%, #40D459 100%); height: 5px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 36px; background-color: #111827; border-bottom: 1px solid #1F2937;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; text-transform: uppercase;">
                      POCO<span style="color: #40D459;">TECH</span>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">
                      Admin Support Notification
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(228, 176, 16, 0.15); border: 1px solid #E4B010; color: #E4B010; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">
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
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #F9FAFB;">
                Hello Admin,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
                A new support request message has been submitted on the <strong style="color: #E2E8F0;">POCOTECH Troubleshooting Platform</strong>.
              </p>

              <!-- User Information Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0D1117; border-radius: 8px; border: 1px solid #1F2937; margin-bottom: 24px; padding: 16px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #40D459; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                      👤 User Information
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #9CA3AF; width: 100px;">Name:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #F9FAFB; font-weight: 600;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #9CA3AF;">Email:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #40D459; font-weight: 600;">${email}</td>
                      </tr>
                      ${
                        phone
                          ? `<tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #9CA3AF;">Phone:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #F9FAFB;">${phone}</td>
                      </tr>`
                          : ""
                      }
                      ${
                        subject
                          ? `<tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #9CA3AF;">Subject:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #E4B010; font-weight: 600;">${subject}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #9CA3AF;">Time:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #9CA3AF;">${submittedAt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- User Message Box -->
              <div style="background-color: #0D1117; border: 1px solid #E4B010; border-left: 4px solid #E4B010; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #E4B010; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  💬 Message:
                </div>
                <div style="font-size: 14px; color: #FFFFFF; line-height: 1.6;">
                  ${message}
                </div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                You can reply directly to the user at <a href="mailto:${email}" style="color: #40D459; text-decoration: none;">${email}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #111827; border-top: 1px solid #1F2937; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4B5563;">
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
