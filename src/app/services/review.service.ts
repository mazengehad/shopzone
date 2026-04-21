import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { NewReview, Review } from '../models/review.model';
import { normalizeReview } from './api-normalizers';
import { API_BASE_URL } from './api.constants';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly baseUrl = `${API_BASE_URL}/reviews`;

  constructor(private readonly http: HttpClient) {}

  getProductReviews(productId: number): Observable<Review[]> {
    const params = new HttpParams().set('productId', String(productId));
    return this.http
      .get<Review[]>(this.baseUrl, { params })
      .pipe(
        map((reviews) =>
          reviews
            .map(normalizeReview)
            .sort(
              (firstReview, secondReview) =>
                new Date(secondReview.createdAt).getTime() -
                new Date(firstReview.createdAt).getTime(),
            ),
        ),
      );
  }

  upsertReview(review: NewReview): Observable<Review> {
    const params = new HttpParams().set('productId', String(review.productId));

    return this.http.get<Review[]>(this.baseUrl, { params }).pipe(
      map((reviews) => reviews.map(normalizeReview)),
      switchMap((reviews) => {
        const existingReview = reviews.find(
          (currentReview) => currentReview.userId === review.userId,
        );

        if (!existingReview) {
          return this.http.post<Review>(this.baseUrl, review).pipe(map(normalizeReview));
        }

        return this.http
          .patch<Review>(`${this.baseUrl}/${existingReview.id}`, review)
          .pipe(map(normalizeReview));
      }),
    );
  }
}
