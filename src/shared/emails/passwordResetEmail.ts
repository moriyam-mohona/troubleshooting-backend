export const passwordResetEmail = (otp: string) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - POCOTECH Troubleshooting</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #161E2E; border-radius: 12px; overflow: hidden; border: 1px solid #2D3748; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Diagnostic Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #E4B010 0%, #40D459 100%); height: 5px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; background-color: #111827; border-bottom: 1px solid #1F2937;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase;">
                      POCO<span style="color: #40D459;">TECH</span>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">
                      System Diagnostic & Troubleshooting
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(228, 176, 16, 0.15); border: 1px solid #E4B010; color: #E4B010; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px;">
                      🔑 PASSWORD RESET
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 36px 40px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #F9FAFB;">
                Password Reset Request
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
                We received a request to override your credentials on the <strong style="color: #E2E8F0;">POCOTECH Troubleshooting Console</strong>. Use the secure authorization code below to proceed with password reset:
              </p>

              <!-- Code Box Container -->
              <div style="background-color: #0D1117; border: 1.5px solid #E4B010; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 28px; box-shadow: 0 0 15px rgba(228, 176, 16, 0.1);">
                <div style="font-size: 11px; font-weight: 600; color: #E4B010; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                  RESET AUTHORIZATION OTP
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #E4B010; letter-spacing: 10px; padding-left: 10px; text-shadow: 0 0 12px rgba(228, 176, 16, 0.3);">
                  ${otp}
                </div>
                <div style="font-size: 12px; color: #6B7280; margin-top: 12px;">
                  ⏱️ Valid for <strong style="color: #40D459;">10 minutes only</strong>
                </div>
              </div>

              <!-- Diagnostic Caution Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(64, 212, 89, 0.08); border-left: 4px solid #40D459; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 13px; font-weight: 600; color: #40D459; margin-bottom: 4px;">
                      🛡️ Security Status
                    </div>
                    <div style="font-size: 12px; color: #D1D5DB; line-height: 1.5;">
                      If you did not request a password reset, no action is required. Your current password remains secure and active.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                For unauthorized reset attempts, report this incident immediately to your system administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #111827; border-top: 1px solid #1F2937; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #6B7280;">
                POCOTECH Systems Diagnostic & Troubleshooting Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #4B5563;">
                This is an automated security system notification.
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
