function getVippsApiUrl(): string {
  if (process.env.VIPPS_TEST_MODE === 'true') {
    return 'https://apitest.vipps.no';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.vipps.no';
  }
  return 'https://apitest.vipps.no';
}

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

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const apiUrl = getVippsApiUrl();
  const response = await fetch(`${apiUrl}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'client_id': process.env.VIPPS_CLIENT_ID!,
      'client_secret': process.env.VIPPS_CLIENT_SECRET!,
      'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
      'Merchant-Serial-Number': process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
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

async function vippsRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const apiUrl = getVippsApiUrl();

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
      'Merchant-Serial-Number': process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
      'Content-Type': 'application/json',
      'Vipps-System-Name': 'dotty-webshop',
      'Vipps-System-Version': '1.0.0',
      'Idempotency-Key': crypto.randomUUID(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Vipps] API error - Status: ${response.status}, URL: ${apiUrl}${endpoint}`);
    console.error(`[Vipps] Response: ${error}`);
    throw new Error(`Vipps API error (${response.status}): ${error}`);
  }

  return response.json();
}

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

  console.log(`[Vipps] Creating payment with reference: ${params.reference}`);
  const result = await vippsRequest<VippsPaymentResponse>('/epayment/v1/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  console.log(`[Vipps] Payment created, redirect URL: ${result.redirectUrl}`);
  return result;
}

export async function getPayment(reference: string): Promise<VippsPaymentResponse> {
  console.log(`[Vipps] Getting payment status for reference: ${reference}`);
  return vippsRequest<VippsPaymentResponse>(`/epayment/v1/payments/${reference}`);
}

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

export async function cancelPayment(reference: string): Promise<VippsPaymentResponse> {
  return vippsRequest<VippsPaymentResponse>(
    `/epayment/v1/payments/${reference}/cancel`,
    { method: 'POST' },
  );
}

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
