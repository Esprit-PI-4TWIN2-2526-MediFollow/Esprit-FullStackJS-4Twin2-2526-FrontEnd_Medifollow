import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardDoctorComponent } from './dashboard-doctor.component';
import { PatientResponsesComponent } from './patient-responses/patient-responses.component';
import { ViewQuestionnaireComponent } from './view-questionnaire/view-questionnaire.component';
import { DoctorViewSymptomsComponent } from './doctor-view-symptoms.component';

const routes: Routes = [
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardDoctorComponent },
 { path: 'patient/:id/responses', component: PatientResponsesComponent },
  { path: 'patient/:id/symptoms', component: DoctorViewSymptomsComponent },
{path:'viewQu/:id',component:ViewQuestionnaireComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule { }
