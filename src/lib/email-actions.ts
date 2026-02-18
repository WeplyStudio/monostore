
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
      user: 'support@weplystudio.my.id',
      pass: 'Semarang20?',
    },
  });

  const itemsHtml = orderData.items
    .map(
      (item) => `
    <div style="padding: 10px; border: 1px solid #eee; margin-bottom: 10px; border-radius: 8px;">
      <strong>${item.name}</strong><br/>
      <a href="${item.deliveryContent}" style="color: #2563eb; text-decoration: underline;">Klik di sini untuk unduh / akses</a>
    </div>
  `
    )
    .join('');

  const mailOptions = {
    from: '"MonoStore" <support@weplystudio.my.id>',
    to: orderData.customerEmail,
    subject: `Invoice Pembelian #${orderData.orderId} - MonoStore`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f0f0f0;">
        <h2 style="color: #212529;">Terima Kasih, ${orderData.customerName}!</h2>
        <p>Pembayaran Anda telah berhasil kami terima. Berikut adalah detail pesanan Anda:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p style="margin: 5px 0;"><strong>Total Bayar:</strong> IDR ${orderData.totalAmount.toLocaleString('id-ID')}</p>
        </div>

        <h3>Aset Digital Anda:</h3>
        ${itemsHtml}

        <p style="margin-top: 30px; font-size: 12px; color: #6c757d;">
          Jika Anda memiliki pertanyaan, silakan hubungi kami via WhatsApp atau balas email ini.
        </p>
        <hr/>
        <p style="text-align: center; font-weight: bold; color: #212529;">MonoStore Digital</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email Sending Error:', error);
    return { success: false, error };
  }
}
