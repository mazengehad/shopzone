import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { CheckoutDetails } from '../models/checkout.model';
import { NewOrder, Order } from '../models/order.model';
import { normalizeOrder } from './api-normalizers';
import { API_BASE_URL } from './api.constants';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly baseUrl = `${API_BASE_URL}/orders`;

  constructor(
    private readonly http: HttpClient,
    private readonly cartService: CartService,
  ) {}

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl).pipe(map((orders) => orders.map(normalizeOrder)));
  }

  getOrders(userId: number): Observable<Order[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http
      .get<Order[]>(this.baseUrl, { params })
      .pipe(map((orders) => orders.map(normalizeOrder)));
  }

  placeOrder(order: NewOrder): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order).pipe(map(normalizeOrder));
  }

  placeOrderFromCart(userId: number, checkout: CheckoutDetails): Observable<Order> {
    return this.cartService.getCartItems(userId).pipe(
      switchMap((items) => {
        if (items.length === 0) {
          return throwError(() => new Error('EMPTY_CART'));
        }

        // This still runs on the client in the mock app. A real backend must
        // recalculate totals server-side before accepting an order.
        const total = items.reduce(
          (orderTotal, item) => orderTotal + item.price * item.quantity,
          0,
        );
        const newOrder: NewOrder = {
          userId,
          total,
          status: 'pending',
          date: new Date().toISOString(),
          paymentMethod: checkout.paymentMethod,
          shippingInfo: checkout.shippingInfo,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        };

        return this.placeOrder(newOrder);
      }),
    );
  }
}
