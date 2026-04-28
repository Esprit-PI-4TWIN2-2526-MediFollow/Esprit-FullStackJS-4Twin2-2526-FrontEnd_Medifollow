import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { DashboardSuperAdminComponent } from './dashboard-super-admin.component';
import { GestureControlModule } from '../../gesture-control/gesture-control.module';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [
    DashboardSuperAdminComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SuperAdminRoutingModule,
    GestureControlModule,
    TranslateModule
  ]
})
export class SuperAdminModule { }
