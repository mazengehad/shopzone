import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      void this.router.navigate([this.authService.isAdminUser() ? '/admin' : '/products']);
      return;
    }

    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage = 'Account created! Please log in.';
    }
  }

  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService
      .login(email, password)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (users) => {
          if (users[0]) {
            // The interceptor has already written the user to localStorage via its tap().
            // We now sync that written data into our active application signals.
            this.authService.syncAuthStateFromStorage();
            const returnUrl =
              this.route.snapshot.queryParamMap.get('returnUrl') ??
              (users[0].role === 'admin' ? '/admin' : '/products');
            void this.router.navigateByUrl(returnUrl);
            return;
          }

          this.errorMessage = 'Invalid email or password';
        },
        error: () => {
          this.errorMessage = 'We could not sign you in right now. Please try again.';
        },
      });
  }
}
