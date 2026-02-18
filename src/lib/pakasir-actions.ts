'use server';

/**
 * @fileOverview Server-side actions for Pakasir API integration.
 * Handles CORS issues by executing API calls on the server.
 */

const PAKASIR_PROJECT = "depodomain";
const PAKASIR_API_KEY = "Qz8ylLI2rA37YnuLYCqIEaoMd4ZdM9eT";

/**
 * Creates a QRIS transaction via Pakasir.
 */
export async function createPakasirTransaction(orderId: string, amount: number) {
  try {
    const response = await fetch("https://app.pakasir.com/api/transactioncreate/qris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: PAKASIR_PROJECT,
        order_id: orderId,
        amount: amount,
        api_key: PAKASIR_API_KEY
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Pakasir API responded with ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Pakasir Create Transaction Error:", error);
    return { error: true, message: error.message || "Gagal membuat transaksi di server." };
  }
}

/**
 * Checks the status of a transaction via Pakasir.
 */
export async function checkPakasirStatus(orderId: string, amount: number) {
  try {
    const url = `https://app.pakasir.com/api/transactiondetail?project=${PAKASIR_PROJECT}&amount=${amount}&order_id=${orderId}&api_key=${PAKASIR_API_KEY}`;
    
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Pakasir API responded with ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Pakasir Check Status Error:", error);
    return { error: true, message: error.message || "Gagal mengecek status di server." };
  }
}
