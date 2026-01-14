/**
 * Bring Shipping Guide API Types
 * Based on: https://api.bring.com/shippingguide/api-docs
 */

// Request types
export interface BringShippingDate {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
}

export interface BringPackage {
  id?: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  grossWeight: number; // grams
  volume?: number; // dm3
}

export interface BringProduct {
  id: string; // Service code like '5800', 'SERVICEPAKKE', '5600'
  customerNumber?: string; // For net pricing
}

export interface BringConsignment {
  id?: string;
  fromCountryCode: string;
  fromPostalCode: string;
  toCountryCode: string;
  toPostalCode: string;
  toCity?: string;
  addressLine?: string;
  shippingDate?: BringShippingDate;
  packages: BringPackage[];
  products?: BringProduct[];
}

export interface BringShippingRequest {
  consignments: BringConsignment[];
  withPrice?: boolean;
  withExpectedDelivery?: boolean;
  withGuiInformation?: boolean;
  withEnvironmentalData?: boolean;
  withEstimatedDeliveryTime?: boolean;
  numberOfAlternativeDeliveryDates?: number;
  language?: 'NO' | 'EN' | 'SE' | 'DK' | 'FI';
}

// Response types
export interface BringGuiInformation {
  sortOrder: string;
  mainDisplayCategory: string;
  subDisplayCategory: string;
  displayName: string;
  productName: string;
  descriptionText: string;
  helpText: string;
  shortName: string;
  deliveryType: string;
  maxWeightInKgs: string;
  logo: string;
}

export interface BringPriceAmount {
  amountWithoutVAT: string;
  amountWithVAT: string;
  vat: string;
  currencyCode: string;
}

export interface BringPrice {
  listPrice?: BringPriceAmount;
  netPrice?: BringPriceAmount;
}

export interface BringExpectedDelivery {
  workingDays: string;
  userMessage: string;
  formattedExpectedDeliveryDate: string;
  expectedDeliveryDate?: {
    year: string;
    month: string;
    day: string;
  };
  alternativeDeliveryDates?: Array<{
    year: string;
    month: string;
    day: string;
    formattedDate: string;
    timeSlots?: Array<{
      startTime: string;
      endTime: string;
    }>;
  }>;
}

export interface BringEnvironmentalData {
  fossilFreePercentage?: string;
  bioDieselPercentage?: string;
}

export interface BringProductResponse {
  id: string;
  productionCode?: string;
  guiInformation?: BringGuiInformation;
  price?: BringPrice;
  expectedDelivery?: BringExpectedDelivery;
  environmentalData?: BringEnvironmentalData;
  errors?: Array<{
    code: string;
    description: string;
  }>;
  warnings?: Array<{
    code: string;
    description: string;
  }>;
}

export interface BringConsignmentResponse {
  products: BringProductResponse[];
}

export interface BringShippingResponse {
  traceMessages?: string[];
  consignments: BringConsignmentResponse[];
}

// Simplified shipping option for the checkout
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  deliveryType: string;
  estimatedDelivery: string;
  workingDays: number;
  priceWithVat: number; // In øre (cents)
  priceWithoutVat: number;
  logo?: string;
  environmentalInfo?: {
    fossilFreePercentage?: number;
  };
}

// Common Bring service codes for Norway
export const BRING_SERVICES = {
  // Pickup point services
  PICKUP_PARCEL: '5800', // Pakke til hentested
  SERVICEPAKKE: 'SERVICEPAKKE', // Servicepakke (locker/pickup)

  // Home delivery services
  HOME_DELIVERY_MAILBOX: '3584', // Pakke i postkassen
  HOME_DELIVERY: '5600', // Pakke levert hjem

  // Express services
  EXPRESS_NORDIC: '4850', // Bedriftspakke
  EXPRESS_SAME_DAY: '1736', // Ekspress neste dag
} as const;

// Default services to request for checkout
export const DEFAULT_CHECKOUT_SERVICES = [
  BRING_SERVICES.PICKUP_PARCEL,
  BRING_SERVICES.SERVICEPAKKE,
  BRING_SERVICES.HOME_DELIVERY_MAILBOX,
  BRING_SERVICES.HOME_DELIVERY,
];
