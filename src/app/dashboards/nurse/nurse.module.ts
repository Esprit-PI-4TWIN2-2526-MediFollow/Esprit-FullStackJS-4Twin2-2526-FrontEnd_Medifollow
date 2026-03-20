import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NurseRoutingModule } from './nurse-routing.module';
import { DashboardNurseComponent } from './dashboard-nurse.component';


@NgModule({
  declarations: [
    DashboardNurseComponent
  ],
  imports: [
    CommonModule,
    NurseRoutingModule
  ]
})
export class NurseModule { }
