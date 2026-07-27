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
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0F172A;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #16A34A 0%, #D97706 100%); height: 5px;"></td>
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
                      Support & Troubleshooting Ticket Response
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #DCFCE7; border: 1px solid #22C55E; color: #15803D; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px; letter-spacing: 0.5px;">
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
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0F172A;">
                Hello <strong>${userName || "Valued User"}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                An engineer from the POCOTECH Troubleshooting Team has responded to your inquiry regarding 
                <strong style="color: #16A34A;">${subcategoryTitle}</strong>.
              </p>

              <!-- Your Original Question -->
              <div style="background-color: #F8FAFC; border-left: 3px solid #94A3B8; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                  Your Question:
                </div>
                <div style="font-size: 13px; color: #334155; line-height: 1.5; font-style: italic;">
                  "${questionDescription}"
                </div>
              </div>

              <!-- Admin Reply Box -->
              <div style="background-color: #F0FDF4; border: 1px solid #22C55E; border-left: 4px solid #16A34A; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #15803D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  💬 Admin Response:
                </div>
                <div style="font-size: 14px; color: #0F172A; line-height: 1.6;">
                  ${adminReply}
                </div>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                If you have further questions, feel free to submit another request from your POCOTECH Troubleshooting app.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748B;">
                POCOTECH Systems Troubleshooting Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
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
