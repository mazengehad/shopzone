import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NewReview, Review } from '../../models/review.model';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../services/review.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly wishlistService = inject(WishlistService);
  private readonly reviewService = inject(ReviewService);
  private readonly toastService = inject(ToastService);
  private readonly location = inject(Location);
  readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  product: Product | null = null;
  reviews: Review[] = [];
  quantity = 1;
  reviewRating = 5;
  reviewComment = '';
  loading = true;
  isSubmitting = false;
  isSubmittingReview = false;
  activeWishlist = false;
  errorMessage = '';
  reviewErrorMessage = '';

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(productId) || productId <= 0) {
      this.loading = false;
      this.errorMessage = 'Product not found.';
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.wishlistService.loadWishlist().subscribe();
    }

    forkJoin({
      product: this.productService.getProductById(productId),
      reviews: this.reviewService.getProductReviews(productId),
    }).subscribe({
      next: ({ product, reviews }) => {
        this.product = product;
        this.reviews = reviews;
        this.quantity = product.stock > 0 ? 1 : 0;
        this.prefillReviewForm();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load this product.';
        this.loading = false;
      },
    });
  }

  get quantityInvalid(): boolean {
    if (!this.product || this.product.stock === 0) {
      return false;
    }

    return (
      !Number.isInteger(this.quantity) || this.quantity < 1 || this.quantity > this.product.stock
    );
  }

  get displayRating(): number {
    if (this.reviews.length === 0) {
      return this.product?.rating ?? 0;
    }

    const total = this.reviews.reduce((ratingTotal, review) => ratingTotal + review.rating, 0);
    return total / this.reviews.length;
  }

  get reviewButtonLabel(): string {
    return this.currentUserReview ? 'Update review' : 'Submit review';
  }

  get currentUserReview(): Review | null {
    const currentUserId = this.currentUser()?.id;

    if (!currentUserId) {
      return null;
    }

    return this.reviews.find((review) => review.userId === currentUserId) ?? null;
  }

  isSaved(): boolean {
    return this.product ? this.wishlistService.isSaved(this.product.id) : false;
  }

  addToCart(): void {
    if (!this.product || this.product.stock === 0 || this.quantityInvalid) {
      return;
    }

    this.errorMessage = '';

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.isSubmitting = true;

    this.cartService
      .addToCart({
        productId: this.product.id,
        quantity: this.quantity,
        name: this.product.name,
        price: this.product.price,
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastService.success(
            'Added to cart',
            `${this.product?.name} is ready in your cart.`,
          );
        },
        error: () => {
          this.errorMessage = 'We could not add this product to your cart.';
        },
      });
  }

  toggleWishlist(): void {
    if (!this.product) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.activeWishlist = true;

    this.wishlistService
      .toggle(this.product)
      .pipe(finalize(() => (this.activeWishlist = false)))
      .subscribe({
        next: (result) => {
          const message = result
            ? `${this.product?.name} was saved for later.`
            : `${this.product?.name} was removed from your wishlist.`;
          this.toastService.info('Wishlist updated', message);
        },
        error: () => {
          this.toastService.error('Wishlist unavailable', 'We could not update your wishlist.');
        },
      });
  }

  submitReview(): void {
    if (!this.product) {
      return;
    }

    const currentUser = this.currentUser();

    if (!currentUser) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const normalizedComment = this.reviewComment.trim();

    if (normalizedComment.length < 10) {
      this.reviewErrorMessage = 'Please write at least 10 characters so the review is useful.';
      return;
    }

    this.reviewErrorMessage = '';
    this.isSubmittingReview = true;

    const reviewPayload: NewReview = {
      userId: currentUser.id,
      productId: this.product.id,
      userName: currentUser.name,
      rating: this.reviewRating,
      comment: normalizedComment,
      createdAt: new Date().toISOString(),
    };

    this.reviewService
      .upsertReview(reviewPayload)
      .pipe(finalize(() => (this.isSubmittingReview = false)))
      .subscribe({
        next: (savedReview) => {
          const remainingReviews = this.reviews.filter((review) => review.id !== savedReview.id);
          this.reviews = [savedReview, ...remainingReviews].sort(
            (firstReview, secondReview) =>
              new Date(secondReview.createdAt).getTime() -
              new Date(firstReview.createdAt).getTime(),
          );
          this.prefillReviewForm();
          this.toastService.success('Review saved', 'Your rating and comments are now live.');
        },
        error: () => {
          this.reviewErrorMessage = 'We could not save your review right now.';
        },
      });
  }

  trackByReviewId(_index: number, review: Review): number {
    return review.id;
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigate(['/products']);
  }

  private prefillReviewForm(): void {
    if (!this.currentUserReview) {
      return;
    }

    this.reviewRating = this.currentUserReview.rating;
    this.reviewComment = this.currentUserReview.comment;
  }
}
