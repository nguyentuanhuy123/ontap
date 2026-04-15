// utils/emailTemplate.js
const resetPasswordTemplate = (link) => {
  return `
  <div style="font-family: Arial; background:#0f172a; padding:40px; color:white;">
    <div style="max-width:500px;margin:auto;background:#1e293b;padding:30px;border-radius:10px;">
      
      <h2 style="text-align:center;">🔐 Reset your password</h2>

      <p>Looks like you forgot your password.</p>

      <p>Click the button below to reset it:</p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${link}" 
           style="background:#5865f2;color:white;padding:12px 20px;
                  text-decoration:none;border-radius:5px;font-weight:bold;">
          Reset Password
        </a>
      </div>

      <p style="font-size:12px;color:#94a3b8;">
        This link will expire in 15 minutes.
      </p>

      <p style="font-size:12px;color:#94a3b8;">
        If you didn't request this, ignore this email.
      </p>

    </div>
  </div>
  `;
};

// utils/emailTemplate.js

const otpEmailTemplate = (otp) => {
  return `
  <div style="font-family: Arial; background:#0f172a; padding:40px; color:white;">
    <div style="max-width:500px;margin:auto;background:#1e293b;padding:30px;border-radius:10px;">
      
      <h2 style="text-align:center;">🔐 Verify your login</h2>

      <p>We detected a login attempt to your account.</p>

      <p>Please use the OTP code below to continue:</p>

      <div style="text-align:center;margin:30px 0;">
        <span style="
          display:inline-block;
          background:#5865f2;
          color:white;
          padding:15px 25px;
          font-size:24px;
          letter-spacing:4px;
          border-radius:8px;
          font-weight:bold;
        ">
          ${otp}
        </span>
      </div>

      <p style="text-align:center; font-size:14px;">
        This code will expire in <b>5 minutes</b>.
      </p>

      <p style="font-size:12px;color:#94a3b8;">
        If this wasn't you, please secure your account immediately.
      </p>

    </div>
  </div>
  `;
};

module.exports = { resetPasswordTemplate, otpEmailTemplate };