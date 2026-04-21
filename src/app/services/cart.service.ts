import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { CartItem } from '../models/cart-item.model';
import { normalizeCartItem } from './api-normalizers';
import { API_BASE_URL } from './api.constants';
import { AuthService } from './auth.service';

interface AddToCartPayload {
  productId: number;
  quantity: number;
  name: string;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly baseUrl = `${API_BASE_URL}/cart`;
  public cartCount$ = new BehaviorSubject<number>(0);
  private readonly drawerOpenState = signal(false);
  private readonly drawerItemsState = signal<CartItem[]>([]);
  private readonly drawerLoadingState = signal(false);
  private readonly badgePulseState = signal(false);
  private badgePulseTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly drawerOpen = computed(() => this.drawerOpenState());
  readonly drawerItems = computed(() => this.drawerItemsState());
  readonly drawerLoading = computed(() => this.drawerLoadingState());
  readonly badgePulse = computed(() => this.badgePulseState());

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getCartItems(userId: number): Observable<CartItem[]> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http
      .get<CartItem[]>(this.baseUrl, { params })
      .pipe(map((items) => items.map(normalizeCartItem)));
  }

  addToCart(payload: AddToCartPayload): Observable<CartItem> {
    const userId = this.requireUserId();
    const params = new HttpParams().set('userId', String(userId));

    // Mock-cart upsert lives here only because JSON Server does not support
    // the backend merge behavior a production cart endpoint should provide.
    return this.http.get<CartItem[]>(this.baseUrl, { params }).pipe(
      map((allItems) => allItems.map(normalizeCartItem)),
      switchMap((allItems) => {
        const existingItem = allItems.find(
          (item) => String(item.productId) === String(payload.productId),
        );

        if (existingItem) {
          const quantity = existingItem.quantity + payload.quantity;
          return this.syncClientCartState(
            this.http
              .patch<CartItem>(`${this.baseUrl}/${existingItem.id}`, { quantity })
              .pipe(map(normalizeCartItem)),
            userId,
          );
        }

        return this.syncClientCartState(
          this.http
            .post<CartItem>(this.baseUrl, {
              userId,
              ...payload,
            })
            .pipe(map(normalizeCartItem)),
          userId,
        );
      }),
      tap(() => {
        this.openDrawer();
        this.pulseCartBadge();
      }),
    );
  }

  removeFromCart(cartItemId: number): Observable<void> {
    const userId = this.requireUserId();
    return this.syncClientCartState(
      this.http.delete<void>(`${this.baseUrl}/${cartItemId}`),
      userId,
    );
  }

  updateQuantity(cartItemId: number, quantity: number): Observable<CartItem> {
    const userId = this.requireUserId();
    return this.syncClientCartState(
      this.http
        .patch<CartItem>(`${this.baseUrl}/${cartItemId}`, { quantity })
        .pipe(map(normalizeCartItem)),
      userId,
    );
  }

  clearCart(): Observable<void> {
    const userId = this.requireUserId();

    return this.getCartItems(userId).pipe(
      switchMap((items) => {
        if (items.length === 0) {
          this.cartCount$.next(0);
          this.drawerItemsState.set([]);
          return of(void 0);
        }

        return forkJoin(
          items.map((item) => this.http.delete<void>(`${this.baseUrl}/${item.id}`)),
        ).pipe(map(() => void 0));
      }),
      switchMap(() => this.loadCartCount(userId).pipe(map(() => void 0))),
      tap(() => this.drawerItemsState.set([])),
    );
  }

  loadCartCount(userId: number | null = this.authService.getUserId()): Observable<number> {
    if (userId === null) {
      this.cartCount$.next(0);
      this.drawerItemsState.set([]);
      return of(0);
    }

    return this.fetchCartCount(userId);
  }

  openDrawer(): void {
    this.drawerOpenState.set(true);

    const userId = this.authService.getUserId();
    if (userId !== null) {
      this.loadDrawerItems(userId).subscribe({
        error: () => {
          this.drawerItemsState.set([]);
          this.drawerLoadingState.set(false);
        },
      });
    } else {
      this.drawerItemsState.set([]);
    }
  }

  closeDrawer(): void {
    this.drawerOpenState.set(false);
  }

  loadDrawerItems(userId: number | null = this.authService.getUserId()): Observable<CartItem[]> {
    if (userId === null) {
      this.drawerLoadingState.set(false);
      this.drawerItemsState.set([]);
      return of([]);
    }

    this.drawerLoadingState.set(true);
    return this.getCartItems(userId).pipe(
      tap({
        next: (items) => {
          this.drawerItemsState.set(items);
          this.drawerLoadingState.set(false);
        },
        error: () => {
          this.drawerLoadingState.set(false);
        },
      }),
    );
  }

  private syncClientCartState<T>(operation: Observable<T>, userId: number): Observable<T> {
    return operation.pipe(
      switchMap((result) =>
        this.fetchCartCount(userId).pipe(
          switchMap(() => {
            if (!this.drawerOpenState()) {
              return of(result);
            }

            return this.loadDrawerItems(userId).pipe(map(() => result));
          }),
        ),
      ),
    );
  }

  private fetchCartCount(userId: number): Observable<number> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.get<CartItem[]>(this.baseUrl, { params }).pipe(
      map((items) => items.map(normalizeCartItem)),
      map((items) => items.reduce((count, item) => count + item.quantity, 0)),
      tap((count) => this.cartCount$.next(count)),
    );
  }

  private requireUserId(): number {
    const userId = this.authService.getUserId();

    if (userId === null) {
      throw new Error('User must be logged in to manage the cart.');
    }

    return userId;
  }

  private pulseCartBadge(): void {
    this.badgePulseState.set(false);

    if (this.badgePulseTimeout) {
      clearTimeout(this.badgePulseTimeout);
    }

    queueMicrotask(() => this.badgePulseState.set(true));
    this.badgePulseTimeout = setTimeout(() => this.badgePulseState.set(false), 900);
  }
}
