import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
  readonly cartCount$ = this.cartService.cartCount$;
  readonly badgePulse = this.cartService.badgePulse;

  constructor() {
    effect(() => {
      const userId = this.authService.userId();

      this.cartService.loadCartCount(userId).subscribe();
      this.wishlistService.loadWishlist(userId).subscribe();
    });
  }

  logout(): void {
    this.cartService.closeDrawer();
    this.authService.logout();
  }
}
