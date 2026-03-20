import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPatientComponent } from './dashboard-patient.component';
import { QuestionnaireRendererComponent } from './questionnaire-renderer/questionnaire-renderer.component';

const routes: Routes = [
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',  component: DashboardPatientComponent },
{path:'questionnaire/:id',component:QuestionnaireRendererComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientRoutingModule { }
