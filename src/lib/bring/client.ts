import 'server-only';
import type {
  BringShippingRequest,
  BringShippingResponse,
  BringConsignment,
  BringPackage,
  ShippingOption,
} from './types';

const BRING_API_URL = 'https://api.bring.com/shippingguide/api/v2/products';

const DEFAULT_FROM_POSTAL_CODE = process.env.BRING_FROM_POSTAL_CODE || '0173';
const DEFAULT_FROM_COUNTRY = 'NO';

interface BringClientConfig {
  apiUid?: string;
  apiKey?: string;
  customerNumber?: string;
}

function getConfig(): BringClientConfig {
  return {
    apiUid: process.env.BRING_API_UID,
    apiKey: process.env.BRING_API_KEY,
    customerNumber: process.env.BRING_CUSTOMER_NUMBER,
  };
}

function validateConfig(config: BringClientConfig): void {
  if (!config.apiUid || !config.apiKey) {
    throw new Error('BRING_API_UID and BRING_API_KEY must be configured');
  }
}

function getShippingDate(): { year: string; month: string; day: string } {
  const today = new Date();
  today.setDate(today.getDate() + 1);

  return {
    year: today.getFullYear().toString(),
    month: (today.getMonth() + 1).toString().padStart(2, '0'),
    day: today.getDate().toString().padStart(2, '0'),
  };
}

async function fetchBringApi(request: BringShippingRequest): Promise<BringShippingResponse> {
  const config = getConfig();
  validateConfig(config);

  const response = await fetch(BRING_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-MyBring-API-Uid': config.apiUid!,
      'X-MyBring-API-Key': config.apiKey!,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Bring API error:', response.status, errorText);

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(`Bring API error: ${response.status}`);
  }

  return response.json();
}

function parseShippingOptions(response: BringShippingResponse): ShippingOption[] {
  const options: ShippingOption[] = [];

  for (const consignment of response.consignments) {
    for (const product of consignment.products) {
      if (product.errors && product.errors.length > 0) {
        console.warn(`Bring product ${product.id} error:`, product.errors);
        continue;
      }

      if (!product.price?.listPrice?.amountWithVAT) {
        continue;
      }

      const gui = product.guiInformation;
      const price = product.price;
      const delivery = product.expectedDelivery;

      options.push({
        id: product.id,
        name: gui?.displayName || gui?.productName || product.id,
        description: gui?.descriptionText || '',
        deliveryType: gui?.deliveryType || 'unknown',
        estimatedDelivery: delivery?.formattedExpectedDeliveryDate || delivery?.userMessage || '',
        workingDays: parseInt(delivery?.workingDays || '0', 10),
        priceWithVat: Math.round(parseFloat(price.listPrice!.amountWithVAT) * 100),
        priceWithoutVat: Math.round(parseFloat(price.listPrice!.amountWithoutVAT) * 100),
        logo: gui?.logo,
        environmentalInfo: product.environmentalData
          ? {
              fossilFreePercentage: product.environmentalData.fossilFreePercentage
                ? parseFloat(product.environmentalData.fossilFreePercentage)
                : undefined,
            }
          : undefined,
      });
    }
  }

  options.sort((a, b) => a.priceWithVat - b.priceWithVat);

  return options;
}

export interface PackageDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightGrams: number;
}

export interface GetShippingOptionsParams {
  toPostalCode: string;
  toCountryCode?: string;
  packages: PackageDimensions[];
  services?: string[];
  fromPostalCode?: string;
  fromCountryCode?: string;
  language?: 'NO' | 'EN';
}

export async function getShippingOptions(params: GetShippingOptionsParams): Promise<ShippingOption[]> {
  const {
    toPostalCode,
    toCountryCode = 'NO',
    packages,
    services,
    fromPostalCode = DEFAULT_FROM_POSTAL_CODE,
    fromCountryCode = DEFAULT_FROM_COUNTRY,
    language = 'NO',
  } = params;

  const config = getConfig();
  const bringPackages: BringPackage[] = packages.map((pkg, index) => ({
    id: (index + 1).toString(),
    length: pkg.lengthCm,
    width: pkg.widthCm,
    height: pkg.heightCm,
    grossWeight: pkg.weightGrams,
  }));

  const consignment: BringConsignment = {
    id: '1',
    fromCountryCode,
    fromPostalCode,
    toCountryCode,
    toPostalCode,
    shippingDate: getShippingDate(),
    packages: bringPackages,
    products: services?.map((id) => ({
      id,
      customerNumber: config.customerNumber,
    })),
  };

  const request: BringShippingRequest = {
    consignments: [consignment],
    withPrice: true,
    withExpectedDelivery: true,
    withGuiInformation: true,
    withEnvironmentalData: true,
    language,
  };

  const response = await fetchBringApi(request);
  return parseShippingOptions(response);
}

export async function getShippingOptionsForCart(params: {
  toPostalCode: string;
  toCountryCode?: string;
  totalWeightGrams?: number;
  language?: 'NO' | 'EN';
}): Promise<ShippingOption[]> {
  const defaultPackage: PackageDimensions = {
    lengthCm: 60,
    widthCm: 10,
    heightCm: 10,
    weightGrams: params.totalWeightGrams || 500,
  };

  return getShippingOptions({
    toPostalCode: params.toPostalCode,
    toCountryCode: params.toCountryCode,
    packages: [defaultPackage],
    language: params.language,
  });
}

export function isValidNorwegianPostalCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}
