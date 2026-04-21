import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { WishlistItem } from '../../models/wishlist-item.model';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';

interface WishlistProduct extends WishlistItem {
  product: Product | null;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent implements OnInit {
  private readonly wishlistService = inject(WishlistService);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);

  wishlistProducts: WishlistProduct[] = [];
  loading = true;
  errorMessage = '';
  activeProductId: number | null = null;

  ngOnInit(): void {
    this.loadWishlistView();
  }

  removeFromWishlist(item: WishlistProduct): void {
    const targetProduct = item.product ?? {
      id: item.productId,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      rating: 0,
      stock: 0,
    };

    this.wishlistService.toggle(targetProduct).subscribe({
      next: () => {
        this.wishlistProducts = this.wishlistProducts.filter(
          (currentItem) => currentItem.productId !== item.productId,
        );
        this.toastService.info('Wishlist updated', `${item.name} was removed from your wishlist.`);
      },
      error: () => {
        this.toastService.error(
          'Wishlist unavailable',
          'We could not update your wishlist right now.',
        );
      },
    });
  }

  addToCart(item: WishlistProduct): void {
    if (item.product?.stock === 0) {
      this.toastService.error('Out of stock', 'This product is currently unavailable.');
      return;
    }

    this.activeProductId = item.productId;
    this.cartService
      .addToCart({
        productId: item.productId,
        quantity: 1,
        name: item.name,
        price: item.price,
      })
      .pipe(finalize(() => (this.activeProductId = null)))
      .subscribe({
        next: () => {
          this.toastService.success('Added to cart', `${item.name} is ready in your cart.`);
        },
        error: () => {
          this.toastService.error(
            'Cart unavailable',
            'We could not add this product to your cart.',
          );
        },
      });
  }

  trackByProductId(_index: number, item: WishlistProduct): number {
    return item.productId;
  }

  private loadWishlistView(): void {
    forkJoin({
      wishlistItems: this.wishlistService.loadWishlist(),
      products: this.productService.getAllProducts(),
    }).subscribe({
      next: ({ wishlistItems, products }) => {
        const productById = new Map(products.map((product) => [product.id, product]));
        this.wishlistProducts = wishlistItems.map((item) => ({
          ...item,
          product: productById.get(item.productId) ?? null,
        }));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load your wishlist.';
        this.loading = false;
      },
    });
  }
}
