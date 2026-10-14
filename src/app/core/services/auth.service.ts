
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly tokenState = signal<string | null>(
    this.readToken(),
  );

  private readonly userState = signal<AuthUser | null>(
    this.readSavedUser(),
  );

  readonly user = this.userState.asReadonly();
  readonly isLoggedIn = computed(() => !!this.tokenState());
  readonly isAuthenticated = this.isLoggedIn;

  getToken(): string | null {
    return this.tokenState();
  }

  private readToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('access_token');
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => this.saveSession(response)),
      );
  }

  register(data: {
    name: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap((response) => {
          const token =
            response.access_token ??
            response.accessToken ??
            response.token;

          if (token) {
            this.saveSession(response);
          }
        }),
      );
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/me`)
      .pipe(
        tap((user) => {
          this.userState.set(user);

          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(
              'auth_user',
              JSON.stringify(user),
            );
          }
        }),
      );
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_user');
    }

    this.tokenState.set(null);
    this.userState.set(null);
  }

  private saveSession(response: AuthResponse): void {
    const token =
      response.access_token ??
      response.accessToken ??
      response.token;

    if (!token) {
      throw new Error(
        'Authentication response did not contain a JWT token.',
      );
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', token);
    }

    // Update reactive authentication state immediately.
    this.tokenState.set(token);

    if (response.user) {
      this.userState.set(response.user);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          'auth_user',
          JSON.stringify(response.user),
        );
      }
    }
  }

  private readSavedUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const value = localStorage.getItem('auth_user');

      return value
        ? (JSON.parse(value) as AuthUser)
        : null;
    } catch {
      return null;
    }
  }
}
