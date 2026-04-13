
import nodemailer from "nodemailer";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

console.log("loaded: " + process.env.SMTP_HOST)
const transporter = nodemailer.createTransport({ 
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_HOST) || 587,
    secure: false, 
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS,
    },
})

async function sendEmail({to, subject, text, html}) { 
    try {
        const info = await transporter.sendMail({
            from: `"Misinformation Detector" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        })

        console.log("Email sent:", info.messageId);
        return info
    } catch (err) {
        console.error("Error sending email:", err);
        throw err
    }
}

export default sendEmail