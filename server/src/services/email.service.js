import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOrderEmail({ email, name, code, quantity, amount }) {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrBase64 = qrCodeDataURL.split(',')[1];

    const mailOptions = {
      from: process.env.MAIL_FROM || 'Somali Society <noreply@example.com>',
      to: email,
      subject: `✅ ${process.env.EVENT_TITLE || 'Event'} - Ticket Confirmation`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            
            <div style="background: #1a73e8; color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 You're All Set!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your ticket for ${process.env.EVENT_TITLE || 'the event'}</p>
            </div>
            
            <div style="padding: 40px 20px; background: #f5f5f5;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Hi ${name},</p>
              <p style="font-size: 16px; color: #333; margin: 0 0 30px 0;">Thank you for registering! Your payment has been confirmed.</p>
              
              <div style="background: white; padding: 40px 20px; text-align: center; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #1a73e8; font-size: 22px;">📱 Your QR Ticket</h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;"><strong>Show this QR code at check-in</strong></p>
                <img src="cid:qrcode" alt="QR Code" style="max-width: 300px; width: 100%; height: auto;" />
                <p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">
                  Code: <strong style="color: #333;">${code}</strong>
                </p>
              </div>

              <div style="background: white; padding: 30px 20px; border-radius: 8px; border-left: 4px solid #1a73e8; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1a73e8; font-size: 18px;">📋 Event Details</h3>
                <p style="margin: 8px 0; color: #333; font-size: 14px;"><strong>Event:</strong> ${process.env.EVENT_TITLE || 'Event'}</p>
                <p style="margin: 8px 0; color: #333; font-size: 14px;"><strong>Date:</strong> ${process.env.EVENT_DATE || 'TBA'}</p>
                <p style="margin: 8px 0; color: #333; font-size: 14px;"><strong>Time:</strong> ${process.env.EVENT_TIME || 'TBA'}</p>
                <p style="margin: 8px 0; color: #333; font-size: 14px;"><strong>Location:</strong> ${process.env.EVENT_LOCATION || 'TBA'}</p>
                <p style="margin: 8px 0; color: #333; font-size: 14px;"><strong>Tickets:</strong> ${quantity} × £${(amount / quantity).toFixed(2)} = <strong>£${amount.toFixed(2)}</strong></p>
              </div>

              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: bold;">⚠️ Important:</p>
                <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Save this email or screenshot your QR code</li>
                  <li style="margin-bottom: 8px;">Bring your QR code to the event for quick check-in</li>
                  <li style="margin-bottom: 0;">If you lose your code, contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}</li>
                </ul>
              </div>

              <div style="text-align: center; padding: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #1a73e8; font-size: 18px; font-weight: bold;">See you at the event! 🎊</p>
                <p style="margin: 0; color: #666; font-size: 14px;">Somali Society Salford</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'qr-code.png',
          content: qrBase64,
          encoding: 'base64',
          cid: 'qrcode'
        }
      ]
    };

 const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', email);
    console.log('Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
}