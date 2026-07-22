export const questionAnswerEmail = (
  userName: string,
  subcategoryTitle: string,
  questionDescription: string,
  adminReply: string
) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Answer - POCOTECH Troubleshooting</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #161E2E; border-radius: 12px; overflow: hidden; border: 1px solid #2D3748; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #40D459 0%, #E4B010 100%); height: 5px;"></td>
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
                      Support & Troubleshooting Ticket Response
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(64, 212, 89, 0.15); border: 1px solid #40D459; color: #40D459; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">
                      ✓ ANSWERED
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
                Hello <strong>${userName || "Valued User"}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
                An engineer from the POCOTECH Troubleshooting Team has responded to your inquiry regarding 
                <strong style="color: #40D459;">${subcategoryTitle}</strong>.
              </p>

              <!-- Your Original Question -->
              <div style="background-color: #0D1117; border-left: 3px solid #6B7280; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; margin-bottom: 6px;">
                  Your Question:
                </div>
                <div style="font-size: 13px; color: #D1D5DB; line-height: 1.5; font-style: italic;">
                  "${questionDescription}"
                </div>
              </div>

              <!-- Admin Reply Box -->
              <div style="background-color: #0D1117; border: 1px solid #40D459; border-left: 4px solid #40D459; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #40D459; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  💬 Admin Response:
                </div>
                <div style="font-size: 14px; color: #FFFFFF; line-height: 1.6;">
                  ${adminReply}
                </div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                If you have further questions, feel free to submit another request from your POCOTECH Troubleshooting app.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #111827; border-top: 1px solid #1F2937; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">
                POCOTECH Systems Troubleshooting Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #4B5563;">
                This is an automated response notification.
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
