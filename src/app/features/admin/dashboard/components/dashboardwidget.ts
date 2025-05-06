import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { RouterModule } from "@angular/router";
// import { DashboardService } from "../../service/dashboard.service";

@Component({
  standalone: true,
  selector: 'app-dashboard-widget',
  imports: [ButtonModule, CommonModule, CardModule, RouterModule],
  templateUrl: './dashboard-widget.html'
})

export class DashboardWidget {
  data: any = {
    category: 0,
    product: 0,
    bill: 0
  };

  // constructor(private dashboardService: DashboardService) { }

  // ngOnInit() {
  //   this.dashboardService.getDetails().subscribe((response: any) => {
  //     this.data = response;
  //     console.log(this.data);
  //   });
  // }
}
