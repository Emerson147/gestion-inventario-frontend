import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PageStat {
  value: number | string;
  label: string;
  cssClass: string;
  valueClass: string;
  labelClass: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Input() iconClass!: string;
  @Input() stats: PageStat[] = [];
}