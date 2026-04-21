import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsState = signal<ToastMessage[]>([]);
  private nextId = 1;

  readonly toasts = this.toastsState.asReadonly();

  success(title: string, message: string): void {
    this.show({ title, message, tone: 'success' });
  }

  error(title: string, message: string): void {
    this.show({ title, message, tone: 'error' });
  }

  info(title: string, message: string): void {
    this.show({ title, message, tone: 'info' });
  }

  dismiss(id: number): void {
    this.toastsState.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(toast: Omit<ToastMessage, 'id'>): void {
    const nextToast: ToastMessage = {
      id: this.nextId++,
      ...toast,
    };

    this.toastsState.update((toasts) => [...toasts, nextToast]);
    setTimeout(() => this.dismiss(nextToast.id), 3000);
  }
}
