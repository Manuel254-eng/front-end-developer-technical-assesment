import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LogoutModalComponent } from '../shared/logout-modal/logout-modal.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { TopBarComponent } from '../shared/top-bar/top-bar.component';

interface SelectedProduct {
  id: number;
  title: string;
  price: number;
  qty: number;
  deduction: number;
  discountPct?: number;
}

interface SummaryNavigationState {
  selected?: SelectedProduct[];
  total?: number;
  totalDeduction?: number;
}

interface StoredUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

/**
 * Payment summary screen.
 *
 * Receives selected product data from dashboard route navigation state,
 * captures verification code input, and forwards receipt details.
 */
@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TopBarComponent, SidebarComponent, LogoutModalComponent],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  userName: string | null = null;
  selected: SelectedProduct[] = [];
  total = 0;
  totalDeduction = 0;

  /** Six-character verification token entered by the user. */
  verification: string[] = ['1', '2', '3', '4', '5', '6'];

  showPaymentModal = false;
  showLogoutModal = false;
  paymentRef = '';
  paymentDate = '';
  customerLabel = '';

  constructor(private readonly router: Router) {}

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

    const nav = (window.history?.state || {}) as SummaryNavigationState;

    this.selected = nav.selected || [];
    this.total = nav.total || 0;
    this.totalDeduction = nav.totalDeduction || 0;
    this.paymentRef = this.generatePaymentRef();
    this.paymentDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    this.customerLabel = this.getCustomerLabel();

    if (!this.selected.length) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  /** Opens logout confirmation modal. */
  logout(): void {
    this.showLogoutModal = true;
  }

  /** Returns to dashboard to revise selected products. */
  back(): void {
    this.router.navigateByUrl('/dashboard');
  }

  /** Opens payment confirmation modal. */
  pay(): void {
    this.showPaymentModal = true;
  }

  /** Closes payment modal and returns to dashboard flow. */
  donePayment(): void {
    this.showPaymentModal = false;
    this.router.navigateByUrl('/dashboard');
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

  /**
   * Navigates to receipt page with payment metadata.
   * Falls back to a text receipt download if navigation fails.
   */
  downloadReceipt(): void {
    try {
      this.router.navigateByUrl('/receipt', {
        state: {
          selected: this.selected,
          total: this.total,
          totalDeduction: this.totalDeduction,
          paymentRef: this.paymentRef,
          paymentDate: this.paymentDate,
          customerLabel: this.customerLabel
        }
      });
    } catch {
      const lines = [
        'Payment Successful',
        `Ref Number: ${this.paymentRef}`,
        `Date: ${this.paymentDate}`,
        `Amount: ${this.totalDeduction.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} KES`,
        `Customer: ${this.customerLabel}`
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `receipt-${this.paymentRef}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }
  }

  /** Builds display label using stored user context. */
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

  /** Generates lightweight reference identifier for this payment session. */
  private generatePaymentRef(): string {
    return Math.random().toString(36).slice(2, 12);
  }

  /** Indicates whether all verification fields have at least one character. */
  get isVerificationComplete(): boolean {
    return this.verification.every((value) => value.trim().length > 0);
  }

  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Stores one-character OTP input and auto-focuses the next field when filled.
   */
  onVerificationInput(index: number, value: string): void {
    const normalized = (value || '').slice(-1);
    this.verification[index] = normalized;

    if (normalized && index < this.verification.length - 1) {
      const nextInput = this.otpInputs.get(index + 1)?.nativeElement;
      nextInput?.focus();
      nextInput?.select();
    }
  }

  /**
   * On backspace from an empty field, focus previous OTP input.
   */
  onVerificationKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.verification[index] && index > 0) {
      const prevInput = this.otpInputs.get(index - 1)?.nativeElement;
      prevInput?.focus();
      prevInput?.select();
    }
  }
}
