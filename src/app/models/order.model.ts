import { PaymentMethod, ShippingInfo } from './checkout.model';

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
  date: string;
  items: OrderItem[];
  shippingInfo?: ShippingInfo;
  paymentMethod?: PaymentMethod;
}

export type NewOrder = Omit<Order, 'id'>;
