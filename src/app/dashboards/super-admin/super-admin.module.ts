import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { DashboardSuperAdminComponent } from './dashboard-super-admin.component';


@NgModule({
  declarations: [
    DashboardSuperAdminComponent
  ],
  imports: [
    CommonModule,
    SuperAdminRoutingModule
  ]
})
export class SuperAdminModule { }
