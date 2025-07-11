import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

export interface UserInfo {
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
  productividad: number;
  nivel: string;
}

@Component({
  selector: 'app-user-info-card',
  templateUrl: './user-info-card.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TagModule
  ]
})
export class UserInfoCardComponent {
  @Input() user!: UserInfo;
  @Input() ping = 0;

  getCurrentTime(): Date {
    return new Date();
  }

  getProductividadColor(): string {
    if (this.user.productividad >= 90) return 'text-blue-600';
    if (this.user.productividad >= 70) return 'text-green-600';
    if (this.user.productividad >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getProductividadBgColor(): string {
    if (this.user.productividad >= 90) return 'from-blue-500 to-purple-600';
    if (this.user.productividad >= 70) return 'from-green-500 to-emerald-600';
    if (this.user.productividad >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  }
}