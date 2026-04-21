import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../models/cart-item.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.css',
})
export class CartDrawerComponent {
  private readonly cartService = inject(CartService);
  readonly isOpen = this.cartService.drawerOpen;
  readonly items = this.cartService.drawerItems;
  readonly isLoading = this.cartService.drawerLoading;
  readonly itemCount = computed(() =>
    this.items().reduce((count, item) => count + item.quantity, 0),
  );
  readonly orderTotal = computed(() =>
    this.items().reduce((total, item) => total + item.price * item.quantity, 0),
  );

  close(): void {
    this.cartService.closeDrawer();
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.id).subscribe({
      error: () => {
        this.cartService.loadDrawerItems().subscribe();
      },
    });
  }

  trackByCartItemId(_index: number, item: CartItem): number {
    return item.id;
  }
}
