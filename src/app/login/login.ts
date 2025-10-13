import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { CheckboxModule } from 'primeng/checkbox';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { LoginRequest } from '@shared/dtos/login';
import { ApiResponse } from '@shared/dtos/response';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    DividerModule,
    CheckboxModule,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
  `,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  protected readonly isLoading = signal(false);
  protected readonly loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Form',
        detail: 'Please fill in all required fields correctly',
      });
      return;
    }

    this.isLoading.set(true);

    const loginData: LoginRequest = this.loginForm.value;

    this.http
      .post<ApiResponse<undefined>>('/api/auth/login', loginData)
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Login successful!',
            life: 3000,
          });

          // Redirect to home page after 1 second
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          const errorMessage =
            error.error?.message || 'Login failed. Please check your credentials.';
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: errorMessage,
          });
        },
      });
  }

  /**
   * Handle forgot password
   */
  protected onForgotPassword(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Forgot Password',
      detail: 'Password reset feature coming soon!',
    });
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if field has error
   */
  protected hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  /**
   * Get error message for field
   */
  protected getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }

    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }
}
