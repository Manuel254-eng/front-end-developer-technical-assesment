import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

type LoginStep = 'username' | 'password';

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  id?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  image?: string;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
}

interface StoredUser {
  id?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  image?: string;
}

/**
 * Two-step login flow.
 *
 * Step 1 captures username, Step 2 captures password and authenticates against
 * the demo API. Successful auth stores token/user data in local storage.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  currentStep: LoginStep = 'username';
  enteredUsername = '';
  showPassword = false;
  loading = false;
  loginError: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  /** Advances the login wizard or submits credentials at password step. */
  onSubmit(): void {
    if (this.currentStep === 'username') {
      const usernameControl = this.loginForm.get('username');
      if (usernameControl?.valid) {
        this.enteredUsername = String(usernameControl.value);
        this.currentStep = 'password';
      } else {
        usernameControl?.markAsTouched();
      }
      return;
    }

    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.valid) {
      this.loginError = null;
      this.login({ username: this.enteredUsername, password: String(passwordControl.value) });
    } else {
      passwordControl?.markAsTouched();
    }
  }

  /**
   * Sends credentials to the auth endpoint and persists auth context on success.
   */
  private login(payload: LoginPayload): void {
    this.loading = true;
    this.loginError = null;

    this.http.post<LoginResponse>('https://dummyjson.com/auth/login', payload).subscribe({
      next: (res) => {
        this.loading = false;

        // Support both modern (`accessToken`) and legacy (`token`) field names.
        const token = res?.accessToken ?? res?.token;
        if (token) {
          try {
            localStorage.setItem('auth_token', token);
          } catch {
            // Storage failures should not block navigation in this demo flow.
          }
        }

        if (res?.refreshToken) {
          try {
            localStorage.setItem('refresh_token', res.refreshToken);
          } catch {
            // Ignore storage errors and continue.
          }
        }

        const user: StoredUser = {
          id: res?.id,
          username: res?.username,
          email: res?.email,
          firstName: res?.firstName,
          lastName: res?.lastName,
          gender: res?.gender,
          image: res?.image
        };

        try {
          localStorage.setItem('user', JSON.stringify(user));
        } catch {
          // Ignore storage errors and continue.
        }

        this.router.navigateByUrl('/dashboard');
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;

        if (err.error && typeof err.error.message === 'string') {
          this.loginError = err.error.message;
        } else if (err.status === 0) {
          this.loginError = 'Network error. Please check your connection.';
        } else {
          this.loginError = 'Invalid username or password.';
        }
      }
    });
  }

  /** Returns the user to the first step and clears password input. */
  goBack(): void {
    this.currentStep = 'username';
    this.loginForm.patchValue({ password: '' });
  }

  get isUsernameStep(): boolean {
    return this.currentStep === 'username';
  }

  get isPasswordStep(): boolean {
    return this.currentStep === 'password';
  }

  /** Enables submit button only for the active step field validity. */
  get isFormValid(): boolean {
    if (this.currentStep === 'username') {
      return this.loginForm.get('username')?.valid || false;
    }

    return this.loginForm.get('password')?.valid || false;
  }

  /** Toggles password field visibility state. */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get passwordFieldType(): string {
    return this.showPassword ? 'text' : 'password';
  }
}
