import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuditorRoutingModule } from './auditor-routing.module';
import { DashboardAuditorComponent } from './dashboard-auditor.component';


@NgModule({
  declarations: [
    DashboardAuditorComponent
  ],
  imports: [
    CommonModule,
    AuditorRoutingModule
  ]
})
export class AuditorModule { }
