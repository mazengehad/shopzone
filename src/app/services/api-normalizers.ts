import { CartItem } from '../models/cart-item.model';
import { Order, OrderItem } from '../models/order.model';
import { Product } from '../models/product.model';
import { Review } from '../models/review.model';
import { User } from '../models/user.model';
import { WishlistItem } from '../models/wishlist-item.model';

type NumericLike = number | string;

function normalizeNumber(value: NumericLike): number {
  if (typeof value === 'string' && Number.isNaN(Number(value))) {
    return value as unknown as number;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function normalizeUser(user: User & { id: NumericLike }): User {
  return {
    ...user,
    id: normalizeNumber(user.id),
  };
}

export function normalizeProduct(product: Product & { id: NumericLike }): Product {
  return {
    ...product,
    id: normalizeNumber(product.id),
    price: normalizeNumber(product.price),
    stock: normalizeNumber(product.stock),
    rating: normalizeNumber(product.rating),
  };
}

export function normalizeCartItem(
  item: CartItem & { id: NumericLike; userId: NumericLike; productId: NumericLike },
): CartItem {
  return {
    ...item,
    id: normalizeNumber(item.id),
    userId: normalizeNumber(item.userId),
    productId: normalizeNumber(item.productId),
    quantity: normalizeNumber(item.quantity),
    price: normalizeNumber(item.price),
  };
}

function normalizeOrderItem(item: OrderItem & { productId: NumericLike }): OrderItem {
  return {
    ...item,
    productId: normalizeNumber(item.productId),
    quantity: normalizeNumber(item.quantity),
    price: normalizeNumber(item.price),
  };
}

export function normalizeOrder(order: Order & { id: NumericLike; userId: NumericLike }): Order {
  return {
    ...order,
    id: normalizeNumber(order.id),
    userId: normalizeNumber(order.userId),
    total: normalizeNumber(order.total),
    items: order.items.map(normalizeOrderItem),
  };
}

export function normalizeWishlistItem(
  item: WishlistItem & { id: NumericLike; userId: NumericLike; productId: NumericLike },
): WishlistItem {
  return {
    ...item,
    id: normalizeNumber(item.id),
    userId: normalizeNumber(item.userId),
    productId: normalizeNumber(item.productId),
    price: normalizeNumber(item.price),
  };
}

export function normalizeReview(
  review: Review & { id: NumericLike; userId: NumericLike; productId: NumericLike },
): Review {
  return {
    ...review,
    id: normalizeNumber(review.id),
    userId: normalizeNumber(review.userId),
    productId: normalizeNumber(review.productId),
    rating: normalizeNumber(review.rating),
  };
}
