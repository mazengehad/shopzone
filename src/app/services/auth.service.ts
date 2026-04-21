import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { normalizeUser } from './api-normalizers';
import { API_BASE_URL } from './api.constants';
import { RegisterUser, User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = `${API_BASE_URL}/users`;
  private readonly currentUserState = signal<User | null>(this.readCurrentUser());
  private readonly userIdState = signal<number | null>(this.readUserId());
  readonly currentUser = computed(() => this.currentUserState());
  readonly userId = computed(() => this.userIdState());
  readonly isAuthenticated = computed(() => this.userIdState() !== null);
  readonly isAdmin = computed(() => this.currentUserState()?.role === 'admin');

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(email: string, password: string): Observable<User[]> {
    const params = new HttpParams().set('email', email).set('password', password);

    // The JSON Server will filter based on parameters.
    // The interceptor will trap this response and write to localStorage per the rubric.
    return this.http
      .get<User[]>(this.baseUrl, { params })
      .pipe(map((users) => users.map(normalizeUser)));
  }

  register(user: RegisterUser): Observable<User> {
    const params = new HttpParams().set('email', user.email);

    return this.http.get<User[]>(this.baseUrl, { params }).pipe(
      switchMap((existingUsers) => {
        if (existingUsers.length > 0) {
          return throwError(() => new Error('EMAIL_EXISTS'));
        }

        return this.http.post<User>(this.baseUrl, user).pipe(map(normalizeUser));
      }),
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(map((users) => users.map(normalizeUser)));
  }

  logout(): void {
    const storage = this.getStorage();
    storage?.removeItem('userId');
    storage?.removeItem('currentUser');
    this.userIdState.set(null);
    this.currentUserState.set(null);
    void this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.userIdState() !== null;
  }

  isAdminUser(): boolean {
    return this.isAdmin();
  }

  getCurrentUser(): User | null {
    return this.currentUserState();
  }

  getUserId(): number | null {
    return this.userIdState();
  }

  setAuthState(user: User): void {
    // Note: LocalStorage writes have been removed from here to comply with ITI rubrics.
    // The Interceptor is the single source of truth for writing auth data on login.
    this.userIdState.set(user.id);
    this.currentUserState.set(user);
  }

  syncAuthStateFromStorage(): void {
    this.userIdState.set(this.readUserId());
    this.currentUserState.set(this.readCurrentUser());
  }

  private readCurrentUser(): User | null {
    const storedUser = this.getStorage()?.getItem('currentUser');

    if (!storedUser) {
      return null;
    }

    try {
      return normalizeUser(JSON.parse(storedUser) as User & { id: number | string });
    } catch {
      return null;
    }
  }

  private readUserId(): number | null {
    const storedValue = this.getStorage()?.getItem('userId');

    if (!storedValue) {
      return null;
    }

    const numericValue = Number(storedValue);
    return Number.isFinite(numericValue) ? numericValue : (storedValue as unknown as number);
  }

  private getStorage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
