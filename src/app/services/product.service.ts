import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { normalizeProduct } from './api-normalizers';
import { API_BASE_URL } from './api.constants';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly baseUrl = `${API_BASE_URL}/products`;

  constructor(private readonly http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(this.baseUrl)
      .pipe(map((products) => products.map(normalizeProduct)));
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`).pipe(map(normalizeProduct));
  }

  getByCategory(category: string): Observable<Product[]> {
    const params = new HttpParams().set('category', category);
    return this.http
      .get<Product[]>(this.baseUrl, { params })
      .pipe(map((products) => products.map(normalizeProduct)));
  }
}
