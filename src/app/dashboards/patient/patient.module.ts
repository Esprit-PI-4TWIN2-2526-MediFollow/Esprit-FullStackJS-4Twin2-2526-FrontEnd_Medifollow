import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientRoutingModule } from './patient-routing.module';
import { DashboardPatientComponent } from './dashboard-patient.component';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { QuestionnaireRendererComponent } from './questionnaire-renderer/questionnaire-renderer.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    DashboardPatientComponent,
    QuestionnaireRendererComponent
  ],
  imports: [
    CommonModule,
    PatientRoutingModule,
    FormsModule,
    HttpClientModule,
    PatientRoutingModule
  ],
  providers: [
    QuestionnaireService
  ]
})
export class PatientModule { }
