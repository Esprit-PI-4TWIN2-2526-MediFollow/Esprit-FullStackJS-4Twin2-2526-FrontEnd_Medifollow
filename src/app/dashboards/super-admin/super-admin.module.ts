import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { DashboardSuperAdminComponent } from './dashboard-super-admin.component';
import { GestureControlModule } from '../../gesture-control/gesture-control.module';


@NgModule({
  declarations: [
    DashboardSuperAdminComponent
  ],
  imports: [
    CommonModule,
    SuperAdminRoutingModule,
GestureControlModule
  ]
})
export class SuperAdminModule { }
