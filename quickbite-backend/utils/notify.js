const nodemailer = require("nodemailer");

// -----------------------------------------------------------------------
// Email transporter
// -----------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// -----------------------------------------------------------------------
// OTP generator
// -----------------------------------------------------------------------

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// -----------------------------------------------------------------------
// Send Email OTP
// -----------------------------------------------------------------------

const sendOtpEmail = async (email, code) => {
  const mailOptions = {
    from: `"QuickBite" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your QuickBite Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account - QuickBite</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border: 1px solid #f1f5f9;">
                
                <!-- Header / Logo -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #ffffff;">
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <span style="background-color: #ff5a36; color: #ffffff; width: 36px; height: 36px; display: inline-block; border-radius: 8px; text-align: center; line-height: 36px; font-weight: bold; font-size: 18px;">⚡</span>
                      <span style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Quick<span style="color: #ff5a36;">Bite</span></span>
                    </div>
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding: 0 32px 32px 32px; text-align: center;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                      Verify Your Account
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                      Thank you for creating your QuickBite culinary profile. Use the verification code below to complete your setup.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                      <span style="font-size: 32px; font-weight: 800; color: #ff5a36; letter-spacing: 8px;">
                        ${code}
                      </span>
                    </div>

                    <!-- Expiry Notice Box -->
                    <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #c2410c; font-weight: 500;">
                        ⏱️ This verification code will expire in <strong>${process.env.OTP_EXPIRES_MINUTES || 5} minutes</strong>.
                      </p>
                    </div>

                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                      If you did not create this account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      &copy; 2026 QuickBite Technologies Inc. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log(`OTP email sent to ${email}`);
  console.log(`Message ID: ${info.messageId}`);

  return true;
};

// -----------------------------------------------------------------------
// SMS
// -----------------------------------------------------------------------

const sendOtpSms = async (phone, code) => {
  console.log(`[MOCK SMS] Sending OTP ${code} to ${phone}`);
  return true;
};

// -----------------------------------------------------------------------
// WhatsApp
// -----------------------------------------------------------------------

const sendOtpWhatsapp = async (phone, code) => {
  console.log(`[MOCK WHATSAPP] Sending OTP ${code} to ${phone}`);
  return true;
};

// -----------------------------------------------------------------------
// Password reset email
// -----------------------------------------------------------------------

const sendResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: `"QuickBite" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your QuickBite Password",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - QuickBite</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border: 1px solid #f1f5f9;">
                
                <!-- Header / Logo -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #ffffff;">
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <span style="background-color: #ff5a36; color: #ffffff; width: 36px; height: 36px; display: inline-block; border-radius: 8px; text-align: center; line-height: 36px; font-weight: bold; font-size: 18px;">⚡</span>
                      <span style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Quick<span style="color: #ff5a36;">Bite</span></span>
                    </div>
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding: 0 32px 32px 32px; text-align: center;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                      Password Reset Request
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                      We received a request to reset the password for your QuickBite account. Click the button below to securely set a new password.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" target="_blank" style="background-color: #ff5a36; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(255, 90, 54, 0.25);">
                            Reset Your Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Notice Box -->
                    <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #c2410c; font-weight: 500;">
                        ⏱️ This secure link will expire in <strong>30 minutes</strong>.
                      </p>
                    </div>

                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                      If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      &copy; 2026 QuickBite Technologies Inc. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);

  console.log(`Password reset email sent to ${email}`);

  return true;
};

// -----------------------------------------------------------------------
// Welcome email
// -----------------------------------------------------------------------

const sendWelcomeEmail = async (email, tempPassword) => {
  const mailOptions = {
    from: `"QuickBite" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to QuickBite",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to QuickBite</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 520px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border: 1px solid #f1f5f9;">
                
                <!-- Header / Logo -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center; background-color: #ffffff;">
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <span style="background-color: #ff5a36; color: #ffffff; width: 36px; height: 36px; display: inline-block; border-radius: 8px; text-align: center; line-height: 36px; font-weight: bold; font-size: 18px;">⚡</span>
                      <span style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Quick<span style="color: #ff5a36;">Bite</span></span>
                    </div>
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding: 0 32px 32px 32px; text-align: center;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                      Welcome to QuickBite!
                    </h2>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                      Your account has been created by an administrator. Here are your temporary login details:
                    </p>

                    <!-- Credentials Box -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
                      <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;">
                        <strong>Email:</strong> ${email}
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #475569;">
                        <strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #0f172a;">${tempPassword}</code>
                      </p>
                    </div>

                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                      Please change your password immediately after signing in for security purposes.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      &copy; 2026 QuickBite Technologies Inc. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);

  console.log(`Welcome email sent to ${email}`);

  return true;
};

module.exports = {
  generateOtp,
  sendOtpEmail,
  sendOtpSms,
  sendOtpWhatsapp,
  sendResetEmail,
  sendWelcomeEmail,
};
