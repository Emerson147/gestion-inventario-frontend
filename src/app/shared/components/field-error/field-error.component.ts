import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { ValidationUtils } from '../../../core/utils/validation.utils';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="shouldShowError()" 
      class="field-error mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in"
      role="alert"
      [attr.aria-live]="'polite'"
    >
      <i class="pi pi-exclamation-triangle text-xs"></i>
      <span>{{ getErrorMessage() }}</span>
    </div>
  `,
  styles: [`
    .field-error {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .pi {
      font-size: 0.75rem;
    }
  `]
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() customMessage?: string;
  @Input() showWhen: 'touched' | 'dirty' | 'always' = 'touched';

  shouldShowError(): boolean {
    if (!this.control || !this.control.errors) {
      return false;
    }

    switch (this.showWhen) {
      case 'always':
        return true;
      case 'dirty':
        return this.control.dirty;
      case 'touched':
      default:
        return this.control.touched;
    }
  }

  getErrorMessage(): string {
    if (this.customMessage) {
      return this.customMessage;
    }

    if (!this.control) {
      return '';
    }

    return ValidationUtils.getErrorMessage(this.control) || '';
  }
}