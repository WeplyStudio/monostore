'use server';

import nodemailer from 'nodemailer';

/**
 * Server action to send order confirmation email via Zoho SMTP.
 */
export async function sendOrderConfirmationEmail(orderData: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  totalAmount: number;
  items: { name: string; deliveryContent: string }[];
}) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: 'hello@itsjason.my.id',
      pass: 'Semarang20?',
    },
    tls: {
      rejectUnauthorized: false // Membantu koneksi di lingkungan tertentu
    }
  });

  // Verifikasi koneksi sebelum kirim
  try {
    await transporter.verify();
  } catch (verifyError) {
    console.error('SMTP Verification Failed:', verifyError);
    return { success: false, error: 'SMTP connection failed' };
  }

  const itemsHtml = orderData.items
    .map(
      (item) => `
    <div style="padding: 15px; border: 1px solid #e5e7eb; margin-bottom: 12px; border-radius: 12px; background-color: #ffffff;">
      <strong style="font-size: 16px; color: #111827;">${item.name}</strong><br/>
      <p style="margin: 10px 0 0 0;">
        <a href="${item.deliveryContent}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Download Source Code
        </a>
      </p>
      <div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">Link Alternatif: ${item.deliveryContent}</div>
    </div>
  `
    )
    .join('');

  const mailOptions = {
    from: '"MonoStore Templates" <hello@itsjason.my.id>',
    to: orderData.customerEmail,
    subject: `Invoice Pembelian #${orderData.orderId} - MonoStore Web Templates`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 20px; background-color: #f9fafb;">
        <h2 style="color: #111827; text-align: center; margin-bottom: 25px;">Terima Kasih, ${orderData.customerName}!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Pembayaran Anda telah berhasil kami terima. Berikut adalah detail pesanan dan link akses source code template Anda:</p>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 16px; margin: 25px 0; border: 1px solid #eeeeee;">
          <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Order ID: <strong style="color: #111827;">#${orderData.orderId}</strong></p>
          <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Total Bayar: <strong style="color: #111827;">IDR ${orderData.totalAmount.toLocaleString('id-ID')}</strong></p>
        </div>

        <h3 style="color: #111827; font-size: 18px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; margin-bottom: 20px;">Template Website Anda:</h3>
        ${itemsHtml}

        <p style="margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center;">
          Butuh bantuan instalasi? Balas email ini atau hubungi kami melalui WhatsApp.<br/>
          &copy; ${new Date().getFullYear()} MonoStore Digital Inc.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Sending Error:', error);
    return { success: false, error: String(error) };
  }
}
