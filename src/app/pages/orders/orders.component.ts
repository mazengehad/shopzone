import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order, OrderStatus } from '../../models/order.model';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly orderService: OrderService,
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();

    if (userId === null) {
      this.loading = false;
      return;
    }

    this.orderService.getOrders(userId).subscribe({
      next: (orders) => {
        this.orders = [...orders].sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date).getTime() - new Date(firstOrder.date).getTime(),
        );
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load your orders.';
        this.loading = false;
      },
    });
  }

  trackByOrderId(_index: number, order: Order): number {
    return order.id;
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return 'status-chip pending';
      case 'processing':
        return 'status-chip processing';
      case 'delivered':
        return 'status-chip delivered';
      case 'cancelled':
        return 'status-chip cancelled';
    }
  }

  getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }
}
