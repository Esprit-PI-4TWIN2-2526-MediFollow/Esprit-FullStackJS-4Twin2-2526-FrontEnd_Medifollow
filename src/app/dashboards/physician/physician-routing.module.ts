import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPhysicianComponent } from './dashboard-physician.component';
import { PatientResponsesComponent } from './patient-responses/patient-responses.component';

const routes: Routes = [
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPhysicianComponent },
 { path: 'patient/:id/responses', component: PatientResponsesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PhysicianRoutingModule { }
