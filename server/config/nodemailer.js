import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// In a real application, replace this with your SMTP config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"Auth System" <no-reply@authsystem.com>',
            to,
            subject,
            text,
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};
