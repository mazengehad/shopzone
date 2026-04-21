import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mustMatchValidator } from '../../validators/must-match.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: mustMatchValidator('password', 'confirmPassword') },
  );

  errorMessage = '';
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      void this.router.navigate(['/products']);
    }
  }

  get nameControl() {
    return this.registerForm.controls.name;
  }

  get emailControl() {
    return this.registerForm.controls.email;
  }

  get passwordControl() {
    return this.registerForm.controls.password;
  }

  get confirmPasswordControl() {
    return this.registerForm.controls.confirmPassword;
  }

  get passwordsDoNotMatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') && this.confirmPasswordControl.touched;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { name, email, password } = this.registerForm.getRawValue();

    this.authService
      .register({ name, email, password, role: 'user' })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/login'], { queryParams: { registered: '1' } });
        },
        error: (error: Error) => {
          this.errorMessage =
            error.message === 'EMAIL_EXISTS'
              ? 'An account with this email already exists.'
              : 'We could not create your account. Please try again.';
        },
      });
  }
}
