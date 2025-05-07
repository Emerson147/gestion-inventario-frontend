import { Component } from '@angular/core';
import {DashboardWidget} from './components/dashboardwidget';
import {StatsWidget} from './components/statswidget';
import {RecentSalesWidget} from './components/recentsaleswidget';
import {BestSellingWidget} from './components/bestsellingwidget';
import {RevenueStreamWidget} from './components/revenuestreamwidget';
import {NotificationsWidget} from './components/notificationswidget';


@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardWidget,
    StatsWidget,
    RecentSalesWidget,
    BestSellingWidget,
    RevenueStreamWidget,
    NotificationsWidget
  ],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {

}
