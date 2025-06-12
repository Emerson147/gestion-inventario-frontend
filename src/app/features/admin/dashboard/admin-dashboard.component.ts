import { Component } from '@angular/core';
import {DashboardWidget} from './components/dashboardwidget';
import {StatsWidget} from './components/statswidget';
import {RecentSalesWidget} from './components/recentsaleswidget';
import {BestSellingWidget} from './components/bestsellingwidget';
import {RevenueStreamWidget} from './components/revenuestreamwidget';
import {NotificationsWidget} from './components/notificationswidget';
import { MetricCardComponent } from '../../ventas/realizar-venta/components/metrics/metric-card.component';


@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardWidget,
    StatsWidget,
    RecentSalesWidget,
    BestSellingWidget,
    RevenueStreamWidget,
    NotificationsWidget,
    MetricCardComponent
  ],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {

}
