import { Component, Input, signal, computed, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { Subject } from 'rxjs';

interface UserData {
  name: string;
  role: string;
  avatar?: string;
  email?: string;
  lastLogin?: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

@Component({
  selector: 'app-user-info-card',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    AvatarModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    RippleModule
  ],
  templateUrl: './user-info-card.component.html',
  styleUrls: ['./user-info-card-component.scss']
})
export class UserInfoCardComponent implements OnInit {
 // Input properties
 @Input() set user(value: UserData) {
  this.userSignal.set(value);
}
@Input() set currentTime(value: Date) {
  this.currentTimeSignal.set(value);
}

// Signals
private readonly userSignal = signal<UserData>({} as UserData);
private readonly currentTimeSignal = signal<Date>(new Date());
private readonly notificationCount = signal<number>(3);
private readonly destroy$ = new Subject<void>();

// Computed properties
readonly userData = this.userSignal.asReadonly();
readonly currentTimeValue = this.currentTimeSignal.asReadonly();
readonly notifications = this.notificationCount.asReadonly();

// Computed values
readonly userInitials = computed(() => {
  const user = this.userData();
  return user.name
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
});

readonly sessionDuration = computed(() => {
  const now = this.currentTimeValue();
  const start = this.userData()?.lastLogin || now;
  const diffMs = now.getTime() - new Date(start).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
});

// Status configuration
private readonly statusConfig = {
  online: { color: 'green-500', text: 'En línea', pulse: true, severity: 'success' as const },
  away: { color: 'yellow-500', text: 'Ausente', pulse: true, severity: 'warning' as const },
  busy: { color: 'red-500', text: 'Ocupado', pulse: false, severity: 'danger' as const },
  offline: { color: 'gray-500', text: 'Desconectado', pulse: false, severity: 'secondary' as const }
};

constructor() {}

ngOnInit(): void {
  // Update time every minute
  const timer = setInterval(() => {
    this.currentTimeSignal.set(new Date());
  }, 60000);

  // Clean up on destroy
  this.destroy$.subscribe(() => {
    clearInterval(timer);
  });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

getStatusConfig(status: string = 'offline') {
  return this.statusConfig[status as keyof typeof this.statusConfig] || this.statusConfig.offline;
}

getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}
}