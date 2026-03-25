import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NurseRoutingModule } from './nurse-routing.module';
import { DashboardNurseComponent } from './dashboard-nurse.component';
import { SymptomsListComponent } from './symptoms/symptoms-list/symptoms-list.component';
import { SymptomsDetailsComponent } from './symptoms/symptoms-details/symptoms-details.component';


@NgModule({
  declarations: [
    DashboardNurseComponent,
    SymptomsListComponent,
    SymptomsDetailsComponent
  ],
  imports: [
    CommonModule,
    NurseRoutingModule
  ]
})
export class NurseModule { }
