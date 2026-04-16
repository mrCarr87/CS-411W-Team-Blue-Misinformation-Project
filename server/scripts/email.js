import nodemailer from "nodemailer";
import { Resend } from "resend";
import { setDefaultResultOrder } from "dns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const resend = new Resend(process.env.RESEND_API_KEY);
setDefaultResultOrder("ipv4first"); 




// const transporter = nodemailer.createTransport({ 
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: Number(process.env.SMTP_PORT) === 465, 
//     family: 4,
//     auth: {
//         user: process.env.SMTP_USER, 
//         pass: process.env.SMTP_PASS,
//     },
// })

async function sendEmail({to, subject, text, html}) { 
    try {
        const {data, error} = await resend.emails.send({
            from: 'no-reply@misinfodetect.xyz',
            to,
            subject,
            html,
        })

        if (error) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
        console.log("Email sent:", data.id);
        return data.id
    } catch (err) {
        console.error("Error sending email:", err);
        throw err
    }
}

export default sendEmail