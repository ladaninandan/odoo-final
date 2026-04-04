import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSms = async (to, text) => {
    try {
        const message = await client.messages.create({
            body: text,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to // Must include country code, e.g., '+1234567890'
        });
        console.log("SMS sent perfectly. Twilio Message SID:", message.sid);
        return true;
    } catch (error) {
        console.error("Error sending SMS via Twilio:", error);
    }
};
