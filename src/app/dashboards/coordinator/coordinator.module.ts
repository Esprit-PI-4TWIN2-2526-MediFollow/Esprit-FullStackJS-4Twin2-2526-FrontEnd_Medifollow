import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoordinatorRoutingModule } from './coordinator-routing.module';
import { DashboardCoordinatorComponent } from './dashboard-coordinator.component';


@NgModule({
  declarations: [
    DashboardCoordinatorComponent
  ],
  imports: [
    CommonModule,
    CoordinatorRoutingModule
  ]
})
export class CoordinatorModule { }
