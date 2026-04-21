import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { Product } from '../models/product.model';
import { NewWishlistItem, WishlistItem } from '../models/wishlist-item.model';
import { normalizeWishlistItem } from './api-normalizers';
import { API_BASE_URL } from './api.constants';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly baseUrl = `${API_BASE_URL}/wishlist`;
  private readonly itemsState = signal<WishlistItem[]>([]);
  private readonly loadingState = signal(false);

  readonly items = this.itemsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly savedProductIds = computed(
    () => new Set(this.itemsState().map((item) => item.productId)),
  );

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  loadWishlist(userId: number | null = this.authService.getUserId()): Observable<WishlistItem[]> {
    if (userId === null) {
      this.loadingState.set(false);
      this.itemsState.set([]);
      return of([]);
    }

    const params = new HttpParams().set('userId', String(userId));
    this.loadingState.set(true);

    return this.http.get<WishlistItem[]>(this.baseUrl, { params }).pipe(
      map((items) => items.map(normalizeWishlistItem)),
      tap({
        next: (items) => {
          this.itemsState.set(items);
          this.loadingState.set(false);
        },
        error: () => {
          this.loadingState.set(false);
        },
      }),
    );
  }

  isSaved(productId: number): boolean {
    return this.savedProductIds().has(productId);
  }

  toggle(product: Product): Observable<WishlistItem | void> {
    const userId = this.requireUserId();
    const params = new HttpParams().set('userId', String(userId));

    return this.http.get<WishlistItem[]>(this.baseUrl, { params }).pipe(
      map((items) => items.map(normalizeWishlistItem)),
      switchMap((items) => {
        const existingItem = items.find((item) => item.productId === product.id);

        if (existingItem) {
          return this.http.delete<void>(`${this.baseUrl}/${existingItem.id}`).pipe(
            tap(() => {
              this.itemsState.set(items.filter((item) => item.id !== existingItem.id));
            }),
          );
        }

        const payload: NewWishlistItem = {
          userId,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        };

        return this.http.post<WishlistItem>(this.baseUrl, payload).pipe(
          map(normalizeWishlistItem),
          tap((createdItem) => this.itemsState.set([...items, createdItem])),
        );
      }),
    );
  }

  private requireUserId(): number {
    const userId = this.authService.getUserId();

    if (userId === null) {
      throw new Error('User must be logged in to manage wishlist items.');
    }

    return userId;
  }
}
