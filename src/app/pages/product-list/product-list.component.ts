import { CommonModule, Location } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly wishlistService = inject(WishlistService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(Location);

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  readonly savedProductIds = this.wishlistService.savedProductIds;
  products: Product[] = [];
  categories: string[] = ['All'];
  searchTerm = '';
  selectedCategory = 'All';
  loading = true;
  errorMessage = '';
  activeProductId: number | null = null;
  activeWishlistProductId: number | null = null;

  private pendingSearchTerm = '';
  private pendingCategory = 'All';
  private shouldFocusSearch = false;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.pendingSearchTerm = params.get('q')?.trim() ?? '';
      this.pendingCategory = params.get('category') ?? 'All';
      this.shouldFocusSearch = params.get('focus') === 'search';
      this.applyQueryState();
    });

    if (this.authService.isLoggedIn()) {
      this.wishlistService.loadWishlist().subscribe();
    }

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.categories = ['All', ...new Set(products.map((product) => product.category))];
        this.loading = false;
        this.applyQueryState();
      },
      error: () => {
        this.errorMessage = 'We could not load the product catalog right now.';
        this.loading = false;
      },
    });
  }

  get filteredProducts(): Product[] {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    return this.products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        this.selectedCategory === 'All' || product.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  trackByProductId(_index: number, product: Product): number {
    return product.id;
  }

  isSaved(productId: number): boolean {
    return this.savedProductIds().has(productId);
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.syncFiltersToUrl(true);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.syncFiltersToUrl(true);
  }

  addToCart(product: Product): void {
    this.errorMessage = '';

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (product.stock === 0) {
      this.toastService.error('Out of stock', `${product.name} is not available right now.`);
      return;
    }

    this.activeProductId = product.id;

    this.cartService
      .addToCart({
        productId: product.id,
        quantity: 1,
        name: product.name,
        price: product.price,
      })
      .pipe(finalize(() => (this.activeProductId = null)))
      .subscribe({
        next: () => {
          this.toastService.success('Added to cart', `${product.name} was added to your cart.`);
        },
        error: () => {
          this.errorMessage = 'We could not add that product to your cart.';
        },
      });
  }

  toggleWishlist(product: Product): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.activeWishlistProductId = product.id;

    this.wishlistService
      .toggle(product)
      .pipe(finalize(() => (this.activeWishlistProductId = null)))
      .subscribe({
        next: (result) => {
          if (result) {
            this.toastService.info('Wishlist updated', `${product.name} was saved for later.`);
            return;
          }

          this.toastService.info(
            'Wishlist updated',
            `${product.name} was removed from your wishlist.`,
          );
        },
        error: () => {
          this.toastService.error('Wishlist unavailable', 'We could not update your wishlist.');
        },
      });
  }

  private applyQueryState(): void {
    this.searchTerm = this.pendingSearchTerm;
    this.selectedCategory = this.categories.includes(this.pendingCategory)
      ? this.pendingCategory
      : 'All';

    if (this.shouldFocusSearch) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
  }

  private syncFiltersToUrl(replaceUrl: boolean): void {
    const urlTree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchTerm.trim() || null,
        category: this.selectedCategory !== 'All' ? this.selectedCategory : null,
        focus: null,
      },
    });
    
    const url = this.router.serializeUrl(urlTree);
    
    if (replaceUrl) {
      this.location.replaceState(url);
    } else {
      this.location.go(url);
    }
  }
}
