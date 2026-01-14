/**
 * Vipps ePayment API Client
 * Documentation: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 *
 * SEC-010: CREDENTIAL ROTATION REMINDER
 * ======================================
 * Vipps credentials should be rotated regularly:
 * - CLIENT_SECRET: Rotate every 6 months
 * - SUBSCRIPTION_KEY: Rotate every 12 months
 *
 * To rotate credentials:
 * 1. Generate new credentials in Vipps Portal (portal.vippsmobilepay.com)
 * 2. Update environment variables in production (Vercel/hosting)
 * 3. Verify payment flow still works in test environment
 * 4. Deploy to production
 * 5. Revoke old credentials in Vipps Portal
 *
 * Set calendar reminders for rotation dates!
 */

const VIPPS_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.vipps.no'
  : 'https://apitest.vipps.no';

const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID!;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET!;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY!;
const VIPPS_MSN = process.env.VIPPS_MERCHANT_SERIAL_NUMBER!;

interface VippsAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_on: string;
}

interface VippsAmount {
  currency: 'NOK';
  value: number; // In ore (1 NOK = 100 ore)
}

interface VippsPaymentMethod {
  type: 'WALLET';
}

interface VippsCustomer {
  phoneNumber?: string;
}

interface VippsCreatePaymentRequest {
  amount: VippsAmount;
  paymentMethod: VippsPaymentMethod;
  customer?: VippsCustomer;
  reference: string;
  userFlow: 'WEB_REDIRECT' | 'NATIVE_REDIRECT' | 'PUSH_MESSAGE';
  returnUrl: string;
  paymentDescription: string;
}

interface VippsPaymentResponse {
  reference: string;
  state: 'CREATED' | 'AUTHORIZED' | 'TERMINATED' | 'EXPIRED' | 'CAPTURED' | 'REFUNDED';
  redirectUrl?: string;
  aggregate?: {
    authorizedAmount: VippsAmount;
    cancelledAmount: VippsAmount;
    capturedAmount: VippsAmount;
    refundedAmount: VippsAmount;
  };
}

interface VippsCaptureRequest {
  modificationAmount: VippsAmount;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token for Vipps API
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const response = await fetch(`${VIPPS_API_URL}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'client_id': VIPPS_CLIENT_ID,
      'client_secret': VIPPS_CLIENT_SECRET,
      'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
      'Merchant-Serial-Number': VIPPS_MSN,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Vipps access token: ${error}`);
  }

  const data = await response.json() as VippsAccessToken;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return data.access_token;
}

/**
 * Make authenticated request to Vipps API
 */
async function vippsRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${VIPPS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
      'Merchant-Serial-Number': VIPPS_MSN,
      'Content-Type': 'application/json',
      'Vipps-System-Name': 'dotty-webshop',
      'Vipps-System-Version': '1.0.0',
      'Idempotency-Key': crypto.randomUUID(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vipps API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Create a new payment
 */
export async function createPayment(params: {
  reference: string;
  amount: number; // In ore
  description: string;
  returnUrl: string;
  customerPhone?: string;
}): Promise<VippsPaymentResponse> {
  const body: VippsCreatePaymentRequest = {
    amount: {
      currency: 'NOK',
      value: params.amount,
    },
    paymentMethod: { type: 'WALLET' },
    reference: params.reference,
    userFlow: 'WEB_REDIRECT',
    returnUrl: params.returnUrl,
    paymentDescription: params.description,
  };

  if (params.customerPhone) {
    // Format Norwegian phone number (remove +47 prefix if present)
    const phone = params.customerPhone.replace(/^\+?47/, '').replace(/\s/g, '');
    if (/^\d{8}$/.test(phone)) {
      body.customer = { phoneNumber: `47${phone}` };
    }
  }

  return vippsRequest<VippsPaymentResponse>('/epayment/v1/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get payment status
 */
export async function getPayment(reference: string): Promise<VippsPaymentResponse> {
  return vippsRequest<VippsPaymentResponse>(`/epayment/v1/payments/${reference}`);
}

/**
 * Capture an authorized payment (Reserve capture flow)
 */
export async function capturePayment(
  reference: string,
  amount: number, // In ore
): Promise<VippsPaymentResponse> {
  const body: VippsCaptureRequest = {
    modificationAmount: {
      currency: 'NOK',
      value: amount,
    },
  };

  return vippsRequest<VippsPaymentResponse>(
    `/epayment/v1/payments/${reference}/capture`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

/**
 * Cancel an authorized payment
 */
export async function cancelPayment(reference: string): Promise<VippsPaymentResponse> {
  return vippsRequest<VippsPaymentResponse>(
    `/epayment/v1/payments/${reference}/cancel`,
    { method: 'POST' },
  );
}

/**
 * Refund a captured payment
 */
export async function refundPayment(
  reference: string,
  amount: number, // In ore
): Promise<VippsPaymentResponse> {
  const body: VippsCaptureRequest = {
    modificationAmount: {
      currency: 'NOK',
      value: amount,
    },
  };

  return vippsRequest<VippsPaymentResponse>(
    `/epayment/v1/payments/${reference}/refund`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export type { VippsPaymentResponse, VippsAmount };
