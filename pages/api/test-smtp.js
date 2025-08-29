import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Nastavení transportéru pro iCloud
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

 console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "********" : undefined);


  try {
    // Test připojení k SMTP
    await transporter.verify();
    console.log("SMTP připojení OK");
    res.status(200).json({ success: true, message: "SMTP připojení OK" });
  } catch (err) {
    console.error("SMTP připojení selhalo:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
