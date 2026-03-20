import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PhysicianRoutingModule } from './physician-routing.module';
import { DashboardPhysicianComponent } from './dashboard-physician.component';


@NgModule({
  declarations: [
    DashboardPhysicianComponent
  ],
  imports: [
    CommonModule,
    PhysicianRoutingModule
  ]
})
export class PhysicianModule { }
