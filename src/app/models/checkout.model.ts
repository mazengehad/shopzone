export type PaymentMethod = 'cash-on-delivery' | 'credit-card';

export interface ShippingInfo {
  address: string;
  city: string;
  phone: string;
}

export interface CheckoutDetails {
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
}
