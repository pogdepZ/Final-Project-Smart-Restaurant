const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",         
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendVerifyEmail = async ({ to, name, verifyUrl }) => {
  const subject = "Xác thực email - Lumière Bistro";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Xin chào ${name || ""},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại <b>Lumière Bistro</b>.</p>
      <p>Vui lòng bấm nút bên dưới để xác thực email:</p>

      <p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 18px;
                  background:#f97316;color:#fff;
                  text-decoration:none;border-radius:8px">
          Xác thực email
        </a>
      </p>

      <p style="color:#666;font-size:13px">
        Link có hiệu lực trong 15 phút.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
};
