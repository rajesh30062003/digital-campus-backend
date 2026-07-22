import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
    console.log("📬 Email service: Real SMTP Transporter initialized");
  } else {
    console.log("⚠️  Email service: SMTP environment variables are missing. Transactional emails will fall back to console logs.");
  }

  return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const { to, subject, text, html } = options;
  const activeTransporter = getTransporter();

  const from = process.env.SMTP_FROM || '"Digital Campus ERP" <no-reply@campus.edu>';

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`✉️  Email successfully sent to: ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      return false;
    }
  } else {
    // Elegant fallback logger so developers/previewers see what was sent
    console.log("\n============================================================");
    console.log("✉️  SIMULATED EMAIL LOG");
    console.log("------------------------------------------------------------");
    console.log(`From:    ${from}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Text:    ${text}`);
    if (html) console.log(`HTML:    ${html}`);
    console.log("============================================================\n");
    return true;
  }
};
