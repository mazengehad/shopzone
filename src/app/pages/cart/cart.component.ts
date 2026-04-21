import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { CartItem } from '../../models/cart-item.model';
import { CheckoutDetails, PaymentMethod, ShippingInfo } from '../../models/checkout.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';

type CheckoutStep = 1 | 2 | 3;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  cartItems: CartItem[] = [];
  loading = true;
  errorMessage = '';
  isPlacingOrder = false;
  isCheckoutOpen = false;
  checkoutStep: CheckoutStep = 1;
  shippingInfo: ShippingInfo = {
    address: '',
    city: '',
    phone: '',
  };
  paymentMethod: PaymentMethod = 'cash-on-delivery';

  ngOnInit(): void {
    this.loadCart();
  }

  get orderTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get itemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  get shippingStepInvalid(): boolean {
    return (
      this.shippingInfo.address.trim().length < 8 ||
      this.shippingInfo.city.trim().length < 2 ||
      this.shippingInfo.phone.trim().length < 10
    );
  }

  trackByCartItemId(_index: number, item: CartItem): number {
    return item.id;
  }

  loadCart(): void {
    const userId = this.authService.getUserId();

    if (userId === null) {
      this.loading = false;
      this.cartItems = [];
      return;
    }

    this.cartService.getCartItems(userId).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.loading = false;
        if (items.length === 0) {
          this.closeCheckout();
        }
      },
      error: () => {
        this.errorMessage = 'We could not load your cart.';
        this.loading = false;
      },
    });
  }

  updateQuantity(item: CartItem): void {
    this.errorMessage = '';
    const safeQuantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    item.quantity = safeQuantity;

    this.cartService.updateQuantity(item.id, safeQuantity).subscribe({
      next: (updatedItem) => {
        item.quantity = updatedItem.quantity;
      },
      error: () => {
        this.errorMessage = 'We could not update that item quantity.';
        this.loadCart();
      },
    });
  }

  removeItem(item: CartItem): void {
    this.errorMessage = '';

    this.cartService.removeFromCart(item.id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter((currentItem) => currentItem.id !== item.id);
        if (this.cartItems.length === 0) {
          this.closeCheckout();
        }
      },
      error: () => {
        this.errorMessage = 'We could not remove that item from your cart.';
      },
    });
  }

  openCheckout(): void {
    if (this.cartItems.length === 0) {
      return;
    }

    this.errorMessage = '';
    this.isCheckoutOpen = true;
    this.checkoutStep = 1;
  }

  closeCheckout(): void {
    this.isCheckoutOpen = false;
    this.checkoutStep = 1;
  }

  goToStep(step: CheckoutStep): void {
    if (step === 2 && this.shippingStepInvalid) {
      return;
    }

    this.checkoutStep = step;
  }

  nextStep(): void {
    if (this.checkoutStep === 1) {
      if (this.shippingStepInvalid) {
        this.errorMessage = 'Please complete your shipping details before continuing.';
        return;
      }

      this.errorMessage = '';
      this.checkoutStep = 2;
      return;
    }

    if (this.checkoutStep === 2) {
      this.checkoutStep = 3;
    }
  }

  previousStep(): void {
    if (this.checkoutStep > 1) {
      this.checkoutStep = (this.checkoutStep - 1) as CheckoutStep;
    }
  }

  confirmOrder(): void {
    const userId = this.authService.getUserId();

    if (userId === null || this.cartItems.length === 0) {
      return;
    }

    const checkoutDetails: CheckoutDetails = {
      shippingInfo: {
        address: this.shippingInfo.address.trim(),
        city: this.shippingInfo.city.trim(),
        phone: this.shippingInfo.phone.trim(),
      },
      paymentMethod: this.paymentMethod,
    };

    this.errorMessage = '';
    this.isPlacingOrder = true;

    this.orderService
      .placeOrderFromCart(userId, checkoutDetails)
      .pipe(
        switchMap(() => this.cartService.clearCart()),
        finalize(() => (this.isPlacingOrder = false)),
      )
      .subscribe({
        next: () => {
          this.cartItems = [];
          this.closeCheckout();
          this.toastService.success(
            'Order placed',
            'Your order is confirmed and now visible in orders.',
          );
          void this.router.navigate(['/orders']);
        },
        error: () => {
          this.errorMessage = 'We could not place your order. Please try again.';
        },
      });
  }
}
