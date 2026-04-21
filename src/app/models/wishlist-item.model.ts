export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

export type NewWishlistItem = Omit<WishlistItem, 'id'>;
