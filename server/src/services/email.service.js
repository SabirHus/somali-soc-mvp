import { Resend } from 'resend';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a PDF ticket with QR code
 */
async function generateTicketPDF({ name, eventName, eventDate, eventTime, location, code,}) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(code, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 1
      });

  // Format date for PDF
    const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

      // Header - Somali Society branding
      doc.fontSize(28).fillColor('#0074D9').text('Somali Society', 50, 50);
      doc.fontSize(12).fillColor('#666').text('Salford', 50, 82);
      
      // Vertical line separator
      doc.moveTo(400, 50).lineTo(400, 550).strokeColor('#0074D9').lineWidth(3).stroke();
      
      // Event name (large, bold)
      doc.fontSize(22).fillColor('#003B73').text(eventName, 50, 130, { width: 330 });
      
      // Date/Time section
      doc.fontSize(12).fillColor('#666').text('Date/Time', 50, 200);
      doc.fontSize(11).fillColor('#000').text(`${formattedDate} ${eventTime}`, 50, 220);
      
      // Location section
      doc.fontSize(12).fillColor('#666').text('Location', 50, 260);
      doc.fontSize(11).fillColor('#000').text(location, 50, 280);
      
      // Name section
      doc.fontSize(12).fillColor('#666').text('Name', 50, 320);
      doc.fontSize(13).fillColor('#000').text(name, 50, 340);
      
      // Booking Code (right side)
      doc.fontSize(12).fillColor('#666').text('Booking Code', 420, 120);
      doc.fontSize(14).fillColor('#003B73').text(code, 420, 140, { width: 130 });
      
      // QR Code (centered)
      doc.image(qrBuffer, 95, 390, { width: 240, height: 240 });
      
      // Event info at bottom
      doc.fontSize(14).fillColor('#0074D9').text(`SOMSOC ${eventName}`, 50, 650, { align: 'center', width: 500 });
      
      // Footer
      doc.fontSize(9).fillColor('#999').text(
        'Somali Society Salford | Registered Student Society',
        50,
        720,
        { align: 'center', width: 500 }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send order confirmation email with PDF ticket attachment
 */
export async function sendOrderEmail({ email, name, code, quantity, amount, location, eventName, eventDate, eventTime,}) {
  try {
    // Generate PDF ticket
    const pdfBuffer = await generateTicketPDF({
      name,
      eventName,
      eventDate,
      eventTime,
      location,
      code,
    });

    // Format date for email display
    const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Somali Society Salford <tickets@somsocsal.com>',
      to: email,
      subject: `✅ ${eventName} - Ticket Confirmation`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background: #f5f5f5;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #003B73 0%, #0074D9 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 16px;
              color: #333;
              margin: 0 0 20px 0;
            }
            .booking-code-box {
              background: #003B73;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              margin: 30px 0;
            }
            .booking-code-label {
              font-size: 14px;
              opacity: 0.9;
              margin: 0 0 8px 0;
            }
            .booking-code {
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 3px;
              margin: 0;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #0074D9;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #495057;
            }
            .info-value {
              color: #212529;
            }
            .notice-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .notice-box strong {
              color: #856404;
              display: block;
              margin-bottom: 10px;
            }
            .notice-box ul {
              margin: 10px 0 0 0;
              padding-left: 20px;
              color: #856404;
            }
            .notice-box li {
              margin: 8px 0;
            }
            .cta-box {
              text-align: center;
              margin: 30px 0;
            }
            .cta-button {
              display: inline-block;
              background: #0074D9;
              color: white !important;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            .footer a {
              color: #0074D9;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p>${eventName}</p>
            </div>
            
            <!-- Content -->
            <div class="content">
              <p class="greeting">Hi ${name},</p>
              <p class="greeting">Thank you for registering! Your booking has been confirmed.</p>
              
              <!-- Booking Code -->
              <div class="booking-code-box">
                <p class="booking-code-label">Your Booking Code</p>
                <p class="booking-code">${code}</p>
              </div>
              
              <!-- Event Details -->
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Event:</span>
                  <span class="info-value">${eventName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span class="info-value">${eventTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Location:</span>
                  <span class="info-value">${location}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tickets:</span>
                  <span class="info-value">${quantity}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Paid:</span>
                  <span class="info-value">£${amount.toFixed(2)}</span>
                </div>
              </div>
              
              <!-- PDF Attachment Notice -->
              <div class="notice-box">
                <strong>📱 QR Code Attached</strong>
                <p style="margin: 0;">Your QR code ticket is attached to this email. Download it and show it at the event entrance for quick check-in!</p>
              </div>
              
              <!-- CTA -->
              <div class="cta-box">
                <p style="font-size: 18px; color: #0074D9; font-weight: 600; margin: 0 0 20px 0;">
                  See you at the event! 🎊
                </p>
              </div>
              
              <!-- Need Help -->
              <h3 style="color: #003B73; margin: 30px 0 15px 0;">Need Help?</h3>
              <p style="color: #495057;">
                For event information, check out our 
                <a href="https://www.instagram.com/" style="color: #0074D9; text-decoration: none; margin: 0 8px;">
                  Instagram
                </a>
                 or 
                  <a href="https://chat.whatsapp.com/Ba1DrDXZpRo3N4aWrcV6rl" style="color: #0074D9; text-decoration: none; margin: 0 8px;">
                  WhatsApp
                </a>.<br>
                For questions about your booking, contact us at <a href="mailto:contact@somsocsal.com" style="color: #0074D9;">contact@somsocsal.com</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 10px 0;">© 2025 Somali Society Salford. All rights reserved.</p>
              <p style="margin: 0; font-size: 12px;">
                This is an automated confirmation email. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `${eventName.replace(/[^a-z0-9]/gi, '-')}-Ticket.pdf`,
          content: pdfBuffer
        }
      ]
    });

    if (error) {
      logger.error('Email send failed', { error, email });
      throw new Error(`Failed to send email: ${error.message}`);
    }

    logger.info('Order email sent successfully', { email, code });
    return data;
  } catch (error) {
    logger.error('sendOrderEmail error', { error: error.message, email });
    throw error;
  }
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Somali Society Salford <noreply@somsocsal.com>',
      to: email,
      subject: 'Password Reset Request - Somali Society Salford',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0074D9;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your Somali Society Salford admin account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link expires in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #0074D9;">${resetUrl}</p>
            <div class="footer">
              <p>This is an automated email from Somali Society Salford.</p>
              <p>If you need help, please contact support.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      throw error;
    }

    logger.info('Password reset email sent', {
      email,
      messageId: data?.id
    });

    return data;
  } catch (error) {
    logger.error('Failed to send password reset email', {
      error: error.message,
      email
    });
    throw error;
  }
}