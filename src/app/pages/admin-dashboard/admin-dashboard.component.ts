import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Order } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);

  readonly currentUser = this.authService.currentUser;

  users: User[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    forkJoin({
      users: this.authService.getAllUsers(),
      products: this.productService.getAllProducts(),
      orders: this.orderService.getAllOrders(),
    }).subscribe({
      next: ({ users, products, orders }) => {
        this.users = users;
        this.products = products;
        this.orders = [...orders].sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date).getTime() - new Date(firstOrder.date).getTime(),
        );
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'We could not load the admin dashboard right now.';
        this.loading = false;
      },
    });
  }

  get adminCount(): number {
    return this.users.filter((user) => user.role === 'admin').length;
  }

  get totalRevenue(): number {
    return this.orders.reduce((total, order) => total + order.total, 0);
  }

  get pendingOrders(): number {
    return this.orders.filter((order) => order.status === 'pending').length;
  }

  get lowStockProducts(): Product[] {
    return this.products
      .filter((product) => product.stock <= 5)
      .sort((firstProduct, secondProduct) => firstProduct.stock - secondProduct.stock)
      .slice(0, 5);
  }

  get recentOrders(): Order[] {
    return this.orders.slice(0, 5);
  }

  get latestUsers(): User[] {
    return [...this.users]
      .sort((firstUser, secondUser) => secondUser.id - firstUser.id)
      .slice(0, 6);
  }

  getUserName(userId: number): string {
    return this.users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
  }

  getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  trackByOrderId(_index: number, order: Order): number {
    return order.id;
  }

  trackByUserId(_index: number, user: User): number {
    return user.id;
  }

  trackByProductId(_index: number, product: Product): number {
    return product.id;
  }
}
