import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuditorRoutingModule } from './auditor-routing.module';
import { DashboardAuditorComponent } from './dashboard-auditor.component';
import { AuditComponent } from './audit.component';


@NgModule({
  declarations: [
    DashboardAuditorComponent,
    AuditComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AuditorRoutingModule
  ]
})
export class AuditorModule { }
