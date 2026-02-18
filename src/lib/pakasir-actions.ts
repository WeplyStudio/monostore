'use server';

/**
 * @fileOverview Server-side actions for Pakasir API integration.
 * Handles CORS issues by executing API calls on the server.
 */

const PAKASIR_PROJECT = "itsjason";
const PAKASIR_API_KEY = "Qz8ylLI2rA37YnuLYCqIEaoMd4ZdM9eT";

/**
 * Creates a QRIS transaction via Pakasir.
 */
export async function createPakasirTransaction(orderId: string, amount: number) {
  try {
    const payload = {
      project: PAKASIR_PROJECT,
      order_id: orderId,
      amount: Math.round(amount), // Pastikan jumlahnya bulat
      api_key: PAKASIR_API_KEY
    };

    const response = await fetch("https://app.pakasir.com/api/transactioncreate/qris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    const result = await response.json();

    if (!response.ok) {
      // Jika error, kembalikan pesan dari API jika ada, atau status HTTP
      return { 
        error: true, 
        message: result.message || `Pakasir API error: ${response.status}`,
        details: result
      };
    }

    return result;
  } catch (error: any) {
    console.error("Pakasir Create Transaction Error:", error);
    return { error: true, message: error.message || "Gagal menghubungi payment gateway." };
  }
}

/**
 * Checks the status of a transaction via Pakasir.
 */
export async function checkPakasirStatus(orderId: string, amount: number) {
  try {
    const roundedAmount = Math.round(amount);
    const url = `https://app.pakasir.com/api/transactiondetail?project=${PAKASIR_PROJECT}&amount=${roundedAmount}&order_id=${orderId}&api_key=${PAKASIR_API_KEY}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();

    if (!response.ok) {
      return { 
        error: true, 
        message: result.message || `Status check error: ${response.status}` 
      };
    }

    return result;
  } catch (error: any) {
    console.error("Pakasir Check Status Error:", error);
    return { error: true, message: error.message || "Gagal mengecek status pembayaran." };
  }
}
