import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PhysicianRoutingModule } from './physician-routing.module';
import { DashboardPhysicianComponent } from './dashboard-physician.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { UsersService } from '../../services/user/users.service';
import { PatientResponsesComponent } from './patient-responses/patient-responses.component';


@NgModule({
  declarations: [
    DashboardPhysicianComponent,
    PatientResponsesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    PhysicianRoutingModule
  ],
  providers: [
    QuestionnaireService,
    UsersService
  ]
})
export class PhysicianModule { }
