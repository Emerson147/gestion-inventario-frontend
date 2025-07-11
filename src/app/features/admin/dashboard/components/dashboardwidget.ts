import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { RouterModule } from "@angular/router";
// import { DashboardService } from "../../service/dashboard.service";

interface DashboardData {
  category: number;
  product: number;
  bill: number;
  warehouse: number;
  users: number;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-widget',
  imports: [ButtonModule, CommonModule, CardModule, RouterModule],
  templateUrl: './dashboard-widget.html'
})

export class DashboardWidget {
  data: DashboardData = {
    category: 0,
    product: 0,
    bill: 0,
    warehouse: 0,
    users: 0
  };

  // constructor(private dashboardService: DashboardService) { }

  // ngOnInit() {
  //   this.dashboardService.getDetails().subscribe((response: any) => {
  //     this.data = response;
  //     console.log(this.data);
  //   });
  // }
}
