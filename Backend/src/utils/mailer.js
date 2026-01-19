const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Khai báo host cụ thể
  port: 587,              // Dùng port 587 (TLS) thay vì 465 (SSL) để tránh timeout
  secure: false,          // false cho port 587, true cho port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // ⚠️ Bắt buộc phải là App Password
  },
  tls: {
    // 👇 Dòng này cực quan trọng trên Render để không bị lỗi kết nối
    rejectUnauthorized: false
  }
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

exports.sendResetPasswordEmail = async ({ to, name, resetUrl }) => {
  const subject = "Đặt lại mật khẩu - Lumière Bistro";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Xin chào ${name || ""},</h2>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
      <p>Bấm nút bên dưới để đặt lại mật khẩu (link có hiệu lực 15 phút):</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 18px;
                  background:#f97316;color:#fff;text-decoration:none;border-radius:8px">
          Đặt lại mật khẩu
        </a>
      </p>
      <p style="color:#666;font-size:13px">
        Nếu bạn không yêu cầu, hãy bỏ qua email này.
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
