import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientRoutingModule } from './patient-routing.module';
import { DashboardPatientComponent } from './dashboard-patient.component';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { QuestionnaireRendererComponent } from './questionnaire-renderer/questionnaire-renderer.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SymptomsRendererComponent } from './symptoms-renderer/symptoms-renderer.component';
import { DailySymptomsCheckComponent } from './daily-symptoms-check/daily-symptoms-check.component';
import { ChatComponent } from '../../chat/chat.component';


@NgModule({
  declarations: [
    DashboardPatientComponent,
    QuestionnaireRendererComponent,
    SymptomsRendererComponent,
    DailySymptomsCheckComponent,
  ],
  imports: [
    CommonModule,
    PatientRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PatientRoutingModule,
    ChatComponent
  ],
  providers: [
    QuestionnaireService
  ]
})
export class PatientModule { }
