export interface Review {
  id: number;
  userId: number;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type NewReview = Omit<Review, 'id'>;
