
'use server';

import nodemailer from 'nodemailer';

/**
 * Server action to send emails via Zoho SMTP.
 */
async function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: 'hello@itsjason.my.id',
      pass: 'Semarang20?',
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

export async function sendPaymentKeyEmail(email: string, key: string, isExisting: boolean = false) {
  const transporter = await getTransporter();
  const subject = isExisting 
    ? "Akses Kembali Payment Key Anda - MonoStore" 
    : "Payment Key Baru Anda - MonoStore Wallet";

  const mailOptions = {
    from: '"MonoStore Wallet" <hello@itsjason.my.id>',
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Halo!</h2>
        <p>${isExisting ? 'Anda meminta akses kembali ke Payment Key Anda.' : 'Selamat! Payment Key Anda telah berhasil dibuat.'}</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">${key}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          Gunakan key ini untuk melakukan pembayaran atau cek saldo di Dashboard Wallet.<br/>
          <strong>PENTING:</strong> Jangan bagikan key ini kepada siapapun.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} MonoStore Digital Inc.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: String(err) };
  }
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const transporter = await getTransporter();
  const mailOptions = {
    from: '"MonoStore Security" <hello@itsjason.my.id>',
    to: email,
    subject: "Kode Verifikasi Pembayaran Wallet - MonoStore",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Verifikasi Pembayaran</h2>
        <p>Anda mencoba melakukan pembayaran menggunakan Mono Wallet. Masukkan kode berikut untuk melanjutkan:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #2563eb;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Kode ini akan kadaluwarsa dalam 5 menit. Jika bukan Anda yang melakukan ini, abaikan email ini.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: String(err) };
  }
}

export async function sendOrderConfirmationEmail(orderData: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  totalAmount: number;
  items: { name: string; deliveryContent: string }[];
}) {
  const transporter = await getTransporter();
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
    </div>
  `
    )
    .join('');

  const mailOptions = {
    from: '"MonoStore Templates" <hello@itsjason.my.id>',
    to: orderData.customerEmail,
    subject: `Invoice Pembelian #${orderData.orderId} - MonoStore`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #f9fafb; border-radius: 20px;">
        <h2 style="color: #111827; text-align: center;">Terima Kasih, ${orderData.customerName}!</h2>
        <div style="background: #ffffff; padding: 20px; border-radius: 16px; margin: 25px 0; border: 1px solid #eeeeee;">
          <p>Order ID: <strong>#${orderData.orderId}</strong></p>
          <p>Total: <strong>IDR ${orderData.totalAmount.toLocaleString('id-ID')}</strong></p>
        </div>
        ${itemsHtml}
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false };
  }
}
