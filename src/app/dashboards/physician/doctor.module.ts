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
import { ViewQuestionnaireComponent } from './view-questionnaire/view-questionnaire.component';
import { ChatComponent } from '../../chat/chat.component';

@NgModule({
  declarations: [
    DashboardDoctorComponent,
    PatientResponsesComponent,
    ViewQuestionnaireComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DoctorRoutingModule,
    NgChartsModule,
    ChatComponent
  ],
  providers: [
    QuestionnaireService,
    UsersService
  ]
})
export class DoctorModule { }
