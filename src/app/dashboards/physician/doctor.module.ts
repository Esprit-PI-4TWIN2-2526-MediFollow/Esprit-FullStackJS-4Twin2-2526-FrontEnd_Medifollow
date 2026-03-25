import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorRoutingModule } from './doctor-routing.module';
import { DashboardDoctorComponent } from './dashboard-doctor.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { UsersService } from '../../services/user/users.service';
import { PatientResponsesComponent } from './patient-responses/patient-responses.component';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [
    DashboardDoctorComponent,
    PatientResponsesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DoctorRoutingModule,
    NgChartsModule,
  ],
  providers: [
    QuestionnaireService,
    UsersService
  ]
})
export class DoctorModule { }
