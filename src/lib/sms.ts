interface SMSOptions {
  to: string;
  message: string;
  senderId?: string;
  apiKey?: string;
  username?: string;
}

export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; error?: string }> {
  const { to, message, senderId, apiKey, username } = options;

  const key = apiKey || process.env.SMS_API_KEY;
  const user = username || process.env.SMS_USERNAME;
  const sender = senderId || process.env.SMS_SENDER_ID || "PHIDPOS";

  if (!key || !user) {
    console.warn("SMS credentials not configured");
    return { success: false, error: "SMS not configured" };
  }

  try {
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey: key,
      },
      body: new URLSearchParams({
        username: user,
        to,
        message,
        from: sender,
      }),
    });

    const data = await response.json();
    if (data.SMSMessageData?.Recipients?.[0]?.status === "Success") {
      return { success: true };
    }
    return { success: false, error: data.SMSMessageData?.Message };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function buildSaleNotification(params: {
  shopName: string;
  cashierName: string;
  receiptNumber: string;
  total: number;
  currency: string;
}): string {
  return `${params.shopName}: Sale by ${params.cashierName}. Receipt: ${params.receiptNumber}. Amount: ${params.currency} ${params.total.toLocaleString()}`;
}

export function buildLowStockNotification(params: {
  shopName: string;
  productName: string;
  currentStock: number;
  minStock: number;
}): string {
  return `${params.shopName}: LOW STOCK ALERT! ${params.productName} has only ${params.currentStock} units left (min: ${params.minStock}).`;
}

export function buildDebtNotification(params: {
  customerName: string;
  shopName: string;
  debtAmount: number;
  currency: string;
}): string {
  return `Dear ${params.customerName}, you have an outstanding balance of ${params.currency} ${params.debtAmount.toLocaleString()} at ${params.shopName}. Please pay to continue enjoying our services.`;
}

export function buildPaymentConfirmation(params: {
  customerName: string;
  shopName: string;
  amountPaid: number;
  currency: string;
  receiptNumber: string;
}): string {
  return `Dear ${params.customerName}, your payment of ${params.currency} ${params.amountPaid.toLocaleString()} to ${params.shopName} has been received. Receipt: ${params.receiptNumber}. Thank you!`;
}
