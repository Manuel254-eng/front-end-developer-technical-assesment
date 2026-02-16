import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LogoutModalComponent } from '../shared/logout-modal/logout-modal.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { TopBarComponent } from '../shared/top-bar/top-bar.component';

interface StoredUser {
  firstName?: string;
  username?: string;
  email?: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  discountPercentage?: number | string;
}

interface ProductsResponse {
  products?: Product[];
  total?: number;
}

interface SelectedProduct {
  id: number;
  title: string;
  price: number;
  qty: number;
  deduction: number;
  discountPct?: number;
}

/**
 * Dashboard screen that loads products, tracks user item selection,
 * and sends an order summary to the summary route.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, TopBarComponent, SidebarComponent, LogoutModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string | null = null;
  walletBalance = 'Kes 2,400.00';
  showLogoutModal = false;

  products: Product[] = [];
  loadingProducts = false;
  productsError: string | null = null;
  page = 1;
  pageSize = 5;
  total = 0;

  /** Current line items selected for payment deduction. */
  selected: SelectedProduct[] = [];

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw) as StoredUser;
        this.userName = (user.firstName || user.username || user.email || 'User').toUpperCase();
      }
    } catch {
      this.userName = 'USER';
    }

    this.fetchProducts(this.page);
  }

  /** Loads one paged chunk of products from the demo API. */
  fetchProducts(page: number): void {
    this.productsError = null;
    this.loadingProducts = true;

    const skip = (page - 1) * this.pageSize;
    const url = `https://dummyjson.com/products?limit=${this.pageSize}&skip=${skip}`;

    this.http.get<ProductsResponse>(url).subscribe({
      next: (res) => {
        this.loadingProducts = false;
        this.products = res?.products || [];
        this.total = res?.total || 0;
        this.page = page;
      },
      error: () => {
        this.loadingProducts = false;
        this.productsError = 'Failed to load products.';
      }
    });
  }

  canPrev(): boolean {
    return this.page > 1;
  }

  canNext(): boolean {
    return this.page * this.pageSize < this.total;
  }

  goPrev(): void {
    if (this.canPrev()) {
      this.fetchProducts(this.page - 1);
    }
  }

  goNext(): void {
    if (this.canNext()) {
      this.fetchProducts(this.page + 1);
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  /** Opens logout confirmation modal. */
  logout(): void {
    this.showLogoutModal = true;
  }

  /** Adds one unit of a product to the selected list. */
  addProduct(product: Product): void {
    const existing = this.selected.find((line) => line.id === product.id);
    const discountPct =
      typeof product.discountPercentage === 'number'
        ? product.discountPercentage
        : (parseFloat(product.discountPercentage || '0') || 0);

    const perUnitDeduction = Math.round(product.price - product.price * (discountPct / 100));

    if (existing) {
      existing.qty += 1;
      existing.deduction = Math.round(perUnitDeduction * existing.qty);
      return;
    }

    this.selected.push({
      id: product.id,
      title: product.title,
      price: product.price,
      qty: 1,
      deduction: perUnitDeduction,
      discountPct
    });
  }

  /** Decreases quantity by one and removes the line when it reaches zero. */
  removeSelected(id: number): void {
    const item = this.selected.find((line) => line.id === id);
    if (!item) {
      return;
    }

    if (item.qty <= 1) {
      this.selected = this.selected.filter((line) => line.id !== id);
      return;
    }

    item.qty -= 1;
    if (typeof item.discountPct === 'number') {
      const perUnit = Math.round(item.price - item.price * (item.discountPct / 100));
      item.deduction = Math.round(perUnit * item.qty);
    }
  }

  /** Updates quantity from manual numeric input. */
  updateQty(id: number, value: string): void {
    const qty = parseInt(value || '0', 10);
    if (Number.isNaN(qty) || qty < 1) {
      return;
    }

    const item = this.selected.find((line) => line.id === id);
    if (!item) {
      return;
    }

    item.qty = qty;
    if (typeof item.discountPct === 'number') {
      const perUnit = Math.round(item.price - item.price * (item.discountPct / 100));
      item.deduction = Math.round(perUnit * item.qty);
    }
  }

  /** Updates custom deduction for a selected line item. */
  updateDeduction(id: number, value: string): void {
    const deduction = parseFloat(value || '0');
    const item = this.selected.find((line) => line.id === id);
    if (item) {
      item.deduction = Number.isNaN(deduction) ? 0 : deduction;
    }
  }

  /** Clears all currently selected products. */
  clearSelectedProducts(): void {
    this.selected = [];
  }

  /** Gross total before deductions. */
  get selectedTotal(): number {
    return this.selected.reduce((sum, line) => sum + line.price * line.qty, 0);
  }

  /** Total amount to charge after per-line deductions. */
  get totalDeduction(): number {
    return this.selected.reduce((sum, line) => sum + (Number(line.deduction) || 0), 0);
  }

  /**
   * Navigates to summary and carries current selection via navigation state.
   *
   * Note: state is in-memory browser history state and is not persisted on hard refresh.
   */
  goToSummary(): void {
    if (!this.selected.length) {
      return;
    }

    this.router.navigateByUrl('/summary', {
      state: {
        selected: this.selected,
        total: this.selectedTotal,
        totalDeduction: this.totalDeduction
      }
    });
  }

  /** Clears local auth context and returns user to login. */
  confirmLogout(): void {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } catch {
      // Ignore storage errors and continue to sign out.
    }

    this.showLogoutModal = false;
    this.router.navigateByUrl('/login');
  }

  /** Closes logout confirmation modal without signing out. */
  cancelLogout(): void {
    this.showLogoutModal = false;
  }
}
