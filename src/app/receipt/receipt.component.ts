import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface SelectedProduct {
  id: number;
  title: string;
  price: number;
  qty: number;
  deduction: number;
}

interface ReceiptNavigationState {
  selected?: SelectedProduct[];
  total?: number;
  totalDeduction?: number;
  paymentRef?: string;
  paymentDate?: string;
  customerLabel?: string;
}

interface StoredUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

/**
 * Printable receipt screen.
 *
 * Reads payment details from router navigation state and provides browser print.
 */
@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.css']
})
export class ReceiptComponent implements OnInit {
  selected: SelectedProduct[] = [];
  total = 0;
  totalDeduction = 0;
  paymentRef = '';
  paymentDate = '';
  customerLabel = '';

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    const nav = (window.history?.state || {}) as ReceiptNavigationState;

    this.selected = nav.selected || [];
    this.total = nav.total || 0;
    this.totalDeduction = nav.totalDeduction || 0;
    this.paymentRef = nav.paymentRef || this.generateRef();
    this.paymentDate =
      nav.paymentDate ||
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    this.customerLabel = nav.customerLabel || this.getCustomerLabel();

    if (!this.selected.length) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  /** Navigates back to the dashboard page. */
  back(): void {
    this.router.navigateByUrl('/dashboard');
  }

  /** Opens browser print dialog for receipt output. */
  print(): void {
    window.print();
  }

  /** Builds a customer label from persisted user info. */
  private getCustomerLabel(): string {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        return 'Customer - 12345678';
      }

      const user = JSON.parse(raw) as StoredUser;
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer';
      const id = user.id || '12345678';
      return `${name} -${id}`;
    } catch {
      return 'Customer - 12345678';
    }
  }

  /** Generates fallback reference when route state does not include one. */
  private generateRef(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }
}
